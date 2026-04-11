"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
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
 * 功能：渲染认证页统一壳层，提供居中单卡片布局与平滑背景位移效果。
 * 关键参数：mode 用于显示当前登录/注册语义；children 为表单主体；footer 为底部切换入口。
 * 返回值/副作用：返回认证页壳层节点，无副作用。
 */
export function InteractiveAuthShell({ title, description, mode, footer, children, className }: InteractiveAuthShellProps) {

  return (
    <section
      className="relative isolate min-h-dvh overflow-hidden bg-[var(--gmp-end-bg)] px-4 py-8 text-white md:px-6 md:py-10"
      data-module="scan"
    >
      {/* 增强层：V2 高级工业背景 */}
      <div className="gmp-noise-overlay" />
      <div className="gmp-fluid-scan" />
      <div className="gmp-parallax-geometry" />
      <div className="gmp-kinetic-bg pointer-events-none absolute inset-0 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className={cn("relative z-10 mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-xl flex-col justify-center", className)}
      >
        <div className="mb-4 flex items-center justify-between md:mb-5">
          <Link href="/" className="group flex items-center gap-2 rounded-sm border border-white/20 bg-black/45 px-2.5 py-1.5 transition-all hover:border-[var(--gmp-end-accent)]/50">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xs border border-white/22 bg-black/55 font-heading text-xs font-semibold tracking-[0.14em] text-[var(--gmp-end-accent)] shadow-[0_0_10px_rgba(248,230,79,0.15)] transition-transform group-hover:scale-110">
              GMP
            </span>
            <span className="font-heading text-sm text-white/85 group-hover:text-white transition-colors">GetMyPage</span>
          </Link>
          <div className="flex flex-col items-end gap-1">
            <span className="font-mono text-[9px] tracking-[0.2em] text-white/30 uppercase">
              Secure_Channel: Active
            </span>
            <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--gmp-end-accent)] uppercase">
              {mode === "login" ? "Auth // Login" : "Auth // Register"}
            </span>
          </div>
        </div>

        <motion.div 
          className="gmp-corner-border gmp-corner-border--tl gmp-corner-border--br gmp-panel-premium gmp-inner-glow relative overflow-hidden bg-black/42 p-5 backdrop-blur-[4px] md:p-8 lg:p-10"
          layout
        >
          <header className="mb-6 border-b border-white/10 pb-5 text-center md:mb-8">
            <div className="mb-3 inline-block rounded-xs border border-[var(--gmp-end-accent)]/20 bg-[var(--gmp-end-accent)]/5 px-2 py-0.5 font-mono text-[9px] tracking-widest text-[var(--gmp-end-accent)] uppercase animate-pulse">
              Identity Verification Required
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-white/55">{description}</p>
          </header>

          <div className="relative">
            {children}
          </div>

          <footer className="mt-5 border-t border-white/10 pt-4 text-center text-sm text-white/55 md:mt-6">
            {footer}
          </footer>

          {/* 装饰条 */}
          <div className="absolute top-0 right-0 h-16 w-px bg-gradient-to-b from-[var(--gmp-end-accent)]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 h-16 w-px bg-gradient-to-t from-[var(--gmp-end-accent)]/30 to-transparent" />
        </motion.div>

        <div className="mt-6 flex justify-center opacity-40">
          <p className="font-mono text-[9px] tracking-[0.3em] text-white uppercase">
            Over the frontier // Into the signal
          </p>
        </div>
      </motion.div>
    </section>
  );
}
