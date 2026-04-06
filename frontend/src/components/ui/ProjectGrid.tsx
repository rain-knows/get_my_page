"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, FolderGit2, BookOpen } from "lucide-react";
import Link from "next/link";

// Mock data: mixed stream of Blog Posts and Projects
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
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

export default function ProjectGrid() {
  return (
    <section id="feed" className="relative w-full max-w-6xl mx-auto px-6 py-24 z-10">
      <div className="mb-12 flex items-baseline justify-between">
        <h2 className="font-heading text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-white/60">
          近期动态
        </h2>
        <span className="text-sm font-medium text-neutral-500">MIXED FEED</span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {feedItems.map((item) => (
          <motion.div key={item.id} variants={itemVariants}>
            <Link
              href={item.link}
              className="group block relative h-full bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm overflow-hidden hover:bg-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer"
            >
              {/* Type Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center p-2 rounded-lg bg-neutral-900 border border-white/5 text-neutral-400 group-hover:text-blue-400 transition-colors">
                  {item.type === "project" ? <FolderGit2 size={16} /> : <BookOpen size={16} />}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {item.type}
                </span>
              </div>

              <h3 className="font-heading text-xl md:text-2xl font-bold text-white/90 mb-3 group-hover:text-white transition-colors">
                {item.title}
              </h3>

              <p className="text-neutral-400 mb-8 leading-relaxed line-clamp-3">
                {item.description}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                <div className="flex flex-wrap items-center gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase bg-white/5 border border-white/10 rounded-full text-neutral-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <span className="p-1.5 rounded-full bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white transition-all transform group-hover:rotate-45">
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
