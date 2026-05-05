"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { KineticPageShell } from "@/features/surface/components/KineticPageShell";
import { useInvalidatePostList, useIsAdminCapability, usePostDetail } from "@/features/post/hooks";
import { PostRichEditor } from "@/features/post/components/PostRichEditor";
import { clearNovelDraftStorage, createDefaultEditorContent, loadNovelDraftDocument, loadNovelDraftTitle, parsePostContentToNovelDoc, saveNovelDraftTitle, serializeNovelDoc } from "@/features/post/editor/novel-demo";
import { createPost, updatePost } from "@/features/post/api";
import type { JSONContent } from "novel";

type EditorMode = "create" | "edit";

interface BlogArticleEditorProps {
  /** 编辑模式：create 为新建文章，edit 为编辑已有文章。 */
  mode: EditorMode;
  /** edit 模式必填：目标文章 slug；create 模式下为 null。 */
  slug: string | null;
}

/**
 * 功能：将 slug 转换为可读标题兜底文本，避免标题输入框初始值为空。
 * 关键参数：slug 为文章唯一标识。
 * 返回值/副作用：返回标题兜底文本；无副作用。
 */
function buildFallbackTitleFromSlug(slug: string): string {
  return slug.replace(/[-_]+/g, " ").trim() || "Untitled";
}

/**
 * 功能：将标题转换为安全的 URL slug（仅保留小写字母数字与连字符）。
 * 关键参数：title 为原始标题字符串。
 * 返回值/副作用：返回规范化 slug 字符串；无副作用。
 */
function slugifyFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-")
    || "untitled";
}

/**
 * 功能：尝试解析服务端内容为 Novel 文档，失败时返回错误信息而非静默降级。
 * 关键参数：content 为正文 JSON 字符串；format 为内容格式。
 * 返回值/副作用：返回文档与可选错误信息；无副作用。
 */
function tryParsePostContent(
  content: string | undefined | null,
  format: string | undefined | null,
): { doc: JSONContent; error?: string } {
  if (!content) {
    return { doc: createDefaultEditorContent(), error: "服务端返回内容为空，请检查文章是否存在或格式是否正确。" };
  }
  if (format !== "tiptap-json") {
    return { doc: createDefaultEditorContent(), error: `不支持的内容格式：${format || "未知"}，仅支持 tiptap-json。` };
  }
  try {
    const doc = parsePostContentToNovelDoc(content, format);
    if (isEffectivelyEmpty(doc)) {
      return { doc, error: "文章内容解析后为空，可能为旧格式或未完成迁移的内容。" };
    }
    return { doc };
  } catch {
    return { doc: createDefaultEditorContent(), error: "文章内容 JSON 解析失败，可能为旧版 MDX 格式数据。" };
  }
}

/**
 * 功能：判断文档是否实际为空（仅含一个无文本的段落）。
 * 关键参数：doc 为待检测的 Novel 文档。
 * 返回值/副作用：返回是否为空文档；无副作用。
 */
function isEffectivelyEmpty(doc: JSONContent): boolean {
  const content = doc.content;
  if (!content || content.length === 0) return true;
  if (content.length > 1) return false;
  const firstNode = content[0];
  if (!firstNode) return true;
  if (firstNode.type !== "paragraph") return false;
  const textNodes = firstNode.content;
  if (!textNodes || textNodes.length === 0) return true;
  if (textNodes.length > 1) return false;
  return textNodes[0]?.type === "text" && !(textNodes[0] as { text?: string }).text;
}

/** create 模式使用的临时 localStorage slug 占位键，发布后替换为真实 slug。 */
const CREATE_PLACEHOLDER_SLUG = "__new__";

/**
 * 功能：渲染文章编辑页壳层，支持新建（create）与编辑（edit）双模式。
 * 关键参数：mode 控制创建/编辑分支；slug 为 edit 模式的目标文章标识。
 * 返回值/副作用：返回编辑页节点；副作用为根据用户操作触发路由跳转。
 */
export function BlogArticleEditor({ mode, slug }: BlogArticleEditorProps) {
  const router = useRouter();
  const canEdit = useIsAdminCapability();

  // edit 模式下按 slug 加载服务端详情；create 模式跳过服务端请求
  const effectiveSlug = mode === "edit" ? (slug ?? "") : "";
  const { data, loading, error, reload } = usePostDetail(
    effectiveSlug,
    mode === "edit" ? canEdit : false,
  );

  const localStorageScope = mode === "edit" && slug ? slug : CREATE_PLACEHOLDER_SLUG;
  const detailPath = mode === "edit" && slug ? `/blog/${slug}` : "/blog";
  const localPreviewPath = mode === "edit" && slug ? `${detailPath}?preview=local` : "";

  const [publishError, setPublishError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [contentParseError, setContentParseError] = useState("");

  const invalidatePostList = useInvalidatePostList();
  // create 模式：独立管理 slug 状态（用于自定义文章路径）
  const [draftSlug, setDraftSlug] = useState("");
  /**
   * 功能：处理 create 模式下 slug 输入变化，自动从标题生成 slug 兜底。
   * 关键参数：nextSlug 为输入框值。
   * 返回值/副作用：更新 draftSlug；当 slug 为空时尝试从标题草稿生成。
   */
  function handleSlugChange(nextTitle: string): void {
    setDraftSlug(slugifyFromTitle(nextTitle));
  }

  const initialSnapshot = useMemo(() => {
    if (mode === "create") {
      // 新建模式：使用空文档 + localStorage 标题草稿恢复
      const localTitle = loadNovelDraftTitle(CREATE_PLACEHOLDER_SLUG);
      const localDocument = loadNovelDraftDocument(CREATE_PLACEHOLDER_SLUG);
      setContentParseError("");
      if (!draftSlug && localTitle) {
        setDraftSlug(slugifyFromTitle(localTitle));
      }
      return {
        key: "create:new",
        title: localTitle ?? "",
        content: localDocument ?? createDefaultEditorContent(),
        baseUpdatedAt: undefined,
      };
    }

    // edit 模式：优先使用服务端数据，localStorage 仅保留标题草稿供用户继续编辑
    if (data) {
      const localTitle = loadNovelDraftTitle(slug ?? "");
      const { doc: parsedDoc, error: parseError } = tryParsePostContent(data.content, data.contentFormat);
      setContentParseError(parseError ?? "");
      return {
        key: `${slug}:remote:${data.baseUpdatedAt}`,
        title: localTitle ?? data.title,
        content: parsedDoc,
        baseUpdatedAt: data.baseUpdatedAt,
      };
    }

    // 服务端不可用时，回退到本地草稿恢复
    const localTitle = loadNovelDraftTitle(slug ?? "");
    const localDocument = loadNovelDraftDocument(slug ?? "");
    if (localTitle || localDocument) {
      return {
        key: `${slug}:local:fallback`,
        title: localTitle ?? (slug ? buildFallbackTitleFromSlug(slug) : ""),
        content: localDocument ?? createDefaultEditorContent(),
        baseUpdatedAt: undefined,
      };
    }

    return null;
  }, [data, mode, slug, draftSlug]);

  /**
   * 功能：处理退出编辑动作并返回上一页。
   * 关键参数：无。
   * 返回值/副作用：无返回值；副作用为执行客户端跳转。
   */
  function handleCancelEdit(): void {
    router.push(detailPath);
  }

  /**
   * 功能：处理标题输入并实时写入本地草稿，供阅读页与刷新恢复复用。
   * 关键参数：nextTitle 为输入框当前值。
   * 返回值/副作用：无返回值；副作用为写入 localStorage。
   */
  function handleTitleChange(nextTitle: string): void {
    saveNovelDraftTitle(localStorageScope, nextTitle);
    if (mode === "create") {
      handleSlugChange(nextTitle);
    }
  }

  /**
   * 功能：将编辑器当前内容保存到后端，编辑模式使用 updatePost，创建模式使用 createPost。
   * 关键参数：content 为当前编辑器文档。
   * 返回值/副作用：返回 Promise<void>；副作用为调用后端接口并跳转页面。
   */
  const handlePublish = useCallback(async (content: JSONContent): Promise<void> => {
    setPublishing(true);
    setPublishError("");

    try {
      const serializedContent = serializeNovelDoc(content);

      if (mode === "create") {
        const currentTitle = loadNovelDraftTitle(CREATE_PLACEHOLDER_SLUG) ?? "";
        const resolvedSlug = draftSlug.trim() || slugifyFromTitle(currentTitle) || "untitled";
        await createPost({
          title: currentTitle || "Untitled",
          slug: resolvedSlug,
          excerpt: "",
          summary: "",
          content: serializedContent,
          contentFormat: "tiptap-json",
          status: 1,
          coverUrl: null,
        });
        // 发布成功后清理 create 占位草稿，跳转到新文章详情页
        clearNovelDraftStorage(CREATE_PLACEHOLDER_SLUG);
        void invalidatePostList();
        router.push(`/blog/${encodeURIComponent(resolvedSlug)}`);
      } else {
        if (!data || !slug) return;
        const currentTitle = loadNovelDraftTitle(slug) ?? data.title;
        await updatePost(data.id, {
          title: currentTitle,
          slug: data.slug,
          excerpt: data.excerpt || "",
          summary: data.summary || "",
          content: serializedContent,
          contentFormat: "tiptap-json",
          status: data.status ?? 1,
          baseUpdatedAt: data.baseUpdatedAt,
          coverUrl: data.coverUrl,
        });
        clearNovelDraftStorage(slug);
        void invalidatePostList();
        router.push(detailPath);
      }
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "发布失败，请稍后重试");
    } finally {
      setPublishing(false);
    }
  }, [data, detailPath, mode, router, slug, draftSlug, invalidatePostList]);

  const isEditMode = mode === "edit";

  return (
    <KineticPageShell
      currentPath="/blog"
      layoutMode="focus"
      centerTitle={isEditMode ? "NOVEL EDITOR" : "NEW ARTICLE"}
      centerDescription={isEditMode
        ? "OFFICIAL ADVANCED DEMO BASELINE (LOCAL STORAGE MODE)."
        : "CREATE A NEW PROTOCOL ENTRY."}
    >
      <div className="mx-auto w-full max-w-6xl space-y-4 pb-10">
        {!canEdit ? (
          <section className="space-y-4 border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-5 gmp-cut-corner-br">
            <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-red-400">
              <ShieldAlert className="h-4 w-4" />
              PERMISSION DENIED
            </p>
            <p className="font-mono text-xs leading-relaxed text-(--gmp-text-secondary)">
              当前账号没有文章编辑权限，请使用管理员账号后重试。
            </p>
            <Link
              href={detailPath}
              className="inline-flex h-10 items-center border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-4 font-mono text-[10px] font-bold tracking-widest uppercase text-white hover:border-white"
            >
              BACK TO BLOG
            </Link>
          </section>
        ) : initialSnapshot ? (
          <section key={initialSnapshot.key} className="border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-4 md:p-6 gmp-cut-corner-br">
            {isEditMode && error ? (
              <div className="mb-4 border border-amber-400/40 bg-amber-300/10 px-4 py-3 font-mono text-xs font-bold tracking-widest uppercase text-amber-200">
                REMOTE DETAIL UNAVAILABLE // USING LOCAL SNAPSHOT
              </div>
            ) : null}
            {contentParseError ? (
              <div className="mb-4 border border-amber-400/40 bg-amber-300/10 px-4 py-3 font-mono text-xs font-bold tracking-widest uppercase text-amber-200">
                {contentParseError}
              </div>
            ) : null}
            {publishError ? (
              <div className="mb-4 border border-red-400/40 bg-red-300/10 px-4 py-3 font-mono text-xs font-bold tracking-widest uppercase text-red-200">
                PUBLISH FAILED // {publishError}
              </div>
            ) : null}
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="font-mono text-[10px] font-bold tracking-widest uppercase text-(--gmp-accent)">
                  {isEditMode ? `EDIT TARGET // ${slug ?? ""}` : "CREATE NEW PROTOCOL"}
                </p>
                {!isEditMode ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="gmp-editor-slug-input" className="font-mono text-[10px] font-bold tracking-widest uppercase text-(--gmp-text-secondary)">
                      SLUG (URL 标识)
                    </label>
                    <input
                      id="gmp-editor-slug-input"
                      type="text"
                      value={draftSlug}
                      onChange={(e) => setDraftSlug(e.target.value)}
                      placeholder="article-url-slug"
                      className="h-10 w-full max-w-xl border border-(--gmp-novel-line) bg-(--gmp-novel-toolbar) px-3 font-mono text-sm text-(--gmp-novel-text) outline-none transition-colors focus:border-(--gmp-novel-accent)"
                    />
                  </div>
                ) : null}
                <label className="sr-only" htmlFor="gmp-editor-title-input">
                  编辑标题
                </label>
                <input
                  key={`${initialSnapshot.key}:title`}
                  id="gmp-editor-title-input"
                  type="text"
                  defaultValue={initialSnapshot.title}
                  onChange={(event) => {
                    handleTitleChange(event.target.value);
                  }}
                  placeholder="Input article title..."
                  className="h-12 w-full max-w-xl border border-(--gmp-novel-line) bg-(--gmp-novel-toolbar) px-4 font-heading text-xl font-black tracking-tight text-(--gmp-novel-text) outline-none transition-colors focus:border-(--gmp-novel-accent) md:text-2xl"
                />
              </div>
              {isEditMode && localPreviewPath ? (
                <Link
                  href={localPreviewPath}
                  className="inline-flex h-9 items-center border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 font-mono text-[10px] font-bold tracking-widest uppercase text-(--gmp-text-secondary) hover:text-white"
                >
                  LOCAL PREVIEW
                </Link>
              ) : null}
            </div>

            <PostRichEditor
              key={initialSnapshot.key}
              slug={localStorageScope}
              initialContent={initialSnapshot.content}
              onCancel={handleCancelEdit}
              onPublish={handlePublish}
              publishing={publishing}
            />
          </section>
        ) : isEditMode && error ? (
          <section className="space-y-4 border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-5 gmp-cut-corner-br">
            <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-red-400">
              <ShieldAlert className="h-4 w-4" />
              LOAD FAILED
            </p>
            <p className="font-mono text-xs leading-relaxed text-(--gmp-text-secondary)">
              {error}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void reload()}
                className="inline-flex h-10 items-center border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-4 font-mono text-[10px] font-bold tracking-widest uppercase text-white hover:border-white"
              >
                RETRY
              </button>
              <Link
                href={detailPath}
                className="inline-flex h-10 items-center border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-4 font-mono text-[10px] font-bold tracking-widest uppercase text-white hover:border-white"
              >
                BACK TO BLOG
              </Link>
            </div>
          </section>
        ) : isEditMode && loading ? (
          <section className="space-y-4 border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-5 gmp-cut-corner-br animate-pulse">
            <div className="h-4 w-40 bg-(--gmp-line-soft)" />
            <div className="h-12 w-full max-w-xl bg-(--gmp-novel-line)" />
            <div className="h-80 w-full bg-(--gmp-novel-surface)" />
          </section>
        ) : isEditMode ? (
          <section className="space-y-3 border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-5 gmp-cut-corner-br">
            <p className="font-mono text-xs tracking-widest uppercase text-(--gmp-text-secondary)">
              未找到可编辑内容。
            </p>
          </section>
        ) : null}
      </div>
    </KineticPageShell>
  );
}
