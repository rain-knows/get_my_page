"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { EndfieldLoadingScreen } from "@/features/home/components/EndfieldLoadingScreen";
import { HomeLandingSurface } from "@/features/home/components/HomeLandingSurface";

const HOME_ENTRY_VISITED_SESSION_KEY = "gmp:home-entry-visited";

/**
 * 功能：清理登录/注册回跳来源参数，避免用户刷新时重复触发来源判定。
 * 关键参数：无。
 * 返回值/副作用：无返回值；会通过 history.replaceState 原地更新地址栏查询参数。
 */
function clearAuthSourceQueryParam(): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  if (url.searchParams.get("from") !== "auth") {
    return;
  }

  url.searchParams.delete("from");
  const query = url.searchParams.toString();
  const nextUrl = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

/**
 * 功能：根据当前时间片计算加载进度，并在尾段做非线性加速，强化收束感。
 * 关键参数：elapsed 为已耗时毫秒，duration 为总时长毫秒。
 * 返回值/副作用：返回 0-100 的进度数值，无副作用。
 */
function computeProgress(elapsed: number, duration: number): number {
  const ratio = Math.max(0, Math.min(1, elapsed / duration));
  const eased = ratio < 0.86 ? ratio * 0.82 : 0.7052 + (1 - Math.pow(1 - ratio, 2.6)) * 0.2948;
  return Math.min(100, eased * 100);
}

/**
 * 功能：构建首页加载门控，仅在会话首次进入首页或认证成功回跳首页时展示加载页。
 * 关键参数：无外部参数，内部依赖时长配置与进度算法控制加载节奏。
 * 返回值/副作用：返回加载页或首页主场景节点；会写入 sessionStorage 并清理来源查询参数。
 */
export function EntryExperienceGate() {
  const searchParams = useSearchParams();
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [gateResolved, setGateResolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fromAuth, setFromAuth] = useState(false);

  // 精简总展示时长，常规模式由 2520ms 下调至 1600ms，避免视觉疲劳
  const duration = useMemo(() => (prefersReducedMotion ? 820 : 1600), [prefersReducedMotion]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      // 会话内首次访问首页，或认证成功回跳首页时才触发加载体验。
      const hasVisited = window.sessionStorage.getItem(HOME_ENTRY_VISITED_SESSION_KEY) === "1";
      const authSource = searchParams.get("from") === "auth";
      const shouldShowLoading = !hasVisited || authSource;

      setFromAuth(authSource);
      setIsLoading(shouldShowLoading);
      if (shouldShowLoading) {
        setProgress(0);
      }

      setGateResolved(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [searchParams]);

  useEffect(() => {
    if (!gateResolved || !isLoading) {
      return;
    }

    const start = performance.now();
    let frameId = 0;

    const tick = () => {
      const elapsed = performance.now() - start;
      const value = computeProgress(elapsed, duration);
      setProgress(value);

      if (elapsed >= duration) {
        setProgress(100);
        window.setTimeout(() => {
          window.sessionStorage.setItem(HOME_ENTRY_VISITED_SESSION_KEY, "1");
          if (fromAuth) {
            clearAuthSourceQueryParam();
            setFromAuth(false);
          }
          setIsLoading(false);
        }, prefersReducedMotion ? 60 : 220);
        return;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [duration, fromAuth, gateResolved, isLoading, prefersReducedMotion]);

  if (!gateResolved) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? <EndfieldLoadingScreen key="loading" progress={progress} /> : <HomeLandingSurface key="home" />}
    </AnimatePresence>
  );
}
