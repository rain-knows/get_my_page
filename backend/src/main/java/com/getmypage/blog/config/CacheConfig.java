package com.getmypage.blog.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Caffeine 本地缓存配置。
 * 文章详情缓存，最大 500 条，写入后 10 分钟过期。
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * 功能：创建 Caffeine 本地缓存管理器并注册文章详情缓存区。
     * 关键参数：无（缓存策略由本方法内固定配置）。
     * 返回值/副作用：返回 CacheManager；副作用为启用 postDetail 缓存区并应用 TTL 与容量限制。
     */
    @Bean
    public CacheManager caffeineCacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setCacheNames(List.of("postDetail"));
        manager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats());
        return manager;
    }
}
