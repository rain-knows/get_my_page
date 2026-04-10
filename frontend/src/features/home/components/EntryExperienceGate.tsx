"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { EndfieldLoadingScreen } from "@/features/home/components/EndfieldLoadingScreen";
import { HomeLandingSurface } from "@/features/home/components/HomeLandingSurface";

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
 * 功能：构建首页加载门控，确保页面每次刷新都会先进入加载阶段再展示主首页。
 * 关键参数：无外部参数，内部依赖时长配置与进度算法控制加载节奏。
 * 返回值/副作用：返回加载页或首页主场景节点，无持久化副作用。
 */
export function EntryExperienceGate() {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [hydrated, setHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const duration = useMemo(() => (prefersReducedMotion ? 820 : 2520), [prefersReducedMotion]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHydrated(true);
      setIsLoading(true);
      setProgress(0);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !isLoading) {
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
  }, [duration, hydrated, isLoading, prefersReducedMotion]);

  if (!hydrated) {
    return <HomeLandingSurface />;
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? <EndfieldLoadingScreen key="loading" progress={progress} /> : <HomeLandingSurface key="home" />}
    </AnimatePresence>
  );
}
