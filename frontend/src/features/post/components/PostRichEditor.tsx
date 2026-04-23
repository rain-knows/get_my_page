"use client";

import { Bold, Code, Italic, Link as LinkIcon, Strikethrough } from "lucide-react";
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
  handleImageDrop,
  handleImagePaste,
  useEditor,
} from "novel";
import { type ComponentType, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildNovelEditorExtensions } from "@/features/post/editor/novel-demo/extensions";
import { createDefaultEditorContent } from "@/features/post/editor/novel-demo/content";
import { slashCommand, suggestionItems } from "@/features/post/editor/novel-demo/slash-items";
import { buildNovelStorageKey, loadNovelDraftDocument } from "@/features/post/editor/novel-demo/storage";
import { uploadFn } from "@/features/post/editor/novel-demo/upload";

const SAVE_DEBOUNCE_MS = 500;

type SaveStatus = "Saved" | "Unsaved" | "Saving" | "Error";

interface PostRichEditorProps {
  slug: string;
  onCancel: () => void;
}

interface BubbleActionItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  command: (editor: EditorInstance) => void;
  isActive: (editor: EditorInstance) => boolean;
}

interface EditorStorageSnapshot {
  characterCount?: {
    words?: () => number;
  };
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
  const document = new DOMParser().parseFromString(content, "text/html");
  document.querySelectorAll("pre code").forEach((element) => {
    const typedElement = element as HTMLElement;
    typedElement.classList.add("hljs");
  });
  return new XMLSerializer().serializeToString(document);
}

/**
 * 功能：弹出链接输入框并返回规范化链接地址，空值时表示清除链接。
 * 关键参数：editor 为当前编辑器实例，用于读取已存在链接值作为默认输入。
 * 返回值/副作用：返回规范化 URL、空字符串（清除）或 null（用户取消）；副作用为触发 prompt 弹窗。
 */
function resolveLinkInput(editor: EditorInstance): string | null {
  const previousHref = String(editor.getAttributes("link").href ?? "");
  const userInput = window.prompt("Enter URL", previousHref || "https://");
  if (userInput === null) {
    return null;
  }

  const normalized = userInput.trim();
  if (!normalized) {
    return "";
  }

  if (/^[a-z][a-z0-9+\-.]*:/i.test(normalized)) {
    return normalized;
  }

  return `https://${normalized}`;
}

/**
 * 功能：构建文本选区气泡菜单动作集合，覆盖加粗/斜体/删除线/行内代码/链接。
 * 关键参数：无。
 * 返回值/副作用：返回 Bubble 动作配置数组；无副作用。
 */
function buildBubbleActions(): BubbleActionItem[] {
  return [
    {
      id: "bold",
      label: "Bold",
      icon: Bold,
      command: (editor) => {
        editor.chain().focus().toggleBold().run();
      },
      isActive: (editor) => editor.isActive("bold"),
    },
    {
      id: "italic",
      label: "Italic",
      icon: Italic,
      command: (editor) => {
        editor.chain().focus().toggleItalic().run();
      },
      isActive: (editor) => editor.isActive("italic"),
    },
    {
      id: "strike",
      label: "Strike",
      icon: Strikethrough,
      command: (editor) => {
        editor.chain().focus().toggleStrike().run();
      },
      isActive: (editor) => editor.isActive("strike"),
    },
    {
      id: "inline-code",
      label: "Inline Code",
      icon: Code,
      command: (editor) => {
        editor.chain().focus().toggleCode().run();
      },
      isActive: (editor) => editor.isActive("code"),
    },
    {
      id: "link",
      label: "Link",
      icon: LinkIcon,
      command: (editor) => {
        const nextHref = resolveLinkInput(editor);
        if (nextHref === null) {
          return;
        }

        if (!nextHref) {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
          return;
        }

        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({
            href: nextHref,
            target: "_blank",
          })
          .run();
      },
      isActive: (editor) => editor.isActive("link"),
    },
  ];
}

/**
 * 功能：渲染单个 Bubble 按钮并根据当前选区格式状态切换高亮。
 * 关键参数：item 为 Bubble 动作项。
 * 返回值/副作用：返回按钮节点；副作用为调用编辑器格式命令。
 */
function BubbleActionButton({ item }: BubbleActionButtonProps) {
  const { editor } = useEditor();
  const active = editor ? item.isActive(editor) : false;

  return (
    <EditorBubbleItem
      onSelect={(instance) => {
        item.command(instance);
      }}
    >
      <button
        type="button"
        className={[
          "inline-flex h-8 w-8 items-center justify-center rounded-sm border transition-colors",
          active
            ? "border-(--gmp-novel-accent) bg-(--gmp-novel-accent-soft) text-(--gmp-novel-accent)"
            : "border-(--gmp-novel-line) bg-(--gmp-novel-toolbar) text-(--gmp-novel-text-muted) hover:bg-(--gmp-novel-toolbar-hover) hover:text-(--gmp-novel-text)",
        ].join(" ")}
        aria-label={item.label}
      >
        <item.icon className="h-4 w-4" />
      </button>
    </EditorBubbleItem>
  );
}

/**
 * 功能：渲染官方 advanced-editor 范式的文章编辑器（localStorage 保存，不接入后端正文写入）。
 * 关键参数：slug 为文章标识；onCancel 为返回阅读页回调。
 * 返回值/副作用：返回编辑器节点；副作用为写入 localStorage 与调用图片上传接口。
 */
export function PostRichEditor({ slug, onCancel }: PostRichEditorProps) {
  const saveTimerRef = useRef<number | null>(null);
  const [initialContent] = useState<JSONContent>(() => {
    if (typeof window === "undefined") {
      return createDefaultEditorContent();
    }

    const stored = loadNovelDraftDocument(slug);
    return stored ?? createDefaultEditorContent();
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("Saved");
  const [wordCount, setWordCount] = useState(0);

  const storageKeys = useMemo(
    () => ({
      json: buildNovelStorageKey(slug, "novel-content"),
      html: buildNovelStorageKey(slug, "html-content"),
      markdown: buildNovelStorageKey(slug, "markdown"),
    }),
    [slug],
  );

  const extensions = useMemo(() => [...buildNovelEditorExtensions(), slashCommand], []);
  const bubbleActions = useMemo(() => buildBubbleActions(), []);

  /**
   * 功能：将编辑器内容防抖保存到 localStorage，并同步保存状态与词数统计。
   * 关键参数：editor 为当前编辑器实例。
   * 返回值/副作用：无返回值；副作用为写入 localStorage。
   */
  const persistLocalContent = useCallback(
    (editor: EditorInstance): void => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }

      setSaveStatus("Saving");
      saveTimerRef.current = window.setTimeout(() => {
        try {
          const snapshot = editor.storage as EditorStorageSnapshot;
          const nextWordCount = snapshot.characterCount?.words?.() ?? 0;
          const markdown = snapshot.markdown?.getMarkdown?.();
          const nextJson = editor.getJSON();

          window.localStorage.setItem(storageKeys.json, JSON.stringify(nextJson));
          window.localStorage.setItem(storageKeys.html, highlightCodeblocks(editor.getHTML()));
          if (typeof markdown === "string") {
            window.localStorage.setItem(storageKeys.markdown, markdown);
          }

          setWordCount(nextWordCount);
          setSaveStatus("Saved");
        } catch {
          setSaveStatus("Error");
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
    <div className="mx-auto w-full max-w-screen-lg space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-8 items-center rounded-sm border border-(--gmp-novel-line) bg-(--gmp-novel-toolbar) px-3 text-xs font-semibold text-(--gmp-novel-text-muted) transition-colors hover:bg-(--gmp-novel-toolbar-hover) hover:text-(--gmp-novel-text)"
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-(--gmp-novel-toolbar) px-2 py-1 text-xs text-(--gmp-novel-text-muted)">{saveStatus}</span>
          <span className="rounded-md bg-(--gmp-novel-toolbar) px-2 py-1 text-xs text-(--gmp-novel-text-muted)">{wordCount} Words</span>
        </div>
      </div>

      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          extensions={extensions as never[]}
          className="relative min-h-[500px] w-full max-w-screen-lg border-(--gmp-novel-line) bg-(--gmp-novel-surface) sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                "gmp-novel-editor prose max-w-full px-5 py-10 text-(--gmp-novel-text) focus:outline-none sm:px-10",
            },
          }}
          onUpdate={({ editor }) => {
            setSaveStatus("Unsaved");
            persistLocalContent(editor);
          }}
          slotAfter={<ImageResizer />}
        >
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-(--gmp-novel-line) bg-(--gmp-novel-toolbar) px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-sm text-(--gmp-novel-text-muted)">No results</EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  key={item.title}
                  value={item.title}
                  onCommand={(value) => {
                    item.command?.(value);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm aria-selected:bg-(--gmp-novel-toolbar-hover) hover:bg-(--gmp-novel-toolbar-hover)"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-(--gmp-novel-line) bg-(--gmp-novel-surface)">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium text-(--gmp-novel-text)">{item.title}</p>
                    <p className="text-xs text-(--gmp-novel-text-muted)">{item.description}</p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          <EditorBubble
            tippyOptions={{ placement: "top" }}
            className="flex items-center gap-1 rounded-md border border-(--gmp-novel-line) bg-(--gmp-novel-toolbar) p-1 shadow-md"
          >
            {bubbleActions.map((item) => (
              <BubbleActionButton key={item.id} item={item} />
            ))}
          </EditorBubble>
        </EditorContent>
      </EditorRoot>
    </div>
  );
}
