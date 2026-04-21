package com.getmypage.blog.controller.search;

import com.getmypage.blog.model.dto.response.ApiResponse;
import com.getmypage.blog.model.dto.response.SearchResponse;
import com.getmypage.blog.service.search.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 搜索控制器。
 */
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Tag(name = "搜索模块", description = "公开搜索接口")
public class SearchController {

    private final SearchService searchService;

    /**
     * 功能：执行关键词搜索，优先引擎检索，失败时降级数据库检索。
     * 关键参数：keyword 为查询关键词（对应 q 参数）。
     * 返回值/副作用：返回统一搜索响应；无副作用。
     */
    @Operation(summary = "搜索文章", description = "关键词搜索，公开可访问")
    @GetMapping
    public ApiResponse<SearchResponse> search(@RequestParam("q") String keyword) {
        return ApiResponse.success(searchService.search(keyword));
    }
}
