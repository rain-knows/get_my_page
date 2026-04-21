package com.getmypage.blog.event;

import com.getmypage.blog.infrastructure.cache.CacheFacade;
import com.getmypage.blog.infrastructure.search.SearchClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 文章变更事件监听器。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PostPublishedListener {

    private final CacheFacade cacheFacade;
    private final SearchClient searchClient;

    /**
     * 功能：消费文章变更事件并串行执行缓存失效、列表版本递增与索引同步。
     * 关键参数：event 为文章变更事件，包含 postId/status/deleted。
     * 返回值/副作用：无返回值；副作用为操作缓存与搜索索引。
     */
    @EventListener
    public void onPostPublished(PostPublishedEvent event) {
        Long postId = event.getPostId();
        cacheFacade.evictPostAndBumpListVersion(postId);
        searchClient.syncPublicPostIndex(postId, event.getStatus(), event.isDeleted());
        log.info("Handled post changed event: postId={}, status={}, deleted={}", postId, event.getStatus(), event.isDeleted());
    }
}
