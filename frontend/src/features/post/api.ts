import { apiClient } from '@/lib/api-client';
import type { PostDetail, PostListQuery, PostListResponse } from '@/features/post/types';

/**
 * 功能：请求公开文章列表数据。
 * 关键参数：query 控制分页与是否包含草稿（默认仅已发布）。
 * 返回值/副作用：返回分页文章列表，无副作用。
 */
export async function fetchPostList(query: PostListQuery = {}): Promise<PostListResponse> {
  const page = query.page ?? 1;
  const size = query.size ?? 10;
  const includeDraft = query.includeDraft ?? false;

  return apiClient.get<PostListResponse>('/posts', {
    page,
    size,
    includeDraft,
  });
}

/**
 * 功能：按 slug 请求文章详情。
 * 关键参数：slug 为文章唯一标识；includeDraft 控制是否请求草稿。
 * 返回值/副作用：返回文章详情数据，无副作用。
 */
export async function fetchPostDetail(slug: string, includeDraft = false): Promise<PostDetail> {
  return apiClient.get<PostDetail>(`/posts/${encodeURIComponent(slug)}`, {
    includeDraft,
  });
}
