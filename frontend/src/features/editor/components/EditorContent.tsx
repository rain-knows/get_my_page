'use client';

import type { KeyboardEvent } from 'react';
import type { Editor as TiptapEditor } from '@tiptap/react';
import { EditorContent as TiptapEditorContent } from '@tiptap/react';

interface EditorContentProps {
  editor: TiptapEditor | null;
  className?: string;
  onKeyDownCapture?: (event: KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * 功能：封装 Tiptap 编辑区组件，作为平台层统一 EditorContent 出口。
 * 关键参数：editor 为编辑器实例；onKeyDownCapture 用于拦截键盘语义。
 * 返回值/副作用：返回编辑区节点；无副作用。
 */
export function EditorContent({ editor, className, onKeyDownCapture }: EditorContentProps) {
  return (
    <div className={className} onKeyDownCapture={onKeyDownCapture}>
      <TiptapEditorContent editor={editor} />
    </div>
  );
}
