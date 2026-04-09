"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { useAuthActions } from "@/features/auth/hooks";
import { AuthShell } from "@/features/auth/components/AuthShell";

/**
 * 功能：渲染登录页面并提交账户密码到认证模块完成登录。
 * 关键参数：无外部参数，内部使用 username/password 作为登录凭据。
 * 返回值/副作用：返回登录页面节点；提交成功后会跳转到首页。
 */
export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error, clearError } = useAuthActions();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /**
   * 功能：处理登录表单提交并调用登录 API。
   * 关键参数：e 为表单提交事件，用于阻止浏览器默认刷新行为。
   * 返回值/副作用：无返回值；会触发登录请求并在成功后执行路由跳转。
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    try {
      await login({ username, password });
      router.push("/");
    } catch (err) {
      void err;
    }
  };

  return (
    <AuthShell
      title="欢迎回来"
      description="登录后继续管理你的内容与灵感。"
      footer={
        <>
          还没有账户？{" "}
          <Link href="/register" className="font-medium text-[var(--gmp-accent)] transition-colors hover:text-[var(--gmp-text-primary)]">
            立即注册
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-rose-300/35 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="username" className="text-[var(--gmp-text-primary)]">用户名</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--gmp-text-secondary)]" />
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="输入用户名"
              autoComplete="username"
              required
              className="h-11 border-[var(--gmp-line-soft)] bg-[rgba(255,255,255,0.02)] pl-9 text-[var(--gmp-text-primary)] placeholder:text-[var(--gmp-text-secondary)] focus-visible:border-[var(--gmp-line-strong)] focus-visible:ring-[var(--gmp-accent-dim)]/25"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[var(--gmp-text-primary)]">密码</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--gmp-text-secondary)]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="输入密码"
              autoComplete="current-password"
              required
              className="h-11 border-[var(--gmp-line-soft)] bg-[rgba(255,255,255,0.02)] pr-10 pl-9 text-[var(--gmp-text-primary)] placeholder:text-[var(--gmp-text-secondary)] focus-visible:border-[var(--gmp-line-strong)] focus-visible:ring-[var(--gmp-accent-dim)]/25"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-1 -translate-y-1/2 text-[var(--gmp-text-secondary)] hover:bg-[var(--gmp-bg-panel)] hover:text-[var(--gmp-text-primary)]"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="h-11 w-full border border-[var(--gmp-line-strong)] bg-[var(--gmp-accent)] text-black font-medium hover:bg-[#e2d3b4]">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "登录中..." : "登录"}
        </Button>
      </motion.form>
    </AuthShell>
  );
}
