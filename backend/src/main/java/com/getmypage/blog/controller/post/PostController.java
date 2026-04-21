package com.getmypage.blog.controller.post;

import com.getmypage.blog.model.dto.request.PostCreateRequest;
import com.getmypage.blog.model.dto.request.PostUpdateRequest;
import com.getmypage.blog.model.dto.response.ApiResponse;
import com.getmypage.blog.model.dto.response.PageResponse;
import com.getmypage.blog.model.dto.response.PostDetailResponse;
import com.getmypage.blog.model.dto.response.PostListItemResponse;
import com.getmypage.blog.service.post.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 文章控制器。
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Tag(name = "文章模块", description = "文章列表、详情与管理接口")
public class PostController {

    private final PostService postService;

    /**
     * 功能：分页查询文章列表，并支持 includeDraft 控制草稿可见性。
     * 关键参数：page 为页码；size 为每页数量；includeDraft 为是否请求草稿。
     * 返回值/副作用：返回统一分页响应；无副作用。
     */
    @Operation(summary = "文章列表", description = "公开读取文章列表，管理员可通过 includeDraft=true 查询草稿")
    @GetMapping
    public ApiResponse<PageResponse<PostListItemResponse>> listPosts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean includeDraft) {
        return ApiResponse.success(postService.listPosts(page, size, includeDraft));
    }

    /**
     * 功能：按 slug 查询文章详情，并支持 includeDraft 控制草稿可见性。
     * 关键参数：slug 为文章唯一标识；includeDraft 为是否请求草稿。
     * 返回值/副作用：返回文章详情；无副作用。
     */
    @Operation(summary = "文章详情", description = "按 slug 查询文章详情，管理员可通过 includeDraft=true 查询草稿")
    @GetMapping("/{slug}")
    public ApiResponse<PostDetailResponse> getPostDetail(
            @PathVariable String slug,
            @RequestParam(defaultValue = "false") boolean includeDraft) {
        return ApiResponse.success(postService.getPostDetail(slug, includeDraft));
    }

    /**
     * 功能：创建文章。
     * 关键参数：request 为创建请求体。
     * 返回值/副作用：返回新建文章详情；副作用为写入数据库。
     */
    @Operation(summary = "创建文章", description = "仅管理员可写")
    @PostMapping
    public ApiResponse<PostDetailResponse> createPost(@Valid @RequestBody PostCreateRequest request) {
        return ApiResponse.success("创建成功", postService.createPost(request));
    }

    /**
     * 功能：更新文章，支持 baseUpdatedAt 可选冲突检测。
     * 关键参数：id 为文章 ID；request 为更新请求体。
     * 返回值/副作用：返回更新后文章详情；副作用为写入数据库。
     */
    @Operation(summary = "更新文章", description = "仅管理员可写，baseUpdatedAt 传入时执行冲突检测")
    @PutMapping("/{id}")
    public ApiResponse<PostDetailResponse> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostUpdateRequest request) {
        return ApiResponse.success("更新成功", postService.updatePost(id, request));
    }

    /**
     * 功能：删除文章。
     * 关键参数：id 为文章 ID。
     * 返回值/副作用：返回删除成功响应；副作用为执行逻辑删除。
     */
    @Operation(summary = "删除文章", description = "仅管理员可写")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ApiResponse.success("删除成功", null);
    }
}
