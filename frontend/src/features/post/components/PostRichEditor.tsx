'use client';

import type { EditorView } from '@tiptap/pm/view';
import { TextSelection } from '@tiptap/pm/state';
import { Bold, Code, Italic, Link as LinkIcon, Strikethrough, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  EditorBubble,
  EditorBubbleItem,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  ImageResizer,
  type EditorInstance,
  type JSONContent,
  handleCommandNavigation,
  useEditor,
} from 'novel';
import { type ComponentType, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  extractSingleUrlFromClipboard,
  insertEmbedCardAtSelection,
  resolveAndHydrateEmbedCard,
} from '@/features/post/editor/novel-demo/embed-link';
import { buildNovelEditorExtensions } from '@/features/post/editor/novel-demo/extensions';
import { slashCommand, suggestionItems } from '@/features/post/editor/novel-demo/slash-items';
import { buildNovelStorageKey } from '@/features/post/editor/novel-demo/storage';
import { resolveUploadErrorMessage, uploadImageForDirectInsert } from '@/features/post/editor/novel-demo/upload';

const SAVE_DEBOUNCE_MS = 500;
const IMAGE_FILE_EXTENSION_PATTERN = /\.(apng|avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)$/i;

type SaveStatus = 'Saved' | 'Unsaved' | 'Saving' | 'Error';

interface PostRichEditorProps {
  slug: string;
  initialContent: JSONContent;
  onCancel: () => void;
  /** 功能：将编辑器内容发布到后端。关键参数：content 为当前文档。 */
  onPublish?: (content: JSONContent) => Promise<void>;
  /** 是否正在发布中，禁用按钮防重复提交。 */
  publishing?: boolean;
}

interface BubbleActionItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  command: (editor: EditorInstance) => void;
  isActive: (editor: EditorInstance) => boolean;
  isDisabled?: (editor: EditorInstance) => boolean;
  disabledHint?: string;
}

interface EditorStorageSnapshot {
  markdown?: {
    getMarkdown?: () => string;
  };
}

interface BubbleActionButtonProps {
  item: BubbleActionItem;
}

/**
 * 功能：对编辑器 HTML 做代码块高亮预处理，保持与官方 demo 同步的导出内容表现。
 * 关键参数：content 为编辑器输出的 HTML 字符串。
 * 返回值/副作用：返回高亮处理后的 HTML 文本；无副作用。
 */
function highlightCodeblocks(content: string): string {
  const document = new DOMParser().parseFromString(content, 'text/html');
  document.querySelectorAll('pre code').forEach((element) => {
    const typedElement = element as HTMLElement;
    typedElement.classList.add('hljs');
  });
  return new XMLSerializer().serializeToString(document);
}

/**
 * 功能：将保存状态枚举转换为中文文案，统一编辑器顶部状态显示。
 * 关键参数：status 为当前保存状态。
 * 返回值/副作用：返回中文状态文本；无副作用。
 */
function resolveSaveStatusLabel(status: SaveStatus): string {
  if (status === 'Saved') {
    return '已保存';
  }
  if (status === 'Unsaved') {
    return '未保存';
  }
  if (status === 'Saving') {
    return '保存中';
  }
  return '保存失败';
}

/**
 * 功能：弹出链接输入框并返回规范化链接地址，空值时表示清除链接。
 * 关键参数：editor 为当前编辑器实例，用于读取已存在链接值作为默认输入。
 * 返回值/副作用：返回规范化 URL、空字符串（清除）或 null（用户取消）；副作用为触发 prompt 弹窗。
 */
function resolveLinkInput(editor: EditorInstance): string | null {
  const previousHref = String(editor.getAttributes('link').href ?? '');
  const userInput = window.prompt('请输入链接地址', previousHref || 'https://');
  if (userInput === null) {
    return null;
  }

  const normalized = userInput.trim();
  if (!normalized) {
    return '';
  }

  if (/^[a-z][a-z0-9+\-.]*:/i.test(normalized)) {
    return normalized;
  }

  return `https://${normalized}`;
}

/**
 * 功能：判断当前选区是否位于代码上下文，用于控制加粗等样式按钮的可用态。
 * 关键参数：editor 为当前编辑器实例。
 * 返回值/副作用：返回是否处于代码上下文；无副作用。
 */
function isCodeContext(editor: EditorInstance): boolean {
  return editor.isActive('code') || editor.isActive('codeBlock');
}

/**
 * 功能：构建文本选区气泡菜单动作集合，覆盖加粗/斜体/删除线/行内代码/链接。
 * 关键参数：无。
 * 返回值/副作用：返回 Bubble 动作配置数组；无副作用。
 */
function buildBubbleActions(): BubbleActionItem[] {
  return [
    {
      id: 'bold',
      label: '加粗',
      icon: Bold,
      command: (editor) => {
        editor.chain().focus().toggleBold().run();
      },
      isActive: (editor) => editor.isActive('bold'),
      isDisabled: (editor) => isCodeContext(editor),
      disabledHint: '代码上下文不支持加粗。',
    },
    {
      id: 'italic',
      label: '斜体',
      icon: Italic,
      command: (editor) => {
        editor.chain().focus().toggleItalic().run();
      },
      isActive: (editor) => editor.isActive('italic'),
    },
    {
      id: 'strike',
      label: '删除线',
      icon: Strikethrough,
      command: (editor) => {
        editor.chain().focus().toggleStrike().run();
      },
      isActive: (editor) => editor.isActive('strike'),
    },
    {
      id: 'inline-code',
      label: '行内代码',
      icon: Code,
      command: (editor) => {
        editor.chain().focus().toggleCode().run();
      },
      isActive: (editor) => editor.isActive('code'),
    },
    {
      id: 'link',
      label: '链接',
      icon: LinkIcon,
      command: (editor) => {
        const nextHref = resolveLinkInput(editor);
        if (nextHref === null) {
          return;
        }

        if (!nextHref) {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
          return;
        }

        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({
            href: nextHref,
            target: '_blank',
          })
          .run();
      },
      isActive: (editor) => editor.isActive('link'),
    },
  ];
}

/**
 * 功能：在粘贴事件中识别单一 URL 并自动转换为通用链接卡片。
 * 关键参数：view 为 ProseMirror 视图；event 为粘贴事件。
 * 返回值/副作用：返回是否已消费事件；副作用为插入卡片节点并触发异步解析。
 */
function tryConvertPastedUrlToEmbedCard(view: EditorView, event: ClipboardEvent): boolean {
  const pastedUrl = extractSingleUrlFromClipboard(event);
  if (!pastedUrl) {
    return false;
  }

  const embedId = insertEmbedCardAtSelection(view, pastedUrl);
  if (!embedId) {
    return false;
  }

  void resolveAndHydrateEmbedCard(view, embedId, pastedUrl);
  return true;
}

/**
 * 功能：从文件列表中提取可直接插入的图片文件。
 * 关键参数：files 为剪贴板或拖拽事件提供的文件列表。
 * 返回值/副作用：返回图片文件数组；无副作用。
 */
function extractImageFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter((file) => file.type.startsWith('image/') || IMAGE_FILE_EXTENSION_PATTERN.test(file.name || ''));
}

/**
 * 功能：将图片 URL 插入到当前 ProseMirror 选区。
 * 关键参数：view 为编辑器视图；imageUrl 为图片地址；fileName 为原始文件名。
 * 返回值/副作用：返回是否插入成功；副作用为修改编辑器文档。
 */
function insertImageAtSelection(view: EditorView, imageUrl: string, fileName: string): boolean {
  const imageNodeType = view.state.schema.nodes.image;
  if (!imageNodeType) {
    return false;
  }

  const imageNode = imageNodeType.create({
    src: imageUrl,
    alt: fileName,
    title: fileName,
  });
  view.dispatch(view.state.tr.replaceSelectionWith(imageNode).scrollIntoView());
  return true;
}

/**
 * 功能：上传图片文件并按完成顺序直接插入编辑器。
 * 关键参数：view 为编辑器视图；imageFiles 为待上传图片数组。
 * 返回值/副作用：无返回值；副作用为发起上传请求并插入 image 节点。
 */
async function uploadAndInsertImages(view: EditorView, imageFiles: File[]): Promise<void> {
  for (const file of imageFiles) {
    try {
      const uploaded = await uploadImageForDirectInsert(file);
      insertImageAtSelection(view, uploaded.url, uploaded.fileName);
    } catch (error) {
      toast.error(resolveUploadErrorMessage(error));
    }
  }
}

/**
 * 功能：处理图片粘贴并直插 image 节点，避免图片被转换成链接卡片。
 * 关键参数：view 为编辑器视图；event 为剪贴板事件。
 * 返回值/副作用：返回是否消费事件；副作用为异步上传并插入图片。
 */
function tryInsertPastedImages(view: EditorView, event: ClipboardEvent): boolean {
  const files = event.clipboardData?.files;
  if (!files || files.length === 0) {
    return false;
  }

  const imageFiles = extractImageFiles(files);
  if (imageFiles.length === 0) {
    return false;
  }

  event.preventDefault();
  void uploadAndInsertImages(view, imageFiles);
  return true;
}

/**
 * 功能：处理图片拖拽并按落点直插 image 节点。
 * 关键参数：view 为编辑器视图；event 为拖拽事件；moved 表示是否为编辑器内移动。
 * 返回值/副作用：返回是否消费事件；副作用为异步上传并插入图片。
 */
function tryInsertDroppedImages(view: EditorView, event: DragEvent, moved: boolean): boolean {
  if (moved || !event.dataTransfer?.files.length) {
    return false;
  }

  const imageFiles = extractImageFiles(event.dataTransfer.files);
  if (imageFiles.length === 0) {
    return false;
  }

  event.preventDefault();
  const dropPosition = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if (dropPosition) {
    const nextSelection = TextSelection.near(view.state.doc.resolve(dropPosition.pos));
    view.dispatch(view.state.tr.setSelection(nextSelection));
  }
  void uploadAndInsertImages(view, imageFiles);
  return true;
}

/**
 * 功能：统一处理编辑器粘贴事件，优先处理图片上传，其次处理 URL 自动转卡片。
 * 关键参数：view 为 ProseMirror 视图；event 为粘贴事件。
 * 返回值/副作用：返回是否消费本次粘贴；副作用为触发上传或插入卡片。
 */
function handleEditorPaste(view: EditorView, event: ClipboardEvent): boolean {
  if (tryInsertPastedImages(view, event)) {
    return true;
  }

  if (tryConvertPastedUrlToEmbedCard(view, event)) {
    return true;
  }

  return false;
}

/**
 * 功能：渲染单个 Bubble 按钮并根据当前选区格式状态切换高亮。
 * 关键参数：item 为 Bubble 动作项。
 * 返回值/副作用：返回按钮节点；副作用为调用编辑器格式命令。
 */
function BubbleActionButton({ item }: BubbleActionButtonProps) {
  const { editor } = useEditor();
  const active = editor ? item.isActive(editor) : false;
  const disabled = editor ? Boolean(item.isDisabled?.(editor)) : false;

  return (
    <EditorBubbleItem
      onSelect={(instance) => {
        if (item.isDisabled?.(instance)) {
          return;
        }
        item.command(instance);
      }}
    >
      <button
        type="button"
        className={[
          'inline-flex h-8 w-8 items-center justify-center border transition-colors',
          disabled
            ? 'cursor-not-allowed border-(--gmp-novel-line) bg-(--gmp-novel-toolbar) text-(--gmp-novel-text-muted) opacity-50'
            : active
              ? 'border-(--gmp-novel-accent) bg-(--gmp-novel-accent-soft) text-(--gmp-novel-accent)'
              : 'border-(--gmp-novel-line) bg-(--gmp-novel-toolbar) text-(--gmp-novel-text-muted) hover:border-(--gmp-novel-line-strong) hover:bg-(--gmp-novel-toolbar-hover) hover:text-(--gmp-novel-text)',
        ].join(' ')}
        aria-label={item.label}
        title={disabled ? item.disabledHint ?? `${item.label} 当前不可用` : item.label}
        disabled={disabled}
      >
        <item.icon className="h-4 w-4" />
      </button>
    </EditorBubbleItem>
  );
}

/**
 * 功能：渲染官方 advanced-editor 范式的文章编辑器（localStorage 保存，不接入后端正文写入）。
 * 关键参数：slug 为文章标识；initialContent 为首次挂载时的文档内容；onCancel 为返回阅读页回调。
 * 返回值/副作用：返回编辑器节点；副作用为写入 localStorage 与调用图片上传接口。
 */
export function PostRichEditor({ slug, initialContent, onCancel, onPublish, publishing = false }: PostRichEditorProps) {
  const saveTimerRef = useRef<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('Saved');
  const editorInstanceRef = useRef<EditorInstance | null>(null);

  const storageKeys = useMemo(
    () => ({
      json: buildNovelStorageKey(slug, 'novel-content'),
      html: buildNovelStorageKey(slug, 'html-content'),
      markdown: buildNovelStorageKey(slug, 'markdown'),
    }),
    [slug],
  );

  const extensions = useMemo(() => [...buildNovelEditorExtensions(), slashCommand], []);
  const bubbleActions = useMemo(() => buildBubbleActions(), []);

  /**
   * 功能：将编辑器内容防抖保存到 localStorage，并同步更新保存状态。
   * 关键参数：editor 为当前编辑器实例。
   * 返回值/副作用：无返回值；副作用为写入 localStorage。
   */
  const persistLocalContent = useCallback(
    (editor: EditorInstance): void => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }

      setSaveStatus('Saving');
      saveTimerRef.current = window.setTimeout(() => {
        try {
          const snapshot = editor.storage as EditorStorageSnapshot;
          const markdown = snapshot.markdown?.getMarkdown?.();
          const nextJson = editor.getJSON();

          window.localStorage.setItem(storageKeys.json, JSON.stringify(nextJson));
          window.localStorage.setItem(storageKeys.html, highlightCodeblocks(editor.getHTML()));
          if (typeof markdown === 'string') {
            window.localStorage.setItem(storageKeys.markdown, markdown);
          }

          setSaveStatus('Saved');
        } catch {
          setSaveStatus('Error');
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [storageKeys.html, storageKeys.json, storageKeys.markdown],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="border border-(--gmp-novel-line-strong) bg-(--gmp-novel-toolbar) p-3 gmp-cut-corner-br md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center border border-(--gmp-novel-line) bg-(--gmp-novel-surface) px-4 font-mono text-[10px] font-bold tracking-widest text-(--gmp-novel-text-muted) uppercase transition-colors hover:border-(--gmp-novel-line-strong) hover:text-(--gmp-novel-text)"
          >
            返回预览
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-8 items-center border border-(--gmp-novel-line) bg-(--gmp-novel-surface) px-3 font-mono text-[10px] tracking-widest text-(--gmp-novel-text-muted)">
              {resolveSaveStatusLabel(saveStatus)}
            </span>
            {onPublish ? (
              <button
                type="button"
                disabled={publishing}
                onClick={() => {
                  const editor = editorInstanceRef.current;
                  if (!editor) return;
                  void onPublish(editor.getJSON());
                }}
                className="inline-flex h-9 items-center gap-2 border border-(--gmp-accent) bg-(--gmp-accent) px-4 font-mono text-[10px] font-black tracking-widest text-black uppercase transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-3.5 w-3.5" />
                {publishing ? '发布中...' : '发布到服务器'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <EditorRoot>
          <EditorContent
            initialContent={initialContent}
            extensions={extensions as never[]}
            className="relative min-h-96 w-full max-w-5xl border border-(--gmp-novel-line-strong) bg-(--gmp-novel-surface)"
            onCreate={({ editor }) => {
              editorInstanceRef.current = editor;
            }}
            editorProps={{
              handlePaste: (view, event) => handleEditorPaste(view, event),
              handleDrop: (view, event, _slice, moved) => tryInsertDroppedImages(view, event, moved),
              /**
               * 功能：仅在 Slash 菜单可见时接管方向键/回车导航，避免 Enter 被编辑器当作普通换行。
               * 关键参数：event 为当前键盘事件。
               * 返回值/副作用：返回是否消费快捷键；无副作用。
               */
              handleKeyDown: (_view, event) => {
                if (!document.querySelector('#slash-command')) {
                  return false;
                }
                return Boolean(handleCommandNavigation(event));
              },
              attributes: {
                class: [
                  'gmp-novel-editor max-w-full px-4 py-8 text-(--gmp-novel-text) focus:outline-none md:px-8',
                ].join(' '),
              },
            }}
            onUpdate={({ editor }) => {
              setSaveStatus('Unsaved');
              persistLocalContent(editor);
            }}
            slotAfter={<ImageResizer />}
          >
            <EditorCommand
              loop
              className="z-50 h-auto w-full max-w-xl overflow-hidden border border-(--gmp-novel-line-strong) bg-(--gmp-novel-toolbar) p-2 shadow-[4px_4px_0_0_rgba(0,0,0,0.35)] gmp-cut-corner-br transition-all"
            >
              <EditorCommandEmpty className="px-2 py-1 text-sm text-(--gmp-novel-text-muted)">未匹配到命令</EditorCommandEmpty>
              <EditorCommandList className="gmp-editor-command-scroll max-h-84 overflow-y-auto pr-1">
                {suggestionItems.map((item) => (
                  <EditorCommandItem
                    key={item.title}
                    value={item.title}
                    onCommand={(value) => {
                      item.command?.(value);
                    }}
                    className="flex w-full items-center gap-3 border border-transparent px-2 py-2 text-left text-sm aria-selected:border-(--gmp-novel-line-strong) aria-selected:bg-(--gmp-novel-toolbar-hover) hover:border-(--gmp-novel-line) hover:bg-(--gmp-novel-toolbar-hover)"
                  >
                    <div className="flex h-10 w-10 items-center justify-center border border-(--gmp-novel-line) bg-(--gmp-novel-surface) text-(--gmp-novel-text-muted)">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-(--gmp-novel-text)">{item.title}</p>
                      <p className="text-xs text-(--gmp-novel-text-muted)">{item.description}</p>
                    </div>
                  </EditorCommandItem>
                ))}
              </EditorCommandList>
            </EditorCommand>

            <EditorBubble
              tippyOptions={{ placement: 'top' }}
              className="flex items-center gap-1 border border-(--gmp-novel-line-strong) bg-(--gmp-novel-toolbar) p-1 shadow-[4px_4px_0_0_rgba(0,0,0,0.35)]"
            >
              {bubbleActions.map((item) => (
                <BubbleActionButton key={item.id} item={item} />
              ))}
            </EditorBubble>
          </EditorContent>
        </EditorRoot>
      </div>
    </div>
  );
}
