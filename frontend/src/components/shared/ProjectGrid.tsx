"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, BookOpen, FolderGit2 } from "lucide-react";
import { Badge, Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Separator } from "@/components/ui";

const feedItems = [
  {
    id: 1,
    type: "project",
    title: "Next.js 15 Full-stack Blog System",
    description: "A comprehensive blog system built with Next.js 15 App Router, Tailwind V4, and Spring Boot 3.",
    date: "2026-04-01",
    tags: ["Next.js", "React", "Spring Boot"],
    link: "#",
  },
  {
    id: 2,
    type: "blog",
    title: "探索 Tailwind CSS v4 与 React 19 的新特性",
    description: "深度剖析 Tailwind CSS V4 无配置以及并发渲染特性的实践心得，打造极致体验。",
    date: "2026-03-25",
    tags: ["CSS", "React 19"],
    link: "#",
  },
  {
    id: 3,
    type: "blog",
    title: "微交互的艺术：使用 Framer Motion",
    description: "如何在日常组件中添加极其平滑的过渡动画，并保证 60fps 以上的最佳性能。",
    date: "2026-03-12",
    tags: ["Animation", "UX/UI"],
    link: "#",
  },
  {
    id: 4,
    type: "project",
    title: "Aurora UI - React Components Library",
    description: "A set of high quality, accessible glassmorphism React components for modern SaaS.",
    date: "2026-02-28",
    tags: ["UI Library", "TypeScript"],
    link: "#",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

const cardInteractionVariants = {
  rest: { y: 0 },
  hover: {
    y: -3,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const arrowMotionVariants = {
  rest: { x: 0, y: 0, rotate: 0 },
  hover: {
    x: 2,
    y: 0,
    rotate: 45,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/**
 * 功能：渲染首页近期动态卡片网格，统一展示项目与文章入口。
 * 关键参数：无外部参数，数据源使用本地 feedItems mock。
 * 返回值/副作用：返回动态列表节点，无副作用。
 */
export default function ProjectGrid() {
  return (
    <section id="feed" className="mx-auto w-full max-w-6xl px-4 pb-20 md:px-6">
      <div id="projects" className="sr-only" aria-hidden="true" />
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-(--gmp-text-primary) md:text-3xl">近期动态</h2>
          <p className="text-sm text-(--gmp-text-secondary)">项目进展与博客文章的混合流。</p>
        </div>
        <Badge variant="outline" className="border-(--gmp-line-strong) bg-(--gmp-bg-panel) font-mono text-[11px] tracking-[0.14em] text-(--gmp-text-secondary) uppercase">
          Mixed Feed
        </Badge>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 gap-5 md:grid-cols-2"
      >
        {feedItems.map((item) => (
          <motion.div key={item.id} variants={itemVariants}>
            <motion.div initial="rest" whileHover="hover" animate="rest" variants={cardInteractionVariants}>
              <Card className="group relative h-full overflow-hidden border border-(--gmp-line-soft) bg-[rgba(15,20,30,0.7)] py-0 shadow-(--gmp-shadow-soft) transition-[border-color,background-color] duration-200 hover:border-(--gmp-line-strong) hover:bg-[rgba(20,27,39,0.78)]">
                <CardHeader className="space-y-3 border-b border-(--gmp-line-soft) px-5 py-5 transition-colors duration-200 group-hover:border-(--gmp-line-strong)">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1.5 border border-(--gmp-line-soft) bg-(--gmp-bg-panel) text-xs text-(--gmp-text-secondary) transition-colors group-hover:border-(--gmp-line-strong) group-hover:text-(--gmp-text-primary)">
                      {item.type === "project" ? <FolderGit2 className="size-3.5" /> : <BookOpen className="size-3.5" />}
                      {item.type}
                    </Badge>
                    <span className="font-mono text-[11px] tracking-[0.08em] text-(--gmp-text-secondary)">{item.date}</span>
                  </div>
                  <CardTitle className="text-xl leading-snug text-(--gmp-text-primary)">{item.title}</CardTitle>
                </CardHeader>

                <CardContent className="px-5 py-4">
                  <p className="line-clamp-3 text-sm leading-relaxed text-(--gmp-text-secondary)">{item.description}</p>
                </CardContent>

                <Separator className="mx-5 w-auto bg-(--gmp-line-soft)" />
                <CardFooter className="mt-auto flex items-center justify-between px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-(--gmp-line-soft) bg-[rgba(255,255,255,0.01)] font-mono text-[10px] tracking-[0.1em] text-(--gmp-text-secondary) uppercase">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button asChild variant="ghost" size="icon-sm" className="border border-transparent text-(--gmp-text-secondary) hover:border-(--gmp-line-soft) hover:bg-(--gmp-bg-panel) hover:text-(--gmp-text-primary)" aria-label={`查看 ${item.title}`}>
                    <Link href={item.link}>
                      <motion.span variants={arrowMotionVariants} className="inline-flex">
                        <ArrowUpRight className="size-4" />
                      </motion.span>
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
