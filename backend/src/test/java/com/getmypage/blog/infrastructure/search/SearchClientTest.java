package com.getmypage.blog.infrastructure.search;

import com.getmypage.blog.mapper.PostMapper;
import com.getmypage.blog.model.entity.Post;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchClientTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private PostMapper postMapper;

    /**
     * 功能：构造可用于搜索索引同步的已发布文章实体，避免每个测试重复拼装字段。
     * 关键参数：postId 为文章 ID。
     * 返回值/副作用：返回已发布文章实体；无副作用。
     */
    private Post buildPublishedPost(Long postId) {
        Post post = new Post();
        post.setId(postId);
        post.setTitle("Indexed Title");
        post.setSlug("indexed-title");
        post.setSummary("Indexed summary");
        post.setCoverUrl("https://example.com/cover.png");
        post.setStatus(1);
        post.setUpdatedAt(LocalDateTime.of(2026, 5, 4, 23, 45, 0));
        return post;
    }

    /**
     * 功能：验证已发布文章会向 Meilisearch 提交 upsert 文档，且附带 status=1。
     * 关键参数：无（测试内部固定 postId=7 且索引名为 posts）。
     * 返回值/副作用：无返回值；断言请求路径与文档体字段符合预期。
     */
    @Test
    void syncPublicPostIndexShouldUpsertWhenPublished() {
        when(restTemplate.postForEntity(any(String.class), any(Object.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(Map.of("taskUid", 1), HttpStatus.ACCEPTED));
        when(postMapper.selectById(7L)).thenReturn(buildPublishedPost(7L));
        SearchClient searchClient = new SearchClient(restTemplate, "posts", postMapper);

        searchClient.syncPublicPostIndex(7L, 1, false);

        ArgumentCaptor<List<Map<String, Object>>> bodyCaptor = ArgumentCaptor.forClass(List.class);
        verify(restTemplate).postForEntity(
                eq("/indexes/posts/documents?primaryKey=id"),
                bodyCaptor.capture(),
                eq(Map.class));

        List<Map<String, Object>> documents = bodyCaptor.getValue();
        assertEquals(1, documents.size());
        assertEquals(7L, documents.get(0).get("id"));
        assertEquals("Indexed Title", documents.get(0).get("title"));
        assertEquals("indexed-title", documents.get(0).get("slug"));
        assertEquals("Indexed summary", documents.get(0).get("summary"));
        assertEquals(1, documents.get(0).get("status"));
        assertTrue(documents.get(0).containsKey("updatedAt"));
    }

    /**
     * 功能：验证草稿或删除文章会触发索引删除，避免进入公开检索。
     * 关键参数：无（测试内部分别覆盖 status=0 与 deleted=true）。
     * 返回值/副作用：无返回值；断言触发了删除接口调用。
     */
    @Test
    void syncPublicPostIndexShouldDeleteWhenDraftOrDeleted() {
        SearchClient searchClient = new SearchClient(restTemplate, "posts", postMapper);

        searchClient.syncPublicPostIndex(8L, 0, false);
        searchClient.syncPublicPostIndex(9L, 1, true);

        verify(restTemplate).delete("/indexes/posts/documents/8");
        verify(restTemplate).delete("/indexes/posts/documents/9");
    }

    /**
     * 功能：验证 postId 为空时不会触发搜索客户端请求。
     * 关键参数：无（直接传入 null）。
     * 返回值/副作用：无返回值；断言未调用外部搜索客户端。
     */
    @Test
    void updatePostIndexShouldSkipWhenPostIdIsNull() {
        SearchClient searchClient = new SearchClient(restTemplate, "posts", postMapper);

        searchClient.updatePostIndex(null);

        verifyNoInteractions(restTemplate);
    }

    /**
     * 功能：验证搜索成功时会返回命中结果并标记 degraded=false。
     * 关键参数：无（测试内部构造 Meilisearch 返回体）。
     * 返回值/副作用：无返回值；断言命中数与降级标记符合预期。
     */
    @Test
    void searchPublicPostsShouldReturnHitsWhenSuccess() {
        Map<String, Object> meiliBody = Map.of(
                "hits", List.of(Map.of("id", 1, "title", "hit")),
                "estimatedTotalHits", 3,
                "processingTimeMs", 2
        );
        when(restTemplate.postForEntity(eq("/indexes/posts/search"), any(Object.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(meiliBody, HttpStatus.OK));

        SearchClient searchClient = new SearchClient(restTemplate, "posts", postMapper);
        SearchClient.SearchQueryResult result = searchClient.searchPublicPosts("nextjs");

        assertFalse(result.isDegraded());
        assertEquals(1, result.getHits().size());
        assertEquals(3, result.getEstimatedTotalHits());
    }

    /**
     * 功能：验证搜索引擎异常时会返回 degraded=true，供上层触发数据库降级。
     * 关键参数：无（测试内部模拟查询抛出异常）。
     * 返回值/副作用：无返回值；断言降级标记生效且命中为空。
     */
    @Test
    void searchPublicPostsShouldReturnDegradedWhenEngineFails() {
        when(restTemplate.postForEntity(eq("/indexes/posts/search"), any(Object.class), eq(Map.class)))
                .thenThrow(new RuntimeException("meili down"));

        SearchClient searchClient = new SearchClient(restTemplate, "posts", postMapper);
        SearchClient.SearchQueryResult result = searchClient.searchPublicPosts("nextjs");

        assertTrue(result.isDegraded());
        assertEquals(0, result.getHits().size());
        assertEquals(0, result.getEstimatedTotalHits());
    }
}
