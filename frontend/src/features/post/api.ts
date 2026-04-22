import { apiClient } from '@/lib/api-client';
import type {
  EmbedResolveResult,
  FileUploadResult,
  PostDetail,
  PostListQuery,
  PostListResponse,
  PostMutationPayload,
} from '@/features/post/types';

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

/**
 * 功能：更新指定文章内容与元信息。
 * 关键参数：postId 为文章 ID；payload 为更新请求体，包含 content/contentFormat/baseUpdatedAt 等字段。
 * 返回值/副作用：返回更新后的文章详情；副作用为触发文章写接口。
 */
export async function updatePost(postId: number, payload: PostMutationPayload): Promise<PostDetail> {
  return apiClient.put<PostDetail>(`/posts/${postId}`, payload);
}

/**
 * 功能：上传文章图片资源并返回可访问地址。
 * 关键参数：file 为待上传文件；postId 为文章 ID（可选，用于后端 key 归档）。
 * 返回值/副作用：返回上传结果；副作用为触发上传写接口。
 */
export async function uploadPostAsset(file: File, postId?: number): Promise<FileUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.postForm<FileUploadResult>('/files/upload', formData, {
    postId,
  });
}

/**
 * 功能：统一解析外链并返回自动识别后的卡片快照。
 * 关键参数：url 为任意外链输入（GitHub/音乐/视频/网页链接）。
 * 返回值/副作用：返回 embed 解析结果；副作用为触发后端统一解析接口。
 */
export async function resolveEmbed(url: string): Promise<EmbedResolveResult> {
  return apiClient.post<EmbedResolveResult>('/embeds/resolve', { url });
}

/**
 * 功能：解析 GitHub 链接并返回可嵌入编辑器的卡片快照。
 * 关键参数：url 为仓库链接或 owner/repo 字符串。
 * 返回值/副作用：返回 embed 解析结果；副作用为触发后端解析接口。
 */
export async function resolveGithubEmbed(url: string): Promise<EmbedResolveResult> {
  return resolveEmbed(url);
}

/**
 * 功能：解析音乐链接（Spotify/网易云/Apple Music/Bilibili）并返回卡片快照。
 * 关键参数：url 为音乐链接。
 * 返回值/副作用：返回 embed 解析结果；副作用为触发后端解析接口。
 */
export async function resolveMusicEmbed(url: string): Promise<EmbedResolveResult> {
  return resolveEmbed(url);
}
