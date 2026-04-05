"use client";

import { motion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-20 px-4">
      {/* 极光背景特效 */}
      <div className="absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] md:w-[800px] md:h-[600px] bg-blue-600/20 blur-[120px] rounded-full opacity-60 mix-blend-screen pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 -z-10 w-[300px] h-[300px] md:w-[400px] md:h-[400px] bg-violet-600/20 blur-[100px] rounded-full opacity-50 mix-blend-screen pointer-events-none" />

      {/* 点阵网格背景 */}
      <div className="absolute inset-0 -z-20 h-full w-full bg-[radial-gradient(#ffffff15_1px,transparent_1px)] bg-size-[24px_24px] md:bg-size-[32px_32px] pointer-events-none" />

      {/* 半透明渐变遮罩 */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-transparent via-neutral-950/50 to-neutral-950 pointer-events-none" />

      {/* 核心视觉文字 */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-4xl mx-auto flex flex-col items-center"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-medium text-blue-300"
        >
          <Terminal size={14} className="text-blue-400" />
          <span>V1.0 is now live for testing</span>
        </motion.div>

        <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white to-white/60 mb-6 drop-shadow-sm leading-tight pb-2">
          写给未来的代码<br />
          <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-indigo-400 to-violet-500">
            读给世界的文字
          </span>
        </h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl leading-relaxed px-4"
        >
          一个具备高度客制化的现代数字花园。采用 Next.js 与 弹性后台架构驱动，将每一次灵感记录转化为震撼视角的极客体验。
        </motion.p>

        {/* 交互按钮区域 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-6"
        >
          <button className="cursor-pointer group relative w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-black font-heading font-semibold rounded-full overflow-hidden hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)]">
            <span className="relative z-10">探索最近输出</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-linear-to-r from-blue-200 to-violet-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </button>
          
          <button className="cursor-pointer w-full sm:w-auto px-8 py-3.5 bg-white/5 text-white font-medium rounded-full border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-white/20 active:bg-white/5 transition-colors duration-300">
            订阅我的专栏
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
