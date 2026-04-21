package com.getmypage.blog.service.post;

import com.getmypage.blog.model.dto.request.PostCreateRequest;
import com.getmypage.blog.model.dto.request.PostUpdateRequest;
import com.getmypage.blog.model.dto.response.PageResponse;
import com.getmypage.blog.model.dto.response.PostDetailResponse;
import com.getmypage.blog.model.dto.response.PostListItemResponse;

/**
 * 文章服务。
 */
public interface PostService {

    /**
     * 功能：分页查询文章列表，并根据角色与 includeDraft 控制草稿可见性。
     * 关键参数：page 为页码；size 为每页大小；includeDraft 为是否请求包含草稿。
     * 返回值/副作用：返回分页文章列表；无副作用。
     */
    PageResponse<PostListItemResponse> listPosts(int page, int size, boolean includeDraft);

    /**
     * 功能：按 slug 查询文章详情，并根据角色与 includeDraft 控制草稿可见性。
     * 关键参数：slug 为文章唯一标识；includeDraft 为是否请求包含草稿。
     * 返回值/副作用：返回文章详情；未命中时抛出资源不存在异常。
     */
    PostDetailResponse getPostDetail(String slug, boolean includeDraft);

    /**
     * 功能：创建文章并触发后续缓存/搜索一致性事件。
     * 关键参数：request 为创建参数。
     * 返回值/副作用：返回新建文章详情；副作用为写入数据库并发布文章变更事件。
     */
    PostDetailResponse createPost(PostCreateRequest request);

    /**
     * 功能：更新文章并在可选 baseUpdatedAt 存在时执行并发冲突检测。
     * 关键参数：postId 为文章 ID；request 为更新参数。
     * 返回值/副作用：返回更新后文章详情；副作用为写入数据库并发布文章变更事件。
     */
    PostDetailResponse updatePost(Long postId, PostUpdateRequest request);

    /**
     * 功能：删除文章并触发缓存/搜索一致性事件。
     * 关键参数：postId 为文章 ID。
     * 返回值/副作用：无返回值；副作用为逻辑删除文章并发布文章变更事件。
     */
    void deletePost(Long postId);
}
