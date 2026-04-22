'use client';

import type { CSSProperties } from 'react';
import type { EditorCommandMenuItem } from '@/features/editor/types';

interface CommandMenuProps {
  open: boolean;
  items: EditorCommandMenuItem[];
  className?: string;
  style?: CSSProperties;
}

/**
 * 功能：渲染 Novel 风格命令菜单，用于 Slash 与插入命令统一展示。
 * 关键参数：open 控制显示；items 为菜单项列表；style 为定位样式。
 * 返回值/副作用：返回命令菜单节点；无副作用。
 */
export function CommandMenu({ open, items, className, style }: CommandMenuProps) {
  if (!open || items.length === 0) {
    return null;
  }

  return (
    <div className={className} style={style} data-editor-command-menu="novel-like">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onSelect}
          disabled={item.disabled}
          className={`mb-1 flex w-full items-start justify-between border px-3 py-2 text-left last:mb-0 ${
            item.active
              ? 'border-(--gmp-accent) bg-(--gmp-accent) text-black'
              : 'border-(--gmp-line-soft) bg-(--gmp-bg-base) text-(--gmp-text-secondary) hover:border-white hover:text-white'
          }`}
        >
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest">{item.alias ? `/${item.alias}` : item.label}</span>
          <span className="pl-3 text-right font-mono text-[10px] uppercase tracking-widest">{item.description}</span>
        </button>
      ))}
    </div>
  );
}
