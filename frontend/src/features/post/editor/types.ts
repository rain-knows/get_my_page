import type { JSONContent } from '@tiptap/core';

export type SlashCommandType = 'image' | 'card' | 'divider';

export interface SlashCommandItem {
  type: SlashCommandType;
  title: string;
  alias: string;
  description: string;
}

export interface PostEditorValue {
  json: JSONContent;
  rawText: string;
}
