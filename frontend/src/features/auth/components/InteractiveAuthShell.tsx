"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { gmpMotionTransitions } from "@/components/motion";
import { cn } from "@/lib/utils";

interface InteractiveAuthShellProps {
  title: string;
  description: string;
  mode: "login" | "register";
  footer: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * 功能：渲染认证页统一壳层，提供居中单卡片布局，极简实心背景和硬切角工业风格。
 * 关键参数：mode 用于显示当前登录/注册语义；children 为表单主体；footer 为底部切换入口。
 * 返回值/副作用：返回认证页壳层节点，无副作用。
 */
export function InteractiveAuthShell({ title, description, mode, footer, children, className }: InteractiveAuthShellProps) {

  return (
    <section
      className="relative min-h-dvh overflow-hidden bg-(--gmp-bg-base) px-4 py-8 text-(--gmp-text-primary) md:px-6 md:py-10 flex flex-col justify-center"
      data-module="auth"
    >
      {/* 背景工业斜线极简网格 */}
      <div className="absolute inset-0 gmp-industrial-grid opacity-100 pointer-events-none" />

      {/* 左侧巨大的安全域标识水印 */}
      <div className="absolute -left-32 top-1/2 -translate-y-1/2 font-heading text-[240px] font-black tracking-tighter text-white opacity-[0.02] select-none pointer-events-none rotate-90 xl:rotate-0 xl:left-0 z-0">
        AUTH
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={gmpMotionTransitions.controlEnter}
        className={cn("relative z-10 mx-auto flex w-full max-w-xl flex-col justify-center", className)}
      >
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <Link href="/" className="group inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center bg-(--gmp-bg-base) border border-(--gmp-accent) p-1.5 shadow-[2px_2px_0_0_var(--gmp-line-soft)] transition-colors group-hover:bg-(--gmp-bg-panel)">
              <img src="/gmp-logo.svg" alt="GetMyPage Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-heading text-lg font-black tracking-widest text-white group-hover:text-(--gmp-text-secondary) transition-colors uppercase">
              GetMyPage
            </span>
          </Link>
          <div className="flex flex-col items-start sm:items-end gap-1 border-l-2 sm:border-l-0 sm:border-r-2 border-(--gmp-line-strong) pl-3 sm:pl-0 sm:pr-3">
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-(--gmp-text-secondary) uppercase">
              SECURE_CHANNEL
            </span>
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-(--gmp-accent) uppercase">
              {mode === "login" ? "SESSION // LOGIN" : "SESSION // REGISTER"}
            </span>
          </div>
        </div>

        <motion.div
          className="relative overflow-hidden bg-(--gmp-bg-panel) border-2 border-(--gmp-line-strong) p-8 md:p-12 gmp-cut-corner-l shadow-[8px_8px_0_0_#000]"
          layout
        >
          <div className="absolute inset-0 gmp-halftone-card mix-blend-overlay pointer-events-none" />

          {/* 左上角提示刻度 */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-(--gmp-accent) -ml-2 -mt-2 pointer-events-none z-10" />

          <header className="mb-8 border-b-2 border-(--gmp-line-soft) pb-6">
            <div className="mb-4 inline-flex items-center gap-2 bg-(--gmp-bg-base) border border-(--gmp-line-soft) px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] text-(--gmp-accent) uppercase">
              <span className="w-1.5 h-1.5 bg-(--gmp-accent) block animate-pulse" />
              IDENTITY VERIFICATION REQUIRED
            </div>
            <h1 className="font-heading text-3xl font-black tracking-widest text-white md:text-5xl uppercase">{title}</h1>
            <p className="mt-3 text-sm font-medium text-(--gmp-text-secondary)">{description}</p>
          </header>

          <div className="relative z-10 w-full mb-8">
            {children}
          </div>

          <footer className="border-t-2 border-(--gmp-line-soft) pt-6 text-center text-sm font-medium text-(--gmp-text-secondary)">
            {footer}
          </footer>

          {/* 表单内部右下角切割装饰 */}
          <div className="absolute bottom-4 right-4 font-mono text-[9px] font-bold tracking-[0.2em] text-(--gmp-line-strong) uppercase select-none pointer-events-none">
            BLOCK: 0x2A
          </div>
        </motion.div>

      </motion.div>
    </section>
  );
}
