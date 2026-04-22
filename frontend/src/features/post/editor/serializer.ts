import type { JSONContent } from 'novel';
import type { PostContentFormat } from '@/features/post/types';

const EMPTY_EDITOR_DOC: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
  ],
};

/**
 * 功能：判断任意对象是否满足 tiptap-json 顶层文档结构。
 * 关键参数：value 为待判定对象。
 * 返回值/副作用：返回是否为合法 tiptap 文档；无副作用。
 */
function isTiptapDocContent(value: unknown): value is JSONContent {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { type?: unknown; content?: unknown };
  return candidate.type === 'doc' && Array.isArray(candidate.content);
}

/**
 * 功能：将后端文章正文转换为 Novel/Tiptap 可编辑的 JSON 文档。
 * 关键参数：content 为原始正文；contentFormat 指示正文格式。
 * 返回值/副作用：返回 Tiptap JSON 文档对象；无副作用。
 */
export function parsePostContentToEditorDoc(content: string, contentFormat: PostContentFormat): JSONContent {
  if (contentFormat !== 'tiptap-json') {
    return EMPTY_EDITOR_DOC;
  }

  try {
    const parsed = JSON.parse(content) as unknown;
    if (!isTiptapDocContent(parsed)) {
      return EMPTY_EDITOR_DOC;
    }
    return parsed;
  } catch {
    return EMPTY_EDITOR_DOC;
  }
}

/**
 * 功能：将编辑器文档序列化为后端可持久化的 tiptap-json 字符串。
 * 关键参数：doc 为 Tiptap JSON 文档对象。
 * 返回值/副作用：返回 JSON 字符串；无副作用。
 */
export function serializeEditorDoc(doc: JSONContent): string {
  return JSON.stringify(doc);
}

/**
 * 功能：从编辑器文档中提取裁剪后的摘要文本。
 * 关键参数：doc 为 Tiptap JSON 文档对象；maxLength 为最大长度。
 * 返回值/副作用：返回摘要字符串；无副作用。
 */
export function buildExcerptFromEditorDoc(doc: JSONContent, maxLength = 140): string {
  const text = extractPlainTextFromNode(doc).replace(/\s+/g, ' ').trim();
  if (!text) {
    return '';
  }
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength);
}

/**
 * 功能：提供编辑器空文档的 tiptap-json 字符串，供初始化流程复用。
 * 关键参数：无。
 * 返回值/副作用：返回空文档 JSON 字符串；无副作用。
 */
export function buildEmptyBlockDocumentRaw(): string {
  return JSON.stringify(EMPTY_EDITOR_DOC);
}

/**
 * 功能：递归提取 tiptap 节点中的纯文本，覆盖文本、图片与常见卡片 attrs。
 * 关键参数：node 为任意 tiptap 节点或节点数组。
 * 返回值/副作用：返回拼接后的纯文本；无副作用。
 */
function extractPlainTextFromNode(node: unknown): string {
  if (!node) {
    return '';
  }

  if (Array.isArray(node)) {
    return node
      .map((child) => extractPlainTextFromNode(child))
      .filter(Boolean)
      .join(' ');
  }

  if (typeof node !== 'object') {
    return '';
  }

  const current = node as {
    type?: string;
    text?: string;
    attrs?: Record<string, unknown>;
    content?: unknown;
  };

  const directText = typeof current.text === 'string' ? current.text : '';
  const attrsText = extractTextFromAttrs(current.type, current.attrs);
  const childText = extractPlainTextFromNode(current.content);

  return [directText, attrsText, childText].filter(Boolean).join(' ');
}

/**
 * 功能：提取节点 attrs 中可读文本字段，补齐图片和卡片类节点摘要。
 * 关键参数：type 为节点类型；attrs 为节点属性。
 * 返回值/副作用：返回可读文本；无副作用。
 */
function extractTextFromAttrs(type: string | undefined, attrs: Record<string, unknown> | undefined): string {
  if (!attrs) {
    return '';
  }

  if (type === 'image' || type === 'imageBlock') {
    const caption = typeof attrs.caption === 'string' ? attrs.caption : '';
    if (caption) {
      return caption;
    }
    return typeof attrs.alt === 'string' ? attrs.alt : '';
  }

  if (type === 'embedGithub' || type === 'embedMusic' || type === 'embedVideo' || type === 'embedLink') {
    const title = typeof attrs.title === 'string' ? attrs.title : '';
    if (title) {
      return title;
    }

    const snapshot = attrs.snapshot;
    if (snapshot && typeof snapshot === 'object') {
      const snapshotTitle = (snapshot as { title?: unknown }).title;
      if (typeof snapshotTitle === 'string' && snapshotTitle) {
        return snapshotTitle;
      }
    }

    return typeof attrs.url === 'string' ? attrs.url : '';
  }

  return '';
}
