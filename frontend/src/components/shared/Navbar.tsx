"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Code2, LogIn, Search } from "lucide-react";
import { Badge, Button } from "@/components/ui";

/**
 * 功能：渲染首页顶部导航，提供核心入口与外部链接。
 * 关键参数：无外部参数，导航项与按钮在组件内部静态定义。
 * 返回值/副作用：返回导航头部节点，无副作用。
 */
export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="industrial-panel sticky top-3 z-50 mx-auto mt-3 flex w-[min(1100px,calc(100%-1.5rem))] items-center justify-between rounded-2xl px-4 py-3 backdrop-blur-sm md:px-5"
    >
      <div className="flex items-center gap-3">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="inline-flex size-8 items-center justify-center rounded-md border border-(--gmp-line-strong) bg-(--gmp-bg-panel) font-mono text-xs font-semibold tracking-[0.18em] text-(--gmp-accent)">
            GMP
          </span>
          <span className="font-heading text-sm font-semibold tracking-wide text-(--gmp-text-primary) md:text-base">GetMyPage</span>
        </Link>
        <Badge variant="outline" className="hidden border-(--gmp-line-strong) bg-(--gmp-bg-panel) font-mono text-[10px] tracking-[0.16em] text-(--gmp-text-secondary) uppercase lg:inline-flex">
          Sector 01
        </Badge>
      </div>

      <nav className="hidden items-center gap-6 text-sm text-(--gmp-text-secondary) md:flex">
        <Link href="#feed" className="transition-colors hover:text-(--gmp-text-primary)">
          近期动态
        </Link>
        <Link href="#flow" className="transition-colors hover:text-(--gmp-text-primary)">
          创作流程
        </Link>
        <Link href="#projects" className="transition-colors hover:text-(--gmp-text-primary)">
          作品集
        </Link>
      </nav>

      <div className="flex items-center gap-1.5">
        <Button asChild variant="ghost" size="icon-sm" className="border border-transparent text-(--gmp-text-secondary) hover:border-(--gmp-line-soft) hover:bg-(--gmp-bg-panel) hover:text-(--gmp-text-primary)" aria-label="登录">
          <Link href="/login">
            <LogIn className="size-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon-sm" className="border border-transparent text-(--gmp-text-secondary) hover:border-(--gmp-line-soft) hover:bg-(--gmp-bg-panel) hover:text-(--gmp-text-primary)" aria-label="搜索">
          <Search className="size-4" />
        </Button>
        <Button asChild variant="ghost" size="icon-sm" className="border border-transparent text-(--gmp-text-secondary) hover:border-(--gmp-line-soft) hover:bg-(--gmp-bg-panel) hover:text-(--gmp-text-primary)" aria-label="GitHub">
          <Link href="https://github.com" target="_blank" rel="noreferrer">
            <Code2 className="size-4" />
          </Link>
        </Button>
      </div>
    </motion.header>
  );
}
