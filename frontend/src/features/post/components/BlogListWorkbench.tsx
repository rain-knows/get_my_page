"use client";

import Link from "next/link";
import { KineticPageShell } from "@/features/surface/components/KineticPageShell";
import { ChevronRight, DatabaseZap, Terminal } from "lucide-react";
import { usePostList } from "@/features/post/hooks";
import type { PostListItem } from "@/features/post/types";

/**
 * 功能：将文章内容格式与状态组合为列表项的工业标签文本。
 * 关键参数：post 为文章列表项。
 * 返回值/副作用：返回标签字符串，无副作用。
 */
function buildPostLabel(post: PostListItem): string {
  const formatLabel = post.contentFormat === "tiptap-json" ? "TIPTAP-JSON" : "UNKNOWN";
  const statusLabel = post.status === 1 ? "PUBLISHED" : "DRAFT";
  return `${formatLabel} // ${statusLabel}`;
}

/**
 * 功能：格式化文章更新时间，供列表展示使用。
 * 关键参数：value 为后端返回的更新时间字符串。
 * 返回值/副作用：返回可读日期文本，无副作用。
 */
function formatPostUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "UNKNOWN";
  }
  return date.toISOString().slice(0, 10);
}

/**
 * 功能：渲染博客列表工作台并接入真实文章列表接口。
 * 关键参数：无外部参数。
 * 返回值/副作用：返回文章列表页面节点；副作用为触发文章列表请求。
 */
export function BlogListWorkbench() {
  const { records, pagination, loading, error, reload } = usePostList({ page: 1, size: 20 });

  return (
    <KineticPageShell
      currentPath="/blog"
      centerTitle="KNOWLEDGE BASE"
      centerDescription="STORED PROTOCOLS AND REUSABLE STRATEGIC PATTERNS."
    >
      <section className="space-y-6 max-w-5xl mx-auto px-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-(--gmp-line-strong) pb-4">
          <div className="flex items-center gap-3 text-white">
            <DatabaseZap className="h-6 w-6 text-(--gmp-accent)" />
            <span className="font-heading text-lg font-black tracking-widest uppercase mt-1">
              INDEXED ARCHIVES
            </span>
          </div>
          <p className="font-mono text-[10px] font-bold tracking-widest text-(--gmp-text-secondary) uppercase">
            LOCAL STORAGE // {loading ? "SYNCING..." : `${pagination.total} FRAGMENTS`}
          </p>
        </div>

        {error ? (
          <div className="border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-6 gmp-cut-corner-br flex items-center justify-between gap-4">
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

        {!loading && !error && records.length === 0 ? (
          <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-10 gmp-cut-corner-l text-center space-y-3">
            <p className="font-heading text-lg font-black uppercase tracking-widest text-white">NO PUBLIC RECORDS</p>
            <p className="font-mono text-xs tracking-widest uppercase text-(--gmp-text-secondary)">
              当前没有可展示的文章。
            </p>
          </div>
        ) : null}

        <div className="grid gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <article
                  key={`post-skeleton-${index}`}
                  className="relative border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-6 md:p-8 min-h-35 gmp-cut-corner-br animate-pulse"
                >
                  <div className="h-4 w-40 bg-(--gmp-line-soft)" />
                  <div className="mt-4 h-7 w-3/4 bg-(--gmp-line-soft)" />
                  <div className="mt-4 h-4 w-full bg-(--gmp-line-soft)" />
                </article>
              ))
            : records.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="gmp-hover-fill group block relative border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-6 md:p-8 transition-all hover:bg-(--gmp-bg-elevated) hover:border-(--gmp-line-strong) min-h-35 gmp-cut-corner-br overflow-hidden"
              >
                <div className="absolute inset-0 gmp-halftone-card opacity-30 mix-blend-overlay pointer-events-none z-0" />
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10 w-full md:pr-12">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Terminal className="h-4 w-4 text-(--gmp-accent) group-hover:text-black transition-colors" />
                      <span className="font-mono text-[10px] font-bold tracking-widest text-(--gmp-accent) group-hover:text-black uppercase transition-colors">
                        {buildPostLabel(post)}
                      </span>
                    </div>
                    <h2 className="font-heading text-xl md:text-2xl font-black text-white group-hover:text-black uppercase mb-3 drop-shadow-sm transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm font-medium leading-relaxed text-(--gmp-text-secondary) group-hover:text-[#333] transition-colors max-w-3xl line-clamp-2">
                      {post.excerpt || post.summary || "暂无摘要"}
                    </p>
                  </div>

                  <div className="flex flex-row flex-wrap md:flex-col items-center md:items-end gap-3 mt-4 md:mt-0 font-mono text-[10px] font-bold tracking-widest uppercase text-(--gmp-text-secondary) group-hover:text-black transition-colors md:min-w-30">
                    <span>ID-{post.id}</span>
                    <span>{formatPostUpdatedAt(post.updatedAt)}</span>
                    <span className="border border-(--gmp-line-strong) group-hover:border-black px-2 mt-1">
                      {post.status === 1 ? "ONLINE" : "DRAFT"}
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex absolute right-6 bottom-6 w-10 h-10 items-center justify-center border border-(--gmp-line-strong) bg-(--gmp-bg-base) group-hover:bg-black group-hover:border-black transition-colors z-20">
                  <ChevronRight className="w-5 h-5 text-white group-hover:text-(--gmp-accent)" />
                </div>

                <div className="absolute left-0 top-0 w-2 h-2 bg-(--gmp-accent) group-hover:bg-black transition-colors" />
              </Link>
            ))}
        </div>
      </section>
    </KineticPageShell>
  );
}
