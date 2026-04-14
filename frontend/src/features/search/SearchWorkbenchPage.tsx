"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import { KineticPageShell } from "@/features/surface/components/KineticPageShell";

interface SearchResultItem {
  id: string;
  title: string;
  summary: string;
  type: string;
  updatedAt: string;
}

const filterOptions = ["全部", "文章", "专题", "知识库"] as const;

const resultMocks: readonly SearchResultItem[] = [
  {
    id: "R-01",
    title: "内容系统建模记录",
    summary: "描述内容域建模、检索索引与发布流程的占位结果条目。",
    type: "文章",
    updatedAt: "2026-04-10",
  },
  {
    id: "R-02",
    title: "检索链路优化草案",
    summary: "用于承载搜索体验迭代方案，后续可替换为真实检索返回数据。",
    type: "专题",
    updatedAt: "2026-04-08",
  },
  {
    id: "R-03",
    title: "内容标签规范",
    summary: "描述标签治理策略与命名规则，作为知识库结果占位。",
    type: "知识库",
    updatedAt: "2026-04-06",
  },
];

export function SearchWorkbenchPage() {
  const [keyword, setKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof filterOptions)[number]>("全部");

  return (
    <KineticPageShell
      currentPath="/search"
      centerTitle="INDEX PROTOCOL"
      centerDescription="QUERY THE CENTRALIZED ARCHIVE FOR HISTORICAL DATA."
    >
      <section className="space-y-6 max-w-5xl mx-auto px-2">
        {/* Search Control Panel */}
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
              className="group relative flex h-14 items-center justify-center gap-2 border border-(--gmp-line-soft) bg-(--gmp-bg-panel) hover:bg-(--gmp-bg-base) hover:border-white px-8 font-heading text-xs font-bold tracking-widest text-white transition-all uppercase gmp-cut-corner-br"
            >
              <SlidersHorizontal className="h-4 w-4 text-(--gmp-accent) group-hover:animate-pulse" />
              <span>ADVANCED</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-6 border-t border-(--gmp-line-soft) pt-6">
            <span className="flex items-center font-heading text-xs font-black tracking-widest text-(--gmp-text-secondary) uppercase mr-2 border-l-2 border-(--gmp-accent) pl-2 h-6">
              TARGET_
            </span>
            {filterOptions.map((item) => {
              const active = item === activeFilter;
              return (
                <button
                  key={item}
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

        {/* Results Matrix */}
        <div className="grid gap-4 pt-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-1 h-px bg-(--gmp-line-soft)" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-(--gmp-text-secondary) uppercase">
              FOUND {resultMocks.length} RECORDS
            </span>
          </div>

          {resultMocks.map((item) => (
            <article 
              key={item.id} 
              className="gmp-hover-fill group relative border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-5 md:pr-16 pb-12 md:pb-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 gmp-cut-corner-l"
            >
              <div className="flex gap-4 md:gap-6 items-start">
                <div className="font-mono text-[14px] font-black tracking-widest text-(--gmp-line-strong) mt-1 drop-shadow-md group-hover:text-black transition-colors">
                  {item.id}
                </div>
                <div>
                  <h2 className="text-lg font-heading font-black text-white group-hover:text-black mb-2 transition-colors">{item.title}</h2>
                  <p className="text-xs font-medium leading-relaxed text-(--gmp-text-secondary) group-hover:text-[#333] transition-colors max-w-2xl">{item.summary}</p>
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 min-w-35">
                <span className="border border-(--gmp-line-strong) bg-(--gmp-bg-base) px-3 py-1 font-mono text-[9px] font-bold tracking-widest text-white group-hover:border-black group-hover:bg-black group-hover:text-(--gmp-accent) uppercase transition-colors">
                  {item.type}
                </span>
                <p className="font-mono text-[10px] tracking-widest text-(--gmp-text-secondary) group-hover:text-black transition-colors">
                  {item.updatedAt}
                </p>
                <button className="hidden md:flex absolute right-4 bottom-4 w-8 h-8 items-center justify-center border border-(--gmp-line-soft) group-hover:border-black group-hover:bg-black transition-colors z-20">
                  <ChevronRight className="w-4 h-4 text-white group-hover:text-(--gmp-accent)" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </KineticPageShell>
  );
}
