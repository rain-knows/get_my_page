'use client';

import { CodeBlockToolbar } from '@/features/post/editor/code-block/code-block-toolbar';
import { CodeEditor } from '@/features/post/editor/code-block/code-editor';
import type { CodeBlockLanguage } from '@/features/post/editor/code-block/code-block-languages';
import { cn } from '@/lib/utils';

export interface CodeBlockProps {
  value: string;
  language: CodeBlockLanguage;
  onChange?: (value: string) => void;
  onLanguageChange?: (language: CodeBlockLanguage) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
  height?: string;
  showToolbar?: boolean;
  showCopyButton?: boolean;
  showLanguageSelect?: boolean;
  showLanguageLabel?: boolean;
}

/**
 * 功能：渲染博客编辑器内可复用的代码块容器。
 * 关键参数：value/language 为受控代码内容与语言，readOnly 控制编辑能力。
 * 返回值/副作用：返回代码块 UI；编辑或切换语言时通过回调同步外部状态。
 */
export function CodeBlock({
  value,
  language,
  onChange,
  onLanguageChange,
  readOnly = false,
  placeholder = '输入代码...',
  className,
  minHeight,
  maxHeight,
  height,
  showToolbar = true,
  showCopyButton = true,
  showLanguageSelect = true,
  showLanguageLabel = true,
}: CodeBlockProps) {
  return (
    <div className={cn('gmp-code-block-card not-prose', className)} data-editable={readOnly ? 'false' : 'true'}>
      {showToolbar ? (
        <CodeBlockToolbar
          code={value}
          language={language}
          onLanguageChange={onLanguageChange}
          readOnly={readOnly}
          showCopyButton={showCopyButton}
          showLanguageSelect={showLanguageSelect}
          showLanguageLabel={showLanguageLabel}
        />
      ) : null}
      <div className="gmp-code-block-editor">
        <CodeEditor
          value={value}
          language={language}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          minHeight={minHeight}
          maxHeight={maxHeight}
          height={height}
        />
      </div>
    </div>
  );
}
