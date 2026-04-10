"use client";

import { EntryExperienceGate } from "@/features/home/components/EntryExperienceGate";

/**
 * 功能：首页对外渲染入口，统一承接加载门控与主页面视觉场景。
 * 关键参数：无外部参数。
 * 返回值/副作用：返回首页体验节点，无副作用。
 */
export function HomePageExperience() {
  return <EntryExperienceGate />;
}
