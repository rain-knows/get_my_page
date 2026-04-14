"use client";

import { KineticPageShell } from "@/features/surface/components/KineticPageShell";
import { Clock, HardDrive, UserCheck } from "lucide-react";

interface BlogArticleReaderProps {
  slug: string;
}

// 模拟的文章数据集沙盒
const mockArticleData = {
  title: "SYSTEM ARCHITECTURE MODEL v3.1",
  author: "NODE_ADMIN",
  publishDate: "2026-04-13 23:45",
  category: "INTEL // SEC-1",
};

export function BlogArticleReader({ slug }: BlogArticleReaderProps) {
  return (
    <KineticPageShell
      currentPath={`/blog`}
      centerTitle="ARCHIVE DATA"
      centerDescription="RESTRICTED ACCESS. DECRYPTING LOCAL INTELLIGENCE MODULE."
    >
      <div className="mx-auto w-full max-w-4xl">
        {/* 文章元数据仪表盘 - 极度机能风 */}
        <section className="mb-12 bg-(--gmp-bg-panel) p-1 gmp-cut-corner-l">
          <div className="border border-(--gmp-line-soft) bg-(--gmp-bg-base) p-6 md:p-8">
            <div className="mb-4 inline-flex items-center gap-2 bg-(--gmp-bg-panel) px-2 py-1 font-mono text-[9px] font-bold text-(--gmp-accent) uppercase tracking-widest border border-(--gmp-line-strong)">
              <span className="h-1.5 w-1.5 bg-(--gmp-accent) animate-pulse" />
              SLUG: {slug}
            </div>
            
            <h1 className="font-heading text-3xl font-black uppercase text-white mb-8 leading-tight tracking-tight drop-shadow-md">
              {mockArticleData.title}
            </h1>
            
            <dl className="grid grid-cols-2 gap-4 border-t border-dashed border-(--gmp-line-strong) pt-6 sm:grid-cols-4">
              <div className="flex flex-col gap-2 border-l-2 border-(--gmp-accent) pl-4">
                <dt className="flex items-center gap-2 font-mono text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  <UserCheck className="w-3.5 h-3.5 text-(--gmp-accent)" />
                  AUTHOR
                </dt>
                <dd className="font-mono text-[11px] font-black text-white uppercase tracking-wider">{mockArticleData.author}</dd>
              </div>

              <div className="flex flex-col gap-2 border-l-2 border-(--gmp-line-strong) pl-4">
                <dt className="flex items-center gap-2 font-mono text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" />
                  TIMESTAMP
                </dt>
                <dd className="font-mono text-[11px] font-bold text-(--gmp-text-secondary) uppercase tracking-wider">{mockArticleData.publishDate}</dd>
              </div>

              <div className="flex flex-col gap-2 border-l-2 border-(--gmp-line-strong) pl-4">
                <dt className="flex items-center gap-2 font-mono text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  <HardDrive className="w-3.5 h-3.5" />
                  SECTOR
                </dt>
                <dd className="font-mono text-[11px] font-bold text-(--gmp-text-secondary) uppercase tracking-wider">{mockArticleData.category}</dd>
              </div>
              
              <div className="flex flex-col gap-2 border-l-2 border-(--gmp-line-strong) pl-4">
                <dt className="flex items-center gap-2 font-mono text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  CLEARANCE
                </dt>
                <dd className="font-mono text-[11px] font-black text-red-500 uppercase tracking-wider shadow-red-500/20 drop-shadow-md">LVL 5</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* 工业排版内容区 */}
        <article className="prose prose-invert max-w-none pr-4">
          <p className="font-mono text-sm text-(--gmp-accent) font-bold mb-8 uppercase tracking-widest border-b border-(--gmp-line-soft) pb-4 inline-flex items-center gap-4">
            <span className="w-2 h-2 bg-(--gmp-accent)" />
             [{mockArticleData.category}] SYSTEM DOCUMENTATION INITIALIZED.
          </p>
          
          <div className="text-(--gmp-text-secondary) leading-8 space-y-6">
            <p className="text-white">
              This is a sandbox visualization of the reading dashboard. The structure is heavily customized for high contrast readability while maintaining the strict geometric boundaries of the Arknights industrial aesthetics. Notice the lack of standard rounded corners; every block quote, code block, and informational panel relies on deep cuts or sharp angular highlights.
            </p>
            
            <blockquote className="border-l-4 border-(--gmp-accent) bg-(--gmp-bg-panel) pt-8 pb-6 px-6 my-8 font-mono text-sm text-(--gmp-text-primary) relative gmp-cut-corner-br">
              <div className="absolute top-0 right-0 p-2 px-4 bg-(--gmp-bg-base) text-(--gmp-accent) text-[9px] font-bold uppercase tracking-widest border-b border-l border-(--gmp-line-soft) gmp-cut-corner-bl flex gap-2 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-(--gmp-accent) animate-pulse" />
                ATTENTION
              </div>
              <p className="mt-2 text-[13px] leading-relaxed tracking-wide">ALL LOGS MUST BE STRICTLY FORMATTED. NO DEVIATIONS ALLOWED. ANY UNAUTHORIZED ACCESS WILL BE TRACKED AND REPORTED TO SECTOR CONTROL IMMEDIATE.</p>
            </blockquote>

            <p>
              When utilizing markdown rendering components in the future, these exact typographic tokens should be mapped to the `ul`, `li`, `blockquote`, and `code` variables to ensure narrative fidelity.
            </p>

            <ul className="list-none space-y-3 mt-8 font-medium">
              <li className="flex items-start gap-3">
                <span className="font-mono text-[10px] text-(--gmp-accent) mt-1.5">01 //</span>
                <span className="text-white">Optimal resolution matrix initialized.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-[10px] text-(--gmp-accent) mt-1.5">02 //</span>
                <span className="text-white">Telemetry modules synced and broadcasting.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-[10px] text-(--gmp-accent) mt-1.5">03 //</span>
                <span className="text-white">Primary payload encrypted and loaded into RAM.</span>
              </li>
            </ul>
             
             <div className="mt-20 pt-8 border-t border-dashed border-(--gmp-line-strong) flex justify-center">
                <span className="bg-(--gmp-bg-panel) px-6 py-2 border border-(--gmp-line-soft) font-mono text-[10px] text-(--gmp-text-secondary) tracking-widest font-black uppercase gmp-cut-corner-l">
                  [ END OF RECORD // CONNECTION TERMINATED ]
                </span>
             </div>
          </div>
        </article>
      </div>
    </KineticPageShell>
  );
}
