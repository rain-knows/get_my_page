'use client';

import CodeMirror from '@uiw/react-codemirror';
import { useMemo } from 'react';
import { buildCodeEditorExtensions } from '@/features/post/editor/code-block/code-editor-extensions';
import type { CodeBlockLanguage } from '@/features/post/editor/code-block/code-block-languages';
import { cn } from '@/lib/utils';

export interface CodeEditorProps {
  value: string;
  language?: CodeBlockLanguage;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
  height?: string;
  showLineNumbers?: boolean;
}

/**
 * 功能：渲染可复用的轻量 CodeMirror 代码编辑器。
 * 关键参数：value/language 控制代码内容与语言高亮，readOnly 控制是否可编辑。
 * 返回值/副作用：返回 CodeMirror 编辑器节点；编辑时通过 onChange 向外同步内容。
 */
export function CodeEditor({
  value,
  language = 'plaintext',
  onChange,
  readOnly = false,
  placeholder,
  className,
  minHeight = '8rem',
  maxHeight,
  height,
  showLineNumbers = true,
}: CodeEditorProps) {
  const extensions = useMemo(
    () => buildCodeEditorExtensions({ language, placeholder, readOnly, showLineNumbers }),
    [language, placeholder, readOnly, showLineNumbers],
  );

  return (
    <div
      className={cn('gmp-code-editor min-w-0 overflow-hidden', className)}
      style={{
        minHeight,
        maxHeight,
        height,
      }}
    >
      <CodeMirror
        basicSetup={false}
        editable={!readOnly}
        extensions={extensions}
        height={height ?? 'auto'}
        maxHeight={maxHeight}
        minHeight={minHeight}
        readOnly={readOnly}
        value={value}
        onChange={(nextValue) => {
          onChange?.(nextValue);
        }}
      />
    </div>
  );
}
