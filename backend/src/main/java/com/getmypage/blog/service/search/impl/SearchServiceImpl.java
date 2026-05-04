package com.getmypage.blog.service.search.impl;

import com.getmypage.blog.exception.BizException;
import com.getmypage.blog.exception.ErrorCode;
import com.getmypage.blog.infrastructure.search.SearchClient;
import com.getmypage.blog.mapper.PostMapper;
import com.getmypage.blog.model.dto.response.SearchHitResponse;
import com.getmypage.blog.model.dto.response.SearchResponse;
import com.getmypage.blog.model.entity.Post;
import com.getmypage.blog.service.search.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

/**
 * 搜索服务实现。
 */
@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private static final int FALLBACK_LIMIT = 20;

    private final SearchClient searchClient;
    private final PostMapper postMapper;

    /**
     * 功能：执行公开搜索，优先使用 Meilisearch，失败时降级到 MySQL 模糊查询。
     * 关键参数：keyword 为搜索关键词。
     * 返回值/副作用：返回搜索响应；关键词为空时抛出参数异常。
     */
    @Override
    public SearchResponse search(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "搜索关键词不能为空");
        }

        String normalizedKeyword = keyword.trim();
        SearchClient.SearchQueryResult queryResult = searchClient.searchPublicPosts(normalizedKeyword);
        if (queryResult.isDegraded() || shouldFallbackToDatabase(queryResult.getHits())) {
            return fallbackSearch(normalizedKeyword);
        }

        List<SearchHitResponse> hits = queryResult.getHits().stream()
                .map(this::mapSearchHit)
                .toList();

        return SearchResponse.builder()
                .hits(hits)
                .estimatedTotalHits(queryResult.getEstimatedTotalHits())
                .processingTimeMs(queryResult.getProcessingTimeMs())
                .degraded(false)
                .build();
    }

    /**
     * 功能：判断搜索引擎返回结果是否缺失关键展示字段，避免前端拿到只有 ID 的脏索引文档。
     * 关键参数：hits 为搜索引擎返回的原始命中文档集合。
     * 返回值/副作用：返回是否应降级到数据库查询；无副作用。
     */
    private boolean shouldFallbackToDatabase(List<Map<String, Object>> hits) {
        if (hits == null || hits.isEmpty()) {
            return true;
        }

        return hits.stream().anyMatch((hit) ->
                !hasText(hit.get("title")) || !hasText(hit.get("slug"))
        );
    }

    /**
     * 功能：在搜索引擎不可用时执行数据库降级检索，确保公开搜索仍可返回结果。
     * 关键参数：keyword 为搜索关键词。
     * 返回值/副作用：返回降级搜索响应；无副作用。
     */
    private SearchResponse fallbackSearch(String keyword) {
        List<Post> posts = postMapper.searchPublishedByKeyword(keyword, FALLBACK_LIMIT);
        List<SearchHitResponse> hits = posts.stream()
                .map(post -> SearchHitResponse.builder()
                        .id(post.getId())
                        .title(post.getTitle())
                        .summary(post.getSummary())
                        .slug(post.getSlug())
                        .coverUrl(post.getCoverUrl())
                        .build())
                .toList();

        return SearchResponse.builder()
                .hits(hits)
                .estimatedTotalHits(hits.size())
                .processingTimeMs(0)
                .degraded(true)
                .build();
    }

    /**
     * 功能：将搜索引擎返回的命中文档映射为统一响应结构。
     * 关键参数：hit 为 Meilisearch 单条命中记录。
     * 返回值/副作用：返回搜索命中 DTO；无副作用。
     */
    private SearchHitResponse mapSearchHit(Map<String, Object> hit) {
        return SearchHitResponse.builder()
                .id(parseLong(hit.get("id")))
                .title(stringValue(hit.get("title")))
                .summary(stringValue(hit.getOrDefault("summary", hit.get("excerpt"))))
                .slug(stringValue(hit.get("slug")))
                .coverUrl(stringValue(hit.get("coverUrl")))
                .build();
    }

    /**
     * 功能：判断搜索命中文档中的字段是否包含可展示文本，避免空字符串误判为有效结果。
     * 关键参数：value 为待校验对象。
     * 返回值/副作用：返回是否包含有效文本；无副作用。
     */
    private boolean hasText(Object value) {
        return value != null && StringUtils.hasText(String.valueOf(value));
    }

    /**
     * 功能：将对象转换为 long，避免类型不匹配导致响应构建失败。
     * 关键参数：value 为待转换对象。
     * 返回值/副作用：返回 long 值，无法转换时返回 0；无副作用。
     */
    private Long parseLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return 0L;
    }

    /**
     * 功能：将对象安全转换为字符串，兼容 null 值。
     * 关键参数：value 为待转换对象。
     * 返回值/副作用：返回字符串值，null 时返回空字符串；无副作用。
     */
    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
