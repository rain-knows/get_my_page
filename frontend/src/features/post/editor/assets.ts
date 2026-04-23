import type { JSONContent } from 'novel';

const INTERNAL_STORAGE_HOSTS = new Set(['minio', 'blog-minio']);

/**
 * 功能：获取前端可访问的对象存储公网基地址，优先使用 NEXT_PUBLIC_MINIO_URL。
 * 关键参数：无。
 * 返回值/副作用：返回规范化后的基地址字符串；无副作用。
 */
function resolvePublicStorageBaseUrl(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_MINIO_URL ?? '').trim();
  if (fromEnv) {
    return fromEnv.endsWith('/') ? fromEnv.slice(0, -1) : fromEnv;
  }
  return 'http://localhost:9000';
}

/**
 * 功能：将对象存储 URL 归一化为浏览器可访问地址，兼容容器内域名写入历史数据。
 * 关键参数：inputUrl 为任意资源 URL。
 * 返回值/副作用：返回归一化后的 URL；无副作用。
 */
export function normalizeStorageAssetUrl(inputUrl: string): string {
  const normalizedInput = inputUrl.trim();
  if (!normalizedInput) {
    return normalizedInput;
  }

  try {
    const target = new URL(normalizedInput);
    const host = target.hostname.toLowerCase();
    if (!INTERNAL_STORAGE_HOSTS.has(host)) {
      return normalizedInput;
    }

    const publicBase = new URL(resolvePublicStorageBaseUrl());
    return `${publicBase.origin}${target.pathname}${target.search}`;
  } catch {
    return normalizedInput;
  }
}

/**
 * 功能：递归归一化编辑器文档中的图片与卡片资源 URL，避免历史内容因内网域名导致渲染失败。
 * 关键参数：node 为待处理的 tiptap 节点或节点数组。
 * 返回值/副作用：返回归一化后的节点结构；无副作用。
 */
function normalizeNodeAssetUrls(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map((child) => normalizeNodeAssetUrls(child));
  }

  if (!node || typeof node !== 'object') {
    return node;
  }

  const current = node as {
    type?: string;
    attrs?: Record<string, unknown>;
    content?: unknown;
  };

  const nextAttrs = { ...(current.attrs ?? {}) };
  if (typeof nextAttrs.src === 'string') {
    nextAttrs.src = normalizeStorageAssetUrl(nextAttrs.src);
  }
  if (typeof nextAttrs.coverUrl === 'string') {
    nextAttrs.coverUrl = normalizeStorageAssetUrl(nextAttrs.coverUrl);
  }

  return {
    ...current,
    attrs: nextAttrs,
    content: normalizeNodeAssetUrls(current.content),
  };
}

/**
 * 功能：批量归一化 tiptap 文档中的资源地址，供编辑器与阅读器初始化复用。
 * 关键参数：doc 为原始 tiptap JSON 文档。
 * 返回值/副作用：返回处理后的文档副本；无副作用。
 */
export function normalizeEditorAssetUrls(doc: JSONContent): JSONContent {
  return normalizeNodeAssetUrls(doc) as JSONContent;
}
