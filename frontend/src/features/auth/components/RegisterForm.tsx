"use client";

import { useState } from "react";
import type { SubmitEventHandler } from "react";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const currentError = localError || error;
  const currentSubmitState = loading ? "loading" : currentError ? "error" : submitState;

  /**
   * 功能：在输入字段变更时清理本地校验错误和远端错误提示。
   * 关键参数：无。
   * 返回值/副作用：无返回值；会更新组件内部错误状态。
   */
  const resetErrorsForInput = () => {
    if (localError) {
      setLocalError("");
    }
    if (error) {
      clearError();
    }
  };

  /**
   * 功能：执行提交前本地校验，确保密码复杂度与确认密码一致性。
   * 关键参数：无。
   * 返回值/副作用：返回错误消息或 null；无副作用。
   */
  const validateBeforeSubmit = (): string | null => {
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
    if (!passwordPattern.test(password)) {
      return "密码必须为 8-64 位且同时包含字母和数字";
    }
    if (password !== confirmPassword) {
      return "两次输入的密码不一致";
    }
    return null;
  };

  /**
   * 功能：构建标准化后的注册请求体，统一去除空白并格式化邮箱。
   * 关键参数：无。
   * 返回值/副作用：返回可直接提交到注册 API 的请求对象；无副作用。
   */
  const buildNormalizedPayload = () => {
    const normalizedEmail = email.trim().toLowerCase();
    return {
      username: username.trim(),
      nickname: nickname.trim(),
      password,
      email: normalizedEmail ? normalizedEmail : undefined,
    };
  };

  /**
   * 功能：处理注册提交，先执行本地校验，再调用注册 API。
   * 关键参数：event 为表单提交事件，用于阻止默认行为。
   * 返回值/副作用：无返回值；会触发注册请求、错误提示更新与路由跳转。
   */
  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setLocalError("");
    clearError();

    const validationMessage = validateBeforeSubmit();
    if (validationMessage) {
      setLocalError(validationMessage);
      setSubmitState("error");
      return;
    }

    try {
      setSubmitState("loading");
      await register(buildNormalizedPayload());
      setSubmitState("success");
      window.setTimeout(() => {
        router.push("/?from=auth");
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
          <Link href="/login" className="font-medium text-(--gmp-end-accent) transition-colors hover:text-white">
            立即登录
          </Link>
        </>
      }
    >
      {currentError && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xs border border-rose-300/42 bg-rose-400/14 px-3 py-2.5 text-sm text-rose-100"
          role="alert"
          aria-live="polite"
        >
          {currentError}
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
              onChange={(event) => {
                resetErrorsForInput();
                setUsername(event.target.value);
              }}
              placeholder="3-50 个字符"
              autoComplete="username"
              minLength={3}
              maxLength={50}
              required
              className="h-11 rounded-xs border-white/18 bg-black/42 pl-9 text-white placeholder:text-white/38 focus-visible:border-(--gmp-end-accent) focus-visible:ring-(--gmp-end-accent)/30"
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
              onChange={(event) => {
                resetErrorsForInput();
                setNickname(event.target.value);
              }}
              placeholder="显示昵称"
              maxLength={100}
              required
              className="h-11 rounded-xs border-white/18 bg-black/42 pl-9 text-white placeholder:text-white/38 focus-visible:border-(--gmp-end-accent) focus-visible:ring-(--gmp-end-accent)/30"
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
              onChange={(event) => {
                resetErrorsForInput();
                setEmail(event.target.value);
              }}
              placeholder="your@email.com"
              autoComplete="email"
              className="h-11 rounded-xs border-white/18 bg-black/42 pl-9 text-white placeholder:text-white/38 focus-visible:border-(--gmp-end-accent) focus-visible:ring-(--gmp-end-accent)/30"
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
              onChange={(event) => {
                resetErrorsForInput();
                setPassword(event.target.value);
              }}
              placeholder="8-64 位，需含字母+数字"
              autoComplete="new-password"
              minLength={8}
              maxLength={64}
              required
              className="h-11 rounded-xs border-white/18 bg-black/42 pr-10 pl-9 text-white placeholder:text-white/38 focus-visible:border-(--gmp-end-accent) focus-visible:ring-(--gmp-end-accent)/30"
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

        <div className="space-y-2">
          <Label htmlFor="register-password-confirm" className="text-white">确认密码</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/60" />
            <Input
              id="register-password-confirm"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                resetErrorsForInput();
                setConfirmPassword(event.target.value);
              }}
              placeholder="再次输入密码"
              autoComplete="new-password"
              minLength={8}
              maxLength={64}
              required
              className="h-11 rounded-xs border-white/18 bg-black/42 pr-10 pl-9 text-white placeholder:text-white/38 focus-visible:border-(--gmp-end-accent) focus-visible:ring-(--gmp-end-accent)/30"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="relative overflow-hidden group h-12 w-full border border-(--gmp-line-strong) bg-(--gmp-accent) text-black font-heading font-black tracking-widest uppercase hover:bg-white hover:text-black transition-colors rounded-none"
        >
          <div className="absolute inset-0 gmp-halftone-btn pointer-events-none opacity-40 mix-blend-overlay" />
          <span className="relative z-10 flex items-center justify-center gap-2">
            {currentSubmitState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : currentSubmitState === "success" ? <CheckCircle2 className="h-4 w-4" /> : null}
            {currentSubmitState === "loading" ? "CREATING..." : currentSubmitState === "success" ? "ACCOUNT CREATED" : "REGISTER / 注册"}
          </span>
        </Button>
      </motion.form>
    </InteractiveAuthShell>
  );
}
