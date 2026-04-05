import Navbar from "@/components/ui/Navbar";
import Hero from "@/components/ui/Hero";

export default function Home() {
  return (
    <main className="relative flex flex-col min-h-screen bg-neutral-950 font-sans">
      <Navbar />
      <Hero />
      
      {/* 占位符：后续的瀑布流区域 */}
      <div className="h-[60vh] w-full flex items-center justify-center border-t border-white/5 relative z-10 bg-neutral-950/80 backdrop-blur-3xl">
         <p className="text-neutral-600 font-medium tracking-wide">
           向下滚动的更多内容 (Article Feed) 开发中...
         </p>
      </div>
    </main>
  );
}
