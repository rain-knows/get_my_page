"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type PointerEvent } from 'react';
import type { JSONContent } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { ApiError } from '@/lib/api-client';
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
import { filterSlashCommands } from '@/features/post/editor/slash-commands';
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
 * 功能：渲染文章富文本编辑器，提供统一卡片解析、图片上传、块拖拽排序与保存能力。
 * 关键参数：post 为当前文章详情；onSaved/onCancel 为编辑态回调。
 * 返回值/副作用：返回编辑器 UI；副作用为触发接口请求与本地文件选择。
 */
export function PostRichEditor({ post, onSaved, onCancel }: PostRichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragSortRef = useRef<DragSortState | null>(null);

  const [slashState, setSlashState] = useState<SlashState>({
    open: false,
    query: '',
    from: 0,
    to: 0,
  });
  const [activeSlashIndex, setActiveSlashIndex] = useState(0);
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
    setSlashState(detectSlashState(parentBeforeCursor, selection.from));
    refreshActiveBlock(currentEditor);
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
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
      attributes: {
        class:
          'gmp-notion-editor min-h-96 border border-(--gmp-line-soft) bg-(--gmp-bg-base) p-3 md:p-5 font-mono text-sm leading-relaxed text-(--gmp-text-primary) focus:outline-none',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      syncTransientEditorState(currentEditor);
      setStatusHint('');
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      refreshActiveBlock(currentEditor);
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
    setSlashState({
      open: false,
      query: '',
      from: 0,
      to: 0,
    });
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

    if (commandType === 'divider') {
      insertDividerNode();
      return;
    }

    if (commandType === 'image') {
      fileInputRef.current?.click();
      return;
    }

    const inputUrl = requestUrlInput('请输入外部链接（系统将自动识别卡片类型）：', 'https://');
    if (!inputUrl) {
      return;
    }
    await resolveAndInsertCard(inputUrl);
  }

  /**
   * 功能：处理 Slash 菜单键盘导航（上下选择与回车确认）。
   * 关键参数：event 为键盘事件对象。
   * 返回值/副作用：无返回值；副作用为更新菜单选中项或触发命令执行。
   */
  function handleSlashMenuKeydown(event: KeyboardEvent<HTMLDivElement>): void {
    if (!slashState.open || slashItems.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSlashIndex((previous) => (previous + 1) % slashItems.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSlashIndex((previous) => (previous - 1 + slashItems.length) % slashItems.length);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const selected = slashItems[activeSlashIndex] ?? slashItems[0];
      if (selected) {
        void executeSlashCommand(selected.type);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setSlashState({
        open: false,
        query: '',
        from: 0,
        to: 0,
      });
    }
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
        contentFormat: 'tiptap-json',
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

  return (
    <section className="space-y-4 border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-4 md:p-6 gmp-cut-corner-br">
      <header className="flex flex-col gap-4 border-b border-(--gmp-line-soft) pb-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] font-bold tracking-widest text-(--gmp-accent) uppercase">ADMIN EDIT MODE</p>
          <h2 className="font-heading text-xl font-black text-white uppercase tracking-tight">{post.title}</h2>
          <p className="font-mono text-[11px] text-(--gmp-text-secondary) uppercase tracking-widest">SLUG: {post.slug}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
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
            onClick={insertDividerNode}
            disabled={actionLoading || saveLoading}
            className="h-10 border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 font-mono text-[10px] font-bold tracking-widest uppercase text-white hover:border-white disabled:opacity-60"
          >
            DIVIDER
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
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif,image/heic,image/heif"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {statusHint ? (
        <p className="font-mono text-[11px] uppercase tracking-widest text-(--gmp-accent)">{statusHint}</p>
      ) : null}

      {error ? (
        <p className="font-mono text-[11px] uppercase tracking-widest text-red-400" role="alert">
          ERROR // {error}
        </p>
      ) : null}

      <div className="relative" onKeyDownCapture={handleSlashMenuKeydown}>
        <EditorContent editor={editor} />

        {slashState.open && slashItems.length > 0 ? (
          <div className="absolute left-2 top-2 z-20 w-full max-w-xl border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-2">
            {slashItems.map((item, index) => {
              const isActive = index === activeSlashIndex;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => void executeSlashCommand(item.type)}
                  className={`mb-1 flex w-full items-start justify-between border px-3 py-2 text-left last:mb-0 ${
                    isActive
                      ? 'border-(--gmp-accent) bg-(--gmp-accent) text-black'
                      : 'border-(--gmp-line-soft) bg-(--gmp-bg-base) text-(--gmp-text-secondary) hover:border-white hover:text-white'
                  }`}
                >
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest">/{item.alias}</span>
                  <span className="pl-3 text-right font-mono text-[10px] uppercase tracking-widest">{item.description}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <p className="font-mono text-[10px] uppercase tracking-widest text-(--gmp-text-secondary)">
        Slash: 输入 <span className="text-(--gmp-accent)">/</span> 打开命令菜单（支持 IMAGE/CARD/DIVIDER）
      </p>
    </section>
  );
}
