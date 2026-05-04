"use client";

import { motion } from "motion/react";
import { ArrowUpRight, PenLine, Rocket, Sparkles } from "lucide-react";
import { gmpMotionTransitions } from "@/components/motion";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

const flowItems = [
  {
    id: 1,
    icon: PenLine,
    title: "Write",
    description: "记录灵感并形成可迭代草稿，保证输入阶段低摩擦。",
    metric: "Draft sync < 1s",
  },
  {
    id: 2,
    icon: Sparkles,
    title: "Refine",
    description: "将内容拆分为结构化模块，持续压缩噪声并提升可读性。",
    metric: "Structured blocks",
  },
  {
    id: 3,
    icon: Rocket,
    title: "Launch",
    description: "发布后同步首页与搜索，让内容发现路径保持连贯。",
    metric: "Search indexed",
  },
];

const flowContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const flowItemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: gmpMotionTransitions.displayEnter,
  },
};

/**
 * 功能：渲染首页流程展示模块，以时间线卡片强调创作到发布的动态链路。
 * 关键参数：无外部参数，流程节点由 flowItems 常量驱动。
 * 返回值/副作用：返回流程展示节点，无副作用。
 */
export default function FlowShowcase() {
  return (
    <section id="flow" className="mx-auto w-full max-w-6xl px-4 pb-9 md:px-6">
      <div className="relative overflow-hidden border border-(--gmp-line-soft) bg-(--gmp-bg-panel) px-5 py-6 md:px-7 md:py-8 gmp-cut-corner-double gmp-hard-shadow">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-(--gmp-line-strong) to-transparent" />

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="outline" className="border-(--gmp-line-strong) bg-(--gmp-bg-panel) font-mono text-[11px] tracking-[0.16em] text-(--gmp-accent) uppercase">
              Workflow
            </Badge>
            <h2 className="font-heading text-xl tracking-tight text-(--gmp-text-primary) md:text-2xl">从灵感到上线的标准化流程</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-(--gmp-text-secondary)">流程区只保留关键状态和有效反馈，减少无意义的视觉修饰。</p>
        </div>

        <div className="mb-5 hidden grid-cols-3 gap-3 md:grid">
          {flowItems.map((item, index) => (
            <div key={`track-${item.id}`} className="flex items-center gap-2">
              <span className="font-mono text-[11px] tracking-[0.14em] text-(--gmp-text-secondary)">0{index + 1}</span>
              <div className="h-px w-full bg-(--gmp-line-soft)" />
            </div>
          ))}
        </div>

        <motion.div
          variants={flowContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-90px" }}
          className="grid gap-4 md:grid-cols-3"
        >
          {flowItems.map((item, index) => (
            <motion.div key={item.id} variants={flowItemVariants}>
              <Card className="h-full border border-(--gmp-line-soft) bg-[rgba(14,19,28,0.65)] py-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-(--gmp-line-strong) hover:bg-[rgba(18,24,35,0.78)]">
                <CardHeader className="gap-3 border-b border-(--gmp-line-soft) px-4 py-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl border border-(--gmp-line-strong) bg-(--gmp-bg-panel) text-(--gmp-accent)">
                      <item.icon className="size-4.5" />
                    </span>
                    <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-(--gmp-text-secondary)">
                      0{index + 1}
                      <ArrowUpRight className="size-3.5" />
                    </span>
                  </div>
                  <CardTitle className="text-lg text-(--gmp-text-primary)">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-4 py-4">
                  <p className="text-sm leading-relaxed text-(--gmp-text-secondary)">{item.description}</p>
                  <p className="font-mono text-[11px] tracking-[0.12em] text-(--gmp-accent-dim) uppercase">{item.metric}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
