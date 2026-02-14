"use client";

import { useEffect, useRef, useState } from "react";
import type { OKR, WorkspaceSection } from "@/lib/types";

interface WorkspaceDisplayProps {
  sections: WorkspaceSection[];
  okr: OKR | null;
}

function StatusIcon({ status }: { status: WorkspaceSection["status"] }) {
  if (status === "completed") {
    return (
      <div className="w-5 h-5 rounded-full bg-[#669C89]/20 flex items-center justify-center shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#669C89]">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="w-5 h-5 rounded-full bg-[#48BCFE]/20 flex items-center justify-center shrink-0">
        <div className="w-2 h-2 rounded-full bg-[#48BCFE] animate-pulse" />
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full border border-[#363953] shrink-0" />
  );
}

export default function WorkspaceDisplay({ sections, okr }: WorkspaceDisplayProps) {
  const [displayedOkr, setDisplayedOkr] = useState<OKR | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevOkrRef = useRef<string>("");

  useEffect(() => {
    const serialized = okr ? JSON.stringify(okr) : "";
    if (serialized !== prevOkrRef.current) {
      prevOkrRef.current = serialized;
      if (okr) {
        setIsTransitioning(true);
        const timer = setTimeout(() => {
          setDisplayedOkr(okr);
          setIsTransitioning(false);
        }, 150);
        return () => clearTimeout(timer);
      } else {
        setDisplayedOkr(null);
      }
    }
  }, [okr]);

  // Empty state
  if (sections.length === 0 && !displayedOkr) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#363953]/50 border border-[#363953]">
            <div className="w-2 h-2 rounded-full bg-[#838895]/60" />
            <span className="text-xs font-medium text-[#838895] tracking-wide uppercase">
              Workspace
            </span>
          </div>
        </div>

        <div className="p-8 rounded-xl border border-dashed border-[#363953] bg-[#363953]/20">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#363953]/50 border border-[#363953] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#838895]">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#C2C5CE] mb-2">
              Your coaching workspace
            </h3>
            <p className="text-sm text-[#838895] max-w-sm mx-auto">
              Start a conversation with your companion. As you talk, coaching
              steps and your OKR draft will take shape here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveSection = sections.some((s) => s.status === "active");
  const allSectionsComplete = sections.length > 0 && sections.every((s) => s.status === "completed");
  const hasOkrWithKRs = displayedOkr && displayedOkr.key_results.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Status badge */}
      <div className="flex items-center gap-2 mb-6">
        {hasOkrWithKRs && allSectionsComplete ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#669C89]/10 border border-[#669C89]/25">
            <div className="w-2 h-2 rounded-full bg-[#669C89]" />
            <span className="text-xs font-medium text-[#669C89] tracking-wide uppercase">
              OKR Draft Complete
            </span>
          </div>
        ) : displayedOkr ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FADA51]/10 border border-[#FADA51]/25">
            <div className="w-2 h-2 rounded-full bg-[#FADA51] animate-pulse" />
            <span className="text-xs font-medium text-[#FADA51] tracking-wide uppercase">
              Draft OKR
            </span>
          </div>
        ) : hasActiveSection ? (
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

      {/* Coaching sections */}
      {sections.length > 0 && (
        <div className="space-y-3 mb-6">
          {sections.map((section, i) => (
            <div
              key={section.id}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                section.status === "active"
                  ? "bg-[#48BCFE]/[0.06] border-[#48BCFE]/25"
                  : section.status === "completed"
                    ? "bg-[#669C89]/[0.06] border-[#669C89]/20"
                    : "bg-[#363953]/20 border-[#363953]"
              }`}
              style={{
                animationDelay: `${i * 80}ms`,
                animation: "fadeIn 0.3s ease-out forwards",
              }}
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={section.status} />
                <h3
                  className={`text-sm font-medium ${
                    section.status === "active"
                      ? "text-[#48BCFE]"
                      : section.status === "completed"
                        ? "text-white"
                        : "text-[#838895]"
                  }`}
                >
                  {section.title}
                </h3>
              </div>
              {section.summary && (
                <p className="mt-2 ml-8 text-sm text-[#C2C5CE] leading-relaxed">
                  {section.summary}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* OKR Draft */}
      {displayedOkr && (
        <div
          className={`transition-opacity duration-300 ${
            isTransitioning ? "opacity-50" : "opacity-100"
          }`}
        >
          {sections.length > 0 && (
            <div className="border-t border-[#363953] pt-6 mt-2" />
          )}

          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight mb-6">
            {displayedOkr.objective}
          </h2>

          {displayedOkr.key_results.length > 0 && (
            <div className="space-y-4">
              {displayedOkr.key_results.map((kr, i) => (
                <div
                  key={`${kr.label}-${i}`}
                  className="group relative p-4 rounded-xl bg-[#363953]/30 border border-[#363953] hover:border-[#48BCFE]/25 transition-all duration-300"
                  style={{
                    animationDelay: `${i * 100}ms`,
                    animation: "fadeIn 0.4s ease-out forwards",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="shrink-0 mt-0.5 text-[11px] font-bold tracking-wider text-[#EFC92D] uppercase bg-[#EFC92D]/10 px-2 py-1 rounded">
                        {kr.label}
                      </span>
                      <p className="text-sm md:text-base text-[#C2C5CE] leading-relaxed">
                        {kr.text}
                      </p>
                    </div>
                    {kr.progress > 0 && (
                      <span className="shrink-0 text-sm font-mono font-semibold text-white tabular-nums">
                        {kr.progress}%
                      </span>
                    )}
                  </div>
                  {kr.progress > 0 && (
                    <div className="mt-3 h-1 rounded-full bg-[#363953] overflow-hidden">
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
          )}
        </div>
      )}
    </div>
  );
}
