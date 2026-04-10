"use client";

import { motion } from "motion/react";

interface EndfieldLoadingScreenProps {
  progress: number;
}

/**
 * 功能：渲染首页首次进入时的工业化加载界面，并展示实时进度反馈。
 * 关键参数：progress 为 0-100 的加载进度百分比。
 * 返回值/副作用：返回加载界面节点，无额外副作用。
 */
export function EndfieldLoadingScreen({ progress }: EndfieldLoadingScreenProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="relative isolate min-h-dvh overflow-hidden bg-[var(--gmp-end-bg)]"
      aria-label="首页加载中"
      role="status"
      aria-live="polite"
    >
      <div className="gmp-endfield-loading-map pointer-events-none absolute inset-0" />
      <div className="gmp-endfield-loading-grid pointer-events-none absolute inset-0" />
      <div className="gmp-endfield-scanline pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex min-h-dvh flex-col justify-between px-5 py-6 md:px-10 md:py-8">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2.5 rounded-sm border border-white/18 bg-black/45 px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-white/75 uppercase">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--gmp-end-accent)]" />
            Entry Protocol
          </div>
          <span className="font-mono text-[10px] tracking-[0.2em] text-white/55 uppercase">Build 01 / Stage A</span>
        </div>

        <div className="mx-auto w-full max-w-3xl pb-12 md:pb-20">
          <div className="mb-8 text-center md:mb-10">
            <p className="mb-2 font-mono text-[11px] tracking-[0.22em] text-white/65 uppercase">Get My Page</p>
            <h1 className="font-heading text-5xl leading-none font-semibold tracking-tight text-white sm:text-6xl md:text-7xl">
              终界起航
            </h1>
            <p className="mt-4 text-sm text-white/60 md:text-base">OVER THE FRONTIER / INTO THE SIGNAL</p>
          </div>

          <div className="rounded-sm border border-white/14 bg-black/45 px-4 py-4 backdrop-blur-xs md:px-5">
            <div className="mb-2 flex items-center justify-between font-mono text-[11px] tracking-[0.14em] text-white/70 uppercase">
              <span>System Warmup</span>
              <span>{Math.round(clamped)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-xs bg-white/10">
              <motion.div
                className="h-full bg-[linear-gradient(90deg,var(--gmp-end-accent)_0%,var(--gmp-end-accent-soft)_100%)]"
                animate={{ width: `${clamped}%` }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
