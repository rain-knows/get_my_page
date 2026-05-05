import type { PaginatedData } from '@/types/api';

export type PostContentFormat = 'tiptap-json';

export type PostStatus = 0 | 1;

export interface PostListQuery {
  page?: number;
  size?: number;
  includeDraft?: boolean;
}

export interface PostListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  summary: string;
  contentFormat: PostContentFormat;
  status: PostStatus;
  coverUrl: string | null;
  updatedAt: string;
  baseUpdatedAt: string;
}

export type PostListResponse = PaginatedData<PostListItem>;

export interface PostDetail {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  summary: string;
  content: string;
  contentFormat: PostContentFormat;
  status: PostStatus;
  coverUrl: string | null;
  createdAt: string;
  updatedAt: string;
  baseUpdatedAt: string;
}

export interface PostMutationPayload {
  title: string;
  slug: string;
  summary?: string;
  excerpt?: string;
  content: string;
  contentFormat: PostContentFormat;
  status: PostStatus;
  baseUpdatedAt?: string;
  coverUrl?: string | null;
}

/**
 * 功能：定义创建文章请求体，与后端 PostCreateRequest 字段一一对应。
 * 关键字段：title/slug/content/contentFormat/status 为必填；summary/excerpt/coverUrl 可选。
 */
export interface PostCreatePayload {
  title: string;
  slug: string;
  summary?: string;
  excerpt?: string;
  content: string;
  contentFormat: PostContentFormat;
  status: PostStatus;
  coverUrl?: string | null;
}

export interface FileUploadResult {
  url: string;
  key: string;
}
