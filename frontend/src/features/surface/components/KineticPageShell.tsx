"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
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
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(50);
  const smoothX = useSpring(pointerX, { stiffness: 150, damping: 22 });
  const smoothY = useSpring(pointerY, { stiffness: 150, damping: 22 });
  const gridOffsetX = useTransform(smoothX, [0, 100], [-10, 10]);
  const gridOffsetY = useTransform(smoothY, [0, 100], [-8, 8]);
  const geometryOffsetX = useTransform(smoothX, [0, 100], [7, -7]);
  const geometryOffsetY = useTransform(smoothY, [0, 100], [5, -5]);
  const modeLabel = INTERACTION_MODULES.find((item) => item.key === mode)?.label ?? "SCAN";

  /**
   * 功能：跟踪鼠标在壳层内的相对位置，驱动网格与几何背景层平滑位移。
   * 关键参数：event 为鼠标移动事件，包含当前光标在壳层内的坐标信息。
   * 返回值/副作用：无返回值；会更新 motion 值并触发背景层位移。
   */
  const handlePointerMove = (event: MouseEvent<HTMLElement>) => {
    if (reducedMotion) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    pointerX.set(Math.max(0, Math.min(100, x)));
    pointerY.set(Math.max(0, Math.min(100, y)));
  };

  return (
    <section
      className={cn("relative min-h-dvh overflow-hidden bg-[var(--gmp-end-bg)] text-white", className)}
      data-module={mode}
      onMouseMove={handlePointerMove}
    >
      <div className="gmp-kinetic-bg pointer-events-none absolute inset-0" />
      <motion.div
        className="gmp-kinetic-grid pointer-events-none absolute inset-0"
        style={reducedMotion ? undefined : { x: gridOffsetX, y: gridOffsetY }}
      />
      <motion.div
        className="gmp-kinetic-geometry pointer-events-none absolute inset-0"
        style={reducedMotion ? undefined : { x: geometryOffsetX, y: geometryOffsetY }}
        data-module={mode}
      />

      <main className="relative z-10 mx-auto grid min-h-dvh w-full max-w-[1600px] grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[84px_1fr] xl:grid-cols-[96px_1fr_320px] xl:gap-5 xl:px-6 xl:py-5">
        <aside className="hidden h-full rounded-sm border border-white/12 bg-black/36 p-3 backdrop-blur-sm md:flex md:flex-col md:items-center md:justify-between">
          <div className="flex flex-col items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-white/20 bg-black/40 font-heading text-xl font-semibold tracking-tight text-white">
              GMP
            </span>
            <span className="[writing-mode:vertical-rl] rotate-180 font-mono text-[10px] tracking-[0.2em] text-white/55 uppercase">
              Page Navigation
            </span>
          </div>

          <nav className="flex w-full flex-col gap-2">
            {navItems.map((item) => {
              const active = isNavActive(currentPath, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex h-10 w-full items-center justify-center rounded-xs border font-mono text-[10px] tracking-[0.14em] transition-all",
                    active
                      ? "border-[var(--gmp-end-accent)] bg-black/72 text-[var(--gmp-end-accent)]"
                      : "border-white/16 bg-black/50 text-white/62 hover:border-[var(--gmp-end-accent)] hover:text-[var(--gmp-end-accent)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <p className="font-mono text-[10px] tracking-[0.16em] text-white/55 uppercase">2026</p>
        </aside>

        <motion.section
          initial={{ opacity: 0, scale: 0.986 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.46, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="gmp-module-stage relative overflow-hidden rounded-sm border border-white/16 bg-black/30"
          data-module={mode}
        >
          <div className={cn("gmp-module-stage__aura absolute inset-0", `gmp-module-stage__aura--${mode}`)} />

          <div className="relative z-10 flex h-full min-h-[660px] flex-col p-5 md:p-8 lg:p-10">
            <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-white/14 pb-4">
              <div>
                <p className="inline-flex items-center gap-2 rounded-sm border border-white/16 bg-black/45 px-3 py-1.5 font-mono text-[11px] tracking-[0.18em] text-white/72 uppercase">
                  <Layers3 className="h-3.5 w-3.5 text-[var(--gmp-end-accent)]" />
                  Content Surface
                </p>
                <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-white md:text-4xl">{centerTitle}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/68 md:text-base">{centerDescription}</p>
              </div>

              <button
                type="button"
                onClick={onModeCycle}
                className="inline-flex h-10 items-center gap-2 rounded-xs border border-[var(--gmp-end-accent)]/70 bg-black/62 px-3 font-mono text-[11px] tracking-[0.16em] text-[var(--gmp-end-accent)] uppercase transition-colors hover:bg-black/78"
                aria-label="切换背景模式"
              >
                模式
                <span>{modeLabel}</span>
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
          </div>
        </motion.section>

        <aside className="grid grid-cols-1 gap-3 xl:grid">
          <section className="rounded-sm border border-white/16 bg-black/44 p-4 backdrop-blur-sm">
            <p className="mb-3 font-mono text-[10px] tracking-[0.16em] text-white/62 uppercase">Core Actions</p>
            <div className="space-y-2">
              {topActions.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex h-11 w-full items-center justify-between rounded-xs border border-white/14 bg-black/45 px-3.5 text-sm text-white transition-colors hover:border-[var(--gmp-end-accent)] hover:bg-black/66"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-[var(--gmp-end-accent)]" />
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-sm border border-white/16 bg-black/44 p-4 backdrop-blur-sm">
            <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-white/62 uppercase">Reserved</p>
            {rightBottom ?? (
              <div className="rounded-xs border border-dashed border-white/22 bg-black/42 p-3">
                <p className="text-sm text-white/68">功能待定</p>
              </div>
            )}
          </section>
        </aside>
      </main>
    </section>
  );
}
