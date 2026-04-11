"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpenText, Compass, DatabaseZap, ScanSearch, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { KineticPageShell } from "@/features/surface/components/KineticPageShell";
import { getNextInteractionModule, type InteractionModuleKey } from "@/types/interaction-module";

interface HomeModeNarrative {
  title: string;
  description: string;
}

interface HomeContentCard {
  id: string;
  title: string;
  summary: string;
  status: string;
  href: string;
  icon: LucideIcon;
}

/**
 * 功能：维护首页三种背景模式下的标题与说明文本映射。
 * 关键参数：键为模式标识，值包含中间面板标题与说明文本。
 * 返回值/副作用：返回静态映射对象，无副作用。
 */
const modeNarratives: Record<InteractionModuleKey, HomeModeNarrative> = {
  scan: {
    title: "内容侦测面板",
    description: "中间区域聚合最新内容流，占位卡片用于承载后续真实数据与推荐策略。",
  },
  forge: {
    title: "内容构建面板",
    description: "保持同一信息结构，通过模式切换改变背景语义与视觉节奏，不影响内容布局。",
  },
  shield: {
    title: "内容防护面板",
    description: "在低噪声背景下强调信息边界，中间区域持续作为内容展示核心，不承载跳转杂项。",
  },
};

const homeCards: readonly HomeContentCard[] = [
  {
    id: "01",
    title: "创作周报占位",
    summary: "每周结构化更新内容摘要，后续将接入真实文章与作者信息。",
    status: "准备中",
    href: "/blog",
    icon: BookOpenText,
  },
  {
    id: "02",
    title: "专题索引占位",
    summary: "用于聚合系列内容入口，支持按主题维度拓展检索链路。",
    status: "规划中",
    href: "/search",
    icon: Compass,
  },
  {
    id: "03",
    title: "知识库条目占位",
    summary: "沉淀可复用结论与实践步骤，后续将增加标签与关联关系。",
    status: "待接入",
    href: "/blog",
    icon: DatabaseZap,
  },
  {
    id: "04",
    title: "信号观察记录",
    summary: "保留轻量占位用于展示实时动态，后续可替换为活动流组件。",
    status: "草稿",
    href: "/",
    icon: ScanSearch,
  },
  {
    id: "05",
    title: "发布校验清单",
    summary: "用于承载发布前检查点，后续可接入协作与审批流程。",
    status: "待定义",
    href: "/login",
    icon: ShieldCheck,
  },
];

/**
 * 功能：根据当前模式获取首页中间面板的叙事文案。
 * 关键参数：mode 表示当前背景模式键值。
 * 返回值/副作用：返回标题与说明文本对象，无副作用。
 */
function resolveNarrative(mode: InteractionModuleKey): HomeModeNarrative {
  return modeNarratives[mode];
}

/**
 * 功能：渲染首页内容主场景，提供页面导航、核心功能占位与中间内容流展示。
 * 关键参数：无外部参数，内部维护背景模式切换状态。
 * 返回值/副作用：返回首页展示节点，无副作用。
 */
export function HomeLandingSurface() {
  const [mode, setMode] = useState<InteractionModuleKey>("scan");
  const narrative = useMemo(() => resolveNarrative(mode), [mode]);

  /**
   * 功能：响应右上角模式按钮点击并循环切换背景模式。
   * 关键参数：无外部参数。
   * 返回值/副作用：无返回值；会更新当前背景模式状态。
   */
  const handleModeCycle = () => {
    setMode((previous) => getNextInteractionModule(previous));
  };

  return (
    <KineticPageShell
      currentPath="/"
      mode={mode}
      onModeCycle={handleModeCycle}
      centerTitle={narrative.title}
      centerDescription={narrative.description}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:gap-5">
        {homeCards.map((card, index) => {
          const CardIcon = card.icon;
          return (
            <article
              key={card.id}
              className="gmp-corner-border gmp-corner-border--tl gmp-corner-border--br gmp-panel-premium gmp-inner-glow group relative overflow-hidden bg-black/44 p-6 transition-all hover:border-[var(--gmp-end-accent)]/40"
            >
              <div className="pointer-events-none absolute top-3 right-4 font-mono text-[9px] tracking-[0.3em] text-white/10 uppercase opacity-0 transition-opacity group-hover:opacity-100">
                P_Node: 0x{index + 1} SYNC
              </div>
              
              <div className="relative z-10">
                <p className="mb-4 font-mono text-[11px] font-bold tracking-[0.3em] text-[var(--gmp-end-accent)] uppercase">
                  {card.id}
                  <span className="ml-3 inline-block h-1 w-1 bg-[var(--gmp-end-accent)] animate-pulse" />
                </p>
                
                <h2 className="flex items-center gap-3 text-xl font-heading font-semibold text-white transition-colors group-hover:text-[var(--gmp-end-accent)]">
                  <CardIcon className="h-5 w-5 text-[var(--gmp-end-accent)]" />
                  {card.title}
                </h2>
                
                <p className="mt-4 text-sm leading-relaxed text-white/50 group-hover:text-white/80 transition-colors">
                  {card.summary}
                </p>
                
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--gmp-end-accent)]/40" />
                    <span className="rounded-xs border border-white/8 bg-black/40 px-3 py-1 font-mono text-[10px] tracking-widest text-white/50 uppercase">{card.status}</span>
                  </div>
                  <Link 
                    href={card.href} 
                    className="inline-flex items-center gap-2 rounded-xs border border-white/5 bg-black/20 px-3 py-1.5 font-mono text-[11px] font-bold tracking-widest text-[var(--gmp-end-accent)] transition-all hover:border-[var(--gmp-end-accent)]/50 hover:bg-[var(--gmp-end-accent)]/10"
                  >
                    ACCESS
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* 装饰条 */}
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gmp-end-accent)]/40 to-transparent scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
            </article>
          );
        })}
      </div>
    </KineticPageShell>
  );
}
