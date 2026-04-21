"use client";

import { KineticPageShell } from "@/features/surface/components/KineticPageShell";
import { Clock, HardDrive, UserCheck } from "lucide-react";
import { usePostDetail } from "@/features/post/hooks";
import { PostContentRenderer } from "@/features/post/components/PostContentRenderer";

interface BlogArticleReaderProps {
  slug: string;
}

/**
 * 功能：将后端时间字符串格式化为详情页可读文本。
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
 * 功能：渲染博客详情阅读页并接入真实文章详情接口。
 * 关键参数：slug 为文章唯一标识。
 * 返回值/副作用：返回文章详情节点；副作用为触发文章详情请求。
 */
export function BlogArticleReader({ slug }: BlogArticleReaderProps) {
  const { data, loading, error, reload } = usePostDetail(slug);

  return (
    <KineticPageShell
      currentPath="/blog"
      centerTitle="ARCHIVE DATA"
      centerDescription="RESTRICTED ACCESS. DECRYPTING LOCAL INTELLIGENCE MODULE."
    >
      <div className="mx-auto w-full max-w-4xl">
        <section className="mb-12 bg-(--gmp-bg-panel) p-1 gmp-cut-corner-l">
          <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-base) p-6 md:p-8">
            <div className="mb-4 inline-flex items-center gap-2 bg-(--gmp-bg-panel) px-2 py-1 font-mono text-[9px] font-bold text-(--gmp-accent) uppercase tracking-widest border border-(--gmp-line-strong)">
              <span className="h-1.5 w-1.5 bg-(--gmp-accent) animate-pulse" />
              SLUG: {slug}
            </div>

            <h1 className="font-heading text-3xl font-black uppercase text-white mb-8 leading-tight tracking-tight drop-shadow-md">
              {loading ? "LOADING ARTICLE..." : data?.title ?? "ARTICLE NOT FOUND"}
            </h1>

            <dl className="grid grid-cols-2 gap-4 border-t border-dashed border-(--gmp-line-strong) pt-6 sm:grid-cols-4">
              <div className="flex flex-col gap-2 border-l-2 border-(--gmp-accent) pl-4">
                <dt className="flex items-center gap-2 font-mono text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  <UserCheck className="w-3.5 h-3.5 text-(--gmp-accent)" />
                  AUTHOR
                </dt>
                <dd className="font-mono text-[11px] font-black text-white uppercase tracking-wider">SYSTEM</dd>
              </div>

              <div className="flex flex-col gap-2 border-l-2 border-(--gmp-line-strong) pl-4">
                <dt className="flex items-center gap-2 font-mono text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" />
                  TIMESTAMP
                </dt>
                <dd className="font-mono text-[11px] font-bold text-(--gmp-text-secondary) uppercase tracking-wider">
                  {data ? formatDetailTime(data.updatedAt) : "--"}
                </dd>
              </div>

              <div className="flex flex-col gap-2 border-l-2 border-(--gmp-line-strong) pl-4">
                <dt className="flex items-center gap-2 font-mono text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  <HardDrive className="w-3.5 h-3.5" />
                  FORMAT
                </dt>
                <dd className="font-mono text-[11px] font-bold text-(--gmp-text-secondary) uppercase tracking-wider">
                  {data?.contentFormat ?? "--"}
                </dd>
              </div>

              <div className="flex flex-col gap-2 border-l-2 border-(--gmp-line-strong) pl-4">
                <dt className="flex items-center gap-2 font-mono text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  STATUS
                </dt>
                <dd className="font-mono text-[11px] font-black uppercase tracking-wider text-(--gmp-accent)">
                  {data?.status === 1 ? "PUBLISHED" : "DRAFT"}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {error ? (
          <div className="mb-8 border border-(--gmp-line-strong) bg-(--gmp-bg-panel) p-6 gmp-cut-corner-br flex items-center justify-between gap-4">
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

        <article className="prose prose-invert max-w-none pr-4">
          <p className="font-mono text-sm text-(--gmp-accent) font-bold mb-8 uppercase tracking-widest border-b border-(--gmp-line-soft) pb-4 inline-flex items-center gap-4">
            <span className="w-2 h-2 bg-(--gmp-accent)" />
            [{data?.contentFormat ?? "UNKNOWN"}] SYSTEM DOCUMENTATION INITIALIZED.
          </p>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 w-full bg-(--gmp-line-soft)" />
              <div className="h-4 w-11/12 bg-(--gmp-line-soft)" />
              <div className="h-4 w-4/5 bg-(--gmp-line-soft)" />
            </div>
          ) : data ? (
            <PostContentRenderer content={data.content} contentFormat={data.contentFormat} />
          ) : (
            <p className="text-sm leading-relaxed text-(--gmp-text-secondary)">目标文章不存在或暂不可访问。</p>
          )}

          <div className="mt-20 pt-8 border-t border-dashed border-(--gmp-line-strong) flex justify-center">
            <span className="bg-(--gmp-bg-panel) px-6 py-2 border border-(--gmp-line-soft) font-mono text-[10px] text-(--gmp-text-secondary) tracking-widest font-black uppercase gmp-cut-corner-l">
              [ END OF RECORD // CONNECTION TERMINATED ]
            </span>
          </div>
        </article>
      </div>
    </KineticPageShell>
  );
}
