"use client";

import { useState, useEffect, useRef } from "react";
import type { OKR, ChatMessage } from "@/lib/types";

interface DebugPanelProps {
  messages: ChatMessage[];
  okr: OKR | null;
  understanding: string;
}

export default function DebugPanel({
  messages,
  okr,
  understanding,
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "transcript" | "okr" | "understanding"
  >("transcript");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Cmd+D to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (activeTab === "transcript" && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-4 right-4 z-50 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
          isOpen
            ? "bg-[#363953] text-white"
            : "bg-[#363953]/50 text-[#838895] hover:bg-[#363953] hover:text-[#C2C5CE]"
        } border border-[#363953]`}
        title="Toggle Debug Panel (Cmd+D)"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: 400 }}
      >
        <div className="h-full bg-[#363953] border-l border-[#363953] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#1C1E31]/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Debug Panel</h3>
              <span className="text-[10px] text-[#838895] font-mono">
                Cmd+D
              </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1">
              {(
                ["transcript", "okr", "understanding"] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    activeTab === tab
                      ? "bg-[#1C1E31]/60 text-white"
                      : "text-[#838895] hover:text-[#C2C5CE]"
                  }`}
                >
                  {tab === "okr"
                    ? "OKR JSON"
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === "transcript" && messages.length > 0 && (
                    <span className="ml-1.5 text-[10px] text-[#838895]">
                      ({messages.length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "transcript" && (
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-[#838895] italic">
                    Conversation transcript will appear here...
                  </p>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-[10px] text-[#838895] font-mono shrink-0 mt-0.5">
                        {formatTime(msg.timestamp)}
                      </span>
                      <div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            msg.role === "coach"
                              ? "text-[#669C89]"
                              : "text-[#48BCFE]"
                          }`}
                        >
                          {msg.role === "coach" ? "Coach" : "You"}
                        </span>
                        <p className="text-xs text-[#C2C5CE] mt-0.5 leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            )}

            {activeTab === "okr" && (
              <div>
                {okr ? (
                  <pre className="text-xs text-[#C2C5CE] font-mono whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(okr, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-[#838895] italic">
                    No OKR generated yet...
                  </p>
                )}
              </div>
            )}

            {activeTab === "understanding" && (
              <div>
                {understanding ? (
                  <p className="text-sm text-[#C2C5CE] leading-relaxed">
                    {understanding}
                  </p>
                ) : (
                  <p className="text-xs text-[#838895] italic">
                    Coach&apos;s understanding will appear here after a few
                    exchanges...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
