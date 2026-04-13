"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, Compass, DatabaseZap, ScanSearch, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { KineticPageShell } from "@/features/surface/components/KineticPageShell";

interface HomeContentCard {
  id: string;
  title: string;
  summary: string;
  status: string;
  href: string;
  icon: LucideIcon;
}

const homeCards: readonly HomeContentCard[] = [
  {
    id: "01",
    title: "WEEKLY REPORT",
    summary: "Structured chronological log of recent activity and strategic findings.",
    status: "STANDBY",
    href: "/blog",
    icon: BookOpenText,
  },
  {
    id: "02",
    title: "INDEX SEARCH",
    summary: "Query the centralized archive for historical procedures and intelligence.",
    status: "PLANNING",
    href: "/search",
    icon: Compass,
  },
  {
    id: "03",
    title: "KNOWLEDGE BASE",
    summary: "Stored protocols and reusable strategic patterns for deployment.",
    status: "OFFLINE",
    href: "/blog",
    icon: DatabaseZap,
  },
  {
    id: "04",
    title: "SIGNAL MONITOR",
    summary: "Real-time feed of local node activities and anomalous transmissions.",
    status: "DRAFT",
    href: "/",
    icon: ScanSearch,
  },
  {
    id: "05",
    title: "LAUNCH CHECKLIST",
    summary: "Pre-flight authorization and verification parameters.",
    status: "UNDEFINED",
    href: "/login",
    icon: ShieldCheck,
  },
];

export function HomeLandingSurface() {
  return (
    <KineticPageShell
      currentPath="/"
      centerTitle="OPERATOR OVERVIEW"
      centerDescription="AGGREGATING CURRENT REGIONAL DATA AND PENDING OPERATIONS. STAND BY FOR ASSIGNMENT."
    >
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
        {homeCards.map((card, index) => {
          const CardIcon = card.icon;
          const isPrimary = index < 2;
          
          return (
            <article
              key={card.id}
              className={`gmp-hover-fill group relative border border-[var(--gmp-line-soft)] flex flex-col justify-between ${
                isPrimary 
                  ? "bg-[var(--gmp-bg-elevated)]" 
                  : "bg-[var(--gmp-bg-panel)]"
              } p-5 gmp-cut-corner-br transition-colors min-h-[160px]`}
            >
              {/* Card Meta Top */}
              <div className="flex justify-between items-start mb-3">
                <div className="font-mono text-[11px] font-black tracking-[0.3em] text-[var(--gmp-accent)] group-hover:text-black uppercase flex items-center gap-2 transition-colors">
                  <span className="w-2 h-2 bg-[var(--gmp-accent)] gmp-cut-corner-l group-hover:bg-[#000] inline-block transition-colors" />
                  NO. {card.id}
                </div>
                <div className="font-mono text-[9px] font-bold tracking-[0.2em] px-2 py-0.5 bg-[var(--gmp-bg-base)] border border-[var(--gmp-line-strong)] text-[var(--gmp-text-secondary)] group-hover:bg-[#000] group-hover:text-[var(--gmp-accent)] group-hover:border-black transition-colors uppercase">
                  {card.status}
                </div>
              </div>

              {/* Card Content Core */}
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="font-heading text-lg lg:text-xl font-black uppercase text-white group-hover:text-black mb-2 flex items-center gap-3 transition-colors">
                  <CardIcon className="h-5 w-5 text-[var(--gmp-text-secondary)] group-hover:text-black transition-colors" />
                  {card.title}
                </h2>
                <p className="text-xs font-medium leading-relaxed text-[var(--gmp-text-secondary)] group-hover:text-[#333] transition-colors max-w-sm line-clamp-2">
                  {card.summary}
                </p>
              </div>

              {/* Card Action Target */}
              <footer className="mt-4 flex justify-between items-end">
                  <div className="w-6 border-b-2 border-[var(--gmp-line-soft)] group-hover:border-black transition-colors mb-2" />
                  <Link
                    href={card.href}
                    className="inline-flex h-8 items-center justify-center gap-2 bg-[var(--gmp-bg-base)] group-hover:bg-black border border-[var(--gmp-line-strong)] group-hover:border-transparent px-4 font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--gmp-accent)] transition-all gmp-cut-corner-l"
                  >
                    ACCESS
                    <ArrowRight className="h-3 w-3 relative transition-transform" />
                  </Link>
              </footer>
            </article>
          );
        })}
      </div>
    </KineticPageShell>
  );
}
