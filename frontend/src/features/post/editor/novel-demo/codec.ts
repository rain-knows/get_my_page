import type { JSONContent } from 'novel';
import { normalizeNovelAssetUrls } from '@/features/post/editor/novel-demo/asset-url';
import type { PostContentFormat } from '@/features/post/types';

const EMPTY_NOVEL_DOC: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
  ],
};

/**
 * 功能：判断任意对象是否符合 tiptap-json 顶层文档结构。
 * 关键参数：value 为待校验对象。
 * 返回值/副作用：返回是否为合法文档对象；无副作用。
 */
function isTiptapDocument(value: unknown): value is JSONContent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as { type?: unknown; content?: unknown };
  return candidate.type === 'doc' && Array.isArray(candidate.content);
}

/**
 * 功能：将后端正文字符串解析为 Novel 可消费的 JSON 文档并做资源 URL 归一化。
 * 关键参数：content 为正文 JSON 字符串；contentFormat 为正文格式标识。
 * 返回值/副作用：返回可编辑/可渲染文档对象；无副作用。
 */
export function parsePostContentToNovelDoc(content: string, contentFormat: PostContentFormat): JSONContent {
  if (contentFormat !== 'tiptap-json') {
    return normalizeNovelAssetUrls(EMPTY_NOVEL_DOC);
  }

  try {
    const parsed = JSON.parse(content) as unknown;
    if (!isTiptapDocument(parsed)) {
      return normalizeNovelAssetUrls(EMPTY_NOVEL_DOC);
    }

    return normalizeNovelAssetUrls(parsed);
  } catch {
    return normalizeNovelAssetUrls(EMPTY_NOVEL_DOC);
  }
}

/**
 * 功能：将 Novel 文档序列化为后端保存所需的 tiptap-json 字符串。
 * 关键参数：doc 为当前编辑器文档对象。
 * 返回值/副作用：返回 JSON 字符串；无副作用。
 */
export function serializeNovelDoc(doc: JSONContent): string {
  return JSON.stringify(doc);
}

/**
 * 功能：从文档节点递归提取可读文本，用于生成文章摘要。
 * 关键参数：node 为任意 tiptap 节点或节点数组。
 * 返回值/副作用：返回提取后的纯文本；无副作用。
 */
function extractPlainText(node: unknown): string {
  if (!node) {
    return '';
  }

  if (Array.isArray(node)) {
    return node
      .map((item) => extractPlainText(item))
      .filter(Boolean)
      .join(' ');
  }

  if (typeof node !== 'object') {
    return '';
  }

  const current = node as {
    text?: unknown;
    attrs?: Record<string, unknown>;
    content?: unknown;
  };

  const directText = typeof current.text === 'string' ? current.text : '';
  const altText = typeof current.attrs?.alt === 'string' ? current.attrs.alt : '';
  const childText = extractPlainText(current.content);

  return [directText, altText, childText].filter(Boolean).join(' ');
}

/**
 * 功能：生成固定长度摘要文本，供自动保存时回填 excerpt 字段。
 * 关键参数：doc 为当前文档；maxLength 为摘要最大长度。
 * 返回值/副作用：返回截断后的摘要文本；无副作用。
 */
export function buildExcerptFromNovelDoc(doc: JSONContent, maxLength = 140): string {
  const plainText = extractPlainText(doc).replace(/\s+/g, ' ').trim();
  if (!plainText) {
    return '';
  }

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.slice(0, maxLength);
}
