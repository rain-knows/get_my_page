"use client";

import type { MouseEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import { Activity, Cpu, ScanSearch, ShieldCheck, UserRoundPen } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export type AuthSubmitState = "idle" | "loading" | "success" | "error";
export type AuthFieldKey = "username" | "email" | "nickname" | "password" | null;

interface InteractiveAuthShellProps {
  title: string;
  description: string;
  mode: "login" | "register";
  activeField: AuthFieldKey;
  submitState: AuthSubmitState;
  footer: ReactNode;
  children: ReactNode;
  className?: string;
}

const defaultHighlights = {
  username: {
    title: "身份验证通道",
    description: "用户名聚焦时，系统会优先校验命名规则与可用性提示。",
    icon: ScanSearch,
  },
  nickname: {
    title: "公开身份配置",
    description: "昵称是对外展示层，建议保持可读、稳定、低歧义。",
    icon: UserRoundPen,
  },
  email: {
    title: "通知路由节点",
    description: "邮箱用于关键通知回路，当前阶段保持可选输入。",
    icon: Cpu,
  },
  password: {
    title: "安全防护层",
    description: "密码输入阶段启用更高亮反馈，并强化错误提示可见性。",
    icon: ShieldCheck,
  },
  idle: {
    title: "认证控制面板",
    description: "输入、校验、提交三段流程可视化，减少状态不确定性。",
    icon: Activity,
  },
} as const;

/**
 * 功能：根据字段焦点与提交状态生成左侧情报区主文案，形成输入联动反馈。
 * 关键参数：activeField 表示当前聚焦字段；submitState 表示表单提交状态机。
 * 返回值/副作用：返回当前应展示的标题、描述与图标，无副作用。
 */
function resolveHighlight(activeField: AuthFieldKey, submitState: AuthSubmitState) {
  if (submitState === "success") {
    return {
      title: "认证完成",
      description: "凭证已通过校验，正在进入主页控制台。",
      icon: ShieldCheck,
    };
  }

  if (submitState === "error") {
    return {
      title: "校验失败",
      description: "请修正提示字段后重新提交，系统会保留已输入内容。",
      icon: ScanSearch,
    };
  }

  if (!activeField) {
    return defaultHighlights.idle;
  }

  return defaultHighlights[activeField];
}

/**
 * 功能：渲染高交互认证壳层，提供鼠标光斑、视差、共享元素与状态联动信息区。
 * 关键参数：mode 控制登录/注册语义，activeField 与 submitState 驱动左侧联动情报。
 * 返回值/副作用：返回认证页通用壳层节点，无副作用。
 */
export function InteractiveAuthShell({
  title,
  description,
  mode,
  activeField,
  submitState,
  footer,
  children,
  className,
}: InteractiveAuthShellProps) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [hovering, setHovering] = useState(false);

  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(50);
  const smoothX = useSpring(pointerX, { stiffness: 150, damping: 22 });
  const smoothY = useSpring(pointerY, { stiffness: 150, damping: 22 });
  const offsetX = useTransform(smoothX, [0, 100], [-10, 10]);
  const offsetY = useTransform(smoothY, [0, 100], [-8, 8]);
  const spotlight = useMotionTemplate`radial-gradient(540px circle at ${smoothX}% ${smoothY}%, rgba(255,232,121,0.25), rgba(255,232,121,0.04) 34%, transparent 68%)`;

  const highlight = useMemo(() => resolveHighlight(activeField, submitState), [activeField, submitState]);

  /**
   * 功能：处理鼠标在壳层中的移动，计算相对坐标用于光斑和视差联动。
   * 关键参数：event 为鼠标移动事件，包含光标在视口中的位置。
   * 返回值/副作用：无返回值；会更新内部 motion 值驱动动画。
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
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="gmp-auth-grid-bg pointer-events-none absolute inset-0" />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={reducedMotion ? undefined : { backgroundImage: spotlight }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className={cn("relative z-10 mx-auto w-full max-w-6xl", className)}
      >
        <div className="mb-4 flex items-center justify-between md:mb-5">
          <Link href="/" className="inline-flex items-center gap-2 rounded-sm border border-white/20 bg-black/45 px-2.5 py-1.5">
            <motion.span layoutId="auth-gmp-logo" className="inline-flex h-8 w-8 items-center justify-center rounded-xs border border-white/22 bg-black/55 font-heading text-xs font-semibold tracking-[0.14em] text-[var(--gmp-end-accent)]">
              GMP
            </motion.span>
            <span className="font-heading text-sm text-white/85">GetMyPage</span>
          </Link>
          <span className="font-mono text-[10px] tracking-[0.18em] text-white/52 uppercase">
            {mode === "login" ? "Auth / Login" : "Auth / Register"}
          </span>
        </div>

        <motion.div
          layoutId="auth-main-frame"
          className="grid overflow-hidden rounded-sm border border-white/18 bg-black/42 backdrop-blur-md md:grid-cols-[1fr_1.14fr]"
        >
          <motion.aside
            style={reducedMotion ? undefined : { x: offsetX, y: offsetY }}
            className="relative border-b border-white/14 p-5 md:border-r md:border-b-0 md:p-7"
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.01)_52%,transparent_100%)]" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-xs border border-[var(--gmp-end-accent)]/40 bg-[rgba(255,216,75,0.1)] px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-[var(--gmp-end-accent)] uppercase">
                <Activity className="h-3.5 w-3.5" />
                Signal Linked
              </div>

              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-white">{highlight.title}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-white/70">{highlight.description}</p>
              </div>

              <ul className="space-y-2.5">
                {["输入后即时反馈", "提交态锁定防重入", "成功后平滑跳转主页"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-white/72">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--gmp-end-accent)]" />
                    {item}
                  </li>
                ))}
              </ul>

              <motion.div
                animate={hovering && !reducedMotion ? { opacity: [0.55, 0.85, 0.55] } : { opacity: 0.55 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center gap-2 rounded-xs border border-white/14 bg-black/42 px-3 py-2"
              >
                <highlight.icon className="h-4 w-4 text-[var(--gmp-end-accent)]" />
                <span className="text-xs text-white/70">当前模式：{mode === "login" ? "登录" : "注册"}</span>
              </motion.div>
            </div>
          </motion.aside>

          <div className="relative p-5 md:p-7">
            <header className="mb-5 border-b border-white/14 pb-4 text-center md:mb-6">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-white md:text-3xl">{title}</h1>
              <p className="mt-1.5 text-sm text-white/65">{description}</p>
            </header>

            {children}

            <footer className="mt-5 border-t border-white/14 pt-4 text-center text-sm text-white/65 md:mt-6">{footer}</footer>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
