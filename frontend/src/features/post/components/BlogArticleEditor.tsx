"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import { KineticPageShell } from "@/features/surface/components/KineticPageShell";
import { useIsAdminCapability } from "@/features/post/hooks";
import { PostRichEditor } from "@/features/post/components/PostRichEditor";
import { loadNovelDraftTitle, saveNovelDraftTitle } from "@/features/post/editor/novel-demo";

interface BlogArticleEditorProps {
  slug: string;
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
 * 功能：渲染文章编辑页壳层，仅负责权限门禁与编辑器装配，不再承载旧版数据编排逻辑。
 * 关键参数：slug 为文章唯一标识，用于 localStorage 命名空间隔离。
 * 返回值/副作用：返回编辑页节点；副作用为根据用户操作触发路由跳转。
 */
export function BlogArticleEditor({ slug }: BlogArticleEditorProps) {
  const router = useRouter();
  const canEdit = useIsAdminCapability();
  const detailPath = `/blog/${slug}`;
  const initialTitle = useMemo(() => {
    const localTitle = loadNovelDraftTitle(slug);
    return localTitle ?? buildFallbackTitleFromSlug(slug);
  }, [slug]);

  /**
   * 功能：处理退出编辑动作并返回阅读页。
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
    saveNovelDraftTitle(slug, nextTitle);
  }

  return (
    <KineticPageShell
      currentPath="/blog"
      layoutMode="focus"
      centerTitle="NOVEL EDITOR"
      centerDescription="OFFICIAL ADVANCED DEMO BASELINE (LOCAL STORAGE MODE)."
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
              BACK TO ARTICLE
            </Link>
          </section>
        ) : (
          <section className="border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-4 md:p-6 gmp-cut-corner-br">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-mono text-[10px] font-bold tracking-widest uppercase text-(--gmp-accent)">EDIT TARGET // {slug}</p>
                <label className="sr-only" htmlFor="gmp-editor-title-input">
                  编辑标题
                </label>
                <input
                  key={slug}
                  id="gmp-editor-title-input"
                  type="text"
                  defaultValue={initialTitle}
                  onChange={(event) => {
                    handleTitleChange(event.target.value);
                  }}
                  placeholder="Input article title..."
                  className="h-12 w-full max-w-xl border border-(--gmp-novel-line) bg-(--gmp-novel-toolbar) px-4 font-heading text-xl font-black tracking-tight text-(--gmp-novel-text) outline-none transition-colors focus:border-(--gmp-novel-accent) md:text-2xl"
                />
              </div>
              <Link
                href={detailPath}
                className="inline-flex h-9 items-center border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 font-mono text-[10px] font-bold tracking-widest uppercase text-(--gmp-text-secondary) hover:text-white"
              >
                READER MODE
              </Link>
            </div>

            <PostRichEditor key={slug} slug={slug} onCancel={handleCancelEdit} />
          </section>
        )}
      </div>
    </KineticPageShell>
  );
}
