package com.getmypage.blog.infrastructure.cache;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 缓存基础设施封装。
 */
@Slf4j
@Component
public class CacheFacade {

    public void evictPost(Long postId) {
        // TODO: 接入 Redis/Caffeine 删除文章缓存。
        log.debug("Evict post cache placeholder, postId={}", postId);
    }
}
