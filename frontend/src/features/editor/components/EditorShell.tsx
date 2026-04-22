'use client';

import { useMemo, type KeyboardEvent } from 'react';
import { EditorRoot } from '@/features/editor/components/EditorRoot';
import type { EditorShellLayoutProps } from '@/features/editor/types';

/**
 * 功能：封装编辑器平台壳层，统一处理快捷保存与只读态语义。
 * 关键参数：shell 为平台层回调协议；editor 为编辑器实例；children 为编辑区内容。
 * 返回值/副作用：返回壳层节点；副作用为响应 Cmd/Ctrl+S 保存动作。
 */
export function EditorShell({
  shell,
  editor,
  className,
  commandMenu,
  bubbleMenu,
  onKeyDownCapture,
  children,
}: EditorShellLayoutProps) {
  const canWrite = useMemo(() => !shell.readonly, [shell.readonly]);

  /**
   * 功能：拦截保存快捷键并委托到平台层 onSave 回调。
   * 关键参数：event 为键盘事件对象。
   * 返回值/副作用：无返回值；副作用为触发异步保存流程。
   */
  function handleShellKeydown(event: KeyboardEvent<HTMLDivElement>): void {
    if (onKeyDownCapture) {
      onKeyDownCapture(event);
      if (event.defaultPrevented) {
        return;
      }
    }

    if (!canWrite || !editor || !shell.onSave) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void shell.onSave(editor);
    }
  }

  return (
    <EditorRoot
      className={className}
    >
      <div
        className="relative"
        data-editor-readonly={shell.readonly ? 'true' : 'false'}
        onKeyDownCapture={handleShellKeydown}
      >
        {bubbleMenu}
        {children}
        {commandMenu}
      </div>
    </EditorRoot>
  );
}
