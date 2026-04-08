package com.getmypage.blog.event;

import org.springframework.context.ApplicationEvent;

/**
 * 文章发布事件。
 * 发布后用于触发索引更新、缓存失效等异步任务。
 */
public class PostPublishedEvent extends ApplicationEvent {

    private final Long postId;

    public PostPublishedEvent(Object source, Long postId) {
        super(source);
        this.postId = postId;
    }

    public Long getPostId() {
        return postId;
    }
}
