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
      className="relative isolate min-h-dvh overflow-hidden bg-(--gmp-end-bg)"
      aria-label="首页加载中"
      role="status"
      aria-live="polite"
    >
      {/* 精简层：保留低噪点基底，去除过度晃动的流体与视差背景 */}
      <div className="gmp-noise-overlay opacity-50" />

      {/* 增强层：随机工业标签 */}
      <div className="pointer-events-none absolute top-1/4 right-10 hidden font-mono text-[9px] tracking-[0.4em] text-white/20 uppercase lg:block [writing-mode:vertical-rl]">
        Protocol-X99 // Auth Sequence: 0xFD42A01
      </div>
      <div className="pointer-events-none absolute bottom-1/4 left-10 hidden font-mono text-[9px] tracking-[0.4em] text-white/20 uppercase lg:block [writing-mode:vertical-rl]">
        Sys_Core_v2.0.4 // Buffer: 0x{clamped.toString(16).padStart(2, '0')}
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col justify-between px-6 py-8 md:px-12 md:py-10">
        <div className="flex items-center justify-between">
          <div className="gmp-corner-border gmp-corner-border--tl gmp-corner-border--br inline-flex items-center gap-2.5 border border-white/10 bg-black/40 px-4 py-2 font-mono text-[9px] tracking-[0.2em] text-white/60 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-(--gmp-end-accent) shadow-[0_0_6px_var(--gmp-end-accent)] opacity-80" />
            Initialization Protocol
          </div>
          <span className="font-mono text-[10px] tracking-[0.3em] text-white/40 uppercase">Global Stage // Frontier</span>
        </div>

        <div className="mx-auto w-full max-w-4xl pb-16 md:pb-24">
          <div className="mb-10 text-center md:mb-14">
            <div className="mb-6 inline-block rounded-xs border border-white/5 bg-white/5 px-3 py-1 font-mono text-[9px] tracking-[0.3em] text-white/40 uppercase">
              Authorization Signal Detected
            </div>
            <p className="mb-3 font-mono text-[12px] tracking-[0.4em] text-white/50 uppercase">Get My Page</p>
            <h1 className="font-heading text-6xl leading-tight font-medium tracking-widest text-[#f0f4f8] sm:text-7xl md:text-8xl drop-shadow-md">
              终界起航
            </h1>
            <div className="mt-8 flex items-center justify-center gap-6 opacity-80">
              <div className="h-px w-16 bg-white/10" />
              <p className="text-xs tracking-[0.4em] text-white/40 md:text-sm font-heading uppercase">
                <span className="text-(--gmp-end-accent) font-semibold">OVER THE FRONTIER</span> / INTO THE SIGNAL
              </p>
              <div className="h-px w-16 bg-white/10" />
            </div>
          </div>

          <div className="gmp-corner-border gmp-corner-border--tl gmp-corner-border--br gmp-inner-glow overflow-hidden border border-white/5 bg-black/40 px-6 py-6 backdrop-blur-md md:px-8">
            <div className="mb-4 flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-white/70 uppercase">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2">
                  <div className="h-0.5 w-4 bg-(--gmp-end-accent) opacity-80 animate-pulse" />
                  Loading...
                </span>
                <span className="text-white/30 hidden sm:inline-block">System Warmup</span>
              </div>
              <span className="text-(--gmp-end-accent) font-bold">{Math.round(clamped)}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--gmp-end-accent)_0%,var(--gmp-end-accent)_100%)] shadow-[0_0_10px_rgba(248,230,79,0.3)]"
                animate={{ width: `${clamped}%` }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              />
            </div>
            <div className="mt-4 flex justify-between font-mono text-[9px] tracking-[0.3em] text-white/20 uppercase">
              <span>P_Block: 0x{clamped.toString(16).toUpperCase()}</span>
              <span>Status: SYNC_READY</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[8px] tracking-[0.4em] text-white/10 uppercase">© 2026 Endfield Technology</span>
          <div className="h-px w-24 bg-linear-to-r from-transparent via-(--gmp-end-accent)/20 to-transparent" />
          <span className="font-mono text-[8px] tracking-[0.4em] text-white/10 uppercase">Archive // 0xFD42A01</span>
        </div>
      </div>
    </motion.section>
  );
}
