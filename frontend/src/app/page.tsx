import Navbar from "@/components/shared/Navbar";
import Hero from "@/components/shared/Hero";
import FlowShowcase from "@/components/shared/FlowShowcase";
import ProjectGrid from "@/components/shared/ProjectGrid";

/**
 * 功能：组合首页导航、首屏与动态列表模块。
 * 关键参数：无外部参数，直接渲染首页静态组合结构。
 * 返回值/副作用：返回首页主视图节点，无副作用。
 */
export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="industrial-grid-bg pointer-events-none absolute inset-0 -z-30" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,transparent_0%,rgba(6,8,12,0.45)_26%,rgba(6,8,12,0.75)_100%)]" />
      <Navbar />
      <Hero />
      <FlowShowcase />
      <ProjectGrid />
    </main>
  );
}
