"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { INTERACTION_MODULES, type InteractionModuleKey } from "@/types/interaction-module";

interface ShellNavItem {
  label: string;
  href: string;
}

interface ShellActionItem {
  label: string;
  href: string;
}

interface KineticPageShellProps {
  currentPath: string;
  mode: InteractionModuleKey;
  onModeCycle: () => void;
  centerTitle: string;
  centerDescription: string;
  children: ReactNode;
  navItems?: ShellNavItem[];
  topActions?: ShellActionItem[];
  rightBottom?: ReactNode;
  className?: string;
}

const defaultNavItems: readonly ShellNavItem[] = [
  { label: "首页", href: "/" },
  { label: "博客", href: "/blog" },
  { label: "搜索", href: "/search" },
  { label: "登录", href: "/login" },
];

const defaultTopActions: readonly ShellActionItem[] = [
  { label: "跳转一", href: "/" },
  { label: "跳转二", href: "/" },
];

/**
 * 功能：根据当前路径判断左侧导航项是否处于激活态，提升页面跳转可见性。
 * 关键参数：currentPath 为当前路由路径；href 为导航目标路径。
 * 返回值/副作用：返回是否激活的布尔值，无副作用。
 */
function isNavActive(currentPath: string, href: string): boolean {
  if (href === "/") {
    return currentPath === "/";
  }
  return currentPath.startsWith(href);
}

/**
 * 功能：渲染 Home/Search 共用的三栏动效壳层，承载左导航、右功能区与中间内容区。
 * 关键参数：mode 决定背景模式；onModeCycle 提供单按钮循环切换；children 为中间内容主体。
 * 返回值/副作用：返回页面壳层结构节点，无副作用。
 */
export function KineticPageShell({
  currentPath,
  mode,
  onModeCycle,
  centerTitle,
  centerDescription,
  children,
  navItems = [...defaultNavItems],
  topActions = [...defaultTopActions],
  rightBottom,
  className,
}: KineticPageShellProps) {
  const modeLabel = INTERACTION_MODULES.find((item) => item.key === mode)?.label ?? "SCAN";

  return (
    <section
      className={cn("relative min-h-dvh overflow-hidden bg-[var(--gmp-end-bg)] text-white", className)}
      data-module={mode}
    >
      {/* 增强层：V2 高级工业背景 */}
      <div className="gmp-noise-overlay" />
      <div className="gmp-fluid-scan" />
      <div className="gmp-parallax-geometry" />
      <div className="gmp-kinetic-bg pointer-events-none absolute inset-0 opacity-40" />
      
      <main className="relative z-10 mx-auto grid min-h-dvh w-full max-w-[1600px] grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[84px_1fr] xl:grid-cols-[96px_1fr_320px] xl:gap-5 xl:px-6 xl:py-5">
        {/* 左侧工业导轨 */}
        <aside className="gmp-corner-border gmp-corner-border--tl gmp-corner-border--br gmp-panel-premium gmp-inner-glow hidden h-full flex-col items-center justify-between bg-black/36 p-4 backdrop-blur-[2px] md:flex">
          <div className="flex flex-col items-center gap-6">
            <Link href="/" className="group flex flex-col items-center gap-1.5 transition-transform hover:scale-105">
              <span className="flex h-12 w-12 items-center justify-center rounded-xs border border-white/20 bg-black/60 font-heading text-lg font-bold tracking-widest text-[var(--gmp-end-accent)] shadow-[0_0_15px_rgba(248,230,79,0.15)]">
                GMP
              </span>
              <span className="font-mono text-[7px] tracking-[0.3em] text-white/20 uppercase opacity-0 group-hover:opacity-100 transition-opacity">V2.0</span>
            </Link>
            
            <nav className="flex w-full flex-col gap-3">
              {navItems.map((item, index) => {
                const active = isNavActive(currentPath, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex h-11 w-full flex-col items-center justify-center rounded-xs border transition-all",
                      active
                        ? "border-[var(--gmp-end-accent)] bg-[var(--gmp-end-accent)]/10 text-[var(--gmp-end-accent)]"
                        : "border-transparent text-white/40 hover:border-white/20 hover:text-white",
                    )}
                  >
                    <span className="mb-0.5 text-[10px] uppercase tracking-tighter">{item.label}</span>
                    <span className="font-mono text-[8px] opacity-40 tracking-widest">0{index + 1}</span>
                    {active && (
                      <span className="absolute -left-1 top-1/2 h-4 w-0.5 -translate-y-1/2 bg-[var(--gmp-end-accent)] animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            <span className="font-mono text-[8px] tracking-[0.4em] text-white/20 uppercase [writing-mode:vertical-rl]">
              Frontier_Signal // OK
            </span>
          </div>
        </aside>

        {/* 主舞台区域 */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.54, ease: [0.22, 1, 0.36, 1] }}
          className="gmp-module-stage gmp-corner-border gmp-corner-border--tl gmp-corner-border--br gmp-panel-premium gmp-inner-glow relative flex flex-col overflow-hidden bg-black/30 backdrop-blur-[2px]"
          data-module={mode}
        >
          <div className={cn("gmp-module-stage__aura absolute inset-0 opacity-10", `gmp-module-stage__aura--${mode}`)} />

          <div className="relative z-10 flex h-full min-h-[660px] flex-col p-6 md:p-8 lg:p-10">
            <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-white/8 pb-6">
              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 rounded-sm border border-white/12 bg-black/45 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-white/55 uppercase">
                  <Layers3 className="h-4 w-4 text-[var(--gmp-end-accent)]" />
                  Terminal_Core // {mode.toUpperCase()}
                  <span className="ml-2 inline-block h-1 w-1 rounded-full bg-[var(--gmp-end-accent)] animate-pulse" />
                </p>
                <div>
                  <h1 className="font-heading text-4xl font-semibold tracking-tight text-white md:text-5xl">{centerTitle}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">{centerDescription}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden flex-col items-end font-mono text-[8px] tracking-[0.3em] text-white/20 uppercase sm:flex">
                  <span>Logic_Link: Stabilized</span>
                  <span>Sys_Entropy: 0x4F2A</span>
                </div>
                <button
                  type="button"
                  onClick={onModeCycle}
                  className="group relative inline-flex h-12 items-center gap-3 rounded-xs border border-[var(--gmp-end-accent)]/50 bg-black/62 px-5 font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--gmp-end-accent)] uppercase transition-all hover:border-[var(--gmp-end-accent)] hover:bg-black/82"
                  aria-label="Toggle interaction module"
                >
                  <span className="relative z-10">{modeLabel}</span>
                  <div className="absolute inset-0 bg-[var(--gmp-end-accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
              {children}
            </div>
            
            <footer className="mt-6 flex items-center justify-between border-t border-white/8 pt-4 font-mono text-[9px] tracking-[0.3em] text-white/20 uppercase">
               <span>Module_ID: 0xFD42A01</span>
               <span>Endfield_Tech // v2.0.4</span>
            </footer>
          </div>
        </motion.section>

        {/* 右侧行动区 */}
        <aside className="grid grid-cols-1 gap-4 xl:grid">
          <section className="gmp-corner-border gmp-corner-border--tl gmp-corner-border--br gmp-panel-premium p-5 backdrop-blur-[2px]">
            <p className="mb-4 font-mono text-[10px] tracking-[0.25em] text-white/30 uppercase border-b border-white/8 pb-2 flex items-center gap-2">
              <span className="h-1 w-1 bg-[var(--gmp-end-accent)]" />
              Core Actions
            </p>
            <div className="space-y-3">
              {topActions.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group relative flex h-12 w-full items-center justify-between rounded-xs border border-white/12 bg-black/45 px-4 text-xs font-bold tracking-widest text-white/80 transition-all hover:border-[var(--gmp-end-accent)]/50 hover:bg-black/66 hover:text-white"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-[var(--gmp-end-accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </section>

          <section className="gmp-corner-border gmp-corner-border--tl gmp-corner-border--br gmp-panel-premium p-5 backdrop-blur-[2px]">
            <p className="mb-3 font-mono text-[10px] tracking-[0.25em] text-white/30 uppercase flex items-center gap-2">
               <span className="h-1 w-1 bg-white/20" />
               Reserved_Sector
            </p>
            {rightBottom ?? (
              <div className="rounded-xs border border-dashed border-white/10 bg-black/20 p-4">
                <p className="text-[11px] leading-relaxed text-white/40 font-mono tracking-wider italic">
                  Waiting for system link...
                </p>
              </div>
            )}
          </section>
        </aside>
      </main>
    </section>
  );
}
