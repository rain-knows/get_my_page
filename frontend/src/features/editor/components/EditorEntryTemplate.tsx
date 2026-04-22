'use client';

import type { ReactNode } from 'react';

interface EditorEntryTemplateProps {
  modeLabel: string;
  title: string;
  slug: string;
  actions: ReactNode;
  blockControls?: ReactNode;
  hiddenInputs?: ReactNode;
  statusHint?: string;
  error?: string;
  editorArea: ReactNode;
  helperTexts?: ReactNode;
  previewArea?: ReactNode;
}

/**
 * 功能：提供编辑入口统一模板骨架，复用标题区、操作区、状态区与预览区结构。
 * 关键参数：modeLabel/title/slug 为头部信息；actions/editorArea 为核心编辑交互区域。
 * 返回值/副作用：返回标准化编辑模板节点；无副作用。
 */
export function EditorEntryTemplate({
  modeLabel,
  title,
  slug,
  actions,
  blockControls,
  hiddenInputs,
  statusHint,
  error,
  editorArea,
  helperTexts,
  previewArea,
}: EditorEntryTemplateProps) {
  return (
    <section className="space-y-4 border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-4 md:p-6 gmp-cut-corner-br">
      <header className="flex flex-col gap-4 border-b border-(--gmp-line-soft) pb-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] font-bold tracking-widest text-(--gmp-accent) uppercase">{modeLabel}</p>
          <h2 className="font-heading text-xl font-black text-white uppercase tracking-tight">{title}</h2>
          <p className="font-mono text-[11px] text-(--gmp-text-secondary) uppercase tracking-widest">SLUG: {slug}</p>
        </div>
        {actions}
        {blockControls}
      </header>

      {hiddenInputs}

      {statusHint ? (
        <p className="font-mono text-[11px] uppercase tracking-widest text-(--gmp-accent)">{statusHint}</p>
      ) : null}

      {error ? (
        <p className="font-mono text-[11px] uppercase tracking-widest text-red-400" role="alert">
          ERROR // {error}
        </p>
      ) : null}

      {editorArea}
      {helperTexts}
      {previewArea}
    </section>
  );
}
