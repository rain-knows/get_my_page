import { apiClient } from '@/lib/api-client';
import type { SearchResponse } from '@/features/search/types';

/**
 * 功能：按关键词请求搜索结果。
 * 关键参数：keyword 为用户输入的检索词。
 * 返回值/副作用：返回搜索结果结构，无副作用。
 */
export async function fetchSearchResults(keyword: string): Promise<SearchResponse> {
  return apiClient.get<SearchResponse>('/search', {
    q: keyword,
  });
}
