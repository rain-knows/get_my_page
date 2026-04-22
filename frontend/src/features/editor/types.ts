import type { JSONContent } from '@tiptap/core';
import type { Editor as TiptapEditor } from '@tiptap/react';
import type { KeyboardEvent, ReactNode } from 'react';

export interface EditorShellProps {
  initialContent: JSONContent;
  onChange: (editor: TiptapEditor) => void;
  onSave: (editor: TiptapEditor) => Promise<void>;
  uploadImage: (file: File) => Promise<void>;
  resolveEmbed: (url: string) => Promise<void>;
  readonly?: boolean;
}

export interface EditorCommandMenuItem {
  key: string;
  label: string;
  description: string;
  alias?: string;
  active?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export interface EditorBubbleActionItem {
  key: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}

export interface EditorShellLayoutProps {
  shell: EditorShellProps;
  editor: TiptapEditor | null;
  className?: string;
  onKeyDownCapture?: (event: KeyboardEvent<HTMLDivElement>) => void;
  commandMenu?: ReactNode;
  bubbleMenu?: ReactNode;
  children: ReactNode;
}
