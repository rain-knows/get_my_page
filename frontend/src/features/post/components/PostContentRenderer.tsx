"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, EditorRoot } from 'novel';
import {
  applyCodeLineNumberAttributes,
  readCodeLineNumbersPreference,
} from '@/features/post/editor/novel-demo/code-line-numbers';
import { buildNovelRendererExtensions, parsePostContentToNovelDoc } from '@/features/post/editor/novel-demo';
import type { PostContentFormat } from '@/features/post/types';

interface PostContentRendererProps {
  content: string;
  contentFormat: PostContentFormat;
}

/**
 * 功能：按 tiptap-json 协议渲染阅读正文，保证阅读链路与 Novel 编辑链路使用同一扩展基线。
 * 关键参数：content 为正文 JSON 字符串；contentFormat 为正文格式标识。
 * 返回值/副作用：返回阅读态编辑器节点；无副作用。
 */
export function PostContentRenderer({ content, contentFormat }: PostContentRendererProps) {
  const rendererHostRef = useRef<HTMLDivElement | null>(null);
  const document = useMemo(() => parsePostContentToNovelDoc(content, contentFormat), [content, contentFormat]);
  const extensions = useMemo(() => buildNovelRendererExtensions(), []);
  const [showCodeLineNumbers] = useState<boolean>(() => readCodeLineNumbersPreference());

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      applyCodeLineNumberAttributes(rendererHostRef.current, showCodeLineNumbers);
    });
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [document, showCodeLineNumbers]);

  if (contentFormat !== 'tiptap-json') {
    return (
      <div className="border border-red-500/40 bg-(--gmp-bg-panel) p-4">
        <p className="font-mono text-xs uppercase tracking-widest text-red-400">内容格式不受支持 // 仅支持 tiptap-json</p>
      </div>
    );
  }

  return (
    <div ref={rendererHostRef}>
      <EditorRoot>
        <EditorContent
          immediatelyRender={false}
          editable={false}
          initialContent={document}
          extensions={extensions as never[]}
          editorProps={{
            attributes: {
              class: [
                'gmp-novel-editor gmp-novel-view min-h-24 border border-(--gmp-novel-line-strong) bg-(--gmp-novel-surface) px-4 py-6 text-(--gmp-novel-text) gmp-cut-corner-br focus:outline-none md:px-6',
                showCodeLineNumbers ? 'gmp-code-lines-enabled' : '',
              ].join(' '),
            },
          }}
        />
      </EditorRoot>
    </div>
  );
}
