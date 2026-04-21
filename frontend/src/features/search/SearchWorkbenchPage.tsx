"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import { KineticPageShell } from "@/features/surface/components/KineticPageShell";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchResults } from "@/features/search/hooks";
import type { SearchHit } from "@/features/search/types";

const filterOptions = ["全部", "标题", "摘要"] as const;

/**
 * 功能：移除搜索高亮标签，避免未受控 HTML 注入并保持纯文本展示。
 * 关键参数：value 为后端返回的标题或摘要文本。
 * 返回值/副作用：返回剥离高亮标签后的字符串，无副作用。
 */
function stripHighlight(value: string): string {
  return value.replaceAll("<em>", "").replaceAll("</em>", "");
}

/**
 * 功能：按当前筛选项对搜索结果做前端二次过滤。
 * 关键参数：hits 为搜索命中集合；filter 为筛选项；keyword 为关键词。
 * 返回值/副作用：返回过滤后的结果集合，无副作用。
 */
function filterHits(hits: SearchHit[], filter: (typeof filterOptions)[number], keyword: string): SearchHit[] {
  if (filter === "全部") {
    return hits;
  }

  const normalizedKeyword = keyword.toLowerCase();
  if (!normalizedKeyword) {
    return hits;
  }

  if (filter === "标题") {
    return hits.filter((hit) => stripHighlight(hit.title).toLowerCase().includes(normalizedKeyword));
  }

  return hits.filter((hit) => stripHighlight(hit.summary).toLowerCase().includes(normalizedKeyword));
}

/**
 * 功能：渲染搜索工作台并接入真实搜索接口。
 * 关键参数：无外部参数。
 * 返回值/副作用：返回搜索页节点；副作用为触发搜索请求。
 */
export function SearchWorkbenchPage() {
  const [keyword, setKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof filterOptions)[number]>("全部");

  const debouncedKeyword = useDebounce(keyword, 350);
  const { data, loading, error, isEmptyKeyword, normalizedKeyword, reload } = useSearchResults(debouncedKeyword);

  const filteredHits = useMemo(
    () => filterHits(data?.hits ?? [], activeFilter, normalizedKeyword),
    [activeFilter, data?.hits, normalizedKeyword],
  );

  return (
    <KineticPageShell
      currentPath="/search"
      centerTitle="INDEX PROTOCOL"
      centerDescription="QUERY THE CENTRALIZED ARCHIVE FOR HISTORICAL DATA."
    >
      <section className="space-y-6 max-w-5xl mx-auto px-2">
        <div className="border-2 border-(--gmp-line-strong) bg-(--gmp-bg-elevated) p-6 gmp-cut-corner-br relative shadow-xl">
          <div className="absolute top-0 right-0 p-1 px-3 bg-(--gmp-accent) text-black font-mono text-[9px] font-bold tracking-widest uppercase gmp-cut-corner-bl">
            SEARCH // ENGINE ACTIVE
          </div>

          <div className="mb-6 mt-4 flex flex-col gap-4 md:flex-row md:items-end">
            <div className="relative w-full flex-1">
              <label className="mb-2 block font-mono text-[10px] font-bold text-(--gmp-accent) tracking-widest uppercase">
                QUERY KEYWORD_
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-(--gmp-bg-panel) border-r border-(--gmp-line-soft) pointer-events-none">
                  <Search className="h-4 w-4 text-(--gmp-text-secondary)" />
                </div>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="AWAITING INPUT..."
                  className="h-14 w-full bg-(--gmp-bg-base) border border-(--gmp-line-soft) pl-16 pr-4 font-mono text-sm text-white placeholder:text-(--gmp-line-strong) focus:border-(--gmp-accent) focus:ring-1 focus:ring-(--gmp-accent) focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => void reload()}
              className="group relative flex h-14 items-center justify-center gap-2 border border-(--gmp-line-soft) bg-(--gmp-bg-panel) hover:bg-(--gmp-bg-base) hover:border-white px-8 font-heading text-xs font-bold tracking-widest text-white transition-all uppercase gmp-cut-corner-br"
            >
              <SlidersHorizontal className="h-4 w-4 text-(--gmp-accent) group-hover:animate-pulse" />
              <span>REQUERY</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-4 mt-6 border-t border-(--gmp-line-soft) pt-6">
            <span className="flex items-center font-heading text-xs font-black tracking-widest text-(--gmp-text-secondary) uppercase mr-2 border-l-2 border-(--gmp-accent) pl-2 h-6">
              TARGET_
            </span>
            {filterOptions.map((item) => {
              const active = item === activeFilter;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveFilter(item)}
                  className={`relative flex h-8 items-center justify-center border px-4 font-mono text-[11px] font-bold tracking-widest uppercase transition-all gmp-cut-corner-br ${
                    active
                      ? "border-(--gmp-accent) bg-(--gmp-accent) text-black shadow-[0_0_10px_rgba(255,204,0,0.3)]"
                      : "border-(--gmp-line-soft) bg-(--gmp-bg-base) text-(--gmp-text-secondary) hover:border-white hover:text-white"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 pt-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-1 h-px bg-(--gmp-line-soft)" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-(--gmp-text-secondary) uppercase">
              {isEmptyKeyword
                ? "WAITING FOR KEYWORD"
                : `FOUND ${filteredHits.length} RECORDS${data?.degraded ? " // DEGRADED" : ""}`}
            </span>
          </div>

          {isEmptyKeyword ? (
            <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-8 gmp-cut-corner-l text-center">
              <p className="font-heading text-lg font-black uppercase tracking-widest text-white">请输入关键词开始搜索</p>
            </div>
          ) : null}

          {!isEmptyKeyword && error ? (
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

          {!isEmptyKeyword && !error && loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`search-skeleton-${index}`} className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-5 gmp-cut-corner-l animate-pulse">
                  <div className="h-4 w-30 bg-(--gmp-line-soft)" />
                  <div className="mt-3 h-6 w-3/5 bg-(--gmp-line-soft)" />
                  <div className="mt-3 h-4 w-full bg-(--gmp-line-soft)" />
                </div>
              ))}
            </div>
          ) : null}

          {!isEmptyKeyword && !error && !loading && filteredHits.length === 0 ? (
            <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-8 gmp-cut-corner-l text-center space-y-2">
              <p className="font-heading text-lg font-black uppercase tracking-widest text-white">NO MATCHED RECORD</p>
              <p className="font-mono text-xs tracking-widest uppercase text-(--gmp-text-secondary)">
                关键词“{normalizedKeyword}”暂无结果，请更换后重试。
              </p>
            </div>
          ) : null}

          {!isEmptyKeyword && !error && !loading
            ? filteredHits.map((item) => (
                <article
                  key={item.id}
                  className="gmp-hover-fill group relative border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-5 md:pr-16 pb-12 md:pb-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 gmp-cut-corner-l"
                >
                  <div className="flex gap-4 md:gap-6 items-start">
                    <div className="font-mono text-[14px] font-black tracking-widest text-(--gmp-line-strong) mt-1 drop-shadow-md group-hover:text-black transition-colors">
                      ID-{item.id}
                    </div>
                    <div>
                      <h2 className="text-lg font-heading font-black text-white group-hover:text-black mb-2 transition-colors">
                        {stripHighlight(item.title)}
                      </h2>
                      <p className="text-xs font-medium leading-relaxed text-(--gmp-text-secondary) group-hover:text-[#333] transition-colors max-w-2xl">
                        {stripHighlight(item.summary) || "该结果暂无摘要"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 min-w-35">
                    <span className="border border-(--gmp-line-strong) bg-(--gmp-bg-base) px-3 py-1 font-mono text-[9px] font-bold tracking-widest text-white group-hover:border-black group-hover:bg-black group-hover:text-(--gmp-accent) uppercase transition-colors">
                      ARTICLE
                    </span>
                    <Link
                      href={`/blog/${item.slug}`}
                      className="font-mono text-[10px] tracking-widest text-(--gmp-text-secondary) hover:text-white uppercase"
                    >
                      /blog/{item.slug}
                    </Link>
                    <Link
                      href={`/blog/${item.slug}`}
                      className="hidden md:flex absolute right-4 bottom-4 w-8 h-8 items-center justify-center border border-(--gmp-line-soft) group-hover:border-black group-hover:bg-black transition-colors z-20"
                    >
                      <ChevronRight className="w-4 h-4 text-white group-hover:text-(--gmp-accent)" />
                    </Link>
                  </div>
                </article>
              ))
            : null}
        </div>
      </section>
    </KineticPageShell>
  );
}
