"use client";

import Link from "next/link";
import { Clock, HardDrive, ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { KineticPageShell } from "@/features/surface/components/KineticPageShell";
import { useIsAdminCapability, usePostDetail } from "@/features/post/hooks";
import { PostContentRenderer } from "@/features/post/components/PostContentRenderer";
import { loadNovelDraftContentString, loadNovelDraftTitle } from "@/features/post/editor/novel-demo";
import { formatPostCalendarDateTime } from "@/features/post/time";
import type { PostContentFormat } from "@/features/post/types";

interface BlogArticleReaderProps {
  slug: string;
}

interface LocalDraftSnapshot {
  title: string | null;
  content: string | null;
}

/**
 * 功能：渲染博客详情阅读页并接入真实文章详情接口。
 * 关键参数：slug 为文章唯一标识。
 * 返回值/副作用：返回文章详情节点；副作用为触发文章详情请求。
 */
export function BlogArticleReader({ slug }: BlogArticleReaderProps) {
  const searchParams = useSearchParams();
  const { data, loading, error, reload } = usePostDetail(slug);
  const canEdit = useIsAdminCapability();
  const shouldUseLocalPreview = canEdit && searchParams.get("preview") === "local";
  const localDraft = useMemo<LocalDraftSnapshot>(() => {
    if (!shouldUseLocalPreview) {
      return {
        title: null,
        content: null,
      };
    }

    return {
      title: loadNovelDraftTitle(slug),
      content: loadNovelDraftContentString(slug),
    };
  }, [shouldUseLocalPreview, slug]);
  const hasLocalDraftPreview = Boolean(localDraft.title || localDraft.content);

  const resolvedTitle = useMemo(() => {
    if (hasLocalDraftPreview && localDraft.title) {
      return localDraft.title;
    }
    if (loading) {
      return "LOADING ARTICLE...";
    }
    return data?.title ?? "ARTICLE NOT FOUND";
  }, [data?.title, hasLocalDraftPreview, loading, localDraft.title]);

  const resolvedContent = (hasLocalDraftPreview ? localDraft.content : null) ?? data?.content ?? "";
  const resolvedFormat: PostContentFormat = "tiptap-json";

  return (
    <KineticPageShell
      currentPath="/blog"
      layoutMode="focus"
      centerTitle="READING MODE"
      centerDescription="CONTENT-FIRST VIEW. MINIMAL NON-ARTICLE FOOTPRINT."
    >
      <div className="mx-auto w-full max-w-6xl space-y-4 pb-10">
        {error ? (
          <div className="border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-4 gmp-cut-corner-br flex items-center justify-between gap-4">
            <p className="font-mono text-xs tracking-widest text-red-400 uppercase">ERROR // {error}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="h-10 border border-(--gmp-line-strong) bg-(--gmp-bg-base) px-4 font-heading text-xs font-bold tracking-widest uppercase text-white hover:border-white"
            >
              RETRY
            </button>
          </div>
        ) : null}

        <article className="overflow-hidden border border-(--gmp-line-strong) bg-(--gmp-bg-panel) gmp-cut-corner-br">
          <header className="border-b border-(--gmp-line-soft) bg-(--gmp-bg-base) p-4 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <p className="font-mono text-[10px] font-bold text-(--gmp-accent) uppercase tracking-widest">ARTICLE // {slug}</p>
                <h1 className="font-heading text-2xl font-black text-white uppercase leading-tight tracking-tight md:text-3xl">
                  {resolvedTitle}
                </h1>
                {hasLocalDraftPreview ? (
                  <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-300">LOCAL DRAFT PREVIEW ACTIVE</p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/blog"
                  className="inline-flex h-10 items-center border border-(--gmp-line-soft) bg-(--gmp-bg-panel) px-4 font-mono text-[10px] font-bold tracking-widest uppercase text-(--gmp-text-secondary) hover:text-white"
                >
                  BACK LIST
                </Link>
                {canEdit && data ? (
                  <Link
                    href={`/blog/${slug}/edit`}
                    className="inline-flex h-10 items-center border border-(--gmp-accent) bg-(--gmp-accent) px-4 font-mono text-[10px] font-black tracking-widest uppercase text-black hover:opacity-90"
                  >
                    EDIT ARTICLE
                  </Link>
                ) : null}
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) px-3 py-2">
                <dt className="font-mono text-[9px] font-bold uppercase tracking-widest text-(--gmp-text-secondary)">STATUS</dt>
                <dd className="font-mono text-[10px] font-black uppercase tracking-widest text-(--gmp-accent)">
                  {data?.status === 1 ? "PUBLISHED" : "DRAFT"}
                </dd>
              </div>
              <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) px-3 py-2">
                <dt className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest text-(--gmp-text-secondary)">
                  <Clock className="h-3 w-3" />
                  UPDATED
                </dt>
                <dd className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/80">
                  {hasLocalDraftPreview ? "LOCAL PREVIEW" : data ? formatPostCalendarDateTime(data.updatedAt) : "--"}
                </dd>
                {hasLocalDraftPreview && data ? (
                  <dd className="mt-1 font-mono text-[9px] font-bold uppercase tracking-widest text-(--gmp-text-secondary)">
                    PUBLISHED {formatPostCalendarDateTime(data.updatedAt)}
                  </dd>
                ) : null}
              </div>
              <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) px-3 py-2">
                <dt className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest text-(--gmp-text-secondary)">
                  <HardDrive className="h-3 w-3" />
                  FORMAT
                </dt>
                <dd className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/80">{data?.contentFormat ?? "--"}</dd>
                {hasLocalDraftPreview ? (
                  <dd className="mt-1 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-300">LOCAL</dd>
                ) : null}
              </div>
              <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) px-3 py-2">
                <dt className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest text-(--gmp-text-secondary)">
                  <ShieldAlert className="h-3 w-3" />
                  ACCESS
                </dt>
                <dd className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/80">
                  {canEdit ? "ADMIN" : "PUBLIC"}
                </dd>
              </div>
            </dl>
          </header>

          <div className="bg-(--gmp-bg-base) p-4 md:p-8 lg:p-10">
            {loading && !hasLocalDraftPreview ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 w-full bg-(--gmp-line-soft)" />
                <div className="h-4 w-11/12 bg-(--gmp-line-soft)" />
                <div className="h-4 w-4/5 bg-(--gmp-line-soft)" />
              </div>
            ) : resolvedContent ? (
              <PostContentRenderer content={resolvedContent} contentFormat={resolvedFormat} />
            ) : (
              <p className="text-sm leading-relaxed text-(--gmp-text-secondary)">目标文章不存在或暂不可访问。</p>
            )}
          </div>
        </article>
      </div>
    </KineticPageShell>
  );
}
