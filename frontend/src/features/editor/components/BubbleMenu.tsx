'use client';

import type { CSSProperties } from 'react';
import type { EditorBubbleActionItem } from '@/features/editor/types';

interface BubbleMenuProps {
  visible: boolean;
  actions: EditorBubbleActionItem[];
  className?: string;
  style?: CSSProperties;
}

/**
 * 功能：渲染行内工具条（BubbleMenu），统一承载粗体/斜体/链接等快捷操作。
 * 关键参数：visible 控制显示；actions 为操作列表；style 为定位样式。
 * 返回值/副作用：返回工具条节点；无副作用。
 */
export function BubbleMenu({ visible, actions, className, style }: BubbleMenuProps) {
  if (!visible || actions.length === 0) {
    return null;
  }

  return (
    <div className={className} style={style} data-editor-bubble-menu="novel-like">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={action.onClick}
          className={`h-8 min-w-8 border px-2 font-mono text-[10px] font-bold uppercase tracking-widest ${
            action.active
              ? 'border-(--gmp-accent) bg-(--gmp-accent) text-black'
              : 'border-(--gmp-line-soft) bg-(--gmp-bg-base) text-white hover:border-white'
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
