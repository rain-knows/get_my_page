"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";
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
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(50);
  const smoothX = useSpring(pointerX, { stiffness: 150, damping: 22 });
  const smoothY = useSpring(pointerY, { stiffness: 150, damping: 22 });
  const gridOffsetX = useTransform(smoothX, [0, 100], [-11, 11]);
  const gridOffsetY = useTransform(smoothY, [0, 100], [-8, 8]);
  const geometryOffsetX = useTransform(smoothX, [0, 100], [8, -8]);
  const geometryOffsetY = useTransform(smoothY, [0, 100], [6, -6]);

  /**
   * 功能：跟踪鼠标在认证壳层中的位置，用于驱动背景层平滑位移。
   * 关键参数：event 为鼠标移动事件，包含光标在容器中的相对坐标。
   * 返回值/副作用：无返回值；会更新 motion 值，影响背景层位置。
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
      className="relative isolate min-h-dvh overflow-hidden bg-[var(--gmp-end-bg)] px-4 py-8 text-white md:px-6 md:py-10"
      onMouseMove={handlePointerMove}
      data-module="scan"
    >
      <div className="gmp-kinetic-bg pointer-events-none absolute inset-0" />
      <motion.div
        aria-hidden="true"
        className="gmp-kinetic-grid pointer-events-none absolute inset-0"
        style={reducedMotion ? undefined : { x: gridOffsetX, y: gridOffsetY }}
      />
      <motion.div
        aria-hidden="true"
        className="gmp-kinetic-geometry pointer-events-none absolute inset-0"
        style={reducedMotion ? undefined : { x: geometryOffsetX, y: geometryOffsetY }}
        data-module="scan"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className={cn("relative z-10 mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-xl flex-col justify-center", className)}
      >
        <div className="mb-4 flex items-center justify-between md:mb-5">
          <Link href="/" className="inline-flex items-center gap-2 rounded-sm border border-white/20 bg-black/45 px-2.5 py-1.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xs border border-white/22 bg-black/55 font-heading text-xs font-semibold tracking-[0.14em] text-[var(--gmp-end-accent)]">
              GMP
            </span>
            <span className="font-heading text-sm text-white/85">GetMyPage</span>
          </Link>
          <span className="font-mono text-[10px] tracking-[0.18em] text-white/52 uppercase">
            {mode === "login" ? "Auth / Login" : "Auth / Register"}
          </span>
        </div>

        <motion.div className="overflow-hidden rounded-sm border border-white/18 bg-black/42 p-5 backdrop-blur-md md:p-7">
          <header className="mb-5 border-b border-white/14 pb-4 text-center md:mb-6">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-white md:text-3xl">{title}</h1>
            <p className="mt-1.5 text-sm text-white/65">{description}</p>
          </header>

          {children}

          <footer className="mt-5 border-t border-white/14 pt-4 text-center text-sm text-white/65 md:mt-6">{footer}</footer>
        </motion.div>
      </motion.div>
    </section>
  );
}
