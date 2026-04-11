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
      {/* 增强层：V2 高级工业背景 */}
      <div className="gmp-noise-overlay" />
      <div className="gmp-fluid-scan" />
      <div className="gmp-parallax-geometry" />
      <div className="gmp-kinetic-bg pointer-events-none absolute inset-0 opacity-40" />

      {/* 增强层：随机工业标签 */}
      <div className="pointer-events-none absolute top-1/4 right-10 hidden font-mono text-[9px] tracking-[0.4em] text-white/20 uppercase lg:block [writing-mode:vertical-rl]">
        Protocol-X99 // Auth Sequence: 0xFD42A01
      </div>
      <div className="pointer-events-none absolute bottom-1/4 left-10 hidden font-mono text-[9px] tracking-[0.4em] text-white/20 uppercase lg:block [writing-mode:vertical-rl]">
        Sys_Core_v2.0.4 // Buffer: 0x{clamped.toString(16).padStart(2, '0')}
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col justify-between px-6 py-8 md:px-12 md:py-10">
        <div className="flex items-center justify-between">
          <div className="gmp-corner-border gmp-corner-border--tl gmp-corner-border--br gmp-panel-premium gmp-inner-glow inline-flex items-center gap-2.5 bg-black/45 px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-white/75 uppercase">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--gmp-end-accent)] shadow-[0_0_10px_var(--gmp-end-accent)]" />
            Initialization Protocol
          </div>
          <span className="font-mono text-[10px] tracking-[0.3em] text-white/40 uppercase">Global Stage // Frontier</span>
        </div>

        <div className="mx-auto w-full max-w-4xl pb-16 md:pb-24">
          <div className="mb-10 text-center md:mb-14">
            <div className="mb-6 inline-block rounded-xs border border-white/10 bg-white/5 px-3 py-1 font-mono text-[9px] tracking-[0.4em] text-white/30 uppercase">
              Authorization Signal Detected
            </div>
            <p className="mb-3 font-mono text-[12px] tracking-[0.3em] text-white/55 uppercase">Get My Page</p>
            <h1 className="gmp-glitch-text font-heading text-7xl leading-none font-bold tracking-tighter text-white sm:text-8xl md:text-9xl">
              终界起航
            </h1>
            <div className="mt-8 flex items-center justify-center gap-6">
               <div className="h-px w-12 bg-white/10" />
               <p className="text-sm tracking-[0.3em] text-white/40 md:text-base font-heading">
                 <span className="text-[var(--gmp-end-accent)]">OVER THE FRONTIER</span> / INTO THE SIGNAL
               </p>
               <div className="h-px w-12 bg-white/10" />
            </div>
          </div>

          <div className="gmp-corner-border gmp-corner-border--tl gmp-corner-border--br gmp-panel-premium gmp-inner-glow overflow-hidden bg-black/45 px-6 py-6 backdrop-blur-[2px] md:px-8">
            <div className="mb-4 flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-white/80 uppercase">
              <div className="flex items-center gap-3">
                <span className="animate-pulse flex items-center gap-2">
                   <div className="h-1 w-4 bg-[var(--gmp-end-accent)]" />
                   Loading...
                </span>
                <span className="text-white/20">System Warmup</span>
              </div>
              <span className="text-[var(--gmp-end-accent)] font-bold">{Math.round(clamped)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-xs bg-white/5 p-[1px]">
              <motion.div
                className="h-full bg-[linear-gradient(90deg,var(--gmp-end-accent)_0%,var(--gmp-end-accent-soft)_100%)] shadow-[0_0_20px_rgba(248,230,79,0.4)]"
                animate={{ width: `${clamped}%` }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              />
            </div>
            <div className="mt-4 flex justify-between font-mono text-[8px] tracking-[0.3em] text-white/10 uppercase">
               <span>P_Block: 0x{clamped.toString(16).toUpperCase()}</span>
               <span>Status: SYNC_READY</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
           <span className="font-mono text-[8px] tracking-[0.4em] text-white/10 uppercase">© 2026 Endfield Technology</span>
           <div className="h-px w-24 bg-gradient-to-r from-transparent via-[var(--gmp-end-accent)]/20 to-transparent" />
           <span className="font-mono text-[8px] tracking-[0.4em] text-white/10 uppercase">Archive // 0xFD42A01</span>
        </div>
      </div>
    </motion.section>
  );
}
