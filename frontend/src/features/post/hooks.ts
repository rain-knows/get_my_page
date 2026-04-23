import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { ApiError } from '@/lib/api-client';
import { fetchPostDetail, fetchPostList } from '@/features/post/api';
import type { PostDetail, PostListItem, PostListQuery, PostListResponse } from '@/features/post/types';
import { useAuthStore } from '@/stores/use-auth-store';

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

/**
 * 功能：解析 JWT accessToken 中的 role 字段，作为刷新后的权限兜底来源。
 * 关键参数：token 为浏览器本地存储的 accessToken。
 * 返回值/副作用：返回角色字符串（大写）或 null；无副作用。
 */
function parseRoleFromAccessToken(token: string): string | null {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) {
      return null;
    }

    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const payloadText = atob(padded);
    const payload = JSON.parse(payloadText) as { role?: unknown };

    if (typeof payload.role !== 'string') {
      return null;
    }

    return payload.role.toUpperCase();
  } catch {
    return null;
  }
}

/**
 * 功能：判断当前浏览器会话是否具备管理员编辑能力。
 * 关键参数：无（内部读取 Zustand 登录态与 localStorage token）。
 * 返回值/副作用：返回管理员标识布尔值；副作用为首次挂载时读取浏览器本地存储。
 */
export function useIsAdminCapability(): boolean {
  const userRole = useAuthStore((state) => state.user?.role ?? null);
  const normalizedUserRole = userRole ? userRole.toUpperCase() : null;
  const tokenRole = useSyncExternalStore(
    subscribeAccessTokenStorage,
    getTokenRoleSnapshot,
    getTokenRoleServerSnapshot,
  );

  return normalizedUserRole === 'ADMIN' || tokenRole === 'ADMIN';
}

/**
 * 功能：为 accessToken 本地存储提供订阅接口，支持跨标签页权限状态同步。
 * 关键参数：onStoreChange 为外部存储变更回调。
 * 返回值/副作用：返回取消订阅函数；副作用为注册/注销 storage 事件监听。
 */
function subscribeAccessTokenStorage(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorage = (event: StorageEvent): void => {
    if (event.key === 'accessToken') {
      onStoreChange();
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener('storage', handleStorage);
  };
}

/**
 * 功能：读取客户端 accessToken 并解析角色快照，供 useSyncExternalStore 客户端分支使用。
 * 关键参数：无。
 * 返回值/副作用：返回角色字符串或 null；副作用为读取 localStorage。
 */
function getTokenRoleSnapshot(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return parseRoleFromAccessToken(localStorage.getItem('accessToken') ?? '');
}

/**
 * 功能：返回 SSR 阶段的权限快照，保证服务端与客户端首帧结构一致。
 * 关键参数：无。
 * 返回值/副作用：固定返回 null；无副作用。
 */
function getTokenRoleServerSnapshot(): string | null {
  return null;
}
