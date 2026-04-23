"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type RefObject } from 'react';
import { Bold, Code2, Italic, Link2, Strikethrough } from 'lucide-react';
import {
  EditorBubble,
  EditorBubbleItem,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  createImageUpload,
  handleImageDrop,
  handleImagePaste,
  type EditorInstance,
  type JSONContent,
} from 'novel';
import { ApiError } from '@/lib/api-client';
import { resolveEmbed, updatePost, uploadPostAsset } from '@/features/post/api';
import { EditorEntryTemplate } from '@/features/editor/components';
import { normalizeStorageAssetUrl } from '@/features/post/editor/assets';
import { buildEmbedInsertPayload, insertEmbedCardNode, insertFallbackLinkNode } from '@/features/post/editor/embed';
import { buildPostEditorExtensions } from '@/features/post/editor/extensions';
import { buildPostSlashCommandItems } from '@/features/post/editor/slash-items';
import { buildExcerptFromEditorDoc, parsePostContentToEditorDoc, serializeEditorDoc } from '@/features/post/editor/serializer';
import type { EditorSaveState, EmbedNodeType } from '@/features/post/editor/types';
import type { PostDetail } from '@/features/post/types';

const AUTO_SAVE_DELAY_MS = 1200;
const EMBED_NODE_TYPES: EmbedNodeType[] = ['embedGithub', 'embedMusic', 'embedVideo', 'embedLink'];

interface PostRichEditorProps {
  post: PostDetail;
  onSaved: (updatedPost: PostDetail) => void;
  onCancel: () => void;
}

interface PositionRange {
  from: number;
  to: number;
}

type InsertEditorState =
  | {
      mode: 'embed';
      nodeType: EmbedNodeType;
      range: PositionRange;
      url: string;
      title: string;
      description: string;
    }
  | {
      mode: 'code';
      range: PositionRange;
      language: string;
      code: string;
    }
  | null;

/**
 * 功能：将自动保存状态转换为统一状态文案，便于界面反馈保持一致。
 * 关键参数：saveState 为当前保存状态。
 * 返回值/副作用：返回状态文本；无副作用。
 */
function resolveSaveStatusLabel(saveState: EditorSaveState): string {
  switch (saveState) {
    case 'saving':
      return 'SAVING...';
    case 'saved':
      return 'SAVED';
    case 'error':
      return 'SAVE FAILED';
    default:
      return 'EDITING';
  }
}

/**
 * 功能：将自动保存状态映射到状态徽标样式，保证不同状态有清晰视觉区分。
 * 关键参数：saveState 为当前保存状态。
 * 返回值/副作用：返回 Tailwind class 字符串；无副作用。
 */
function resolveSaveStatusClassName(saveState: EditorSaveState): string {
  switch (saveState) {
    case 'saving':
      return 'border-(--gmp-accent) text-(--gmp-accent)';
    case 'saved':
      return 'border-emerald-400/60 text-emerald-300';
    case 'error':
      return 'border-red-400/60 text-red-300';
    default:
      return 'border-(--gmp-line-soft) text-(--gmp-text-secondary)';
  }
}

/**
 * 功能：标准化文章标题，避免空标题进入保存接口。
 * 关键参数：title 为编辑态标题。
 * 返回值/副作用：返回可保存标题；无副作用。
 */
function normalizePostTitle(title: string): string {
  const normalized = title.trim();
  return normalized || 'UNTITLED POST';
}

/**
 * 功能：构造未导入外链的空卡片属性，供 slash 与编辑面板复用。
 * 关键参数：title/description 为可选展示文本。
 * 返回值/副作用：返回 embed attrs 对象；无副作用。
 */
function buildEmptyEmbedAttrs(title: string, description: string): Record<string, unknown> {
  return {
    provider: 'link',
    url: '',
    fallbackUrl: '',
    resolved: false,
    title: title.trim(),
    description: description.trim(),
    coverUrl: '',
    domain: '',
    siteName: '',
    artist: '',
    videoId: '',
    snapshot: null,
  };
}

/**
 * 功能：从当前选区解析激活中的 embed 卡片状态，供单独编辑面板使用。
 * 关键参数：editor 为当前编辑器实例。
 * 返回值/副作用：返回 embed 编辑态或 null；无副作用。
 */
function resolveActiveEmbedEditorState(editor: EditorInstance): InsertEditorState {
  for (const nodeType of EMBED_NODE_TYPES) {
    if (!editor.isActive(nodeType)) {
      continue;
    }

    const attrs = editor.getAttributes(nodeType) as Record<string, unknown>;
    return {
      mode: 'embed',
      nodeType,
      range: {
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      },
      url: typeof attrs.url === 'string' ? attrs.url : '',
      title: typeof attrs.title === 'string' ? attrs.title : '',
      description: typeof attrs.description === 'string' ? attrs.description : '',
    };
  }

  return null;
}

/**
 * 功能：从当前选区定位 codeBlock 节点并提取代码编辑上下文。
 * 关键参数：editor 为当前编辑器实例。
 * 返回值/副作用：返回代码编辑态或 null；无副作用。
 */
function resolveActiveCodeEditorState(editor: EditorInstance): InsertEditorState {
  if (!editor.isActive('codeBlock')) {
    return null;
  }

  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth >= 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type.name !== 'codeBlock') {
      continue;
    }

    return {
      mode: 'code',
      range: {
        from: $from.before(depth),
        to: $from.after(depth),
      },
      language: typeof node.attrs.language === 'string' ? node.attrs.language : '',
      code: node.textContent,
    };
  }

  return null;
}

/**
 * 功能：渲染基于 Novel 运行时的文章富文本编辑器，并接入自动保存、可编辑标题与插入卡片编辑面板。
 * 关键参数：post 为当前文章详情；onSaved/onCancel 为编辑态回调。
 * 返回值/副作用：返回编辑器 UI；副作用为触发更新接口、上传接口与外链解析接口。
 */
export function PostRichEditor({ post, onSaved, onCancel }: PostRichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const commandHostRef = useRef<HTMLDivElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
  const saveQueuedRef = useRef(false);
  const lastSavedContentRef = useRef(post.content);
  const pendingContentRef = useRef(post.content);
  const lastSavedTitleRef = useRef(post.title);
  const pendingTitleRef = useRef(post.title);
  const baseUpdatedAtRef = useRef(post.baseUpdatedAt);

  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(null);
  const [saveState, setSaveState] = useState<EditorSaveState>('idle');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionHint, setActionHint] = useState('');
  const [titleDraft, setTitleDraft] = useState(post.title);
  const [insertEditorState, setInsertEditorState] = useState<InsertEditorState>(null);

  const initialDoc = useMemo(
    () => parsePostContentToEditorDoc(post.content, post.contentFormat),
    [post.content, post.contentFormat],
  );

  const uploadFn = useMemo(
    () =>
      createImageUpload({
        onUpload: async (file) => {
          const uploadResult = await uploadPostAsset(file, post.id);
          return normalizeStorageAssetUrl(uploadResult.url);
        },
      }),
    [post.id],
  );

  /**
   * 功能：同步选区对应的插入内容编辑态，支持外链卡片与代码卡片独立编辑。
   * 关键参数：editor 为当前编辑器实例。
   * 返回值/副作用：无返回值；副作用为更新 insertEditorState 状态。
   */
  const syncInsertEditorState = useCallback((editor: EditorInstance): void => {
    const embedState = resolveActiveEmbedEditorState(editor);
    if (embedState) {
      setInsertEditorState(embedState);
      return;
    }

    const codeState = resolveActiveCodeEditorState(editor);
    if (codeState) {
      setInsertEditorState(codeState);
      return;
    }

    setInsertEditorState(null);
  }, []);

  /**
   * 功能：清理自动保存定时器，避免重复调度导致的并发保存。
   * 关键参数：无。
   * 返回值/副作用：无返回值；副作用为清除已存在的 timeout。
   */
  const clearAutoSaveTimer = useCallback((): void => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  /**
   * 功能：执行一次保存请求并处理串行化，确保高频输入只提交最新快照。
   * 关键参数：force 表示是否强制保存（忽略与已保存内容一致的短路）。
   * 返回值/副作用：返回 Promise<void>；副作用为更新保存状态并调用更新接口。
   */
  const persistLatestContent = useCallback(
    async (force: boolean): Promise<void> => {
      const editor = editorInstance;
      if (!editor) {
        return;
      }

      if (saveInFlightRef.current) {
        saveQueuedRef.current = true;
        return;
      }

      const docJson = editor.getJSON() as JSONContent;
      const serialized = serializeEditorDoc(docJson);
      const normalizedTitle = normalizePostTitle(titleDraft);
      pendingContentRef.current = serialized;
      pendingTitleRef.current = normalizedTitle;

      if (!force && serialized === lastSavedContentRef.current && normalizedTitle === lastSavedTitleRef.current) {
        setSaveState('saved');
        return;
      }

      saveInFlightRef.current = true;
      setSaveState('saving');
      setError('');

      let saveSucceeded = false;
      try {
        const nextExcerpt = buildExcerptFromEditorDoc(docJson) || post.excerpt || post.summary || '';
        const updatedPost = await updatePost(post.id, {
          title: normalizedTitle,
          slug: post.slug,
          summary: nextExcerpt,
          excerpt: nextExcerpt,
          content: serialized,
          contentFormat: 'tiptap-json',
          status: post.status,
          baseUpdatedAt: baseUpdatedAtRef.current,
          coverUrl: post.coverUrl,
        });

        saveSucceeded = true;
        lastSavedContentRef.current = serialized;
        lastSavedTitleRef.current = normalizedTitle;
        baseUpdatedAtRef.current = updatedPost.baseUpdatedAt;
        setSaveState('saved');
        onSaved(updatedPost);
      } catch (err) {
        setSaveState('error');
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('保存失败，请稍后重试');
        }
      } finally {
        saveInFlightRef.current = false;
        if (
          saveSucceeded
          && (
            saveQueuedRef.current
            || pendingContentRef.current !== lastSavedContentRef.current
            || pendingTitleRef.current !== lastSavedTitleRef.current
          )
        ) {
          saveQueuedRef.current = false;
          void persistLatestContent(false);
        } else {
          saveQueuedRef.current = false;
        }
      }
    },
    [editorInstance, onSaved, post.coverUrl, post.excerpt, post.id, post.slug, post.status, post.summary, titleDraft],
  );

  /**
   * 功能：按防抖策略调度自动保存请求，减少无效网络写入。
   * 关键参数：无。
   * 返回值/副作用：无返回值；副作用为设置保存定时器。
   */
  const scheduleAutoSave = useCallback((): void => {
    clearAutoSaveTimer();
    saveTimerRef.current = window.setTimeout(() => {
      void persistLatestContent(false);
    }, AUTO_SAVE_DELAY_MS);
  }, [clearAutoSaveTimer, persistLatestContent]);

  /**
   * 功能：统一同步编辑器内容变更，维护保存状态机并触发防抖自动保存。
   * 关键参数：editor 为当前编辑器实例。
   * 返回值/副作用：无返回值；副作用为更新本地内容快照并调度自动保存。
   */
  const syncEditorContent = useCallback(
    (editor: EditorInstance): void => {
      const serialized = serializeEditorDoc(editor.getJSON() as JSONContent);
      pendingContentRef.current = serialized;

      if (serialized === lastSavedContentRef.current && normalizePostTitle(titleDraft) === lastSavedTitleRef.current) {
        setSaveState('saved');
        return;
      }

      setSaveState((prev) => (prev === 'saving' ? prev : 'idle'));
      scheduleAutoSave();
    },
    [scheduleAutoSave, titleDraft],
  );

  /**
   * 功能：处理编辑器创建事件，初始化保存快照并标记为已同步状态。
   * 关键参数：editor 为 Novel 当前编辑器实例。
   * 返回值/副作用：无返回值；副作用为缓存实例与更新初始保存状态。
   */
  function handleEditorCreate(editor: EditorInstance): void {
    setEditorInstance(editor);
    const serialized = serializeEditorDoc(editor.getJSON() as JSONContent);
    lastSavedContentRef.current = serialized;
    pendingContentRef.current = serialized;
    lastSavedTitleRef.current = normalizePostTitle(titleDraft);
    pendingTitleRef.current = normalizePostTitle(titleDraft);
    setSaveState('saved');
    syncInsertEditorState(editor);
  }

  /**
   * 功能：处理图片文件选择并插入编辑器，统一复用上传接口。
   * 关键参数：event 为文件选择事件。
   * 返回值/副作用：无返回值；副作用为上传文件并更新编辑器内容。
   */
  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file || !editorInstance) {
      return;
    }

    setActionLoading(true);
    setError('');
    setActionHint('上传图片中...');

    uploadPostAsset(file, post.id)
      .then((uploadResult) => {
        editorInstance
          .chain()
          .focus()
          .setImage({ src: normalizeStorageAssetUrl(uploadResult.url), alt: file.name || 'article-image' })
          .run();
        setActionHint('图片已插入');
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setError(`图片上传失败：${err.message}`);
        } else {
          setError('图片上传失败，请稍后重试');
        }
        setActionHint('');
      })
      .finally(() => {
        setActionLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });
  }

  /**
   * 功能：触发本地文件选择窗口，供 slash 与工具栏共用图片上传入口。
   * 关键参数：无。
   * 返回值/副作用：无返回值；副作用为触发隐藏文件输入框 click。
   */
  const triggerImageSelect = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  /**
   * 功能：执行 slash 外链卡片插入流程，并在失败时降级为普通链接。
   * 关键参数：editor 为编辑器实例；range 为 slash 命令区间；inputUrl 为用户输入链接。
   * 返回值/副作用：返回 Promise<void>；副作用为调用外链解析接口并修改文档。
   */
  const handleInsertEmbedFromSlash = useCallback(
    async ({ editor, range, inputUrl }: { editor: EditorInstance; range: { from: number; to: number }; inputUrl: string }): Promise<void> => {
      setActionLoading(true);
      setError('');
      setActionHint('解析外链中...');

      try {
        const resolved = await resolveEmbed(inputUrl);
        const payload = buildEmbedInsertPayload(resolved, inputUrl);
        insertEmbedCardNode(editor, range, payload);

        if (!resolved.resolved) {
          setActionHint('外链已降级为基础卡片');
        } else {
          setActionHint('外链卡片已插入');
        }
      } catch {
        insertFallbackLinkNode(editor, range, inputUrl);
        setError('外链解析失败，已降级为普通链接');
        setActionHint('');
      } finally {
        setActionLoading(false);
      }
    },
    [],
  );

  /**
   * 功能：通过 slash 插入空外链卡片，供用户后续在独立编辑面板补全。
   * 关键参数：editor 为编辑器实例；range 为 slash 命令区间。
   * 返回值/副作用：无返回值；副作用为插入 embedLink 空卡片节点。
   */
  const handleInsertEmptyEmbedCard = useCallback(
    ({ editor, range }: { editor: EditorInstance; range: PositionRange }): void => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent([
          {
            type: 'embedLink',
            attrs: buildEmptyEmbedAttrs('', ''),
          },
          {
            type: 'paragraph',
          },
        ])
        .run();
      setActionHint('已插入通用链接占位卡片，请在 INSERT EDITOR 中补全');
    },
    [],
  );

  /**
   * 功能：通过 slash 插入空代码卡片（codeBlock），供用户后续在独立编辑面板补全。
   * 关键参数：editor 为编辑器实例；range 为 slash 命令区间。
   * 返回值/副作用：无返回值；副作用为插入空代码块节点。
   */
  const handleInsertEmptyCodeCard = useCallback(
    ({ editor, range }: { editor: EditorInstance; range: PositionRange }): void => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent([
          {
            type: 'codeBlock',
            attrs: {
              language: 'plaintext',
            },
            content: [],
          },
          {
            type: 'paragraph',
          },
        ])
        .run();
      setActionHint('已插入空代码块级组件，请在 INSERT EDITOR 中补全');
    },
    [],
  );

  const slashItems = useMemo(
    () =>
      buildPostSlashCommandItems({
        onSelectImage: triggerImageSelect,
        onInsertEmbed: handleInsertEmbedFromSlash,
        onInsertEmptyEmbedCard: handleInsertEmptyEmbedCard,
        onInsertEmptyCodeCard: handleInsertEmptyCodeCard,
      }),
    [handleInsertEmbedFromSlash, handleInsertEmptyCodeCard, handleInsertEmptyEmbedCard, triggerImageSelect],
  );

  const extensions = useMemo(
    () =>
      buildPostEditorExtensions({
        placeholder: '输入正文，支持标题、列表、引用、代码、图片与外链卡片。',
        slashItems,
        commandHostRef: commandHostRef as unknown as RefObject<Element>,
      }),
    [slashItems],
  );

  /**
   * 功能：应用外链卡片编辑面板改动，支持空卡片更新与链接导入两种流程。
   * 关键参数：无（内部读取 insertEditorState 与 editor 实例）。
   * 返回值/副作用：返回 Promise<void>；副作用为更新当前卡片节点。
   */
  const applyEmbedEditorChanges = useCallback(async (): Promise<void> => {
    if (!editorInstance || !insertEditorState || insertEditorState.mode !== 'embed') {
      return;
    }

    const nextUrl = insertEditorState.url.trim();
    const nextTitle = insertEditorState.title.trim();
    const nextDescription = insertEditorState.description.trim();

    setActionLoading(true);
    setError('');

    try {
      if (!nextUrl) {
        editorInstance
          .chain()
          .focus()
          .insertContentAt(insertEditorState.range, {
            type: insertEditorState.nodeType,
            attrs: buildEmptyEmbedAttrs(nextTitle, nextDescription),
          })
          .run();
        setActionHint('空卡片内容已更新');
      } else {
        const resolved = await resolveEmbed(nextUrl);
        const payload = buildEmbedInsertPayload(resolved, nextUrl);
        const mergedAttrs = {
          ...payload.attrs,
          title: nextTitle || (payload.attrs.title as string),
          description: nextDescription || (payload.attrs.description as string),
        };
        editorInstance
          .chain()
          .focus()
          .insertContentAt(insertEditorState.range, {
            type: payload.type,
            attrs: mergedAttrs,
          })
          .run();
        setActionHint(resolved.resolved ? '外链卡片已导入并更新' : '外链导入失败，已保留空卡片');
      }
    } catch {
      setError('外链导入失败，请稍后重试');
    } finally {
      setActionLoading(false);
      syncInsertEditorState(editorInstance);
    }
  }, [editorInstance, insertEditorState, syncInsertEditorState]);

  /**
   * 功能：应用代码卡片编辑面板改动，将输入内容回填至当前 codeBlock。
   * 关键参数：无（内部读取 insertEditorState 与 editor 实例）。
   * 返回值/副作用：无返回值；副作用为替换当前代码块节点内容。
   */
  const applyCodeEditorChanges = useCallback((): void => {
    if (!editorInstance || !insertEditorState || insertEditorState.mode !== 'code') {
      return;
    }

    const language = insertEditorState.language.trim() || 'plaintext';
    const code = insertEditorState.code;

    editorInstance
      .chain()
      .focus()
      .insertContentAt(insertEditorState.range, {
        type: 'codeBlock',
        attrs: { language },
        content: code ? [{ type: 'text', text: code }] : [],
      })
      .run();

    setActionHint('代码卡片已更新');
    syncInsertEditorState(editorInstance);
  }, [editorInstance, insertEditorState, syncInsertEditorState]);

  /**
   * 功能：在 Bubble 菜单中设置或清理超链接，统一处理链接 prompt 与空值取消。
   * 关键参数：editor 为当前编辑器实例。
   * 返回值/副作用：无返回值；副作用为更新选区链接 mark。
   */
  function handleSetLinkFromBubble(editor: EditorInstance): void {
    const currentHref = editor.getAttributes('link').href as string | undefined;
    const nextInput = window.prompt('输入链接（留空可移除链接）', currentHref ?? 'https://');
    if (nextInput === null) {
      return;
    }

    const normalized = nextInput.trim();
    if (!normalized) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    const href = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href,
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      })
      .run();
  }

  useEffect(() => {
    return () => {
      clearAutoSaveTimer();
    };
  }, [clearAutoSaveTimer]);

  /**
   * 功能：监听标题草稿变化并进入自动保存队列，保证标题与正文共享保存语义。
   * 关键参数：无（内部读取 titleDraft 与已保存标题引用）。
   * 返回值/副作用：无返回值；副作用为调度自动保存。
   */
  useEffect(() => {
    const normalizedTitle = normalizePostTitle(titleDraft);
    pendingTitleRef.current = normalizedTitle;

    if (normalizedTitle === lastSavedTitleRef.current) {
      return;
    }

    setSaveState((prev) => (prev === 'saving' ? prev : 'idle'));
    scheduleAutoSave();
  }, [scheduleAutoSave, titleDraft]);

  const actionBar = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={triggerImageSelect}
          disabled={actionLoading || !editorInstance}
          className="h-10 border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 font-mono text-xs font-bold tracking-widest uppercase text-white hover:border-white disabled:opacity-60"
        >
          IMAGE
        </button>
        {saveState === 'error' ? (
          <button
            type="button"
            onClick={() => {
              void persistLatestContent(true);
            }}
            disabled={actionLoading || !editorInstance}
            className="h-10 border border-red-400/60 bg-(--gmp-bg-base) px-3 font-mono text-xs font-bold tracking-widest uppercase text-red-200 hover:border-red-300 disabled:opacity-60"
          >
            RETRY SAVE
          </button>
        ) : null}
        <button
          type="button"
          onClick={onCancel}
          className="h-10 border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 font-mono text-xs font-bold tracking-widest uppercase text-(--gmp-text-secondary) hover:text-white"
        >
          CANCEL
        </button>
      </div>
      <p
        className={`inline-flex h-10 items-center border px-3 font-mono text-[11px] font-bold tracking-widest uppercase ${resolveSaveStatusClassName(
          saveState,
        )}`}
      >
        {resolveSaveStatusLabel(saveState)}
      </p>
    </div>
  );

  const blockControls = (
    <section className="space-y-3 border border-(--gmp-line-soft) bg-(--gmp-bg-base) p-3">
      <div className="space-y-2">
        <p className="font-mono text-[10px] font-bold tracking-widest uppercase text-(--gmp-accent)">TITLE EDITOR</p>
        <input
          type="text"
          value={titleDraft}
          onChange={(event) => {
            setTitleDraft(event.target.value);
          }}
          placeholder="输入文章标题"
          className="h-11 w-full border border-(--gmp-line-strong) bg-(--gmp-bg-panel) px-3 font-heading text-sm font-bold uppercase tracking-wide text-white placeholder:text-(--gmp-text-secondary) focus:border-(--gmp-accent) focus:outline-none"
        />
      </div>

      <div className="space-y-2 border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-3">
        <p className="font-mono text-[10px] font-bold tracking-widest uppercase text-(--gmp-accent)">INSERT EDITOR</p>

        {insertEditorState?.mode === 'embed' ? (
          <>
            <input
              type="text"
              value={insertEditorState.url}
              onChange={(event) => {
                setInsertEditorState((prev) => {
                  if (!prev || prev.mode !== 'embed') {
                    return prev;
                  }
                  return {
                    ...prev,
                    url: event.target.value,
                  };
                });
              }}
              placeholder="输入外链地址（留空保持空卡片）"
              className="h-10 w-full border border-(--gmp-line-strong) bg-(--gmp-bg-base) px-3 font-mono text-xs text-white placeholder:text-(--gmp-text-secondary) focus:border-(--gmp-accent) focus:outline-none"
            />
            <input
              type="text"
              value={insertEditorState.title}
              onChange={(event) => {
                setInsertEditorState((prev) => {
                  if (!prev || prev.mode !== 'embed') {
                    return prev;
                  }
                  return {
                    ...prev,
                    title: event.target.value,
                  };
                });
              }}
              placeholder="卡片标题"
              className="h-10 w-full border border-(--gmp-line-strong) bg-(--gmp-bg-base) px-3 font-mono text-xs text-white placeholder:text-(--gmp-text-secondary) focus:border-(--gmp-accent) focus:outline-none"
            />
            <textarea
              value={insertEditorState.description}
              onChange={(event) => {
                setInsertEditorState((prev) => {
                  if (!prev || prev.mode !== 'embed') {
                    return prev;
                  }
                  return {
                    ...prev,
                    description: event.target.value,
                  };
                });
              }}
              placeholder="卡片描述"
              rows={3}
              className="w-full border border-(--gmp-line-strong) bg-(--gmp-bg-base) px-3 py-2 font-mono text-xs text-white placeholder:text-(--gmp-text-secondary) focus:border-(--gmp-accent) focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                void applyEmbedEditorChanges();
              }}
              disabled={!editorInstance || actionLoading}
              className="h-10 border border-(--gmp-accent) bg-(--gmp-accent) px-4 font-mono text-xs font-black tracking-widest uppercase text-black disabled:opacity-60"
            >
              APPLY CARD
            </button>
          </>
        ) : null}

        {insertEditorState?.mode === 'code' ? (
          <>
            <input
              type="text"
              value={insertEditorState.language}
              onChange={(event) => {
                setInsertEditorState((prev) => {
                  if (!prev || prev.mode !== 'code') {
                    return prev;
                  }
                  return {
                    ...prev,
                    language: event.target.value,
                  };
                });
              }}
              placeholder="代码语言（如 javascript / java）"
              className="h-10 w-full border border-(--gmp-line-strong) bg-(--gmp-bg-base) px-3 font-mono text-xs text-white placeholder:text-(--gmp-text-secondary) focus:border-(--gmp-accent) focus:outline-none"
            />
            <textarea
              value={insertEditorState.code}
              onChange={(event) => {
                setInsertEditorState((prev) => {
                  if (!prev || prev.mode !== 'code') {
                    return prev;
                  }
                  return {
                    ...prev,
                    code: event.target.value,
                  };
                });
              }}
              placeholder="输入代码内容，留空将保持代码空卡片"
              rows={6}
              className="w-full border border-(--gmp-line-strong) bg-(--gmp-bg-base) px-3 py-2 font-mono text-xs text-white placeholder:text-(--gmp-text-secondary) focus:border-(--gmp-accent) focus:outline-none"
            />
            <button
              type="button"
              onClick={applyCodeEditorChanges}
              disabled={!editorInstance || actionLoading}
              className="h-10 border border-(--gmp-accent) bg-(--gmp-accent) px-4 font-mono text-xs font-black tracking-widest uppercase text-black disabled:opacity-60"
            >
              APPLY CODE
            </button>
          </>
        ) : null}

        {!insertEditorState ? (
          <p className="font-mono text-xs tracking-widest uppercase text-(--gmp-text-secondary)">
            选中外链卡片或代码块后，可在此面板单独编辑内容。
          </p>
        ) : null}
      </div>
    </section>
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
    <div ref={commandHostRef} className="relative border border-(--gmp-line-soft) bg-(--gmp-bg-base)">
      <EditorRoot>
        <EditorContent
          immediatelyRender={false}
          initialContent={initialDoc}
          extensions={extensions as never[]}
          onCreate={({ editor }) => {
            handleEditorCreate(editor);
          }}
          onUpdate={({ editor }) => {
            syncEditorContent(editor);
          }}
          onSelectionUpdate={({ editor }) => {
            syncInsertEditorState(editor);
          }}
          editorProps={{
            handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                'gmp-notion-editor min-h-96 border border-(--gmp-line-soft) bg-(--gmp-bg-base) p-3 md:p-5 font-mono text-sm leading-relaxed text-(--gmp-text-primary) focus:outline-none',
            },
          }}
        />

        <EditorBubble tippyOptions={{ duration: 120, placement: 'top' }}>
          <div className="gmp-editor-bubble flex items-center gap-1 border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-1">
            <EditorBubbleItem asChild onSelect={(editor) => editor.chain().focus().toggleBold().run()}>
              <button type="button" aria-label="加粗" className="gmp-editor-bubble-btn">
                <Bold className="h-4 w-4" />
              </button>
            </EditorBubbleItem>
            <EditorBubbleItem asChild onSelect={(editor) => editor.chain().focus().toggleItalic().run()}>
              <button type="button" aria-label="斜体" className="gmp-editor-bubble-btn">
                <Italic className="h-4 w-4" />
              </button>
            </EditorBubbleItem>
            <EditorBubbleItem asChild onSelect={(editor) => editor.chain().focus().toggleStrike().run()}>
              <button type="button" aria-label="删除线" className="gmp-editor-bubble-btn">
                <Strikethrough className="h-4 w-4" />
              </button>
            </EditorBubbleItem>
            <EditorBubbleItem asChild onSelect={(editor) => editor.chain().focus().toggleCode().run()}>
              <button type="button" aria-label="行内代码" className="gmp-editor-bubble-btn">
                <Code2 className="h-4 w-4" />
              </button>
            </EditorBubbleItem>
            <EditorBubbleItem asChild onSelect={handleSetLinkFromBubble}>
              <button type="button" aria-label="设置链接" className="gmp-editor-bubble-btn">
                <Link2 className="h-4 w-4" />
              </button>
            </EditorBubbleItem>
          </div>
        </EditorBubble>

        <EditorCommand className="gmp-editor-command border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-1">
          <EditorCommandEmpty className="px-3 py-2 font-mono text-xs tracking-widest text-(--gmp-text-secondary) uppercase">
            NO COMMAND FOUND
          </EditorCommandEmpty>
          <EditorCommandList className="gmp-editor-command-list max-h-72 overflow-y-auto">
            {slashItems.map((item) => (
              <EditorCommandItem
                key={item.id}
                value={item.title}
                onCommand={({ editor, range }) => {
                  void item.command({ editor, range });
                }}
                className="gmp-editor-command-item flex cursor-pointer items-start gap-3 px-3 py-2"
              >
                <span className="mt-0.5 text-(--gmp-accent)">{item.icon}</span>
                <span className="space-y-0.5">
                  <span className="block font-mono text-xs font-bold tracking-wide text-(--gmp-text-primary)">{item.title}</span>
                  <span className="block font-mono text-[11px] text-(--gmp-text-secondary)">{item.description}</span>
                </span>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>
      </EditorRoot>
    </div>
  );

  const helperTexts = (
    <p className="font-mono text-xs uppercase tracking-widest text-(--gmp-text-secondary)">
      Editor/Reader 一致渲染：支持可编辑标题、文本块、空卡片与独立 INSERT EDITOR 面板。
    </p>
  );

  return (
    <EditorEntryTemplate
      modeLabel="ADMIN EDIT MODE"
      title={normalizePostTitle(titleDraft)}
      slug={post.slug}
      actions={actionBar}
      blockControls={blockControls}
      hiddenInputs={hiddenInputs}
      statusHint={actionHint}
      error={error}
      editorArea={editorArea}
      helperTexts={helperTexts}
    />
  );
}
