import { apiClient } from '@/lib/api-client';

export interface EmbedResolveResponse {
  cardType: string;
  provider: string;
  normalizedUrl: string;
  resolved: boolean;
  fallbackUrl: string;
  snapshot: Record<string, unknown>;
}

/**
 * 功能：调用后端统一 Embed 解析接口，获取链接卡片元数据快照。
 * 关键参数：url 为待解析的原始或规范化链接。
 * 返回值/副作用：返回解析后的卡片响应；副作用为触发网络请求。
 */
export async function fetchEmbedResolve(url: string): Promise<EmbedResolveResponse> {
  return apiClient.post<EmbedResolveResponse>('/embeds/resolve', { url });
}
