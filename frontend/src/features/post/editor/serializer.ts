import type { JSONContent } from '@tiptap/core';
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
 * 功能：将后端文章正文转换为 Tiptap 可编辑的 JSON 文档。
 * 关键参数：content 为原始正文；contentFormat 指示正文来源格式。
 * 返回值/副作用：返回 Tiptap JSON 文档对象；无副作用。
 */
export function parsePostContentToEditorDoc(content: string, contentFormat: PostContentFormat): JSONContent {
  if (contentFormat === 'tiptap-json') {
    try {
      const parsed = JSON.parse(content) as JSONContent;
      if (parsed && parsed.type === 'doc') {
        return parsed;
      }
    } catch {
      return EMPTY_EDITOR_DOC;
    }
  }

  const paragraphs = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: block }],
    }));

  if (paragraphs.length === 0) {
    return EMPTY_EDITOR_DOC;
  }

  return {
    type: 'doc',
    content: paragraphs,
  };
}

/**
 * 功能：将编辑器文档序列化为后端可持久化的字符串。
 * 关键参数：doc 为 Tiptap JSON 文档对象。
 * 返回值/副作用：返回 JSON 字符串；无副作用。
 */
export function serializeEditorDoc(doc: JSONContent): string {
  return JSON.stringify(doc);
}

/**
 * 功能：从 Tiptap JSON 文档中递归提取纯文本，用于摘要兜底。
 * 关键参数：node 为任意 JSON 节点。
 * 返回值/副作用：返回拼接后的纯文本；无副作用。
 */
function extractPlainTextFromNode(node: JSONContent): string {
  if (typeof node.text === 'string') {
    return node.text;
  }

  if (!Array.isArray(node.content) || node.content.length === 0) {
    return '';
  }

  return node.content.map((child) => extractPlainTextFromNode(child)).join(' ');
}

/**
 * 功能：从编辑器文档中提取裁剪后的摘要文本。
 * 关键参数：doc 为 Tiptap JSON 文档对象；maxLength 为最大长度。
 * 返回值/副作用：返回摘要字符串；无副作用。
 */
export function buildExcerptFromEditorDoc(doc: JSONContent, maxLength = 140): string {
  const text = extractPlainTextFromNode(doc).replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}
