package com.getmypage.blog.infrastructure.cache;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CacheFacadeTest {

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache cache;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    /**
     * 功能：验证文章缓存失效时会同时清理本地缓存与 Redis 缓存键。
     * 关键参数：无（测试内部固定 postId=42）。
     * 返回值/副作用：无返回值；断言本地缓存与 Redis 删除调用均已发生。
     */
    @Test
    void evictPostShouldEvictCaffeineAndRedis() {
        when(cacheManager.getCache("postDetail")).thenReturn(cache);
        CacheFacade cacheFacade = new CacheFacade(cacheManager, stringRedisTemplate);

        cacheFacade.evictPost(42L);

        verify(cache).evict(42L);
        verify(stringRedisTemplate).delete("blog:post:detail:42");
    }

    /**
     * 功能：验证写操作后会执行详情缓存失效并递增文章列表版本号。
     * 关键参数：无（测试内部固定 postId=100）。
     * 返回值/副作用：无返回值；断言列表版本递增调用生效。
     */
    @Test
    void evictPostAndBumpListVersionShouldIncrementListVersion() {
        when(cacheManager.getCache("postDetail")).thenReturn(cache);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("blog:post:list:version")).thenReturn(8L);

        CacheFacade cacheFacade = new CacheFacade(cacheManager, stringRedisTemplate);
        long latestVersion = cacheFacade.bumpPostListVersion();
        cacheFacade.evictPostAndBumpListVersion(100L);

        assertEquals(8L, latestVersion);
        verify(valueOperations, org.mockito.Mockito.times(2)).increment("blog:post:list:version");
        verify(cache).evict(100L);
        verify(stringRedisTemplate).delete("blog:post:detail:100");
    }
}
