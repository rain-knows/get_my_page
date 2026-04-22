import type { JSONContent } from '@tiptap/core';
import type { PostContentFormat } from '@/features/post/types';
import {
  buildExcerptFromBlockDocument,
  convertBlockDocumentToTiptapDoc,
  convertTiptapDocToBlockDocument,
  createEmptyBlockDocument,
  parseBlockDocument,
} from '@/features/post/editor/block-model';

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
  if (contentFormat !== 'gmp-block-v1') {
    return EMPTY_EDITOR_DOC;
  }

  const parsedDocument = parseBlockDocument(content);
  if (!parsedDocument) {
    return EMPTY_EDITOR_DOC;
  }

  return convertBlockDocumentToTiptapDoc(parsedDocument);
}

/**
 * 功能：将编辑器文档序列化为后端可持久化的字符串。
 * 关键参数：doc 为 Tiptap JSON 文档对象。
 * 返回值/副作用：返回 JSON 字符串；无副作用。
 */
export function serializeEditorDoc(doc: JSONContent): string {
  return JSON.stringify(convertTiptapDocToBlockDocument(doc));
}

/**
 * 功能：从编辑器文档中提取裁剪后的摘要文本。
 * 关键参数：doc 为 Tiptap JSON 文档对象；maxLength 为最大长度。
 * 返回值/副作用：返回摘要字符串；无副作用。
 */
export function buildExcerptFromEditorDoc(doc: JSONContent, maxLength = 140): string {
  const blockDocument = convertTiptapDocToBlockDocument(doc);
  return buildExcerptFromBlockDocument(blockDocument, maxLength);
}

/**
 * 功能：提供编辑器空文档的 gmp-block-v1 字符串，供迁移与初始化流程复用。
 * 关键参数：无。
 * 返回值/副作用：返回空块文档 JSON 字符串；无副作用。
 */
export function buildEmptyBlockDocumentRaw(): string {
  return JSON.stringify(createEmptyBlockDocument());
}
