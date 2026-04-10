"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { KineticPageShell } from "@/features/surface/components/KineticPageShell";
import { Button } from "@/components/ui";
import { getNextInteractionModule, type InteractionModuleKey } from "@/types/interaction-module";

interface SearchModeNarrative {
  title: string;
  description: string;
}

interface SearchResultItem {
  id: string;
  title: string;
  summary: string;
  type: string;
  updatedAt: string;
}

/**
 * 功能：定义搜索页在不同背景模式下的展示文案。
 * 关键参数：键为背景模式标识，值为搜索工作台标题与说明。
 * 返回值/副作用：返回静态文案映射对象，无副作用。
 */
const searchNarratives: Record<InteractionModuleKey, SearchModeNarrative> = {
  scan: {
    title: "搜索工作台",
    description: "提供输入、筛选和结果占位结构，后续可直接接入真实检索接口。",
  },
  forge: {
    title: "搜索构建台",
    description: "保留同一工作台布局，通过模式切换强化不同视觉语义。",
  },
  shield: {
    title: "搜索防护台",
    description: "在稳态背景中保留检索上下文，突出结果边界与可读性。",
  },
};

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

/**
 * 功能：根据当前模式解析搜索页标题与说明文本。
 * 关键参数：mode 表示当前背景模式。
 * 返回值/副作用：返回模式对应文案对象，无副作用。
 */
function resolveSearchNarrative(mode: InteractionModuleKey): SearchModeNarrative {
  return searchNarratives[mode];
}

/**
 * 功能：渲染搜索页工作台，复用统一壳层并提供搜索输入、筛选区与结果列表占位。
 * 关键参数：无外部参数，内部维护背景模式、关键词与筛选状态。
 * 返回值/副作用：返回搜索页展示节点，无副作用。
 */
export function SearchWorkbenchPage() {
  const [mode, setMode] = useState<InteractionModuleKey>("scan");
  const [keyword, setKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof filterOptions)[number]>("全部");
  const narrative = useMemo(() => resolveSearchNarrative(mode), [mode]);

  /**
   * 功能：响应背景模式按钮点击并循环切换背景模式。
   * 关键参数：无外部参数。
   * 返回值/副作用：无返回值；会更新当前模式状态。
   */
  const handleModeCycle = () => {
    setMode((previous) => getNextInteractionModule(previous));
  };

  /**
   * 功能：处理搜索关键词输入，更新当前工作台中的关键词状态。
   * 关键参数：value 为输入框最新文本值。
   * 返回值/副作用：无返回值；会更新关键词状态。
   */
  const handleKeywordChange = (value: string) => {
    setKeyword(value);
  };

  return (
    <KineticPageShell
      currentPath="/search"
      mode={mode}
      onModeCycle={handleModeCycle}
      centerTitle={narrative.title}
      centerDescription={narrative.description}
    >
      <section className="space-y-4">
        <div className="rounded-sm border border-white/16 bg-black/44 p-4 backdrop-blur-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-xl">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/62" />
              <input
                value={keyword}
                onChange={(event) => handleKeywordChange(event.target.value)}
                placeholder="输入关键词进行检索"
                className="h-11 w-full rounded-xs border border-white/18 bg-black/42 pr-3 pl-9 text-sm text-white placeholder:text-white/36 focus:border-[var(--gmp-end-accent)] focus:outline-none"
              />
            </div>
            <Button variant="ghost" className="h-11 rounded-xs border border-white/16 bg-black/46 text-white hover:border-[var(--gmp-end-accent)] hover:bg-black/60">
              <SlidersHorizontal className="h-4 w-4 text-[var(--gmp-end-accent)]" />
              高级筛选
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {filterOptions.map((item) => {
              const active = item === activeFilter;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveFilter(item)}
                  className={
                    active
                      ? "h-8 rounded-xs border border-[var(--gmp-end-accent)] bg-black/70 px-3 text-xs text-[var(--gmp-end-accent)]"
                      : "h-8 rounded-xs border border-white/16 bg-black/46 px-3 text-xs text-white/72 hover:border-white/28"
                  }
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3">
          {resultMocks.map((item) => (
            <article key={item.id} className="rounded-sm border border-white/16 bg-black/44 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-white">{item.title}</h2>
                <span className="rounded-xs border border-white/16 bg-black/52 px-2 py-1 text-xs text-white/72">{item.type}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/68">{item.summary}</p>
              <p className="mt-3 font-mono text-[11px] tracking-[0.12em] text-white/52 uppercase">更新于 {item.updatedAt}</p>
            </article>
          ))}
        </div>
      </section>
    </KineticPageShell>
  );
}
