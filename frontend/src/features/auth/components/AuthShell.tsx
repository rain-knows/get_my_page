"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { CheckCircle2, PanelsTopLeft } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
}

/**
 * 功能：提供登录/注册页面统一的视觉外壳（背景、品牌入口、卡片容器）。
 * 关键参数：title/description 控制头部文案，children 注入表单主体，footer 注入底部跳转区域。
 * 返回值/副作用：返回认证页通用布局组件，无副作用。
 */
export function AuthShell({ title, description, children, footer, className }: AuthShellProps) {
  return (
    <div className="industrial-grid-bg relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,12,0.36)_0%,rgba(7,9,12,0.72)_100%)]" />

      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="absolute top-6 left-6 z-10"
      >
        <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-(--gmp-line-soft) bg-[rgba(16,22,32,0.9)] px-2.5 py-1.5 text-sm text-(--gmp-text-secondary) transition-colors hover:text-(--gmp-text-primary)">
          <span className="flex size-7 items-center justify-center rounded-md border border-(--gmp-line-strong) bg-(--gmp-bg-panel) font-mono text-[10px] font-semibold tracking-[0.12em] text-(--gmp-accent)">
            GMP
          </span>
          <span className="font-heading font-medium">GetMyPage</span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.04 }}
        className={cn("relative z-10 w-full max-w-4xl", className)}
      >
        <Card className="overflow-hidden border border-(--gmp-line-soft) bg-[rgba(10,14,21,0.85)] py-0 shadow-(--gmp-shadow-soft) backdrop-blur-sm">
          <div className="grid md:grid-cols-[1fr_1.15fr]">
            <div className="relative border-b border-(--gmp-line-soft) px-6 py-6 md:border-r md:border-b-0">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.012)_60%,transparent_100%)]" />
              <div className="relative space-y-4">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-(--gmp-line-strong) bg-(--gmp-bg-panel) px-2.5 py-1 font-mono text-[11px] tracking-[0.12em] text-(--gmp-accent) uppercase">
                  <PanelsTopLeft className="size-3.5" />
                  Auth Sector
                </div>
                <h2 className="font-heading text-xl font-semibold text-(--gmp-text-primary)">低噪声界面，高密度反馈</h2>
                <p className="text-sm leading-relaxed text-(--gmp-text-secondary)">登录与注册页保持同一节奏：输入、验证、进入首页，一步一步明确反馈。</p>
                <ul className="space-y-2.5">
                  {["输入字段即时反馈", "加载状态明确可见", "成功后无感跳转主页"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-(--gmp-text-secondary)">
                      <CheckCircle2 className="size-4 text-(--gmp-accent-dim)" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <div className="space-y-2 border-b border-(--gmp-line-soft) px-6 pt-6 pb-5 text-center">
                <h1 className="font-heading text-2xl font-semibold tracking-tight text-(--gmp-text-primary)">{title}</h1>
                <p className="text-sm text-(--gmp-text-secondary)">{description}</p>
              </div>
              <div className="px-6 py-6">{children}</div>
              <div className="border-t border-(--gmp-line-soft) px-6 py-4 text-center text-sm text-(--gmp-text-secondary)">{footer}</div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
