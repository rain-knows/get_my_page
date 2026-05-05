package com.getmypage.blog.infrastructure.search;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.getmypage.blog.mapper.PostMapper;
import com.getmypage.blog.model.entity.Post;
import lombok.Builder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * 搜索基础设施封装。
 */
@Slf4j
@Component
public class SearchClient {

    private final RestTemplate meiliSearchRestTemplate;
    private final String postIndex;
    private final PostMapper postMapper;
    private final ObjectMapper objectMapper;

    /**
     * 功能：初始化搜索客户端并绑定 Meilisearch 连接与索引名配置。
     * 关键参数：meiliSearchRestTemplate 为已配置认证信息的 HTTP 客户端；postIndex 为文章索引名；postMapper 用于读取真实文章字段构建搜索文档；objectMapper 用于解析 tiptap-json 内容提取索引文本。
     * 返回值/副作用：无返回值；构造后可提交索引任务与执行搜索查询。
     */
    public SearchClient(
            @Qualifier("meiliSearchRestTemplate") RestTemplate meiliSearchRestTemplate,
            @Value("${blog.meilisearch.post-index:posts}") String postIndex,
            PostMapper postMapper,
            ObjectMapper objectMapper) {
        this.meiliSearchRestTemplate = meiliSearchRestTemplate;
        this.postIndex = postIndex;
        this.postMapper = postMapper;
        this.objectMapper = objectMapper;
    }

    /**
     * 功能：兼容旧调用的索引更新入口，默认按“公开文章写入索引”执行。
     * 关键参数：postId 为需要更新索引的文章 ID。
     * 返回值/副作用：无返回值；副作用为向 Meilisearch 提交更新请求。
     */
    public void updatePostIndex(Long postId) {
        syncPublicPostIndex(postId, 1, false);
    }

    /**
     * 功能：根据文章状态同步公开索引：已发布写入索引，草稿/删除执行索引删除。
     * 关键参数：postId 为文章 ID；status 为文章状态；deleted 表示是否已删除。
     * 返回值/副作用：无返回值；副作用为调用 Meilisearch 写入或删除接口。
     */
    public void syncPublicPostIndex(Long postId, Integer status, boolean deleted) {
        if (postId == null) {
            log.warn("Skip search indexing because postId is null");
            return;
        }
        if (deleted || status == null || status != 1) {
            removePostIndex(postId);
            return;
        }
        upsertPostIndex(postId);
    }

    /**
     * 功能：执行公开文章搜索查询，若搜索引擎异常则返回降级信号。
     * 关键参数：keyword 为搜索关键词。
     * 返回值/副作用：返回搜索结果包装对象；无其他副作用。
     */
    @SuppressWarnings("unchecked")
    public SearchQueryResult searchPublicPosts(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return SearchQueryResult.builder()
                    .hits(Collections.emptyList())
                    .estimatedTotalHits(0)
                    .processingTimeMs(0)
                    .degraded(false)
                    .build();
        }

        String path = "/indexes/%s/search".formatted(postIndex);
        Map<String, Object> payload = Map.of(
                "q", keyword,
                "limit", 20,
                "filter", "status = 1"
        );

        try {
            ResponseEntity<Map> response = meiliSearchRestTemplate.postForEntity(path, payload, Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null) {
                return SearchQueryResult.builder()
                        .hits(Collections.emptyList())
                        .estimatedTotalHits(0)
                        .processingTimeMs(0)
                        .degraded(false)
                        .build();
            }
            List<Map<String, Object>> hits = (List<Map<String, Object>>) body.getOrDefault("hits", Collections.emptyList());
            long estimatedTotalHits = toLong(body.get("estimatedTotalHits"));
            long processingTimeMs = toLong(body.get("processingTimeMs"));
            return SearchQueryResult.builder()
                    .hits(hits)
                    .estimatedTotalHits(estimatedTotalHits)
                    .processingTimeMs(processingTimeMs)
                    .degraded(false)
                    .build();
        } catch (Exception ex) {
            log.error("Failed to query Meilisearch, fallback to DB, keyword={}, index={}", keyword, postIndex, ex);
            return SearchQueryResult.builder()
                    .hits(Collections.emptyList())
                    .estimatedTotalHits(0)
                    .processingTimeMs(0)
                    .degraded(true)
                    .build();
        }
    }

    /**
     * 功能：向 Meilisearch 提交文章文档写入，确保公开文章可被检索。
     * 关键参数：postId 为文章 ID。
     * 返回值/副作用：无返回值；副作用为调用文档写入接口。
     */
    private void upsertPostIndex(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null || post.getStatus() == null || post.getStatus() != 1) {
            log.warn("Skip meilisearch upsert because post is absent or unpublished, postId={}", postId);
            removePostIndex(postId);
            return;
        }

        String path = "/indexes/%s/documents?primaryKey=id".formatted(postIndex);
        List<Map<String, Object>> documents = List.of(buildSearchDocument(post));

        try {
            ResponseEntity<Map> response = meiliSearchRestTemplate.postForEntity(path, documents, Map.class);
            Object taskUid = response.getBody() == null ? null : response.getBody().get("taskUid");
            log.info("Submitted meilisearch index upsert, postId={}, index={}, taskUid={}", postId, postIndex, taskUid);
        } catch (Exception ex) {
            log.error("Failed to submit meilisearch upsert, postId={}, index={}", postId, postIndex, ex);
        }
    }

    /**
     * 功能：将文章实体转换为搜索索引文档，确保搜索页可直接展示标题、摘要、slug 与封面，并附带正文纯文本供全文检索。
     * 关键参数：post 为已发布文章实体。
     * 返回值/副作用：返回可提交到 Meilisearch 的文档 Map；无副作用。
     */
    private Map<String, Object> buildSearchDocument(Post post) {
        String title = post.getTitle() == null ? "" : post.getTitle();
        String slug = post.getSlug() == null ? "" : post.getSlug();
        String summary = post.getSummary() == null ? "" : post.getSummary();
        String coverUrl = post.getCoverUrl() == null ? "" : post.getCoverUrl();
        String updatedAt = post.getUpdatedAt() == null ? Instant.now().toString() : post.getUpdatedAt().toString();
        String contentText = extractContentPlainText(post.getContent());
        return Map.of(
                "id", post.getId(),
                "title", title,
                "summary", summary,
                "excerpt", summary,
                "slug", slug,
                "coverUrl", coverUrl,
                "status", post.getStatus(),
                "updatedAt", updatedAt,
                "contentText", contentText
        );
    }

    /**
     * 功能：从 tiptap-json 正文中递归提取纯文本，供 Meilisearch 全文索引使用。
     * 关键参数：content 为正文 JSON 字符串，可为 null 或非 JSON。
     * 返回值/副作用：返回提取后的纯文本；解析失败时返回空字符串。
     */
    private String extractContentPlainText(String content) {
        if (!StringUtils.hasText(content)) {
            return "";
        }
        try {
            JsonNode root = objectMapper.readTree(content);
            if (!root.isObject() || !"doc".equals(root.path("type").asText(""))) {
                return "";
            }
            JsonNode nodes = root.path("content");
            if (!nodes.isArray()) {
                return "";
            }
            StringBuilder textBuilder = new StringBuilder();
            appendNodePlainText(nodes, textBuilder);
            return textBuilder.toString().replaceAll("\\s+", " ").trim();
        } catch (Exception e) {
            log.debug("Failed to extract plain text from tiptap-json content, returning empty", e);
            return "";
        }
    }

    /**
     * 功能：递归遍历 tiptap 节点树并抽取纯文本。
     * 关键参数：node 为当前节点或数组；builder 为文本构造器。
     * 返回值/副作用：无返回值；副作用为向 builder 追加文本。
     */
    private void appendNodePlainText(JsonNode node, StringBuilder builder) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return;
        }
        if (node.isArray()) {
            for (JsonNode child : node) {
                appendNodePlainText(child, builder);
            }
            return;
        }
        if (!node.isObject()) {
            return;
        }
        if (node.has("text")) {
            String text = node.path("text").asText("");
            if (StringUtils.hasText(text)) {
                if (builder.length() > 0) {
                    builder.append(' ');
                }
                builder.append(text.trim());
            }
        }
        if (node.has("content")) {
            appendNodePlainText(node.path("content"), builder);
        }
    }

    /**
     * 功能：从 Meilisearch 删除文章文档，确保草稿或已删除文章不进入公开检索。
     * 关键参数：postId 为文章 ID。
     * 返回值/副作用：无返回值；副作用为调用文档删除接口。
     */
    private void removePostIndex(Long postId) {
        String path = "/indexes/%s/documents/%d".formatted(postIndex, postId);
        try {
            meiliSearchRestTemplate.delete(path);
            log.info("Submitted meilisearch index delete, postId={}, index={}", postId, postIndex);
        } catch (Exception ex) {
            log.error("Failed to submit meilisearch delete, postId={}, index={}", postId, postIndex, ex);
        }
    }

    /**
     * 功能：将搜索响应中的数字对象安全转换为 long。
     * 关键参数：value 为待转换对象。
     * 返回值/副作用：返回 long 值，无法转换时返回 0；无副作用。
     */
    private long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return 0L;
    }

    /**
     * 搜索查询结果。
     */
    @Getter
    @Builder
    public static class SearchQueryResult {

        private List<Map<String, Object>> hits;

        private long estimatedTotalHits;

        private long processingTimeMs;

        private boolean degraded;
    }
}
