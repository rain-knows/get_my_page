"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, HardDrive, ShieldAlert } from "lucide-react";
import { KineticPageShell } from "@/features/surface/components/KineticPageShell";
import { useIsAdminCapability, usePostDetail } from "@/features/post/hooks";
import { PostRichEditor } from "@/features/post/components/PostRichEditor";
import type { PostDetail } from "@/features/post/types";

interface BlogArticleEditorProps {
  slug: string;
}

/**
 * 功能：将后端时间字符串格式化为编辑页可读文本。
 * 关键参数：value 为时间字符串。
 * 返回值/副作用：返回格式化后的时间文本，无副作用。
 */
function formatDetailTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "UNKNOWN";
  }
  return date.toISOString().replace("T", " ").slice(0, 16);
}

/**
 * 功能：渲染文章独立编辑页并承载自动保存编辑流。
 * 关键参数：slug 为文章唯一标识。
 * 返回值/副作用：返回编辑页节点；副作用为触发详情请求与路由跳转。
 */
export function BlogArticleEditor({ slug }: BlogArticleEditorProps) {
  const router = useRouter();
  const canEdit = useIsAdminCapability();
  const { data, loading, error, reload } = usePostDetail(slug, true);
  const detailPath = `/blog/${slug}`;

  /**
   * 功能：处理自动保存成功后的本地同步回调，保持编辑模式不跳页。
   * 关键参数：updatedPost 为保存后的文章详情。
   * 返回值/副作用：无返回值；无副作用。
   */
  function handleEditorSaved(updatedPost: PostDetail): void {
    void updatedPost;
  }

  /**
   * 功能：处理取消编辑操作并返回文章阅读页。
   * 关键参数：无。
   * 返回值/副作用：无返回值；副作用为触发客户端路由跳转。
   */
  function handleCancelEdit(): void {
    router.push(detailPath);
  }

  return (
    <KineticPageShell
      currentPath="/blog"
      layoutMode="focus"
      centerTitle="EDITOR MODE"
      centerDescription="NOTION-LIKE BLOCK WORKSPACE WITH EMBED CARDS."
    >
      <div className="mx-auto w-full max-w-6xl space-y-4 pb-10">
        <section className="border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-4 md:p-6 gmp-cut-corner-br">
          {!canEdit ? (
            <div className="space-y-4 border border-(--gmp-line-strong) bg-(--gmp-bg-base) p-5 gmp-cut-corner-br">
              <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-red-400">
                <ShieldAlert className="h-4 w-4" />
                PERMISSION DENIED
              </p>
              <p className="font-mono text-xs leading-relaxed text-(--gmp-text-secondary)">
                当前账号没有文章编辑权限，请使用管理员账号后重试。
              </p>
              <Link
                href={detailPath}
                className="inline-flex h-10 items-center border border-(--gmp-line-soft) bg-(--gmp-bg-panel) px-4 font-mono text-[10px] font-bold tracking-widest uppercase text-white hover:border-white"
              >
                BACK TO ARTICLE
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <p className="font-mono text-[10px] font-bold tracking-widest text-(--gmp-accent) uppercase">EDIT TARGET // {slug}</p>
                  <h1 className="font-heading text-2xl font-black uppercase text-white leading-tight tracking-tight md:text-3xl">
                    {loading ? "LOADING ARTICLE..." : data?.title ?? "ARTICLE NOT FOUND"}
                  </h1>
                </div>

                <Link
                  href={detailPath}
                  className="inline-flex h-10 items-center border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-4 font-mono text-[10px] font-bold tracking-widest uppercase text-(--gmp-text-secondary) hover:text-white"
                >
                  READER MODE
                </Link>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 py-2">
                  <dt className="font-mono text-[9px] font-bold uppercase tracking-widest text-(--gmp-text-secondary)">POST ID</dt>
                  <dd className="font-mono text-[10px] font-black uppercase tracking-widest text-white">#{data?.id ?? "--"}</dd>
                </div>
                <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 py-2">
                  <dt className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest text-(--gmp-text-secondary)">
                    <Clock className="h-3 w-3" />
                    UPDATED
                  </dt>
                  <dd className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/80">
                    {data ? formatDetailTime(data.updatedAt) : "--"}
                  </dd>
                </div>
                <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 py-2">
                  <dt className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest text-(--gmp-text-secondary)">
                    <HardDrive className="h-3 w-3" />
                    FORMAT
                  </dt>
                  <dd className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/80">{data?.contentFormat ?? "--"}</dd>
                </div>
                <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-base) px-3 py-2">
                  <dt className="font-mono text-[9px] font-bold uppercase tracking-widest text-(--gmp-text-secondary)">STATUS</dt>
                  <dd className="font-mono text-[10px] font-black uppercase tracking-widest text-(--gmp-accent)">
                    {data?.status === 1 ? "PUBLISHED" : "DRAFT"}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </section>

        {canEdit && error ? (
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

        {canEdit && loading ? (
          <div className="space-y-4 animate-pulse border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-6 gmp-cut-corner-br">
            <div className="h-4 w-full bg-(--gmp-line-soft)" />
            <div className="h-4 w-11/12 bg-(--gmp-line-soft)" />
            <div className="h-4 w-4/5 bg-(--gmp-line-soft)" />
          </div>
        ) : null}

        {canEdit && !loading && data ? (
          <PostRichEditor
            post={data}
            onSaved={(updatedPost) => {
              handleEditorSaved(updatedPost);
            }}
            onCancel={handleCancelEdit}
          />
        ) : null}
      </div>
    </KineticPageShell>
  );
}
