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
      <div className="grid gap-3 md:grid-cols-2">
        {homeCards.map((card) => {
          const CardIcon = card.icon;
          return (
            <article key={card.id} className="rounded-xs border border-white/16 bg-black/44 p-4 backdrop-blur-sm">
              <p className="mb-2 font-mono text-[10px] tracking-[0.18em] text-[var(--gmp-end-accent)] uppercase">{card.id}</p>
              <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                <CardIcon className="h-4 w-4 text-[var(--gmp-end-accent)]" />
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/68">{card.summary}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-xs border border-white/16 bg-black/52 px-2 py-1 text-xs text-white/72">{card.status}</span>
                <Link href={card.href} className="inline-flex items-center gap-1 text-xs text-[var(--gmp-end-accent)] hover:text-[var(--gmp-end-accent-soft)]">
                  查看
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </KineticPageShell>
  );
}
