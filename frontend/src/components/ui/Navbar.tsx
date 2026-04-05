"use client";

import { motion } from "framer-motion";
import { Code2, Search } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md bg-neutral-950/40 border-b border-white/5"
    >
      <div className="flex items-center gap-3 cursor-pointer">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
          G
        </div>
        <span className="font-semibold tracking-tight text-white/90 text-lg">GetMyPage</span>
      </div>

      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
        <Link href="#" className="hover:text-white transition-colors">最新博文</Link>
        <Link href="#" className="hover:text-white transition-colors">技术分类</Link>
        <Link href="#" className="hover:text-white transition-colors">灵感瀑布</Link>
        <Link href="#" className="hover:text-white transition-colors">关于我</Link>
      </nav>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
          <Search size={18} />
        </button>
        <Link href="https://github.com" target="_blank" className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
          <Code2 size={18} />
        </Link>
      </div>
    </motion.header>
  );
}
