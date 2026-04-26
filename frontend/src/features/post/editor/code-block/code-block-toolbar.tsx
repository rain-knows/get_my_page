'use client';

import { Check, Copy, ListOrdered } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CODE_BLOCK_LANGUAGES,
  resolveCodeBlockLanguageLabel,
  type CodeBlockLanguage,
} from '@/features/post/editor/code-block/code-block-languages';
import { cn } from '@/lib/utils';

interface CodeBlockToolbarProps {
  code: string;
  language: CodeBlockLanguage;
  onLanguageChange?: (language: CodeBlockLanguage) => void;
  readOnly?: boolean;
  showCopyButton?: boolean;
  showLanguageSelect?: boolean;
  showLanguageLabel?: boolean;
  showLineNumberToggle?: boolean;
  lineNumbersEnabled?: boolean;
  onLineNumbersChange?: (enabled: boolean) => void;
  className?: string;
}

/**
 * 功能：复制代码内容到系统剪贴板，并返回是否成功。
 * 关键参数：code 为待复制的代码文本。
 * 返回值/副作用：返回复制是否成功；副作用为调用浏览器剪贴板 API。
 */
async function copyCodeToClipboard(code: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(code);
    return true;
  } catch {
    return false;
  }
}

/**
 * 功能：渲染代码块顶部工具栏，包含语言选择、复制与行号开关。
 * 关键参数：language/code 控制展示与复制内容，readOnly 决定是否允许切换语言。
 * 返回值/副作用：返回工具栏节点；交互时触发语言、复制或行号回调。
 */
export function CodeBlockToolbar({
  code,
  language,
  onLanguageChange,
  readOnly = false,
  showCopyButton = true,
  showLanguageSelect = true,
  showLanguageLabel = true,
  showLineNumberToggle = false,
  lineNumbersEnabled = true,
  onLineNumbersChange,
  className,
}: CodeBlockToolbarProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 1400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  const languageLabel = resolveCodeBlockLanguageLabel(language);
  const canSelectLanguage = !readOnly && showLanguageSelect && Boolean(onLanguageChange);

  return (
    <div className={cn('gmp-code-block-toolbar', className)} contentEditable={false}>
      <div className="flex min-w-0 items-center gap-2">
        {canSelectLanguage ? (
          <Select
            value={language}
            onValueChange={(nextLanguage) => {
              onLanguageChange?.(nextLanguage as CodeBlockLanguage);
            }}
          >
            <SelectTrigger
              aria-label="选择代码语言"
              className="gmp-code-language-select h-7 border-(--gmp-code-border) bg-(--gmp-code-toolbar) px-2 font-mono text-[10px] font-bold tracking-widest text-(--gmp-code-muted) uppercase shadow-none hover:border-(--gmp-code-border-strong) hover:text-(--gmp-code-text)"
              size="sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-(--gmp-code-border-strong) bg-(--gmp-code-toolbar) text-(--gmp-code-text)">
              <SelectGroup>
                {CODE_BLOCK_LANGUAGES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : showLanguageLabel ? (
          <span className="gmp-code-block-language">{languageLabel}</span>
        ) : null}
      </div>

      <div className="gmp-code-block-actions flex items-center gap-1">
        {showLineNumberToggle ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={cn(
              'gmp-code-block-action-button text-(--gmp-code-muted) hover:text-(--gmp-code-text)',
              lineNumbersEnabled && 'border-(--gmp-code-accent) bg-(--gmp-code-accent-soft) text-(--gmp-code-accent)',
            )}
            aria-label={lineNumbersEnabled ? '隐藏当前代码块行号' : '显示当前代码块行号'}
            title={lineNumbersEnabled ? '隐藏当前代码块行号' : '显示当前代码块行号'}
            onClick={() => {
              onLineNumbersChange?.(!lineNumbersEnabled);
            }}
          >
            <ListOrdered data-icon="inline-start" />
          </Button>
        ) : null}

        {showCopyButton ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="gmp-code-block-action-button text-(--gmp-code-muted) hover:text-(--gmp-code-text)"
            aria-label={copied ? '已复制代码' : '复制代码'}
            title={copied ? '已复制' : '复制代码'}
            onClick={() => {
              void copyCodeToClipboard(code).then((success) => {
                setCopied(success);
              });
            }}
          >
            {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export type { CodeBlockToolbarProps };
