"use client";

import { useEffect, useRef, useState } from "react";
import type { OKR } from "@/lib/types";

interface OKRDisplayProps {
  okr: OKR | null;
}

export default function OKRDisplay({ okr }: OKRDisplayProps) {
  const [displayedOkr, setDisplayedOkr] = useState<OKR | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevOkrRef = useRef<string>("");

  // Animate transitions when OKR changes
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
  if (!displayedOkr) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#363953]/50 border border-[#363953]">
            <div className="w-2 h-2 rounded-full bg-[#838895]/60" />
            <span className="text-xs font-medium text-[#838895] tracking-wide uppercase">
              OKR Draft
            </span>
          </div>
        </div>

        <div className="p-8 rounded-xl border border-dashed border-[#363953] bg-[#363953]/20">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#363953]/50 border border-[#363953] flex items-center justify-center mx-auto mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-[#838895]"
              >
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#C2C5CE] mb-2">
              Your OKR will appear here
            </h3>
            <p className="text-sm text-[#838895] max-w-sm mx-auto">
              Start a conversation with your coach below. As you describe your
              goals, a draft OKR will take shape here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-4xl mx-auto transition-opacity duration-300 ${
        isTransitioning ? "opacity-50" : "opacity-100"
      }`}
    >
      {/* Header badge */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FADA51]/10 border border-[#FADA51]/25">
          <div className="w-2 h-2 rounded-full bg-[#FADA51] animate-pulse" />
          <span className="text-xs font-medium text-[#FADA51] tracking-wide uppercase">
            Draft OKR
          </span>
        </div>
        <span className="text-[10px] text-[#838895] font-medium tracking-wider uppercase px-2 py-0.5 rounded bg-[#363953]/50 border border-[#363953]">
          AI Generated
        </span>
      </div>

      {/* Objective */}
      <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight mb-8">
        {displayedOkr.objective}
      </h2>

      {/* Key Results */}
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
    </div>
  );
}
