"use client";

import { useState, useEffect, useRef } from "react";
import type { OKR, ChatMessage, TodoItem, Impact, Output, CompletedSession } from "@/lib/types";

interface DebugPanelProps {
  messages: ChatMessage[];
  todos: TodoItem[];
  impact: Impact;
  outcome: OKR | null;
  output: Output;
  understanding: string;
  userContext: string;
  completedSessions: CompletedSession[];
  onReset: () => void;
}

type TabId = "transcript" | "workspace" | "todos" | "context" | "history";

export default function DebugPanel({
  messages,
  todos,
  impact,
  outcome,
  output,
  understanding,
  userContext,
  completedSessions,
  onReset,
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("transcript");
  const transcriptEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (activeTab === "transcript" && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const tabs: { id: TabId; label: string }[] = [
    { id: "transcript", label: "Transcript" },
    { id: "workspace", label: "Workspace" },
    { id: "todos", label: "Todos" },
    { id: "context", label: "Context" },
    { id: "history", label: "History" },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-4 right-4 z-50 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
          isOpen ? "bg-[#363953] text-white" : "bg-[#363953]/50 text-[#838895] hover:bg-[#363953] hover:text-[#C2C5CE]"
        } border border-[#363953]`}
        title="Toggle Debug Panel (Cmd+D)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>

      <div
        className={`fixed top-0 right-0 h-full z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: 400 }}
      >
        <div className="h-full bg-[#363953] border-l border-[#363953] flex flex-col">
          <div className="p-4 border-b border-[#1C1E31]/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Debug Panel</h3>
              <div className="flex items-center gap-2">
                <button onClick={onReset} className="text-[10px] text-[#D9513C] hover:text-[#D9513C]/80 font-mono">
                  Reset
                </button>
                <span className="text-[10px] text-[#838895] font-mono">Cmd+D</span>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
                    activeTab === tab.id ? "bg-[#1C1E31]/60 text-white" : "text-[#838895] hover:text-[#C2C5CE]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "transcript" && (
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-[#838895] italic">Conversation transcript will appear here...</p>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-[10px] text-[#838895] font-mono shrink-0 mt-0.5">{formatTime(msg.timestamp)}</span>
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === "coach" ? "text-[#669C89]" : "text-[#48BCFE]"}`}>
                          {msg.role === "coach" ? "Coach" : "You"}
                        </span>
                        <p className="text-xs text-[#C2C5CE] mt-0.5 leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            )}

            {activeTab === "workspace" && (
              <pre className="text-xs text-[#C2C5CE] font-mono whitespace-pre-wrap leading-relaxed">
                {JSON.stringify({ impact, outcome, output }, null, 2)}
              </pre>
            )}

            {activeTab === "todos" && (
              <pre className="text-xs text-[#C2C5CE] font-mono whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(todos, null, 2)}
              </pre>
            )}

            {activeTab === "context" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#838895] mb-2">Current Understanding</h4>
                  {understanding ? (
                    <p className="text-sm text-[#C2C5CE] leading-relaxed">{understanding}</p>
                  ) : (
                    <p className="text-xs text-[#838895] italic">No understanding yet...</p>
                  )}
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#838895] mb-2">Accumulated User Context</h4>
                  {userContext ? (
                    <p className="text-sm text-[#C2C5CE] leading-relaxed">{userContext}</p>
                  ) : (
                    <p className="text-xs text-[#838895] italic">No accumulated context yet</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4">
                {completedSessions.length === 0 ? (
                  <p className="text-xs text-[#838895] italic">No completed OKR sessions yet.</p>
                ) : (
                  completedSessions.map((session) => (
                    <div key={session.id} className="p-3 rounded-lg bg-[#1C1E31]/40 border border-[#1C1E31]/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-[#838895] font-mono">
                          {new Date(session.timestamp).toLocaleDateString()} {formatTime(session.timestamp)}
                        </span>
                        <span className="text-[10px] text-[#669C89] font-medium">{session.okr.key_results.length} KRs</span>
                      </div>
                      <p className="text-xs text-[#C2C5CE] font-medium leading-relaxed">{session.okr.objective}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
