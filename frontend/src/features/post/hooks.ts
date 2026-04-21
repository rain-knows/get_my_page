import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import { fetchPostDetail, fetchPostList } from '@/features/post/api';
import type { PostDetail, PostListItem, PostListQuery, PostListResponse } from '@/features/post/types';

interface PostListState {
  records: PostListItem[];
  pagination: Pick<PostListResponse, 'current' | 'size' | 'total' | 'pages'>;
}

const DEFAULT_POST_LIST_STATE: PostListState = {
  records: [],
  pagination: {
    current: 1,
    size: 10,
    total: 0,
    pages: 0,
  },
};

/**
 * 功能：封装文章列表加载状态与重载行为，供列表页面复用。
 * 关键参数：query 控制分页与草稿可见性。
 * 返回值/副作用：返回列表数据、加载状态、错误信息与重载函数；副作用为触发网络请求。
 */
export function usePostList(query: PostListQuery = {}) {
  const [data, setData] = useState<PostListState>(DEFAULT_POST_LIST_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const page = query.page ?? 1;
  const size = query.size ?? 10;
  const includeDraft = query.includeDraft ?? false;

  /**
   * 功能：加载文章分页数据并维护错误状态。
   * 关键参数：无（闭包内读取 page/size/includeDraft）。
   * 返回值/副作用：返回 Promise<void>；副作用为更新 React 状态。
   */
  const reload = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetchPostList({ page, size, includeDraft });
      setData({
        records: response.records,
        pagination: {
          current: Number(response.current),
          size: Number(response.size),
          total: Number(response.total),
          pages: Number(response.pages),
        },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('文章列表加载失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }, [includeDraft, page, size]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    ...data,
    loading,
    error,
    reload,
  };
}

/**
 * 功能：封装文章详情加载状态与重载行为，供详情页复用。
 * 关键参数：slug 为文章唯一标识；includeDraft 控制草稿可见性。
 * 返回值/副作用：返回详情数据、加载状态、错误信息与重载函数；副作用为触发网络请求。
 */
export function usePostDetail(slug: string, includeDraft = false) {
  const [data, setData] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * 功能：按 slug 重新加载文章详情。
   * 关键参数：无（闭包内读取 slug/includeDraft）。
   * 返回值/副作用：返回 Promise<void>；副作用为更新 React 状态。
   */
  const reload = useCallback(async () => {
    if (!slug.trim()) {
      setData(null);
      setError('文章标识无效');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetchPostDetail(slug, includeDraft);
      setData(response);
    } catch (err) {
      setData(null);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('文章详情加载失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }, [includeDraft, slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    data,
    loading,
    error,
    reload,
  };
}
