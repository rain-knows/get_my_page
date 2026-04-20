package com.getmypage.blog.infrastructure.search;

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

import static org.junit.jupiter.api.Assertions.assertEquals;
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

    /**
     * 功能：验证文章发布后会向 Meilisearch 提交增量索引文档。
     * 关键参数：无（测试内部固定 postId=7 且索引名为 posts）。
     * 返回值/副作用：无返回值；断言请求路径与文档体字段符合预期。
     */
    @Test
    void updatePostIndexShouldSubmitDocumentToMeiliSearch() {
        when(restTemplate.postForEntity(any(String.class), any(Object.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(Map.of("taskUid", 1), HttpStatus.ACCEPTED));
        SearchClient searchClient = new SearchClient(restTemplate, "posts");

        searchClient.updatePostIndex(7L);

        ArgumentCaptor<List<Map<String, Object>>> bodyCaptor = ArgumentCaptor.forClass(List.class);
        verify(restTemplate).postForEntity(
                eq("/indexes/posts/documents?primaryKey=id"),
                bodyCaptor.capture(),
                eq(Map.class));

        List<Map<String, Object>> documents = bodyCaptor.getValue();
        assertEquals(1, documents.size());
        assertEquals(7L, documents.get(0).get("id"));
        assertTrue(documents.get(0).containsKey("updatedAt"));
    }

    /**
     * 功能：验证 postId 为空时不会触发 Meilisearch 请求，避免写入非法文档。
     * 关键参数：无（直接传入 null）。
     * 返回值/副作用：无返回值；断言未调用外部搜索客户端。
     */
    @Test
    void updatePostIndexShouldSkipWhenPostIdIsNull() {
        SearchClient searchClient = new SearchClient(restTemplate, "posts");

        searchClient.updatePostIndex(null);

        verifyNoInteractions(restTemplate);
    }
}
