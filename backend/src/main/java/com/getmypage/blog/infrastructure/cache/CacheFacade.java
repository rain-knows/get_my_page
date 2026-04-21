package com.getmypage.blog.infrastructure.cache;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * 缓存基础设施封装。
 */
@Slf4j
@Component
public class CacheFacade {

    private static final String POST_DETAIL_CACHE_NAME = "postDetail";
    private static final String POST_DETAIL_REDIS_KEY_TEMPLATE = "blog:post:detail:%d";
    private static final String POST_LIST_VERSION_REDIS_KEY = "blog:post:list:version";

    private final CacheManager cacheManager;
    private final StringRedisTemplate stringRedisTemplate;

    /**
     * 功能：初始化缓存基础设施门面，注入本地缓存与 Redis 客户端。
     * 关键参数：cacheManager 负责访问 Caffeine 缓存；stringRedisTemplate 负责 Redis 键操作。
     * 返回值/副作用：无返回值；构造后用于执行双层缓存失效与列表版本管理。
     */
    public CacheFacade(CacheManager cacheManager, StringRedisTemplate stringRedisTemplate) {
        this.cacheManager = cacheManager;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    /**
     * 功能：清理文章详情缓存，保持兼容已有调用语义。
     * 关键参数：postId 为文章 ID。
     * 返回值/副作用：无返回值；副作用为删除 Caffeine 与 Redis 两层缓存。
     */
    public void evictPost(Long postId) {
        if (postId == null) {
            log.warn("Skip cache eviction because postId is null");
            return;
        }
        evictLocalPostCache(postId);
        evictRedisPostCache(postId);
    }

    /**
     * 功能：执行写操作后的缓存一致性处理：详情缓存失效 + 列表版本递增。
     * 关键参数：postId 为文章 ID。
     * 返回值/副作用：无返回值；副作用为失效详情缓存并更新列表版本号。
     */
    public void evictPostAndBumpListVersion(Long postId) {
        evictPost(postId);
        bumpPostListVersion();
    }

    /**
     * 功能：递增文章列表缓存版本号，驱动前端或上层缓存失效。
     * 关键参数：无。
     * 返回值/副作用：返回递增后的版本号；副作用为写入 Redis 计数键。
     */
    public long bumpPostListVersion() {
        Long version = stringRedisTemplate.opsForValue().increment(POST_LIST_VERSION_REDIS_KEY);
        long resolvedVersion = version == null ? 0L : version;
        log.debug("Bumped post list version to {}", resolvedVersion);
        return resolvedVersion;
    }

    /**
     * 功能：获取当前文章列表缓存版本号。
     * 关键参数：无。
     * 返回值/副作用：返回版本号，缺失时返回 0；无副作用。
     */
    public long getPostListVersion() {
        String value = stringRedisTemplate.opsForValue().get(POST_LIST_VERSION_REDIS_KEY);
        if (value == null) {
            return 0L;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            log.warn("Invalid post list version value: {}", value);
            return 0L;
        }
    }

    /**
     * 功能：清理本地 Caffeine 的文章详情缓存项。
     * 关键参数：postId 为文章 ID。
     * 返回值/副作用：无返回值；副作用为删除指定 key 的本地缓存。
     */
    private void evictLocalPostCache(Long postId) {
        Cache localCache = cacheManager.getCache(POST_DETAIL_CACHE_NAME);
        if (localCache == null) {
            log.warn("Local cache '{}' is not configured, skip eviction for postId={}", POST_DETAIL_CACHE_NAME, postId);
            return;
        }
        localCache.evict(postId);
        log.debug("Evicted local cache for postId={}", postId);
    }

    /**
     * 功能：清理 Redis 中的文章详情缓存键。
     * 关键参数：postId 为文章 ID。
     * 返回值/副作用：无返回值；副作用为删除对应 Redis 键。
     */
    private void evictRedisPostCache(Long postId) {
        String redisKey = buildPostDetailRedisKey(postId);
        Boolean deleted = stringRedisTemplate.delete(redisKey);
        log.debug("Evicted redis cache key={}, deleted={}", redisKey, Boolean.TRUE.equals(deleted));
    }

    /**
     * 功能：根据文章 ID 生成详情缓存 Redis 键。
     * 关键参数：postId 为文章 ID。
     * 返回值/副作用：返回标准化 Redis key 字符串；无其他副作用。
     */
    private String buildPostDetailRedisKey(Long postId) {
        return POST_DETAIL_REDIS_KEY_TEMPLATE.formatted(postId);
    }
}
