import { useCallback, useSyncExternalStore } from 'react';
import useSWR, { type KeyedMutator, useSWRConfig } from 'swr';
import { ApiError } from '@/lib/api-client';
import { fetchPostDetail, fetchPostList } from '@/features/post/api';
import type { PostListItem, PostListQuery, PostListResponse } from '@/features/post/types';
import { useAuthStore } from '@/stores/use-auth-store';

interface PostListState {
  records: PostListItem[];
  pagination: Pick<PostListResponse, 'current' | 'size' | 'total' | 'pages'>;
}

/** 文章列表的 SWR 缓存键前缀，用于批量失效。 */
export const POST_LIST_CACHE_KEY = '/posts.list';

/**
 * 功能：按查询参数拼接出唯一 SWR 缓存键，实现不同分页/权限独立缓存。
 * 关键参数：query 控制分页与草稿可见性。
 * 返回值/副作用：返回去重后的列表缓存键元组；无副作用。
 */
function buildPostListKey(query: PostListQuery): [string, number, number, boolean] {
  const page = query.page ?? 1;
  const size = query.size ?? 10;
  const includeDraft = query.includeDraft ?? false;
  return [POST_LIST_CACHE_KEY, page, size, includeDraft];
}

/**
 * 功能：将原始列表响应映射为组件友好的状态对象。
 * 关键参数：response 为后端分页响应。
 * 返回值/副作用：返回 PostListState；无副作用。
 */
function mapPostListResponse(response: PostListResponse): PostListState {
  return {
    records: response.records,
    pagination: {
      current: Number(response.current),
      size: Number(response.size),
      total: Number(response.total),
      pages: Number(response.pages),
    },
  };
}

/**
 * 功能：封装文章列表加载状态与重载行为，底层基于 SWR 实现请求去重与缓存。
 * 关键参数：query 控制分页与草稿可见性。
 * 返回值/副作用：返回列表数据、加载状态、错误信息与重载函数；副作用为触发网络请求。
 */
export function usePostList(query: PostListQuery = {}) {
  const key = buildPostListKey(query);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    async ([, page, size, includeDraft]) => {
      const response = await fetchPostList({ page, size, includeDraft });
      return mapPostListResponse(response);
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    },
  );

  /**
   * 功能：重新加载文章列表数据。
   * 关键参数：无。
   * 返回值/副作用：返回 Promise；副作用为触发 SWR 重验证。
   */
  const reload = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    records: data?.records ?? [],
    pagination: data?.pagination ?? { current: 1, size: 10, total: 0, pages: 0 },
    loading: isLoading,
    validating: isValidating,
    error: error ? (error instanceof ApiError ? error.message : '文章列表加载失败，请稍后重试') : '',
    reload,
    mutate,
  };
}

/**
 * 功能：构建文章详情 SWR 缓存键。
 * 关键参数：slug 为文章唯一标识；includeDraft 控制草稿可见性。
 * 返回值/副作用：返回详情缓存键元组或 null（slug 无效时）；无副作用。
 */
function buildPostDetailKey(slug: string, includeDraft: boolean): [string, string, boolean] | null {
  if (!slug.trim()) {
    return null;
  }
  return ['/posts.detail', slug, includeDraft];
}

/**
 * 功能：封装文章详情加载状态与重载行为，底层基于 SWR 实现请求去重与缓存。
 * 关键参数：slug 为文章唯一标识；includeDraft 控制草稿可见性。
 * 返回值/副作用：返回详情数据、加载状态、错误信息与重载函数；副作用为触发网络请求。
 */
export function usePostDetail(slug: string, includeDraft = false) {
  const key = buildPostDetailKey(slug, includeDraft);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    async ([, s, incDraft]) => fetchPostDetail(s, incDraft),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    },
  );

  /**
   * 功能：重新加载文章详情数据。
   * 关键参数：无。
   * 返回值/副作用：返回 Promise；副作用为触发 SWR 重验证。
   */
  const reload = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    data: data ?? null,
    loading: isLoading,
    validating: isValidating,
    error: error ? (error instanceof ApiError ? error.message : '文章详情加载失败，请稍后重试') : '',
    reload,
    mutate,
  };
}

/**
 * 功能：返回批量失效文章列表缓存的函数，供写操作（create/update/delete）后调用。
 * 关键参数：无。
 * 返回值/副作用：返回失效函数；副作用不在此执行，由调用方触发。
 */
export function useInvalidatePostList(): () => Promise<void> {
  const { mutate } = useSWRConfig();

  return useCallback(async () => {
    await mutate(
      (key) => Array.isArray(key) && key[0] === POST_LIST_CACHE_KEY,
      undefined,
      { revalidate: true },
    );
  }, [mutate]);
}

export type { KeyedMutator };

// ---- 以下为权限相关 hooks（保持不变） ----

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
    return () => { };
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
