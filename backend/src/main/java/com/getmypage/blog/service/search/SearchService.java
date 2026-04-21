package com.getmypage.blog.service.search;

import com.getmypage.blog.model.dto.response.SearchResponse;

/**
 * 搜索服务。
 */
public interface SearchService {

    /**
     * 功能：执行公开文章搜索，优先走搜索引擎，失败时降级 MySQL 模糊查询。
     * 关键参数：keyword 为搜索关键词。
     * 返回值/副作用：返回搜索结果；关键词为空时抛出参数异常。
     */
    SearchResponse search(String keyword);
}
