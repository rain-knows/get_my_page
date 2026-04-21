import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import { fetchSearchResults } from '@/features/search/api';
import type { SearchResponse } from '@/features/search/types';

/**
 * 功能：封装搜索请求状态管理，统一处理空关键词、失败提示与重载。
 * 关键参数：keyword 为用户输入的检索词。
 * 返回值/副作用：返回搜索状态、搜索数据与重载函数；副作用为触发网络请求。
 */
export function useSearchResults(keyword: string) {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizedKeyword = useMemo(() => keyword.trim(), [keyword]);
  const isEmptyKeyword = normalizedKeyword.length === 0;

  /**
   * 功能：按当前关键词触发搜索请求。
   * 关键参数：无（闭包内读取 normalizedKeyword）。
   * 返回值/副作用：返回 Promise<void>；副作用为更新 React 状态。
   */
  const reload = useCallback(async () => {
    if (!normalizedKeyword) {
      setData(null);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetchSearchResults(normalizedKeyword);
      setData(response);
    } catch (err) {
      setData(null);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('搜索失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }, [normalizedKeyword]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    data,
    loading,
    error,
    isEmptyKeyword,
    normalizedKeyword,
    reload,
  };
}
