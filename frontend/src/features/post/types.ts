import type { PaginatedData } from '@/types/api';

export type PostContentFormat = 'mdx' | 'tiptap-json' | string;

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
