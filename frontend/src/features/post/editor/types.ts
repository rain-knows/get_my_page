import type { JSONContent } from '@tiptap/core';

export type SlashCommandType =
  | 'image'
  | 'card'
  | 'divider'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'quote'
  | 'code';

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
