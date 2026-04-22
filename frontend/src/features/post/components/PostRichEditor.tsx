"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type PointerEvent } from 'react';
import type { Editor as TiptapEditor, JSONContent } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import { useEditor } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { ApiError } from '@/lib/api-client';
import type {
  EditorBubbleActionItem,
  EditorCommandMenuItem,
  EditorShellProps,
} from '@/features/editor/types';
import {
  BubbleMenu,
  CommandMenu,
  EditorContent,
  EditorEntryTemplate,
  EditorShell,
} from '@/features/editor/components';
import {
  handleEditorImageDrop,
  handleEditorImagePaste,
} from '@/features/editor/utils/image-upload-handlers';
import {
  resolveEmbed,
  updatePost,
  uploadPostAsset,
} from '@/features/post/api';
import {
  buildExcerptFromEditorDoc,
  parsePostContentToEditorDoc,
  serializeEditorDoc,
} from '@/features/post/editor/serializer';
import {
  DividerNode,
  EmbedGithubNode,
  EmbedLinkNode,
  EmbedMusicNode,
  EmbedVideoNode,
  ImageBlockNode,
} from '@/features/post/editor/extensions/custom-nodes';
import { filterSlashCommands, SLASH_COMMAND_ITEMS } from '@/features/post/editor/slash-commands';
import { convertTiptapDocToBlockDocument, type BlockDocument } from '@/features/post/editor/block-model';
import { BlockRenderer } from '@/features/post/components/BlockRenderer';
import type { EmbedResolveResult, PostDetail } from '@/features/post/types';
import type { SlashCommandItem, SlashCommandType } from '@/features/post/editor/types';

interface SlashState {
  open: boolean;
  query: string;
  from: number;
  to: number;
}

interface PostRichEditorProps {
  post: PostDetail;
  onSaved: (updatedPost: PostDetail) => void;
  onCancel: () => void;
}

interface ActiveBlockState {
  index: number;
  count: number;
  from: number;
  nodeSize: number;
}

interface DragSortState {
  pointerId: number;
  lastY: number;
}

interface SlashMenuPosition {
  top: number;
  left: number;
}

/**
 * 功能：从当前光标前文本识别 Slash 命令触发区间。
 * 关键参数：contentBeforeCursor 为光标前文本；cursorPos 为当前光标绝对位置。
 * 返回值/副作用：返回 Slash 状态对象；无副作用。
 */
function detectSlashState(contentBeforeCursor: string, cursorPos: number): SlashState {
  const match = contentBeforeCursor.match(/(?:^|\s)\/([a-zA-Z-]*)$/);
  if (!match) {
    return {
      open: false,
      query: '',
      from: cursorPos,
      to: cursorPos,
    };
  }

  const query = match[1] ?? '';
  return {
    open: true,
    query,
    from: cursorPos - query.length - 1,
    to: cursorPos,
  };
}

/**
 * 功能：从后端 snapshot 中安全读取字符串字段。
 * 关键参数：snapshot 为嵌入解析快照；key 为字段名。
 * 返回值/副作用：返回字符串值，缺失时返回空字符串。
 */
function readSnapshotString(snapshot: Record<string, unknown> | null | undefined, key: string): string {
  const value = snapshot?.[key];
  return typeof value === 'string' ? value : '';
}

/**
 * 功能：根据后端解析结果生成 GitHub 卡片 attrs。
 * 关键参数：inputUrl 为原始输入链接；response 为统一解析结果。
 * 返回值/副作用：返回 GitHub 节点 attrs，无副作用。
 */
function buildGithubAttrs(inputUrl: string, response?: EmbedResolveResult) {
  const snapshot = response?.snapshot ?? null;
  const repo =
    readSnapshotString(snapshot, 'fullName')
    || readSnapshotString(snapshot, 'repo')
    || readSnapshotString(snapshot, 'name');

  return {
    repo,
    url: response?.normalizedUrl || inputUrl,
    snapshot,
    snapshotAt: new Date().toISOString(),
    resolved: Boolean(response?.resolved),
    fallbackUrl: response?.fallbackUrl || inputUrl,
  };
}

/**
 * 功能：根据后端解析结果生成音乐卡片 attrs。
 * 关键参数：inputUrl 为原始输入链接；response 为统一解析结果。
 * 返回值/副作用：返回音乐节点 attrs，无副作用。
 */
function buildMusicAttrs(inputUrl: string, response?: EmbedResolveResult) {
  const snapshot = response?.snapshot ?? null;
  const trackId =
    readSnapshotString(snapshot, 'trackId')
    || readSnapshotString(snapshot, 'id');

  return {
    provider: response?.provider || readSnapshotString(snapshot, 'provider') || 'music',
    url: response?.normalizedUrl || inputUrl,
    trackId,
    snapshot,
    snapshotAt: new Date().toISOString(),
    resolved: Boolean(response?.resolved),
    fallbackUrl: response?.fallbackUrl || inputUrl,
  };
}

/**
 * 功能：根据后端解析结果生成链接卡片 attrs（标题/描述/封面/域名）。
 * 关键参数：inputUrl 为原始输入链接；response 为统一解析结果。
 * 返回值/副作用：返回链接节点 attrs，无副作用。
 */
function buildLinkAttrs(inputUrl: string, response?: EmbedResolveResult) {
  const snapshot = response?.snapshot ?? null;
  const url = response?.normalizedUrl || inputUrl;

  return {
    url,
    title: readSnapshotString(snapshot, 'title') || url,
    description: readSnapshotString(snapshot, 'description') || url,
    domain: readSnapshotString(snapshot, 'domain'),
    siteName: readSnapshotString(snapshot, 'siteName'),
    coverUrl: readSnapshotString(snapshot, 'coverUrl'),
  };
}

/**
 * 功能：根据后端解析结果生成视频卡片 attrs。
 * 关键参数：inputUrl 为原始输入链接；response 为统一解析结果。
 * 返回值/副作用：返回视频节点 attrs，无副作用。
 */
function buildVideoAttrs(inputUrl: string, response?: EmbedResolveResult) {
  const snapshot = response?.snapshot ?? null;

  return {
    provider: response?.provider || readSnapshotString(snapshot, 'provider') || 'video',
    url: response?.normalizedUrl || inputUrl,
    videoId: readSnapshotString(snapshot, 'videoId'),
    title: readSnapshotString(snapshot, 'title') || 'VIDEO RESOURCE',
    description: readSnapshotString(snapshot, 'description'),
    coverUrl: readSnapshotString(snapshot, 'coverUrl'),
    fallbackUrl: response?.fallbackUrl || inputUrl,
  };
}

/**
 * 功能：统一弹出 URL 输入框并返回已清洗值。
 * 关键参数：title 为提示文案；placeholder 为默认输入值。
 * 返回值/副作用：返回非空 URL 字符串或 null；副作用为调用浏览器 prompt。
 */
function requestUrlInput(title: string, placeholder = 'https://'): string | null {
  const value = window.prompt(title, placeholder);
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `https://${normalized}`;
}

/**
 * 功能：归一化后端返回 cardType，避免大小写与空值导致分支失配。
 * 关键参数：response 为统一解析结果。
 * 返回值/副作用：返回标准卡片类型（github/music/video/link）。
 */
function resolveCardType(response?: EmbedResolveResult): 'github' | 'music' | 'video' | 'link' {
  const rawCardType = (response?.cardType || '').toLowerCase();
  if (rawCardType === 'github' || rawCardType === 'music' || rawCardType === 'video' || rawCardType === 'link') {
    return rawCardType;
  }

  const provider = (response?.provider || '').toLowerCase();
  if (provider.includes('github')) {
    return 'github';
  }
  if (provider.includes('spotify') || provider.includes('netease') || provider.includes('apple') || provider.includes('music')) {
    return 'music';
  }
  if (provider.includes('youtube') || provider.includes('bilibili') || provider.includes('video')) {
    return 'video';
  }

  return 'link';
}

/**
 * 功能：判断当前光标所在顶层块是否为空块，用于 Backspace 合并块语义。
 * 关键参数：currentEditor 为编辑器实例。
 * 返回值/副作用：返回是否为空块；无副作用。
 */
function isCurrentTopLevelBlockEmpty(currentEditor: TiptapEditor): boolean {
  const selection = currentEditor.state.selection;
  if (!selection.empty || selection.$from.depth < 1) {
    return false;
  }
  const index = selection.$from.index(0);
  if (index < 0 || index >= currentEditor.state.doc.childCount) {
    return false;
  }
  const node = currentEditor.state.doc.child(index);
  if (node.type.name === 'divider') {
    return true;
  }
  return node.textContent.trim().length === 0;
}

/**
 * 功能：计算当前光标所在顶层块在文档中的起止位置。
 * 关键参数：currentEditor 为编辑器实例。
 * 返回值/副作用：返回块范围信息或 null；无副作用。
 */
function resolveCurrentTopLevelBlockRange(currentEditor: TiptapEditor): { index: number; from: number; to: number } | null {
  const selection = currentEditor.state.selection;
  if (selection.$from.depth < 1) {
    return null;
  }
  const index = selection.$from.index(0);
  if (index < 0 || index >= currentEditor.state.doc.childCount) {
    return null;
  }
  return {
    index,
    from: selection.$from.before(1),
    to: selection.$from.after(1),
  };
}

/**
 * 功能：为 Slash 菜单计算相对编辑器容器的位置，使菜单在光标附近弹出。
 * 关键参数：currentEditor 为编辑器实例；container 为编辑器容器节点；from 为 slash 起始位置。
 * 返回值/副作用：返回菜单坐标；无副作用。
 */
function resolveSlashMenuPosition(currentEditor: TiptapEditor, container: HTMLDivElement | null, from: number): SlashMenuPosition {
  if (!container) {
    return { top: 8, left: 8 };
  }

  try {
    const cursorRect = currentEditor.view.coordsAtPos(from);
    const containerRect = container.getBoundingClientRect();
    const top = Math.max(8, cursorRect.bottom - containerRect.top + 8);
    const left = Math.max(8, cursorRect.left - containerRect.left);
    return { top, left };
  } catch {
    return { top: 8, left: 8 };
  }
}

/**
 * 功能：将用户输入链接归一化为可写入 link mark 的 URL。
 * 关键参数：value 为输入链接。
 * 返回值/副作用：返回标准 URL；无副作用。
 */
function normalizeInlineLink(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * 功能：渲染文章富文本编辑器，提供统一卡片解析、图片上传、块拖拽排序与保存能力。
 * 关键参数：post 为当前文章详情；onSaved/onCancel 为编辑态回调。
 * 返回值/副作用：返回编辑器 UI；副作用为触发接口请求与本地文件选择。
 */
export function PostRichEditor({ post, onSaved, onCancel }: PostRichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const dragSortRef = useRef<DragSortState | null>(null);

  const [slashState, setSlashState] = useState<SlashState>({
    open: false,
    query: '',
    from: 0,
    to: 0,
  });
  const [activeSlashIndex, setActiveSlashIndex] = useState(0);
  const [slashMenuPosition, setSlashMenuPosition] = useState<SlashMenuPosition>({ top: 8, left: 8 });
  const [inlineToolbarVisible, setInlineToolbarVisible] = useState(false);
  const [inlineToolbarPosition, setInlineToolbarPosition] = useState<SlashMenuPosition>({ top: 8, left: 8 });
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [activeBlock, setActiveBlock] = useState<ActiveBlockState | null>(null);
  const [dragSorting, setDragSorting] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusHint, setStatusHint] = useState('');

  const initialDoc = useMemo(
    () => parsePostContentToEditorDoc(post.content, post.contentFormat),
    [post.content, post.contentFormat],
  );
  const [previewDocument, setPreviewDocument] = useState<BlockDocument>(() => convertTiptapDocToBlockDocument(initialDoc));

  /**
   * 功能：刷新编辑器当前激活块信息，供上下移动与拖拽排序使用。
   * 关键参数：currentEditor 为编辑器实例。
   * 返回值/副作用：无返回值；副作用为更新 activeBlock 状态。
   */
  function refreshActiveBlock(currentEditor: NonNullable<ReturnType<typeof useEditor>>): void {
    const state = currentEditor.state;
    if (state.selection.$from.depth < 1) {
      setActiveBlock(null);
      return;
    }

    const index = state.selection.$from.index(0);
    const count = state.doc.childCount;
    if (index < 0 || index >= count) {
      setActiveBlock(null);
      return;
    }

    const from = state.selection.$from.before(1);
    const to = state.selection.$from.after(1);
    setActiveBlock({
      index,
      count,
      from,
      nodeSize: to - from,
    });
  }

  /**
   * 功能：同步 Slash 状态与块选择状态。
   * 关键参数：currentEditor 为编辑器实例。
   * 返回值/副作用：无返回值；副作用为更新多个编辑器 UI 状态。
   */
  function syncTransientEditorState(currentEditor: NonNullable<ReturnType<typeof useEditor>>): void {
    const selection = currentEditor.state.selection;
    const parentBeforeCursor = selection.$from.parent.textBetween(0, selection.$from.parentOffset, '\0', '\0');
    const nextSlashState = detectSlashState(parentBeforeCursor, selection.from);
    setSlashState(nextSlashState);
    if (nextSlashState.open) {
      setSlashMenuPosition(resolveSlashMenuPosition(currentEditor, editorContainerRef.current, nextSlashState.from));
    }
    if (!selection.empty) {
      setInlineToolbarVisible(true);
      setInlineToolbarPosition(resolveSlashMenuPosition(currentEditor, editorContainerRef.current, selection.from));
    } else {
      setInlineToolbarVisible(false);
    }
    refreshActiveBlock(currentEditor);
  }

  /**
   * 功能：统一处理编辑器内容变更后的平台层同步逻辑。
   * 关键参数：currentEditor 为当前编辑器实例。
   * 返回值/副作用：无返回值；副作用为更新预览文档与状态提示。
   */
  function handleEditorChanged(currentEditor: NonNullable<ReturnType<typeof useEditor>>): void {
    setPreviewDocument(convertTiptapDocToBlockDocument(currentEditor.getJSON() as JSONContent));
    setStatusHint('');
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
      }),
      ImageBlockNode,
      EmbedGithubNode,
      EmbedMusicNode,
      EmbedLinkNode,
      EmbedVideoNode,
      DividerNode,
    ],
    content: initialDoc,
    editorProps: {
      handlePaste: (view, event) => handleEditorImagePaste(view, event, uploadAndInsertImage),
      handleDrop: (view, event, _slice, moved) => handleEditorImageDrop(view, event, moved, uploadAndInsertImage),
      attributes: {
        class:
          'gmp-notion-editor min-h-96 border border-(--gmp-line-soft) bg-(--gmp-bg-base) p-3 md:p-5 font-mono text-sm leading-relaxed text-(--gmp-text-primary) focus:outline-none',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      syncTransientEditorState(currentEditor);
      handleEditorChanged(currentEditor);
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      syncTransientEditorState(currentEditor);
    },
  });

  const slashItems = useMemo<SlashCommandItem[]>(() => {
    return filterSlashCommands(slashState.query);
  }, [slashState.query]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.commands.setContent(initialDoc);
    setPreviewDocument(convertTiptapDocToBlockDocument(initialDoc));
    setSlashState({
      open: false,
      query: '',
      from: 0,
      to: 0,
    });
    setInsertMenuOpen(false);
    setInlineToolbarVisible(false);
    setStatusHint('');
    setError('');
    refreshActiveBlock(editor);
  }, [editor, initialDoc]);

  useEffect(() => {
    if (slashItems.length === 0) {
      setActiveSlashIndex(0);
      return;
    }

    if (activeSlashIndex >= slashItems.length) {
      setActiveSlashIndex(0);
    }
  }, [activeSlashIndex, slashItems.length]);

  useEffect(() => {
    setActiveSlashIndex(0);
  }, [slashState.query, slashState.open]);

  /**
   * 功能：在执行 Slash 命令前移除光标前的 `/query` 文本。
   * 关键参数：无（依赖当前 slashState）。
   * 返回值/副作用：无返回值；副作用为修改编辑器文档。
   */
  function clearSlashTriggerText(): void {
    if (!editor || !slashState.open) {
      return;
    }

    editor
      .chain()
      .focus()
      .deleteRange({ from: slashState.from, to: slashState.to })
      .run();

    setSlashState({
      open: false,
      query: '',
      from: 0,
      to: 0,
    });
  }

  /**
   * 功能：向编辑器插入 divider 分割线节点。
   * 关键参数：无。
   * 返回值/副作用：无返回值；副作用为更新编辑器文档。
   */
  function insertDividerNode(): void {
    if (!editor) {
      return;
    }

    editor.chain().focus().insertContent({ type: 'divider' }).run();
  }

  /**
   * 功能：向编辑器插入图片节点。
   * 关键参数：url 为图片地址；caption 为图注文本。
   * 返回值/副作用：无返回值；副作用为更新编辑器文档。
   */
  function insertImageNode(url: string, caption: string): void {
    if (!editor) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'imageBlock',
        attrs: {
          src: url,
          alt: caption || 'article-image',
          caption,
          align: 'center',
        },
      })
      .run();
  }

  /**
   * 功能：向编辑器插入 GitHub 卡片节点。
   * 关键参数：url 为输入链接；response 为统一解析响应。
   * 返回值/副作用：无返回值；副作用为更新编辑器文档。
   */
  function insertGithubNode(url: string, response?: EmbedResolveResult): void {
    if (!editor) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'embedGithub',
        attrs: buildGithubAttrs(url, response),
      })
      .run();
  }

  /**
   * 功能：向编辑器插入音乐卡片节点。
   * 关键参数：url 为输入链接；response 为统一解析响应。
   * 返回值/副作用：无返回值；副作用为更新编辑器文档。
   */
  function insertMusicNode(url: string, response?: EmbedResolveResult): void {
    if (!editor) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'embedMusic',
        attrs: buildMusicAttrs(url, response),
      })
      .run();
  }

  /**
   * 功能：向编辑器插入链接卡片节点。
   * 关键参数：url 为输入链接；response 为统一解析响应。
   * 返回值/副作用：无返回值；副作用为更新编辑器文档。
   */
  function insertLinkNode(url: string, response?: EmbedResolveResult): void {
    if (!editor) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'embedLink',
        attrs: buildLinkAttrs(url, response),
      })
      .run();
  }

  /**
   * 功能：向编辑器插入视频卡片节点。
   * 关键参数：url 为输入链接；response 为统一解析响应。
   * 返回值/副作用：无返回值；副作用为更新编辑器文档。
   */
  function insertVideoNode(url: string, response?: EmbedResolveResult): void {
    if (!editor) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'embedVideo',
        attrs: buildVideoAttrs(url, response),
      })
      .run();
  }

  /**
   * 功能：根据统一解析结果自动插入对应类型卡片。
   * 关键参数：url 为输入链接；response 为解析结果。
   * 返回值/副作用：无返回值；副作用为更新编辑器文档。
   */
  function insertResolvedCard(url: string, response?: EmbedResolveResult): void {
    const cardType = resolveCardType(response);

    if (cardType === 'github') {
      insertGithubNode(url, response);
      return;
    }
    if (cardType === 'music') {
      insertMusicNode(url, response);
      return;
    }
    if (cardType === 'video') {
      insertVideoNode(url, response);
      return;
    }
    insertLinkNode(url, response);
  }

  /**
   * 功能：执行图片上传并回填 imageBlock 节点。
   * 关键参数：file 为用户选择的图片文件。
   * 返回值/副作用：返回 Promise<void>；副作用为调用上传接口并更新编辑器内容。
   */
  async function uploadAndInsertImage(file: File): Promise<void> {
    if (!editor) {
      return;
    }

    setActionLoading(true);
    setError('');
    setStatusHint('上传图片中...');

    try {
      const uploadResult = await uploadPostAsset(file, post.id);
      insertImageNode(uploadResult.url, file.name || 'article-image');
      setStatusHint('图片已插入');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 403 || err.code === 40301) {
          setError('图片上传失败：登录态无效或权限不足，请重新登录后重试');
        } else if (err.code === 40001 && err.message.includes('不支持的文件类型')) {
          setError('图片上传失败：当前文件类型不受支持，请选择 jpg/png/webp/gif/avif/heic/heif');
        } else if (err.code === 40001 && err.message.includes('文件大小不能超过')) {
          setError('图片上传失败：文件超过 8MB，请压缩后重试');
        } else {
          setError(`图片上传失败：${err.message}`);
        }
      } else {
        setError('图片上传失败，请稍后重试');
      }
      setStatusHint('');
    } finally {
      setActionLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  /**
   * 功能：统一解析链接并自动插入对应卡片（github/music/video/link）。
   * 关键参数：url 为用户输入的任意链接。
   * 返回值/副作用：返回 Promise<void>；副作用为触发解析接口并更新编辑器内容。
   */
  async function resolveAndInsertCard(url: string): Promise<void> {
    if (!editor) {
      return;
    }

    setActionLoading(true);
    setError('');
    setStatusHint('解析卡片中...');

    try {
      const response = await resolveEmbed(url);
      insertResolvedCard(url, response);
      setStatusHint(response.resolved ? '卡片已插入' : '解析未命中，已降级为链接卡片');
    } catch {
      insertLinkNode(url);
      setStatusHint('解析失败，已降级为链接卡片');
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * 功能：将当前激活块向上或向下移动一个位置。
   * 关键参数：direction 表示移动方向（up/down）。
   * 返回值/副作用：无返回值；副作用为重排文档块顺序并更新光标位置。
   */
  function moveCurrentBlock(direction: 'up' | 'down'): void {
    if (!editor || !activeBlock) {
      return;
    }

    const state = editor.state;
    const index = activeBlock.index;

    if (direction === 'up' && index <= 0) {
      return;
    }
    if (direction === 'down' && index >= activeBlock.count - 1) {
      return;
    }

    const currentNode = state.doc.child(index);
    const currentFrom = activeBlock.from;
    const tr = state.tr;

    if (direction === 'up') {
      const prevNode = state.doc.child(index - 1);
      const insertPos = currentFrom - prevNode.nodeSize;

      tr.delete(currentFrom, currentFrom + currentNode.nodeSize);
      tr.insert(insertPos, currentNode);
      tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(1, insertPos + 1))));
    } else {
      const nextNode = state.doc.child(index + 1);
      const insertPos = currentFrom + nextNode.nodeSize;

      tr.delete(currentFrom, currentFrom + currentNode.nodeSize);
      tr.insert(insertPos, currentNode);
      tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(1, insertPos + 1))));
    }

    editor.view.dispatch(tr.scrollIntoView());
    editor.view.focus();
    refreshActiveBlock(editor);
  }

  /**
   * 功能：处理拖拽排序手柄按下事件，进入块拖拽排序状态。
   * 关键参数：event 为指针事件对象。
   * 返回值/副作用：无返回值；副作用为记录拖拽状态并捕获指针。
   */
  function handleDragHandlePointerDown(event: PointerEvent<HTMLButtonElement>): void {
    dragSortRef.current = {
      pointerId: event.pointerId,
      lastY: event.clientY,
    };
    setDragSorting(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  /**
   * 功能：处理拖拽排序手柄移动事件，按位移阈值执行上下重排。
   * 关键参数：event 为指针事件对象。
   * 返回值/副作用：无返回值；副作用为触发块顺序变更。
   */
  function handleDragHandlePointerMove(event: PointerEvent<HTMLButtonElement>): void {
    const dragState = dragSortRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaY = event.clientY - dragState.lastY;
    if (deltaY > 28) {
      moveCurrentBlock('down');
      dragSortRef.current = {
        ...dragState,
        lastY: event.clientY,
      };
      return;
    }

    if (deltaY < -28) {
      moveCurrentBlock('up');
      dragSortRef.current = {
        ...dragState,
        lastY: event.clientY,
      };
    }
  }

  /**
   * 功能：处理拖拽排序手柄释放事件并退出拖拽状态。
   * 关键参数：event 为指针事件对象。
   * 返回值/副作用：无返回值；副作用为清理拖拽状态。
   */
  function handleDragHandlePointerUp(event: PointerEvent<HTMLButtonElement>): void {
    const dragState = dragSortRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragSortRef.current = null;
    setDragSorting(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  /**
   * 功能：根据命令类型执行 Slash 具体动作。
   * 关键参数：commandType 为 Slash 命令类型。
   * 返回值/副作用：返回 Promise<void>；副作用为触发编辑器内容变更或外部请求。
   */
  async function executeSlashCommand(commandType: SlashCommandType): Promise<void> {
    clearSlashTriggerText();
    setInsertMenuOpen(false);

    if (!editor) {
      return;
    }

    if (commandType === 'heading1') {
      editor.chain().focus().setHeading({ level: 1 }).run();
      return;
    }
    if (commandType === 'heading2') {
      editor.chain().focus().setHeading({ level: 2 }).run();
      return;
    }
    if (commandType === 'heading3') {
      editor.chain().focus().setHeading({ level: 3 }).run();
      return;
    }
    if (commandType === 'bulletList') {
      editor.chain().focus().toggleBulletList().run();
      return;
    }
    if (commandType === 'orderedList') {
      editor.chain().focus().toggleOrderedList().run();
      return;
    }
    if (commandType === 'quote') {
      editor.chain().focus().toggleBlockquote().run();
      return;
    }
    if (commandType === 'code') {
      editor.chain().focus().toggleCodeBlock().run();
      return;
    }
    if (commandType === 'divider') {
      insertDividerNode();
      return;
    }
    if (commandType === 'image') {
      fileInputRef.current?.click();
      return;
    }
    if (commandType === 'card') {
      const inputUrl = requestUrlInput('请输入外部链接（系统将自动识别卡片类型）：', 'https://');
      if (!inputUrl) {
        return;
      }
      await resolveAndInsertCard(inputUrl);
    }
  }

  /**
   * 功能：处理 Slash 菜单键盘导航（上下选择与回车确认）。
   * 关键参数：event 为键盘事件对象。
   * 返回值/副作用：无返回值；副作用为更新菜单选中项或触发命令执行。
   */
  function handleSlashMenuKeydown(event: KeyboardEvent<HTMLDivElement>): boolean {
    if (!slashState.open || slashItems.length === 0) {
      return false;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSlashIndex((previous) => (previous + 1) % slashItems.length);
      return true;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSlashIndex((previous) => (previous - 1 + slashItems.length) % slashItems.length);
      return true;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const selected = slashItems[activeSlashIndex] ?? slashItems[0];
      if (selected) {
        void executeSlashCommand(selected.type);
      }
      return true;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setSlashState({
        open: false,
        query: '',
        from: 0,
        to: 0,
      });
      return true;
    }

    return false;
  }

  /**
   * 功能：将光标定位到指定顶层块的起始或末尾，支持方向键跨块导航。
   * 关键参数：targetIndex 为目标块索引；placement 为定位位置（start/end）。
   * 返回值/副作用：无返回值；副作用为更新编辑器选区。
   */
  function focusBlockByIndex(targetIndex: number, placement: 'start' | 'end'): void {
    if (!editor) {
      return;
    }

    const { doc } = editor.state;
    if (targetIndex < 0 || targetIndex >= doc.childCount) {
      return;
    }

    let from = 0;
    for (let index = 0; index < targetIndex; index += 1) {
      from += doc.child(index).nodeSize;
    }
    from += 1;
    const node = doc.child(targetIndex);
    const targetPos = placement === 'start'
      ? Math.min(from + 1, doc.content.size)
      : Math.max(1, from + node.nodeSize - 2);
    const resolved = editor.state.tr.doc.resolve(targetPos);
    const transaction = editor.state.tr.setSelection(TextSelection.near(resolved, placement === 'start' ? 1 : -1));
    editor.view.dispatch(transaction.scrollIntoView());
    editor.view.focus();
  }

  /**
   * 功能：实现 Notion 核心键盘语义（Enter 拆块、空块 Backspace 合并、方向键跨块移动）。
   * 关键参数：event 为键盘事件对象。
   * 返回值/副作用：返回是否已处理；副作用为修改文档结构或光标位置。
   */
  function handleNotionKeyboardSemantics(event: KeyboardEvent<HTMLDivElement>): boolean {
    if (!editor || actionLoading || saveLoading) {
      return false;
    }
    if (event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
      return false;
    }

    const blockRange = resolveCurrentTopLevelBlockRange(editor);
    if (!blockRange) {
      return false;
    }
    const selection = editor.state.selection;

    if (event.key === 'Enter' && selection.empty) {
      const node = editor.state.doc.child(blockRange.index);
      const atEnd = selection.$from.pos === blockRange.to - 1;
      const supportsSplitByEnter = node.type.name === 'heading' || node.type.name === 'blockquote' || node.type.name === 'codeBlock';
      if (atEnd && supportsSplitByEnter) {
        event.preventDefault();
        editor
          .chain()
          .focus()
          .insertContentAt(blockRange.to, { type: 'paragraph', content: [{ type: 'text', text: '' }] })
          .run();
        focusBlockByIndex(blockRange.index + 1, 'start');
        return true;
      }
    }

    if (event.key === 'Backspace' && isCurrentTopLevelBlockEmpty(editor) && blockRange.index > 0) {
      event.preventDefault();
      const transaction = editor.state.tr.delete(blockRange.from, blockRange.to);
      editor.view.dispatch(transaction.scrollIntoView());
      focusBlockByIndex(blockRange.index - 1, 'end');
      return true;
    }

    if (event.key === 'ArrowUp' && selection.empty) {
      const atStart = selection.$from.pos === blockRange.from + 1;
      if (atStart && blockRange.index > 0) {
        event.preventDefault();
        focusBlockByIndex(blockRange.index - 1, 'end');
        return true;
      }
    }

    if (event.key === 'ArrowDown' && selection.empty) {
      const atEnd = selection.$from.pos === blockRange.to - 1;
      if (atEnd && blockRange.index < editor.state.doc.childCount - 1) {
        event.preventDefault();
        focusBlockByIndex(blockRange.index + 1, 'start');
        return true;
      }
    }

    return false;
  }

  /**
   * 功能：处理图片文件选择并触发上传流程。
   * 关键参数：event 为文件选择事件。
   * 返回值/副作用：无返回值；副作用为触发图片上传与节点插入。
   */
  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    void uploadAndInsertImage(file);
  }

  /**
   * 功能：弹出链接输入框并走统一解析链路插入卡片。
   * 关键参数：无。
   * 返回值/副作用：无返回值；副作用为触发解析请求并更新文档。
   */
  function handleInsertSmartCard(): void {
    const inputUrl = requestUrlInput('请输入外部链接（系统将自动识别卡片类型）：', 'https://');
    if (!inputUrl) {
      return;
    }

    void resolveAndInsertCard(inputUrl);
  }

  /**
   * 功能：处理编辑区键盘事件，优先处理 Slash 菜单，再处理 Notion 风格块语义。
   * 关键参数：event 为键盘事件对象。
   * 返回值/副作用：无返回值；副作用为触发菜单操作或块编辑动作。
   */
  function handleEditorContainerKeydown(event: KeyboardEvent<HTMLDivElement>): void {
    if (handleSlashMenuKeydown(event)) {
      return;
    }
    handleNotionKeyboardSemantics(event);
  }

  /**
   * 功能：为当前选中文本设置或移除行内链接 mark。
   * 关键参数：无（内部读取当前 link mark 与用户输入）。
   * 返回值/副作用：无返回值；副作用为更新当前选区 marks。
   */
  function handleInlineLinkAction(): void {
    if (!editor) {
      return;
    }

    const previousHref = (editor.getAttributes('link').href as string | undefined) ?? '';
    const input = window.prompt('请输入链接地址（留空则移除链接）：', previousHref || 'https://');
    if (input === null) {
      return;
    }
    const normalized = normalizeInlineLink(input);
    if (!normalized) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: normalized,
        target: '_blank',
        rel: 'noopener noreferrer',
      })
      .run();
  }

  /**
   * 功能：将当前编辑器内容保存到后端文章接口。
   * 关键参数：无（内部读取 editor/post）。
   * 返回值/副作用：返回 Promise<void>；副作用为调用更新接口并触发 onSaved。
   */
  async function handleSavePost(): Promise<void> {
    if (!editor) {
      return;
    }

    setSaveLoading(true);
    setError('');
    setStatusHint('保存中...');

    const docJson = editor.getJSON() as JSONContent;
    const nextExcerpt = buildExcerptFromEditorDoc(docJson) || post.excerpt || post.summary || '';

    try {
      const updatedPost = await updatePost(post.id, {
        title: post.title,
        slug: post.slug,
        summary: nextExcerpt,
        excerpt: nextExcerpt,
        content: serializeEditorDoc(docJson),
        contentFormat: 'gmp-block-v1',
        status: post.status,
        baseUpdatedAt: post.baseUpdatedAt,
        coverUrl: post.coverUrl,
      });

      setStatusHint('保存成功');
      onSaved(updatedPost);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('保存失败，请稍后重试');
      }
      setStatusHint('');
    } finally {
      setSaveLoading(false);
    }
  }

  const canMoveUp = Boolean(activeBlock && activeBlock.index > 0);
  const canMoveDown = Boolean(activeBlock && activeBlock.index < activeBlock.count - 1);
  const editorShell: EditorShellProps = {
    initialContent: initialDoc,
    onChange: (currentEditor) => {
      handleEditorChanged(currentEditor);
    },
    onSave: async () => {
      await handleSavePost();
    },
    uploadImage: async (file) => {
      await uploadAndInsertImage(file);
    },
    resolveEmbed: async (url) => {
      await resolveAndInsertCard(url);
    },
    readonly: actionLoading || saveLoading,
  };

  const insertMenuItems: EditorCommandMenuItem[] = SLASH_COMMAND_ITEMS.map((item) => ({
    key: `insert-${item.type}`,
    label: item.title,
    description: item.description,
    alias: item.alias,
    disabled: actionLoading || saveLoading,
    onSelect: () => {
      void executeSlashCommand(item.type);
    },
  }));

  const slashMenuItems: EditorCommandMenuItem[] = slashItems.map((item, index) => ({
    key: item.type,
    label: item.title,
    description: item.description,
    alias: item.alias,
    active: index === activeSlashIndex,
    onSelect: () => {
      void executeSlashCommand(item.type);
    },
  }));

  const bubbleActions: EditorBubbleActionItem[] = !editor ? [] : [
    {
      key: 'bold',
      label: 'B',
      active: editor.isActive('bold'),
      onClick: () => {
        editor.chain().focus().toggleBold().run();
      },
    },
    {
      key: 'italic',
      label: 'I',
      active: editor.isActive('italic'),
      onClick: () => {
        editor.chain().focus().toggleItalic().run();
      },
    },
    {
      key: 'code',
      label: 'CODE',
      active: editor.isActive('code'),
      onClick: () => {
        editor.chain().focus().toggleCode().run();
      },
    },
    {
      key: 'link',
      label: 'LINK',
      active: editor.isActive('link'),
      onClick: handleInlineLinkAction,
    },
  ];

  const actionBar = (
    <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
      <div className="relative">
        <button
          type="button"
          onClick={() => setInsertMenuOpen((previous) => !previous)}
          disabled={actionLoading || saveLoading}
          className="h-10 border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 font-mono text-[10px] font-bold tracking-widest uppercase text-white hover:border-white disabled:opacity-60"
        >
          + BLOCK
        </button>
        <CommandMenu
          open={insertMenuOpen}
          items={insertMenuItems}
          className="absolute left-0 top-11 z-40 w-72 border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-2"
        />
      </div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={actionLoading || saveLoading}
        className="h-10 border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 font-mono text-[10px] font-bold tracking-widest uppercase text-white hover:border-white disabled:opacity-60"
      >
        IMAGE
      </button>
      <button
        type="button"
        onClick={handleInsertSmartCard}
        disabled={actionLoading || saveLoading}
        className="h-10 border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 font-mono text-[10px] font-bold tracking-widest uppercase text-white hover:border-white disabled:opacity-60"
      >
        CARD
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saveLoading}
        className="h-10 border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 font-mono text-[10px] font-bold tracking-widest uppercase text-(--gmp-text-secondary) hover:text-white"
      >
        CANCEL
      </button>
      <button
        type="button"
        onClick={() => void handleSavePost()}
        disabled={saveLoading || actionLoading}
        className="h-10 border border-(--gmp-accent) bg-(--gmp-accent) px-4 font-mono text-[10px] font-black tracking-widest uppercase text-black hover:opacity-90 disabled:opacity-60"
      >
        {saveLoading ? 'SAVING...' : 'SAVE'}
      </button>
    </div>
  );

  const blockControlBar = (
    <div className="flex flex-wrap items-center gap-2 border border-(--gmp-line-soft) bg-(--gmp-bg-base) p-2">
      <button
        type="button"
        onPointerDown={handleDragHandlePointerDown}
        onPointerMove={handleDragHandlePointerMove}
        onPointerUp={handleDragHandlePointerUp}
        disabled={!activeBlock || actionLoading || saveLoading}
        className="inline-flex h-9 w-9 items-center justify-center border border-(--gmp-line-soft) bg-(--gmp-bg-panel) font-mono text-[12px] font-black tracking-tight text-(--gmp-text-secondary) cursor-grab active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
        title="拖拽排序手柄"
      >
        ⋮⋮
      </button>
      <button
        type="button"
        onClick={() => moveCurrentBlock('up')}
        disabled={!canMoveUp || actionLoading || saveLoading}
        className="h-9 border border-(--gmp-line-soft) bg-(--gmp-bg-panel) px-3 font-mono text-[10px] font-bold tracking-widest uppercase text-white hover:border-white disabled:opacity-50"
      >
        MOVE UP
      </button>
      <button
        type="button"
        onClick={() => moveCurrentBlock('down')}
        disabled={!canMoveDown || actionLoading || saveLoading}
        className="h-9 border border-(--gmp-line-soft) bg-(--gmp-bg-panel) px-3 font-mono text-[10px] font-bold tracking-widest uppercase text-white hover:border-white disabled:opacity-50"
      >
        MOVE DOWN
      </button>
      <span className="ml-1 font-mono text-[10px] uppercase tracking-widest text-(--gmp-text-secondary)">
        BLOCK {activeBlock ? `${activeBlock.index + 1}/${activeBlock.count}` : '--/--'}{dragSorting ? ' · DRAGGING' : ''}
      </span>
    </div>
  );

  const hiddenInputs = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif,image/heic,image/heif"
      className="hidden"
      onChange={handleFileInputChange}
    />
  );

  const editorArea = (
    <div ref={editorContainerRef}>
      <EditorShell
        shell={editorShell}
        editor={editor}
        onKeyDownCapture={handleEditorContainerKeydown}
        bubbleMenu={(
          <BubbleMenu
            visible={Boolean(editor && inlineToolbarVisible)}
            actions={bubbleActions}
            className="absolute z-30 flex items-center gap-1 border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-1"
            style={{ top: `${Math.max(8, inlineToolbarPosition.top - 52)}px`, left: `${inlineToolbarPosition.left}px` }}
          />
        )}
        commandMenu={(
          <CommandMenu
            open={slashState.open}
            items={slashMenuItems}
            className="absolute z-20 w-full max-w-xl border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-2"
            style={{ top: `${slashMenuPosition.top}px`, left: `${slashMenuPosition.left}px` }}
          />
        )}
      >
        <EditorContent editor={editor} />
      </EditorShell>
    </div>
  );

  const helperTexts = (
    <>
      <p className="font-mono text-[10px] uppercase tracking-widest text-(--gmp-text-secondary)">
        Slash: 输入 <span className="text-(--gmp-accent)">/</span> 打开命令菜单；支持标题、列表、引用、代码、图片、卡片、分割线。
      </p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-(--gmp-text-secondary)">
        键盘语义：Enter 拆块，空块 Backspace 合并，ArrowUp/ArrowDown 在块间移动。
      </p>
    </>
  );

  const previewArea = (
    <section className="space-y-3 border border-(--gmp-line-soft) bg-(--gmp-bg-base) p-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-(--gmp-accent)">LIVE PREVIEW // SAME BLOCK RENDERER AS READER</p>
      <BlockRenderer document={previewDocument} />
    </section>
  );

  return (
    <EditorEntryTemplate
      modeLabel="ADMIN EDIT MODE"
      title={post.title}
      slug={post.slug}
      actions={actionBar}
      blockControls={blockControlBar}
      hiddenInputs={hiddenInputs}
      statusHint={statusHint}
      error={error}
      editorArea={editorArea}
      helperTexts={helperTexts}
      previewArea={previewArea}
    />
  );
}
