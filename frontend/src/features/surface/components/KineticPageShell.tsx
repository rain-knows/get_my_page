"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { gmpMotionSprings, gmpMotionTransitions } from "@/components/motion";
import { cn } from "@/lib/utils";

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
  centerTitle: string;
  centerDescription: string;
  children: ReactNode;
  layoutMode?: "default" | "focus";
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
  { label: "系统监控", href: "/" },
  { label: "协议档案", href: "/" },
];

/**
 * 功能：渲染 Home/Search 共用的三栏动效壳层，承载左导航、右功能区与中间内容区，极简硬核风格。
 * 关键参数：children 为中间内容主体。
 * 返回值/副作用：返回页面壳层结构节点，无副作用。
 */
export function KineticPageShell({
  currentPath,
  centerTitle,
  centerDescription,
  children,
  layoutMode = "default",
  navItems = [...defaultNavItems],
  topActions = [...defaultTopActions],
  rightBottom,
  className,
}: KineticPageShellProps) {
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const isFocusLayout = layoutMode === "focus";

  return (
    <section
      className={cn("relative min-h-dvh bg-(--gmp-bg-base) text-white overflow-hidden", className)}
    >
      {/* 极简网格底纹 */}
      <div className="absolute inset-0 gmp-industrial-dot-grid opacity-[0.03] pointer-events-none" />

      <main
        className={cn(
          "relative z-10 mx-auto grid min-h-dvh w-full grid-cols-1 gap-0 px-4 md:px-0",
          isFocusLayout
            ? "md:grid-cols-[100px_1fr] xl:grid-cols-[100px_1fr]"
            : "md:grid-cols-[100px_1fr] xl:grid-cols-[100px_1fr_360px] xl:gap-8",
        )}
      >

        {/* 左侧工业导航 */}
        <aside className={cn(
          "relative hidden h-full flex-col items-center justify-between bg-(--gmp-bg-elevated) border-r border-(--gmp-line-soft) py-8 md:flex",
          isFocusLayout ? "py-8" : "py-8",
        )}>
          <div className="absolute inset-0 gmp-halftone-sidebar mix-blend-overlay pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center gap-12 w-full">
            {/* Logo区 */}
            <Link href="/" className="group flex flex-col items-center gap-2">
              <div className={cn(
                "flex z-20 items-center justify-center bg-(--gmp-bg-base) border border-(--gmp-accent) p-1.5 shadow-[2px_2px_0_0_var(--gmp-line-soft)] transition-colors group-hover:bg-(--gmp-bg-panel)",
                isFocusLayout ? "h-16 w-16" : "h-16 w-16",
              )}>
                <img src="/gmp-logo.svg" alt="GetMyPage Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-(--gmp-text-secondary) uppercase group-hover:text-white transition-colors">
                Sys.v3
              </span>
            </Link>

            {/* 导航列表区 */}
            <nav className="flex w-full flex-1 flex-col justify-center" aria-label="Main system navigation">
              <ul className="relative flex w-full flex-col" onMouseLeave={() => setHoveredPath(null)}>
                {navItems.map((item) => {
                  const isActive = item.href === currentPath;
                  const isHovered = hoveredPath === item.href;
                  const isHighlighted = hoveredPath ? isHovered : isActive;

                  return (
                    <li key={item.href} onMouseEnter={() => setHoveredPath(item.href)} className="w-full">
                      <Link
                        href={item.href}
                        className={cn(
                          "group relative flex w-full flex-col items-center justify-center gap-1 transition-all text-center",
                          "font-heading text-xs font-black tracking-widest uppercase outline-none",
                          isFocusLayout ? "py-5" : "py-5",
                          isHighlighted ? "text-white" : "text-(--gmp-text-secondary) hover:text-white"
                        )}
                      >
                        {/* 异形模块延伸突出 —— 精准对齐切割边缘与侧栏边缘 */}
                        {isHighlighted && (
                          <motion.div
                            layoutId="navTrackerBg"
                            className="absolute -top-1 -bottom-1 left-0 -right-3 z-0 bg-(--gmp-bg-panel) border-y border-r border-(--gmp-line-strong) border-l-0 gmp-cut-corner-br shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]"
                            transition={gmpMotionSprings.tracker}
                          />
                        )}

                        {/* 最经典的左侧黄条追踪体系 */}
                        {isHighlighted && (
                          <motion.div
                            layoutId="navTrackerLine"
                            className="absolute left-0 -top-1 -bottom-1 w-1.5 bg-(--gmp-accent) z-60 shadow-[0_0_8px_var(--gmp-accent)]"
                            transition={gmpMotionSprings.tracker}
                          />
                        )}

                        <span className="relative z-10">{item.label}</span>

                        {isActive && !isFocusLayout && (
                          <span className="relative z-10 font-mono text-[9px] tracking-widest text-(--gmp-accent) scale-90">
                            SELECTED
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* 底部保留状态指示 */}
          {!isFocusLayout ? (
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="h-24 w-px bg-(--gmp-line-soft)" />
              <span className="font-mono text-[10px] font-bold tracking-[0.3em] text-(--gmp-text-secondary) uppercase [writing-mode:vertical-rl]">
                LINK // ONLINE
              </span>
            </div>
          ) : null}
        </aside>

        {/* 中间主内容区 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={gmpMotionTransitions.controlReveal}
          className={cn(
            "relative flex flex-col justify-start overflow-hidden",
            isFocusLayout ? "pt-4 pb-4" : "pt-6 pb-6",
          )}
        >
          {/* 主标题栏 */}
          <header
            className={cn(
              "flex flex-wrap items-end justify-between gap-4 border-b-2 border-(--gmp-line-soft) pr-4",
              isFocusLayout ? "mb-4 pb-3" : "mb-6 pb-4",
            )}
          >
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3 bg-(--gmp-bg-panel) border border-(--gmp-line-strong) px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.2em] text-[#FFF] uppercase gmp-cut-corner-l">
                <Layers3 className="h-4 w-4 text-(--gmp-accent)" />
                <span>TERMINAL_CORE</span>
                <span className="ml-1 h-1.5 w-1.5 bg-(--gmp-accent) animate-pulse" />
              </div>
              <div>
                <h1 className={cn(
                  "font-heading font-black tracking-widest text-[#FFF] uppercase drop-shadow-[2px_2px_0_var(--gmp-line-soft)]",
                  isFocusLayout ? "text-2xl md:text-3xl" : "text-4xl md:text-5xl",
                )}>
                  {centerTitle}
                </h1>
                <p className={cn(
                  "mt-2 max-w-xl font-medium leading-relaxed text-(--gmp-text-secondary)",
                  isFocusLayout ? "text-xs md:text-sm" : "text-sm",
                )}>
                  {centerDescription}
                </p>
              </div>
            </div>

            {/* 顶栏静默指示器 */}
            {!isFocusLayout ? (
              <div className="flex items-center gap-4">
                <div className="group relative inline-flex h-10 items-center bg-(--gmp-bg-panel) border border-(--gmp-line-soft) px-5 font-mono text-[10px] font-bold tracking-[0.2em] text-(--gmp-text-secondary) uppercase gmp-cut-corner-r">
                  <span className="w-1.5 h-1.5 bg-(--gmp-accent) mr-3 inline-block opacity-80" />
                  <span>UPLINK: SECURED</span>
                </div>
              </div>
            ) : null}
          </header>

          <div className={cn(
            "min-h-0 flex-1 overflow-y-auto custom-scrollbar",
            isFocusLayout ? "pr-2 md:pr-3" : "pr-4",
          )}>
            {children}
          </div>

          {!isFocusLayout ? (
            <footer className="mt-4 flex items-center justify-start border-t border-(--gmp-line-soft) pt-4 font-mono text-[10px] font-bold tracking-[0.3em] text-(--gmp-text-secondary) uppercase">
              MODULE_ID: 0xFD42A // SYS_v3.0.0
            </footer>
          ) : null}
        </motion.section>

        {/* 右侧边栏区 */}
        <aside className={cn(
          "hidden flex-col gap-6 pt-6 pb-6 pr-8 xl:flex",
          isFocusLayout && "xl:hidden",
        )}>
          {/* Action Panel */}
          <section className="bg-(--gmp-bg-panel) border border-(--gmp-line-soft) p-5 gmp-cut-corner-br gmp-hard-shadow box-border">
            <h3 className="mb-5 font-mono text-[11px] font-bold tracking-[0.2em] text-(--gmp-accent) uppercase flex items-center gap-2 border-b border-(--gmp-line-strong) pb-2">
              <span className="w-2 h-2 bg-(--gmp-accent) inline-block" />
              QUICK_ACTIONS
            </h3>
            <div className="flex flex-col gap-3">
              {topActions.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group relative flex h-14 w-full items-center justify-between border-2 border-(--gmp-line-soft) bg-(--gmp-bg-base) px-4 font-heading text-sm font-bold tracking-widest text-white transition-all hover:border-(--gmp-accent) hover:bg-(--gmp-accent) hover:text-(--gmp-bg-base) gmp-cut-corner-l"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="h-5 w-5 text-(--gmp-text-secondary) group-hover:text-(--gmp-bg-base) group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </section>

          {/* Reserved / Telemetry Panel */}
          <section className="bg-(--gmp-bg-panel) border border-(--gmp-line-soft) p-6 flex-1 flex flex-col">
            <h3 className="mb-4 font-mono text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase flex items-center gap-2">
              SYS_TELEMETRY
            </h3>
            <div className="flex-1 border-2 border-dashed border-(--gmp-line-soft) bg-(--gmp-bg-base) flex items-center justify-center p-4 min-h-40">
              {rightBottom ?? (
                <div className="flex flex-col items-center text-center gap-2">
                  <span className="block h-3 w-3 bg-(--gmp-accent) animate-pulse" />
                  <p className="font-mono text-[10px] font-bold tracking-widest text-(--gmp-text-secondary) uppercase">
                    AWAITING FEED...
                  </p>
                </div>
              )}
            </div>
          </section>
        </aside>
      </main>
    </section>
  );
}
