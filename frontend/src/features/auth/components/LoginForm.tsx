"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { useAuthActions } from "@/features/auth/hooks";
import { InteractiveAuthShell } from "@/features/auth/components/InteractiveAuthShell";

/**
 * 功能：渲染登录表单并驱动认证提交流程，结合居中认证壳层输出单卡片体验。
 * 关键参数：无外部参数，内部维护 username/password 与提交状态机。
 * 返回值/副作用：返回登录页业务组件；登录成功后跳转首页。
 */
export function LoginForm() {
  const router = useRouter();
  const { login, loading, error, clearError } = useAuthActions();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const currentSubmitState = loading ? "loading" : error ? "error" : submitState;

  /**
   * 功能：处理登录表单提交并执行登录请求，按结果更新状态机并跳转。
   * 关键参数：event 为表单提交事件，用于阻止浏览器默认刷新行为。
   * 返回值/副作用：无返回值；成功时跳转首页，失败时更新错误状态。
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setSubmitState("loading");

    try {
      await login({ username, password });
      setSubmitState("success");
      window.setTimeout(() => {
        router.push("/");
      }, 220);
    } catch {
      setSubmitState("error");
    }
  };

  return (
    <InteractiveAuthShell
      mode="login"
      title="欢迎回来"
      description="完成验证后，继续你的内容创作与系统管理。"
      footer={
        <>
          还没有账户？{" "}
          <Link href="/register" className="font-medium text-[var(--gmp-end-accent)] transition-colors hover:text-white">
            立即注册
          </Link>
        </>
      }
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xs border border-rose-300/42 bg-rose-400/14 px-3 py-2.5 text-sm text-rose-100"
          role="alert"
          aria-live="polite"
        >
          {error}
        </motion.div>
      )}

      <motion.form onSubmit={handleSubmit} className="space-y-4" layout>
        <div className="space-y-2">
          <Label htmlFor="login-username" className="text-white">用户名</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/60" />
            <Input
              id="login-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="输入用户名"
              autoComplete="username"
              required
              className="h-11 rounded-xs border-white/18 bg-black/42 pl-9 text-white placeholder:text-white/38 focus-visible:border-[var(--gmp-end-accent)] focus-visible:ring-[var(--gmp-end-accent)]/30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password" className="text-white">密码</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/60" />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="输入密码"
              autoComplete="current-password"
              required
              className="h-11 rounded-xs border-white/18 bg-black/42 pr-10 pl-9 text-white placeholder:text-white/38 focus-visible:border-[var(--gmp-end-accent)] focus-visible:ring-[var(--gmp-end-accent)]/30"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-xs text-white/65 hover:bg-white/8 hover:text-white"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xs border border-black/20 bg-[var(--gmp-end-accent)] font-medium text-black hover:bg-[var(--gmp-end-accent-soft)]"
        >
          {currentSubmitState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : currentSubmitState === "success" ? <CheckCircle2 className="h-4 w-4" /> : null}
          {currentSubmitState === "loading" ? "登录中..." : currentSubmitState === "success" ? "验证通过" : "登录"}
        </Button>
      </motion.form>
    </InteractiveAuthShell>
  );
}
