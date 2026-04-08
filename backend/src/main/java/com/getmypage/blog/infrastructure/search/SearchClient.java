package com.getmypage.blog.infrastructure.search;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 搜索基础设施封装。
 */
@Slf4j
@Component
public class SearchClient {

    public void updatePostIndex(Long postId) {
        // TODO: 接入 Meilisearch 写入文章索引。
        log.debug("Update post index placeholder, postId={}", postId);
    }
}
