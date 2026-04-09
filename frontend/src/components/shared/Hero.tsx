"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Compass, Gauge, Layers3 } from "lucide-react";
import { Badge, Button } from "@/components/ui";

const heroMetrics = [
  { label: "Render Pipeline", value: "SSR/SSG" },
  { label: "Content Surface", value: "MDX + Search" },
  { label: "Interaction Noise", value: "Low" },
];

/**
 * 功能：渲染首页首屏 Hero，展示站点定位与主行动入口。
 * 关键参数：无外部参数，文案和 CTA 在组件内静态定义。
 * 返回值/副作用：返回首屏展示节点，无副作用。
 */
export default function Hero() {
  return (
    <section className="relative flex min-h-[72vh] flex-col items-center justify-center px-4 pt-24 pb-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex w-full max-w-6xl flex-col items-start gap-10"
      >
        <div className="space-y-5">
          <Badge variant="outline" className="border-[var(--gmp-line-strong)] bg-[var(--gmp-bg-panel)] px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-[var(--gmp-accent)] uppercase">
            <Compass className="size-3.5" />
            Industrial Story Layer
          </Badge>

          <h1 className="max-w-4xl font-heading text-4xl leading-[1.05] font-semibold tracking-tight text-[var(--gmp-text-primary)] md:text-6xl lg:text-7xl">
            简洁结构，
            <span className="mt-2 block text-[var(--gmp-accent)]">高密度信息表达。</span>
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-[var(--gmp-text-secondary)] md:text-lg">
            用工业化排版和低噪声交互承载创作流程，从输入灵感到内容发布，保持一致、清晰、可控的表达节奏。
          </p>
        </div>

        <div className="flex w-full flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 min-w-44 border border-[var(--gmp-line-strong)] bg-[var(--gmp-accent)] text-black hover:bg-[#e2d3b4]">
              <Link href="/search">
                查看内容流
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 min-w-44 border-[var(--gmp-line-strong)] bg-[var(--gmp-bg-panel)] text-[var(--gmp-text-primary)] hover:bg-[var(--gmp-bg-elevated)]">
              <Link href="/register">
                <Layers3 className="size-4" />
                创建主页
              </Link>
            </Button>
          </div>

          <div className="industrial-panel grid w-full max-w-xl grid-cols-1 gap-2 rounded-2xl p-3 sm:grid-cols-3">
            {heroMetrics.map((item) => (
              <div key={item.label} className="rounded-xl border border-[var(--gmp-line-soft)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5">
                <p className="font-mono text-[10px] tracking-[0.12em] text-[var(--gmp-text-secondary)] uppercase">{item.label}</p>
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--gmp-text-primary)]">
                  <Gauge className="size-3.5 text-[var(--gmp-accent-dim)]" />
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
