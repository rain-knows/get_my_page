import type { JSONContent } from 'novel';

const INTERNAL_STORAGE_HOSTS = new Set(['minio', 'blog-minio']);

/**
 * 功能：解析对象存储公网基地址，优先使用 NEXT_PUBLIC_MINIO_URL 作为统一出口。
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
 * 功能：标准化对象存储资源 URL，兼容历史内容写入容器内域名导致的前端不可达问题。
 * 关键参数：inputUrl 为任意资源 URL。
 * 返回值/副作用：返回可在浏览器访问的 URL；无副作用。
 */
export function normalizeStorageAssetUrl(inputUrl: string): string {
  const normalizedInput = inputUrl.trim();
  if (!normalizedInput) {
    return normalizedInput;
  }

  try {
    const target = new URL(normalizedInput);
    if (!INTERNAL_STORAGE_HOSTS.has(target.hostname.toLowerCase())) {
      return normalizedInput;
    }

    const publicBase = new URL(resolvePublicStorageBaseUrl());
    return `${publicBase.origin}${target.pathname}${target.search}`;
  } catch {
    return normalizedInput;
  }
}

/**
 * 功能：递归归一化 Tiptap 文档中的资源字段，保证阅读与编辑链路 URL 一致可访问。
 * 关键参数：node 为待处理节点或节点数组。
 * 返回值/副作用：返回处理后的节点副本；无副作用。
 */
function normalizeAssetNode(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map((child) => normalizeAssetNode(child));
  }

  if (!node || typeof node !== 'object') {
    return node;
  }

  const current = node as { attrs?: Record<string, unknown>; content?: unknown };
  const nextAttrs = { ...(current.attrs ?? {}) };

  if (typeof nextAttrs.src === 'string') {
    nextAttrs.src = normalizeStorageAssetUrl(nextAttrs.src);
  }

  return {
    ...current,
    attrs: nextAttrs,
    content: normalizeAssetNode(current.content),
  };
}

/**
 * 功能：批量归一化编辑器文档的资源地址，供编辑器初始化与阅读渲染复用。
 * 关键参数：doc 为原始 tiptap-json 文档。
 * 返回值/副作用：返回处理后的文档对象；无副作用。
 */
export function normalizeNovelAssetUrls(doc: JSONContent): JSONContent {
  return normalizeAssetNode(doc) as JSONContent;
}
