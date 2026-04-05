"use client";

import { motion } from "framer-motion";
import { Code2, Search } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-4 right-4 max-w-[800px] mx-auto z-50 flex items-center justify-between px-6 py-3 rounded-full backdrop-blur-xl bg-neutral-950/60 border border-white/10 shadow-2xl shadow-black/50"
    >
      <Link href="/" className="flex items-center gap-3 cursor-pointer group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow duration-300">
          G
        </div>
        <span className="font-heading font-semibold tracking-tight text-white/90 text-lg group-hover:text-white transition-colors duration-200">GetMyPage</span>
      </Link>

      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
        <Link href="#feed" className="hover:text-white transition-colors duration-200 cursor-pointer">近期动态</Link>
        <Link href="#projects" className="hover:text-white transition-colors duration-200 cursor-pointer">作品集</Link>
        <Link href="#about" className="hover:text-white transition-colors duration-200 cursor-pointer">关于我</Link>
      </nav>

      <div className="flex items-center gap-1 md:gap-2">
        <button className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 cursor-pointer" aria-label="Search">
          <Search size={18} />
        </button>
        <Link href="https://github.com" target="_blank" className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 cursor-pointer" aria-label="GitHub">
          <Code2 size={18} />
        </Link>
      </div>
    </motion.header>
  );
}
