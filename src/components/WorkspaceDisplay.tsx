"use client";

import { useEffect, useRef, useState } from "react";
import type { Impact, OKR, Output } from "@/lib/types";

interface WorkspaceDisplayProps {
  impact: Impact;
  outcome: OKR | null;
  output: Output;
}

function SectionCard({
  icon,
  title,
  description,
  filled,
  highlight,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  filled: boolean;
  highlight?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border transition-all duration-300 ${
        highlight
          ? filled
            ? "bg-[#FADA51]/[0.04] border-[#FADA51]/25"
            : "bg-[#FADA51]/[0.02] border-dashed border-[#FADA51]/15"
          : filled
            ? "bg-[#363953]/30 border-[#363953]"
            : "bg-[#363953]/15 border-dashed border-[#363953]"
      } ${highlight ? "p-5" : "p-4"}`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-5 h-5 flex items-center justify-center shrink-0 ${
          filled
            ? highlight ? "text-[#FADA51]" : "text-[#C2C5CE]"
            : "text-[#838895]/60"
        }`}>
          {icon}
        </div>
        <h3 className={`text-xs font-bold uppercase tracking-wider ${
          filled
            ? highlight ? "text-[#FADA51]" : "text-[#C2C5CE]"
            : "text-[#838895]/60"
        }`}>
          {title}
        </h3>
      </div>
      {filled ? (
        <div className="ml-[30px]">{children}</div>
      ) : (
        <p className="ml-[30px] text-xs text-[#838895]/50 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

// --- Icons ---

function ImpactIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function OutcomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function OutputIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  );
}

export default function WorkspaceDisplay({ impact, outcome, output }: WorkspaceDisplayProps) {
  const [displayedOkr, setDisplayedOkr] = useState<OKR | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevOkrRef = useRef<string>("");

  useEffect(() => {
    const serialized = outcome ? JSON.stringify(outcome) : "";
    if (serialized !== prevOkrRef.current) {
      prevOkrRef.current = serialized;
      if (outcome) {
        setIsTransitioning(true);
        const timer = setTimeout(() => {
          setDisplayedOkr(outcome);
          setIsTransitioning(false);
        }, 150);
        return () => clearTimeout(timer);
      } else {
        setDisplayedOkr(null);
      }
    }
  }, [outcome]);

  const impactFilled = impact.strategy !== null || impact.kpis.length > 0;
  const hasAnyContent = impactFilled || displayedOkr || output.initiatives.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Status badge */}
      <div className="flex items-center gap-2 mb-6">
        {displayedOkr && displayedOkr.key_results.length > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#669C89]/10 border border-[#669C89]/25">
            <div className="w-2 h-2 rounded-full bg-[#669C89]" />
            <span className="text-xs font-medium text-[#669C89] tracking-wide uppercase">
              OKR Draft
            </span>
          </div>
        ) : hasAnyContent ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#48BCFE]/10 border border-[#48BCFE]/25">
            <div className="w-2 h-2 rounded-full bg-[#48BCFE] animate-pulse" />
            <span className="text-xs font-medium text-[#48BCFE] tracking-wide uppercase">
              Coaching
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#363953]/50 border border-[#363953]">
            <div className="w-2 h-2 rounded-full bg-[#838895]/60" />
            <span className="text-xs font-medium text-[#838895] tracking-wide uppercase">
              Workspace
            </span>
          </div>
        )}
      </div>

      {/* Three sections: Impact → Outcome → Output */}
      <div className="space-y-3">
        {/* IMPACT: Strategy + KPIs */}
        <SectionCard
          icon={<ImpactIcon />}
          title="Impact"
          description="The overarching strategy and key metrics this OKR contributes to."
          filled={impactFilled}
        >
          <div className="space-y-3">
            {impact.strategy && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#838895] mb-1 block">Strategy</span>
                <p className="text-sm text-[#C2C5CE] leading-relaxed">{impact.strategy}</p>
              </div>
            )}
            {impact.kpis.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#838895] mb-1.5 block">KPIs / Lagging Indicators</span>
                <div className="space-y-2">
                  {impact.kpis.map((kpi, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="shrink-0 text-[11px] font-bold text-[#48BCFE] bg-[#48BCFE]/10 px-2 py-0.5 rounded">
                        {kpi.value}
                      </span>
                      <div>
                        <span className="text-sm font-medium text-[#C2C5CE]">{kpi.label}</span>
                        {kpi.description && (
                          <p className="text-xs text-[#838895] mt-0.5">{kpi.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* OUTCOME: OKR Draft — highlighted primary section */}
        <SectionCard
          icon={<OutcomeIcon />}
          title="Outcome — OKR Draft"
          description="Your Objective and Key Results — the core outcome you're committing to."
          filled={!!displayedOkr}
          highlight
        >
          <div className={`transition-opacity duration-300 ${isTransitioning ? "opacity-50" : "opacity-100"}`}>
            {displayedOkr && (
              <>
                <h2 className="text-lg md:text-xl font-semibold text-white leading-tight mb-4">
                  {displayedOkr.objective}
                </h2>

                {displayedOkr.key_results.length > 0 ? (
                  <div className="space-y-3">
                    {displayedOkr.key_results.map((kr, i) => (
                      <div
                        key={`${kr.label}-${i}`}
                        className="p-3 rounded-lg bg-[#363953]/40 border border-[#363953] hover:border-[#FADA51]/20 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span className="shrink-0 mt-0.5 text-[10px] font-bold tracking-wider text-[#EFC92D] uppercase bg-[#EFC92D]/10 px-1.5 py-0.5 rounded">
                              {kr.label}
                            </span>
                            <p className="text-sm text-[#C2C5CE] leading-relaxed">
                              {kr.text}
                            </p>
                          </div>
                          {kr.progress > 0 && (
                            <span className="shrink-0 text-xs font-mono font-semibold text-white tabular-nums">
                              {kr.progress}%
                            </span>
                          )}
                        </div>
                        {kr.progress > 0 && (
                          <div className="mt-2 h-1 rounded-full bg-[#363953] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${kr.progress}%`,
                                background:
                                  kr.progress >= 70
                                    ? "linear-gradient(90deg, #669C89, #4D7D6C)"
                                    : kr.progress >= 50
                                      ? "linear-gradient(90deg, #FADA51, #EFC92D)"
                                      : "linear-gradient(90deg, #D9513C, #C6331D)",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="p-3 rounded-lg border border-dashed border-[#363953] bg-[#363953]/10">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-bold tracking-wider text-[#838895]/40 uppercase">
                            KR {n}
                          </span>
                          <div className="h-3 flex-1 rounded bg-[#363953]/30" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </SectionCard>

        {/* OUTPUT: Initiatives */}
        <SectionCard
          icon={<OutputIcon />}
          title="Output"
          description="Concrete actions, initiatives, and projects that drive your Key Results forward."
          filled={output.initiatives.length > 0}
        >
          <div className="space-y-2">
            {output.initiatives.map((init, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#669C89] mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#C2C5CE] leading-relaxed">{init.text}</p>
                  {init.linked_kr && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-[#EFC92D] bg-[#EFC92D]/10 px-1.5 py-0.5 rounded">
                      {init.linked_kr}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
