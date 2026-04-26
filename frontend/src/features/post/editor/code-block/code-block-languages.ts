import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { PostgreSQL, sql } from '@codemirror/lang-sql';
import { StreamLanguage } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { shell } from '@codemirror/legacy-modes/mode/shell';

export type CodeBlockLanguage =
  | 'plaintext'
  | 'javascript'
  | 'typescript'
  | 'java'
  | 'json'
  | 'sql'
  | 'markdown'
  | 'html'
  | 'css'
  | 'bash'
  | 'python';

export interface CodeBlockLanguageConfig {
  value: CodeBlockLanguage;
  label: string;
  aliases: string[];
  extensions: () => Extension[];
}

export const CODE_BLOCK_LANGUAGES: CodeBlockLanguageConfig[] = [
  {
    value: 'plaintext',
    label: 'Plain Text',
    aliases: ['text', 'txt', 'plain', 'code'],
    extensions: () => [],
  },
  {
    value: 'javascript',
    label: 'JavaScript',
    aliases: ['js', 'jsx', 'mjs', 'cjs'],
    extensions: () => [javascript({ jsx: true })],
  },
  {
    value: 'typescript',
    label: 'TypeScript',
    aliases: ['ts', 'tsx'],
    extensions: () => [javascript({ jsx: true, typescript: true })],
  },
  {
    value: 'java',
    label: 'Java',
    aliases: [],
    extensions: () => [java()],
  },
  {
    value: 'json',
    label: 'JSON',
    aliases: ['jsonc', 'json5'],
    extensions: () => [json()],
  },
  {
    value: 'sql',
    label: 'SQL',
    aliases: ['postgres', 'postgresql', 'mysql'],
    extensions: () => [sql({ dialect: PostgreSQL })],
  },
  {
    value: 'markdown',
    label: 'Markdown',
    aliases: ['md', 'mdx'],
    extensions: () => [markdown()],
  },
  {
    value: 'html',
    label: 'HTML',
    aliases: ['xml', 'svg'],
    extensions: () => [html()],
  },
  {
    value: 'css',
    label: 'CSS',
    aliases: ['scss', 'sass', 'less'],
    extensions: () => [css()],
  },
  {
    value: 'bash',
    label: 'Bash',
    aliases: ['shell', 'sh', 'zsh', 'console'],
    extensions: () => [StreamLanguage.define(shell)],
  },
  {
    value: 'python',
    label: 'Python',
    aliases: ['py'],
    extensions: () => [python()],
  },
];

const CODE_BLOCK_LANGUAGE_BY_VALUE = new Map<CodeBlockLanguage, CodeBlockLanguageConfig>(
  CODE_BLOCK_LANGUAGES.map((language) => [language.value, language]),
);

const CODE_BLOCK_LANGUAGE_BY_ALIAS = new Map<string, CodeBlockLanguage>(
  CODE_BLOCK_LANGUAGES.flatMap((language) => [
    [language.value, language.value] as const,
    ...language.aliases.map((alias) => [alias, language.value] as const),
  ]),
);

/**
 * 功能：把任意输入语言名归一化为受支持的代码块语言。
 * 关键参数：rawLanguage 为来自 UI、Tiptap attrs 或后端内容的语言值。
 * 返回值/副作用：返回 CodeBlockLanguage；不识别时回退 plaintext，无副作用。
 */
export function normalizeCodeBlockLanguage(rawLanguage: unknown): CodeBlockLanguage {
  if (typeof rawLanguage !== 'string') {
    return 'plaintext';
  }

  const normalized = rawLanguage.trim().toLowerCase();
  return CODE_BLOCK_LANGUAGE_BY_ALIAS.get(normalized) ?? 'plaintext';
}

/**
 * 功能：根据语言值读取展示标签。
 * 关键参数：language 为代码块语言值。
 * 返回值/副作用：返回面向用户的语言标签；无副作用。
 */
export function resolveCodeBlockLanguageLabel(language: CodeBlockLanguage): string {
  return CODE_BLOCK_LANGUAGE_BY_VALUE.get(language)?.label ?? 'Plain Text';
}

/**
 * 功能：根据语言值读取 CodeMirror 语法扩展。
 * 关键参数：language 为代码块语言值。
 * 返回值/副作用：返回 CodeMirror 扩展数组；无副作用。
 */
export function resolveCodeMirrorLanguageExtension(language: CodeBlockLanguage): Extension[] {
  return CODE_BLOCK_LANGUAGE_BY_VALUE.get(language)?.extensions() ?? [];
}
