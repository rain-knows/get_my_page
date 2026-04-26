'use client';

import { CodeBlock } from '@/features/post/editor/code-block/code-block';
import {
  normalizeCodeBlockLanguage,
  type CodeBlockLanguage,
} from '@/features/post/editor/code-block/code-block-languages';

export interface CodeBlockViewerProps {
  code: string;
  language?: CodeBlockLanguage;
  className?: string;
  showCopyButton?: boolean;
  showLanguageLabel?: boolean;
}

/**
 * 功能：渲染文章详情页与预览页使用的只读代码块。
 * 关键参数：code 为展示代码，language 控制语法高亮与语言标签。
 * 返回值/副作用：返回只读代码块节点；无编辑副作用。
 */
export function CodeBlockViewer({
  code,
  language = 'plaintext',
  className,
  showCopyButton = true,
  showLanguageLabel = true,
}: CodeBlockViewerProps) {
  return (
    <CodeBlock
      value={code}
      language={normalizeCodeBlockLanguage(language)}
      readOnly
      className={className}
      showCopyButton={showCopyButton}
      showLanguageLabel={showLanguageLabel}
      showLanguageSelect={false}
      showToolbar={showCopyButton || showLanguageLabel}
    />
  );
}
