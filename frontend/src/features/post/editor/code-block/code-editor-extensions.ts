import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { EditorState, type Extension } from '@codemirror/state';
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder as codeMirrorPlaceholder,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import {
  normalizeCodeBlockLanguage,
  resolveCodeMirrorLanguageExtension,
  type CodeBlockLanguage,
} from '@/features/post/editor/code-block/code-block-languages';

interface BuildCodeEditorExtensionsOptions {
  language?: CodeBlockLanguage;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  placeholder?: string;
  extraExtensions?: Extension[];
}

export const codeBlockHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: 'var(--gmp-code-syntax-comment)' },
  { tag: [tags.keyword, tags.operatorKeyword], color: 'var(--gmp-code-syntax-keyword)' },
  { tag: [tags.string, tags.regexp, tags.special(tags.string)], color: 'var(--gmp-code-syntax-string)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--gmp-code-syntax-number)' },
  { tag: [tags.definition(tags.variableName), tags.function(tags.variableName)], color: 'var(--gmp-code-syntax-function)' },
  { tag: [tags.typeName, tags.className], color: 'var(--gmp-code-syntax-type)' },
  { tag: [tags.variableName, tags.propertyName, tags.attributeName], color: 'var(--gmp-code-syntax-variable)' },
  { tag: [tags.meta, tags.annotation], color: 'var(--gmp-code-syntax-meta)' },
]);

export const codeBlockEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--gmp-code-bg)',
    color: 'var(--gmp-code-text)',
    fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)',
    fontSize: '0.875rem',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '&.cm-focused .cm-scroller': {
    outline: 'none',
    boxShadow: 'inset 0 0 0 1px var(--gmp-code-border-strong)',
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
    lineHeight: '1.75rem',
    overflowX: 'auto',
    paddingBottom: '0.875rem',
    paddingTop: '0.875rem',
  },
  '.cm-content': {
    caretColor: 'var(--gmp-code-caret)',
    minHeight: 'inherit',
    outline: 'none',
    padding: '0 1rem',
    whiteSpace: 'pre',
  },
  '.cm-line': {
    lineHeight: '1.75rem',
    padding: '0 0.125rem',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--gmp-code-gutter-bg)',
    borderRight: '1px solid var(--gmp-code-border)',
    color: 'var(--gmp-code-muted)',
    fontFamily: 'inherit',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    boxSizing: 'border-box',
    lineHeight: '1.75rem',
    minWidth: '2.75rem',
    padding: '0 0.625rem 0 0.75rem',
    textAlign: 'right',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--gmp-code-active-line)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--gmp-code-active-gutter)',
    color: 'var(--gmp-code-text-strong)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--gmp-code-selection)',
  },
  '.cm-content ::selection': {
    backgroundColor: 'var(--gmp-code-selection)',
    color: 'var(--gmp-code-text-strong)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--gmp-code-caret)',
  },
  '.cm-placeholder': {
    color: 'var(--gmp-code-muted)',
  },
});

/**
 * 功能：构建编辑器与 NodeView 共用的 CodeMirror 基础扩展集合。
 * 关键参数：options 包含语言、只读、行号、占位文本与额外扩展。
 * 返回值/副作用：返回 CodeMirror 扩展数组；无副作用。
 */
export function buildCodeEditorExtensions(options: BuildCodeEditorExtensionsOptions = {}): Extension[] {
  const language = normalizeCodeBlockLanguage(options.language);

  return [
    codeBlockEditorTheme,
    syntaxHighlighting(codeBlockHighlightStyle),
    history(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    bracketMatching(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    EditorState.tabSize.of(2),
    EditorState.readOnly.of(Boolean(options.readOnly)),
    EditorView.editable.of(!options.readOnly),
    options.showLineNumbers === false ? [] : lineNumbers(),
    options.placeholder ? codeMirrorPlaceholder(options.placeholder) : [],
    keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
    resolveCodeMirrorLanguageExtension(language),
    ...(options.extraExtensions ?? []),
  ];
}
