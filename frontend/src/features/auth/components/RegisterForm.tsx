"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { useAuthActions } from "@/features/auth/hooks";
import { InteractiveAuthShell } from "@/features/auth/components/InteractiveAuthShell";

/**
 * 功能：渲染注册表单并驱动注册流程，提供与登录一致的居中单卡片体验。
 * 关键参数：无外部参数，内部维护注册字段与提交状态机。
 * 返回值/副作用：返回注册页业务组件；注册成功后跳转首页。
 */
export function RegisterForm() {
  const router = useRouter();
  const { register, loading, error, clearError } = useAuthActions();

  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const currentSubmitState = loading ? "loading" : error ? "error" : submitState;

  /**
   * 功能：处理注册提交并调用注册 API，成功后写入状态并跳转首页。
   * 关键参数：event 为表单提交事件，用于阻止默认行为。
   * 返回值/副作用：无返回值；会触发注册请求与路由跳转。
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setSubmitState("loading");

    try {
      await register({
        username,
        nickname,
        password,
        email: email || undefined,
      });
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
      mode="register"
      title="创建账户"
      description="接入后即可发布内容、管理作品并加入协作流。"
      footer={
        <>
          已有账户？{" "}
          <Link href="/login" className="font-medium text-[var(--gmp-end-accent)] transition-colors hover:text-white">
            立即登录
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
          <Label htmlFor="register-username" className="text-white">用户名</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/60" />
            <Input
              id="register-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="3-50 个字符"
              autoComplete="username"
              minLength={3}
              maxLength={50}
              required
              className="h-11 rounded-xs border-white/18 bg-black/42 pl-9 text-white placeholder:text-white/38 focus-visible:border-[var(--gmp-end-accent)] focus-visible:ring-[var(--gmp-end-accent)]/30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-nickname" className="text-white">昵称</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/60" />
            <Input
              id="register-nickname"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="显示昵称"
              maxLength={100}
              required
              className="h-11 rounded-xs border-white/18 bg-black/42 pl-9 text-white placeholder:text-white/38 focus-visible:border-[var(--gmp-end-accent)] focus-visible:ring-[var(--gmp-end-accent)]/30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email" className="text-white">邮箱（可选）</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/60" />
            <Input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="h-11 rounded-xs border-white/18 bg-black/42 pl-9 text-white placeholder:text-white/38 focus-visible:border-[var(--gmp-end-accent)] focus-visible:ring-[var(--gmp-end-accent)]/30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password" className="text-white">密码</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/60" />
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 个字符"
              autoComplete="new-password"
              minLength={6}
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
          {currentSubmitState === "loading" ? "注册中..." : currentSubmitState === "success" ? "创建完成" : "注册"}
        </Button>
      </motion.form>
    </InteractiveAuthShell>
  );
}
