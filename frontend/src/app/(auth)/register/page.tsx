"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { useAuthActions } from "@/features/auth/hooks";
import { AuthShell } from "@/features/auth/components/AuthShell";

/**
 * 功能：渲染注册页面并提交注册信息创建新账户。
 * 关键参数：无外部参数，内部维护 username/nickname/email/password 四项字段。
 * 返回值/副作用：返回注册页面节点；注册成功后会跳转到首页。
 */
export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error, clearError } = useAuthActions();

  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /**
   * 功能：处理注册表单提交并调用注册 API。
   * 关键参数：e 为表单提交事件，用于阻止默认提交行为。
   * 返回值/副作用：无返回值；会触发注册请求并在成功后跳转首页。
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    try {
      await register({
        username,
        nickname,
        password,
        email: email || undefined,
      });
      router.push("/");
    } catch (err) {
      void err;
    }
  };

  return (
    <AuthShell
      title="创建账户"
      description="完成注册后即可发布内容、管理作品与订阅。"
      footer={
        <>
          已有账户？{" "}
          <Link href="/login" className="font-medium text-[var(--gmp-accent)] transition-colors hover:text-[var(--gmp-text-primary)]">
            立即登录
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
          <Label htmlFor="register-username" className="text-[var(--gmp-text-primary)]">用户名</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--gmp-text-secondary)]" />
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
              className="h-11 border-[var(--gmp-line-soft)] bg-[rgba(255,255,255,0.02)] pl-9 text-[var(--gmp-text-primary)] placeholder:text-[var(--gmp-text-secondary)] focus-visible:border-[var(--gmp-line-strong)] focus-visible:ring-[var(--gmp-accent-dim)]/25"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-nickname" className="text-[var(--gmp-text-primary)]">昵称</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--gmp-text-secondary)]" />
            <Input
              id="register-nickname"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="显示昵称"
              maxLength={100}
              required
              className="h-11 border-[var(--gmp-line-soft)] bg-[rgba(255,255,255,0.02)] pl-9 text-[var(--gmp-text-primary)] placeholder:text-[var(--gmp-text-secondary)] focus-visible:border-[var(--gmp-line-strong)] focus-visible:ring-[var(--gmp-accent-dim)]/25"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email" className="text-[var(--gmp-text-primary)]">邮箱（可选）</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--gmp-text-secondary)]" />
            <Input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="h-11 border-[var(--gmp-line-soft)] bg-[rgba(255,255,255,0.02)] pl-9 text-[var(--gmp-text-primary)] placeholder:text-[var(--gmp-text-secondary)] focus-visible:border-[var(--gmp-line-strong)] focus-visible:ring-[var(--gmp-accent-dim)]/25"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password" className="text-[var(--gmp-text-primary)]">密码</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--gmp-text-secondary)]" />
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 个字符"
              autoComplete="new-password"
              minLength={6}
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
          {loading ? "注册中..." : "注册"}
        </Button>
      </motion.form>
    </AuthShell>
  );
}
