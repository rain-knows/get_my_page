'use client';

import type { ReactNode } from 'react';

interface EditorRootProps {
  children: ReactNode;
  className?: string;
}

/**
 * 功能：提供编辑器平台层根容器，统一承载 Novel 风格布局语义。
 * 关键参数：children 为编辑器内部结构；className 为额外样式类。
 * 返回值/副作用：返回根容器节点；无副作用。
 */
export function EditorRoot({ children, className }: EditorRootProps) {
  return (
    <div className={className} data-editor-root="novel-like">
      {children}
    </div>
  );
}
