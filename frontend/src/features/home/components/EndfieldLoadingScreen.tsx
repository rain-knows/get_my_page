"use client";

import { motion } from "motion/react";

interface EndfieldLoadingScreenProps {
  progress: number;
}

/**
 * 功能：渲染首页首次进入时的极简工业化加载界面，并展示实时进度反馈。
 * 关键参数：progress 为 0-100 的加载进度百分比。
 * 返回值/副作用：返回极简加载界面节点，无额外副作用。
 */
export function EndfieldLoadingScreen({ progress }: EndfieldLoadingScreenProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 1, 0.2, 1] }}
      className="relative isolate min-h-dvh overflow-hidden bg-[var(--gmp-bg-base)]"
      aria-label="首页加载中"
      role="status"
      aria-live="polite"
    >
      {/* 极简网格底纹 */}
      <div className="absolute inset-0 gmp-industrial-dot-grid opacity-20 pointer-events-none" />

      {/* 右上角纯粹刻度文本 */}
      <div className="pointer-events-none absolute top-12 right-12 hidden font-mono text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase lg:block">
        <div className="border-t-2 border-[var(--gmp-accent)] w-8 mb-2" />
        INIT_SEQ // 0xFD42A
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col justify-between px-8 py-10 md:px-16 md:py-16">
        
        {/* 全新锋利顶部标识 */}
        <div className="flex items-start justify-between">
          <div className="gmp-cut-corner-br flex flex-col border-l-4 border-[var(--gmp-accent)] bg-[var(--gmp-bg-panel)] px-6 py-4">
            <span className="font-heading text-sm font-bold tracking-widest text-white uppercase mb-1">
              GLOBAL STAGE
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--gmp-text-secondary)] uppercase">
              Authorization Signal
            </span>
          </div>
        </div>

        {/* 主加载居中区：巨大粗体与极简排版 */}
        <div className="flex w-full flex-col items-center justify-center self-center pb-10 text-center">
          <div className="mb-0 overflow-hidden flex justify-center w-full">
            <motion.h1 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, ease: [0.2, 1, 0.2, 1] }}
              className="font-heading text-6xl font-black uppercase tracking-widest text-white sm:text-8xl md:text-9xl relative leading-none inline-block w-full inline-block"
            >
              协议<span className="text-[var(--gmp-accent)]">接驳</span>
            </motion.h1>
          </div>
          <div className="mt-4 flex w-full max-w-md items-center justify-center gap-4">
            <div className="h-0.5 flex-1 bg-[var(--gmp-line-strong)]" />
            <p className="font-mono text-[10px] font-bold tracking-[0.4em] text-white/50 uppercase">
              OVER THE FRONTIER
            </p>
            <div className="h-0.5 flex-1 bg-[var(--gmp-line-strong)]" />
          </div>

          {/* 纯硬倒角进度条 */}
          <div className="mt-16 w-full max-w-xl">
             <div className="mb-3 flex items-end justify-between font-mono font-bold uppercase tracking-widest text-[#FFF]">
              <span className="text-xs">SYSTEM_WARMUP //</span>
              <span className="text-2xl leading-none text-[var(--gmp-accent)]">{Math.round(clamped)}%</span>
            </div>
            
            {/* 锐利边框容器 */}
            <div className="h-3 w-full bg-[var(--gmp-bg-panel)] gmp-cut-corner-l border border-[var(--gmp-line-strong)] p-[1px]">
              <motion.div
                className="h-full bg-[var(--gmp-accent)] gmp-cut-corner-l"
                animate={{ width: `${clamped}%` }}
                transition={{ duration: 0.15, ease: "linear" }}
              />
            </div>
          </div>
        </div>

        {/* 底部工业标识 */}
        <div className="flex items-end justify-between border-t-2 border-[var(--gmp-line-soft)] pt-6">
          <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-[var(--gmp-text-secondary)] uppercase">
            © 2026 Endfield Technology
          </span>
          <div className="gmp-cut-corner-tl bg-[var(--gmp-bg-elevated)] px-4 py-2 font-mono text-[9px] tracking-widest text-white/40 uppercase">
            STATUS: <span className="text-[var(--gmp-accent)] font-bold">READY</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
