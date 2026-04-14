"use client";

import Link from "next/link";
import { Activity, Terminal, Database, ArrowRight, Rss, Code2, Globe } from "lucide-react";
import { KineticPageShell } from "@/features/surface/components/KineticPageShell";

export function HomeLandingSurface() {
  return (
    <KineticPageShell
      currentPath="/"
      centerTitle="ROOT SECTOR"
      centerDescription="PRIMARY OPERATING ENVIRONMENT ESTABLISHED. ALL SYSTEMS NOMINAL."
    >
      <div className="flex flex-col gap-4 lg:gap-6 max-w-5xl mx-auto px-2 pb-12">

        {/* Top Hero Panel - The Main Visual Statement */}
        <section className="relative w-full border border-(--gmp-line-soft) bg-(--gmp-bg-panel) overflow-hidden gmp-cut-corner-br min-h-65 md:min-h-70 flex flex-col justify-end p-6 md:p-8 gmp-hard-shadow drop-shadow-xl group">
          <div className="absolute top-0 right-0 bottom-0 left-1/2 gmp-industrial-dot-grid opacity-[0.04] pointer-events-none" />
          <div className="absolute right-0 -bottom-5 font-heading text-[120px] md:text-[180px] font-black leading-none text-white/2 select-none group-hover:text-white/4 transition-colors duration-1000">
            PRTS
          </div>
          <div className="absolute left-0 top-0 w-1.5 h-full bg-(--gmp-accent) opacity-80" />

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-5 h-5 bg-(--gmp-accent) gmp-cut-corner-l">
                <span className="w-1.5 h-1.5 bg-black animate-ping" />
              </span>
              <span className="font-mono text-[10px] font-bold tracking-[0.3em] text-(--gmp-accent) uppercase">
                CONNECTION ESTABLISHED // ORIGIN NODE
              </span>
            </div>

            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-[1.1] mb-4">
              WELCOME TO THE <br />
              <span className="text-(--gmp-text-secondary)">NEXUS TERMINAL</span>
            </h2>

            <p className="font-mono text-xs md:text-sm leading-relaxed text-(--gmp-text-secondary) md:w-3/4 mb-6 border-l border-(--gmp-line-strong) pl-4">
              [ GMP V3.0 ] is the unified gateway providing immediate indexing, cross-reference telemetry, and archival data retrieval operations.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/blog"
                className="group/btn relative inline-flex h-12 items-center justify-center gap-3 bg-(--gmp-bg-base) text-white border border-(--gmp-line-strong) px-6 font-heading text-xs font-black tracking-widest uppercase transition-all hover:bg-white hover:text-black hover:border-white gmp-cut-corner-br"
              >
                <Terminal className="h-4 w-4 group-hover/btn:text-(--gmp-accent)" />
                ACCESS MAIN DB
              </Link>
              <Link
                href="/search"
                className="group/btn relative inline-flex h-12 items-center justify-center gap-3 bg-(--gmp-bg-base) text-(--gmp-text-secondary) border border-(--gmp-line-strong) px-6 font-heading text-xs font-black tracking-widest uppercase transition-all hover:border-(--gmp-accent) hover:text-(--gmp-accent) gmp-cut-corner-l"
              >
                <Activity className="h-4 w-4" />
                INITIATE SEARCH
              </Link>
            </div>
          </div>
        </section>

        {/* Lower Functional Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

          {/* Recent Operations (Blog Feed) */}
          <section className="col-span-1 lg:col-span-2 border border-(--gmp-line-soft) bg-(--gmp-bg-panel) p-5 md:p-6 gmp-cut-corner-bl flex flex-col justify-between relative overflow-hidden group">
            <div className="mb-4 flex items-center justify-between border-b border-(--gmp-line-strong) pb-3">
              <h3 className="font-mono text-[11px] font-bold tracking-[0.2em] text-white uppercase flex items-center gap-2">
                <Database className="w-4 h-4 text-(--gmp-accent)" />
                RECENT OPERATIONS
              </h3>
              <Link href="/blog" className="font-mono text-[9px] text-(--gmp-accent) tracking-widest hover:text-white transition-colors cursor-pointer flex items-center gap-1">
                VIEW_ALL <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { id: "DATA-01", title: "SYSTEM ARCHITECTURE MODEL v3.1", category: "INTEL", date: "TODAY", slug: "system-architecture-model-v3" },
                { id: "DATA-02", title: "OPERATOR FIELD GUIDELINES", category: "PROTOCOL", date: "2D AGO", slug: "operator-guidelines" },
                { id: "DATA-03", title: "ANOMALOUS SIGNAL LOG", category: "WARNING", date: "4D AGO", slug: "anomalous-signal-log" },
              ].map((item, i) => (
                <Link
                  key={i}
                  href={`/blog/${item.slug}`}
                  className="gmp-hover-fill group/item flex flex-col md:flex-row md:items-center justify-between gap-3 border border-(--gmp-line-soft) bg-(--gmp-bg-base) p-3 transition-colors"
                >
                  <div className="flex flex-col gap-1.5 flex-1 relative z-10">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[9px] font-bold text-(--gmp-text-secondary) uppercase tracking-widest">{item.category} // {item.id}</span>
                    </div>
                    <h4 className="font-heading text-sm font-black text-white group-hover/item:text-black uppercase truncate max-w-70 md:max-w-90 transition-colors">{item.title}</h4>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-6 relative z-10 w-full md:w-auto">
                    <span className="font-mono text-[10px] font-bold tracking-widest text-[#71717A] group-hover/item:text-black transition-colors uppercase">{item.date}</span>
                    <span className="flex items-center justify-center w-8 h-8 border border-(--gmp-line-strong) bg-(--gmp-bg-panel) group-hover/item:bg-black group-hover/item:border-black transition-colors">
                      <ArrowRight className="w-3 h-3 text-white group-hover/item:text-(--gmp-accent)" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Quick External Links / Status */}
          <section className="col-span-1 border border-(--gmp-line-soft) bg-[#1A1A20] p-5 md:p-6 gmp-cut-corner-tr flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 bottom-0 left-1/2 gmp-industrial-grid opacity-[0.05] pointer-events-none mix-blend-overlay" />

            <div className="mb-4 border-b border-(--gmp-line-strong) pb-3">
              <h3 className="font-mono text-[11px] font-bold tracking-[0.2em] text-white uppercase flex items-center gap-2">
                <Globe className="w-4 h-4 text-(--gmp-text-secondary)" />
                EXTERNAL UPLINKS
              </h3>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              <a href="#" className="flex items-center justify-between p-2.5 border border-(--gmp-line-strong) bg-(--gmp-bg-base) hover:border-(--gmp-accent) transition-colors group/link">
                <div className="flex items-center gap-3">
                  <Code2 className="w-4 h-4 text-white group-hover/link:text-(--gmp-accent) transition-colors" />
                  <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">SOURCE_CODE</span>
                </div>
                <ArrowRight className="w-3 h-3 text-(--gmp-text-secondary) group-hover/link:text-(--gmp-accent) group-hover/link:-rotate-45 transition-all" />
              </a>

              <a href="#" className="flex items-center justify-between p-2.5 border border-(--gmp-line-strong) bg-(--gmp-bg-base) hover:border-(--gmp-accent) transition-colors group/link">
                <div className="flex items-center gap-3">
                  <Rss className="w-4 h-4 text-white group-hover/link:text-(--gmp-accent) transition-colors" />
                  <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">RSS_FEED</span>
                </div>
                <span className="font-mono text-[9px] text-(--gmp-accent)">ONLINE</span>
              </a>

              <div className="mt-3 pt-3 border-t border-dashed border-(--gmp-line-strong)">
                <p className="font-mono text-[10px] leading-relaxed text-(--gmp-text-secondary) mb-2">
                  System status is regularly monitored. For core metrics, access the admin terminal directly.
                </p>
                <div className="inline-flex w-full px-3 py-2 bg-(--gmp-bg-base) border border-(--gmp-line-strong) text-white font-mono text-[10px] font-bold uppercase tracking-widest justify-center hover:bg-white hover:text-black cursor-pointer transition-colors">
                  TERMINAL AUTH
                </div>
              </div>
            </div>
          </section>
        </div>

      </div>
    </KineticPageShell>
  );
}
