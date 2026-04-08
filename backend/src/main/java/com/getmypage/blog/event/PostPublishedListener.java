package com.getmypage.blog.event;

import com.getmypage.blog.infrastructure.cache.CacheFacade;
import com.getmypage.blog.infrastructure.search.SearchClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 文章发布事件监听器。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PostPublishedListener {

    private final CacheFacade cacheFacade;
    private final SearchClient searchClient;

    @EventListener
    public void onPostPublished(PostPublishedEvent event) {
        Long postId = event.getPostId();
        cacheFacade.evictPost(postId);
        searchClient.updatePostIndex(postId);
        log.info("Handled post published event: postId={}", postId);
    }
}
