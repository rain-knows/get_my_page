"use client";

import { useMemo } from 'react';
import {
  EditorContent,
  EditorRoot,
  StarterKit,
  TiptapLink,
  UpdatedImage,
  type JSONContent,
} from 'novel';
import type { PostContentFormat } from '@/features/post/types';

interface PostContentRendererProps {
  content: string;
  contentFormat: PostContentFormat;
}

/**
 * 功能：解析后端 tiptap-json 字符串为可渲染文档对象。
 * 关键参数：content 为正文 JSON 字符串。
 * 返回值/副作用：返回解析后的文档对象，失败时返回 null；无副作用。
 */
function parseTiptapDocument(content: string): JSONContent | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const candidate = parsed as { type?: unknown; content?: unknown };
    if (candidate.type !== 'doc' || !Array.isArray(candidate.content)) {
      return null;
    }
    return candidate as JSONContent;
  } catch {
    return null;
  }
}

/**
 * 功能：按 tiptap-json 协议渲染文章正文，确保阅读链路与 Novel 编辑器协议一致。
 * 关键参数：content 为正文 JSON 字符串；contentFormat 为正文格式标识。
 * 返回值/副作用：返回正文渲染节点；无副作用。
 */
export function PostContentRenderer({ content, contentFormat }: PostContentRendererProps) {
  const document = useMemo(() => parseTiptapDocument(content), [content]);

  if (contentFormat !== 'tiptap-json') {
    return (
      <div className="border border-red-500/40 bg-(--gmp-bg-panel) p-4">
        <p className="font-mono text-xs uppercase tracking-widest text-red-400">
          CONTENT FORMAT UNSUPPORTED // EXPECTED tiptap-json
        </p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="border border-red-500/40 bg-(--gmp-bg-panel) p-4">
        <p className="font-mono text-xs uppercase tracking-widest text-red-400">
          TIPTAP JSON PARSE FAILED // PLEASE CHECK MIGRATION RESULT
        </p>
      </div>
    );
  }

  return (
    <EditorRoot>
      <EditorContent
        immediatelyRender={false}
        editable={false}
        initialContent={document}
        extensions={[
          StarterKit.configure({
            heading: { levels: [1, 2, 3] },
          }),
          TiptapLink.configure({
            openOnClick: true,
            autolink: false,
            linkOnPaste: false,
          }),
          UpdatedImage,
        ]}
        editorProps={{
          attributes: {
            class:
              'gmp-notion-editor min-h-24 border border-(--gmp-line-soft) bg-(--gmp-bg-base) p-4 md:p-6 font-mono text-sm leading-relaxed text-(--gmp-text-primary) focus:outline-none',
          },
        }}
      />
    </EditorRoot>
  );
}
