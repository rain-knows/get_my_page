package com.getmypage.blog.event;

import org.springframework.context.ApplicationEvent;

/**
 * 文章变更事件。
 * 写操作后用于触发缓存失效、列表版本递增与搜索索引同步。
 */
public class PostPublishedEvent extends ApplicationEvent {

    private final Long postId;
    private final Integer status;
    private final boolean deleted;

    /**
     * 功能：创建兼容旧调用的文章变更事件，默认视为已发布且未删除。
     * 关键参数：source 为事件源；postId 为文章 ID。
     * 返回值/副作用：无返回值；构造后可被监听器消费。
     */
    public PostPublishedEvent(Object source, Long postId) {
        this(source, postId, 1, false);
    }

    /**
     * 功能：创建包含状态与删除标记的文章变更事件。
     * 关键参数：source 为事件源；postId 为文章 ID；status 为文章状态；deleted 为是否删除。
     * 返回值/副作用：无返回值；构造后可被监听器消费。
     */
    public PostPublishedEvent(Object source, Long postId, Integer status, boolean deleted) {
        super(source);
        this.postId = postId;
        this.status = status;
        this.deleted = deleted;
    }

    /**
     * 功能：获取文章 ID。
     * 关键参数：无。
     * 返回值/副作用：返回文章 ID；无副作用。
     */
    public Long getPostId() {
        return postId;
    }

    /**
     * 功能：获取文章状态。
     * 关键参数：无。
     * 返回值/副作用：返回文章状态值；无副作用。
     */
    public Integer getStatus() {
        return status;
    }

    /**
     * 功能：获取文章是否已删除标记。
     * 关键参数：无。
     * 返回值/副作用：返回删除标记；无副作用。
     */
    public boolean isDeleted() {
        return deleted;
    }
}
