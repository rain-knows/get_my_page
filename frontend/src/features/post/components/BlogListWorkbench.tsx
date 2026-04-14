"use client";

import Link from "next/link";
import { KineticPageShell } from "@/features/surface/components/KineticPageShell";
import { ChevronRight, DatabaseZap, Terminal } from "lucide-react";

interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  author: string;
}

const mockPosts: readonly BlogPostItem[] = [
  {
    id: "DATA-01",
    slug: "system-architecture-model-v3",
    title: "SYSTEM ARCHITECTURE MODEL v3.1",
    summary: "Comprehensive breakdown of the newly established modular data grid. Warning: Level 5 access required for full appendices.",
    category: "INTEL // SEC-1",
    date: "2026-04-13",
    author: "NODE_ADMIN",
  },
  {
    id: "DATA-02",
    slug: "operator-guidelines",
    title: "OPERATOR FIELD GUIDELINES",
    summary: "Standard operational procedures for new external contracts. Review mandatory before deployment.",
    category: "PROTOCOL // G",
    date: "2026-04-11",
    author: "HR_DEPT",
  },
  {
    id: "DATA-03",
    slug: "anomalous-signal-log",
    title: "ANOMALOUS SIGNAL LOG",
    summary: "Decrypted transmission from sector 7. High likelihood of external breach attempt. Analysis pending.",
    category: "WARNING // ALERT",
    date: "2026-04-09",
    author: "SEC_TEAM",
  },
];

export function BlogListWorkbench() {
  return (
    <KineticPageShell
      currentPath="/blog"
      centerTitle="KNOWLEDGE BASE"
      centerDescription="STORED PROTOCOLS AND REUSABLE STRATEGIC PATTERNS."
    >
      <section className="space-y-6 max-w-5xl mx-auto px-2">
        {/* Module Header Segment */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-[var(--gmp-line-strong)] pb-4">
          <div className="flex items-center gap-3 text-white">
            <DatabaseZap className="h-6 w-6 text-[var(--gmp-accent)]" />
            <span className="font-heading text-lg font-black tracking-widest uppercase mt-1">
              INDEXED ARCHIVES
            </span>
          </div>
          <p className="font-mono text-[10px] font-bold tracking-widest text-[var(--gmp-text-secondary)] uppercase">
            LOCAL STORAGE // {mockPosts.length} FRAGMENTS
          </p>
        </div>

        {/* Blog Post List */}
        <div className="grid gap-6">
          {mockPosts.map((post) => (
            <Link 
              key={post.id} 
              href={`/blog/${post.slug}`}
              className="gmp-hover-fill group block relative border border-[var(--gmp-line-soft)] bg-[var(--gmp-bg-elevated)] p-6 md:p-8 transition-colors min-h-[140px] gmp-cut-corner-br"
            >
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10 w-full md:pr-12">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="h-4 w-4 text-[var(--gmp-accent)] group-hover:text-black transition-colors" />
                    <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--gmp-accent)] group-hover:text-black uppercase transition-colors">
                      {post.category}
                    </span>
                  </div>
                  <h2 className="font-heading text-xl md:text-2xl font-black text-white group-hover:text-black uppercase mb-3 drop-shadow-sm transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm font-medium leading-relaxed text-[var(--gmp-text-secondary)] group-hover:text-[#333] transition-colors max-w-3xl line-clamp-2">
                    {post.summary}
                  </p>
                </div>
                
                <div className="flex flex-row flex-wrap md:flex-col items-center md:items-end gap-3 mt-4 md:mt-0 font-mono text-[10px] font-bold tracking-widest uppercase text-[var(--gmp-text-secondary)] group-hover:text-black transition-colors md:min-w-[120px]">
                   <span>{post.id}</span>
                   <span>{post.date}</span>
                   <span className="border border-[var(--gmp-line-strong)] group-hover:border-black px-2 mt-1">{post.author}</span>
                </div>
              </div>

              {/* Action Arrow Overlaid (Desktop) */}
              <div className="hidden md:flex absolute right-6 bottom-6 w-10 h-10 items-center justify-center border border-[var(--gmp-line-strong)] bg-[var(--gmp-bg-base)] group-hover:bg-black group-hover:border-black transition-colors z-20">
                <ChevronRight className="w-5 h-5 text-white group-hover:text-[var(--gmp-accent)]" />
              </div>

              {/* Decorative Corner */}
              <div className="absolute left-0 top-0 w-2 h-2 bg-[var(--gmp-accent)] group-hover:bg-black transition-colors" />
            </Link>
          ))}
        </div>
      </section>
    </KineticPageShell>
  );
}
