"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, CalendarCheck2, Download, FileText, Layers3, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui";

const timelineItems = [
  { id: "01", title: "前沿简报", description: "每周发布结构化创作周报，聚焦高价值信号。" },
  { id: "02", title: "项目样本", description: "聚合产品设计、前端工程与系统架构的可复用模板。" },
  { id: "03", title: "实战档案", description: "把迭代经验沉淀为可查询、可演进的知识资产。" },
];

const quickActions = [
  { label: "浏览文章", href: "/", icon: FileText },
  { label: "进入搜索", href: "/search", icon: Sparkles },
  { label: "加入创作", href: "/register", icon: Users },
];

/**
 * 功能：渲染首页主场景，包括左侧信息导轨、中部主视觉与右侧行动卡片。
 * 关键参数：无外部参数，内部使用静态结构承载现阶段品牌与内容入口。
 * 返回值/副作用：返回首页主场景节点，无副作用。
 */
export function HomeLandingSurface() {
  return (
    <section className="relative min-h-dvh overflow-hidden bg-[var(--gmp-end-bg)] text-white">
      <div className="gmp-endfield-home-bg pointer-events-none absolute inset-0" />
      <div className="gmp-endfield-home-noise pointer-events-none absolute inset-0" />

      <main className="relative z-10 mx-auto grid min-h-dvh w-full max-w-[1600px] grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[84px_1fr] lg:grid-cols-[96px_1fr_320px] lg:gap-5 lg:px-6 lg:py-5">
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="hidden h-full rounded-sm border border-white/12 bg-black/36 p-3 backdrop-blur-sm md:flex md:flex-col md:items-center md:justify-between"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-white/20 bg-black/40 font-heading text-xl font-semibold tracking-tight text-white">
              GMP
            </span>
            <span className="[writing-mode:vertical-rl] rotate-180 font-mono text-[10px] tracking-[0.2em] text-white/55 uppercase">
              Sector Navigation
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {timelineItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="group flex h-10 w-10 items-center justify-center rounded-xs border border-white/16 bg-black/50 font-mono text-[10px] tracking-[0.14em] text-white/60 transition-all hover:border-[var(--gmp-end-accent)] hover:text-[var(--gmp-end-accent)] focus-visible:border-[var(--gmp-end-accent)] focus-visible:outline-none"
                aria-label={`跳转章节 ${item.id}`}
              >
                {item.id}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 text-white/55">
            <CalendarCheck2 className="h-4 w-4" />
            <span className="font-mono text-[10px] tracking-[0.16em] uppercase">2026</span>
          </div>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, scale: 0.986 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.46, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-sm border border-white/16 bg-black/30"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,220,51,0.34),transparent_36%),radial-gradient(circle_at_80%_24%,rgba(255,46,46,0.26),transparent_33%),linear-gradient(115deg,rgba(96,0,0,0.62)_0%,rgba(16,18,20,0.8)_30%,rgba(19,19,20,0.3)_100%)]" />
          <div className="absolute right-[-14%] bottom-[-18%] h-[72%] w-[68%] rounded-full bg-[radial-gradient(circle,rgba(255,240,102,0.34)_0%,transparent_62%)] blur-3xl" />

          <div className="relative z-10 flex h-full min-h-[660px] flex-col justify-between p-5 md:p-8 lg:p-10">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-sm border border-white/16 bg-black/45 px-3 py-1.5 font-mono text-[11px] tracking-[0.18em] text-white/75 uppercase">
                <Layers3 className="h-3.5 w-3.5 text-[var(--gmp-end-accent)]" />
                Frontier Broadcast
              </div>
              <div className="font-mono text-[11px] tracking-[0.16em] text-white/60 uppercase">New Wave / Archive Ready</div>
            </header>

            <div className="max-w-3xl space-y-5">
              <h1 className="font-heading text-4xl leading-[0.95] font-semibold tracking-tight text-white md:text-6xl lg:text-7xl">
                新潮起 故渊离
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-white/72 md:text-base">
                在高对比视觉秩序中汇聚创作、工程与叙事内容。每一次更新都围绕真实产出，减少噪声，强化可读性与行动路径。
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Button
                  asChild
                  className="h-11 rounded-xs border border-black/30 bg-[var(--gmp-end-accent)] px-5 font-medium text-black hover:bg-[var(--gmp-end-accent-soft)]"
                >
                  <Link href="/register">
                    立即加入
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="h-11 rounded-xs border border-white/20 bg-black/42 px-5 text-white hover:border-white/32 hover:bg-black/56"
                >
                  <Link href="/login">进入控制台</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {timelineItems.map((item) => (
                <article key={item.id} className="rounded-xs border border-white/16 bg-black/44 p-3.5 backdrop-blur-sm">
                  <p className="mb-2 font-mono text-[10px] tracking-[0.18em] text-[var(--gmp-end-accent)] uppercase">{item.id}</p>
                  <h2 className="text-sm font-semibold text-white md:text-base">{item.title}</h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/65 md:text-sm">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.aside
          initial={{ x: 22, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.42, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 gap-3 lg:grid"
        >
          <section className="rounded-sm border border-white/16 bg-black/44 p-4 backdrop-blur-sm">
            <p className="mb-3 font-mono text-[10px] tracking-[0.16em] text-white/62 uppercase">Quick Access</p>
            <div className="space-y-2">
              {quickActions.map((item) => (
                <Button
                  key={item.label}
                  asChild
                  variant="ghost"
                  className="h-11 w-full justify-between rounded-xs border border-white/14 bg-black/45 px-3.5 text-white hover:border-[var(--gmp-end-accent)] hover:bg-black/66"
                >
                  <Link href={item.href}>
                    <span className="inline-flex items-center gap-2 text-sm">
                      <item.icon className="h-4 w-4 text-[var(--gmp-end-accent)]" />
                      {item.label}
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </div>
          </section>

          <section className="rounded-sm border border-white/16 bg-black/44 p-4 backdrop-blur-sm">
            <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-white/62 uppercase">Download Hub</p>
            <div className="space-y-2.5">
              <div className="rounded-xs border border-dashed border-white/22 bg-black/42 p-3">
                <p className="text-xs text-white/70">扫码加入内容实验组，获取每周更新与模板资源。</p>
              </div>
              <Button className="h-11 w-full rounded-xs border border-black/28 bg-[var(--gmp-end-accent)] text-black hover:bg-[var(--gmp-end-accent-soft)]">
                <Download className="h-4 w-4" />
                下载媒体包
              </Button>
            </div>
          </section>
        </motion.aside>
      </main>
    </section>
  );
}
