package com.getmypage.blog.infrastructure.search;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
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

    /**
     * 功能：初始化搜索客户端并绑定 Meilisearch 连接与索引名配置。
     * 关键参数：meiliSearchRestTemplate 为已配置认证信息的 HTTP 客户端；postIndex 为文章索引名。
     * 返回值/副作用：无返回值；构造后可提交增量索引任务。
     */
    public SearchClient(
            @Qualifier("meiliSearchRestTemplate") RestTemplate meiliSearchRestTemplate,
            @Value("${blog.meilisearch.post-index:posts}") String postIndex) {
        this.meiliSearchRestTemplate = meiliSearchRestTemplate;
        this.postIndex = postIndex;
    }

    /**
     * 功能：向 Meilisearch 提交文章增量索引文档，触发文章发布后的搜索同步。
     * 关键参数：postId 为需要更新索引的文章 ID。
     * 返回值/副作用：无返回值；副作用为调用 Meilisearch 文档写入接口。
     */
    public void updatePostIndex(Long postId) {
        if (postId == null) {
            log.warn("Skip search indexing because postId is null");
            return;
        }

        String path = "/indexes/%s/documents?primaryKey=id".formatted(postIndex);
        List<Map<String, Object>> documents = List.of(Map.of(
                "id", postId,
                "updatedAt", Instant.now().toString()
        ));

        try {
            ResponseEntity<Map> response = meiliSearchRestTemplate.postForEntity(path, documents, Map.class);
            Object taskUid = response.getBody() == null ? null : response.getBody().get("taskUid");
            log.info("Submitted meilisearch index update, postId={}, index={}, taskUid={}", postId, postIndex, taskUid);
        } catch (Exception ex) {
            log.error("Failed to submit meilisearch index update, postId={}, index={}", postId, postIndex, ex);
        }
    }
}
