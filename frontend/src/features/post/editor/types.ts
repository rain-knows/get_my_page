import type { ReactNode } from 'react';
import type { EditorInstance } from 'novel';

export type EditorSaveState = 'idle' | 'saving' | 'saved' | 'error';

export type EmbedNodeType = 'embedGithub' | 'embedMusic' | 'embedVideo' | 'embedLink';

export interface EmbedInsertPayload {
  type: EmbedNodeType;
  attrs: Record<string, unknown>;
}

export interface SlashCommandRange {
  from: number;
  to: number;
}

export interface SlashCommandItem {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  searchTerms?: string[];
  command: (params: { editor: EditorInstance; range: SlashCommandRange }) => void | Promise<void>;
}
