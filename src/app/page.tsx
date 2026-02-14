"use client";

import { useState, useCallback } from "react";
import OKRDisplay from "@/components/OKRDisplay";
import VoiceCoach from "@/components/VoiceCoach";
import DebugPanel from "@/components/DebugPanel";
import type { OKR, OKRUpdate, ChatMessage } from "@/lib/types";

export default function Home() {
  const [okr, setOkr] = useState<OKR | null>(null);
  const [understanding, setUnderstanding] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [language, setLanguage] = useState<"de" | "en">("de");

  const handleOkrUpdate = useCallback((update: OKRUpdate) => {
    setOkr({
      objective: update.objective,
      key_results: update.key_results,
    });
    setUnderstanding(update.understanding);
  }, []);

  const handleMessagesChange = useCallback((newMessages: ChatMessage[]) => {
    setMessages(newMessages);
  }, []);

  return (
    <div className="min-h-screen bg-[#1C1E31] relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#48BCFE]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-[#FADA51]/[0.02] rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FADA51]/15 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="text-[#FADA51]"
              >
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">
              Workpath AI Companion
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-xs ${okr ? "text-[#FADA51]" : "text-[#838895]"}`}>
              {okr ? "Drafting OKR..." : "Ready to coach"}
            </span>
          </div>
        </header>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left column: Voice Companion (1/3) */}
          <section className="w-full lg:w-1/3 lg:sticky lg:top-8">
            <VoiceCoach
              onOkrUpdate={handleOkrUpdate}
              onMessagesChange={handleMessagesChange}
              existingOkr={okr}
              existingUnderstanding={understanding}
              language={language}
              onLanguageChange={setLanguage}
            />
          </section>

          {/* Right column: OKR Display (2/3) */}
          <section className="w-full lg:w-2/3">
            <OKRDisplay okr={okr} />
          </section>
        </div>
      </main>

      {/* Debug Panel */}
      <DebugPanel
        messages={messages}
        okr={okr}
        understanding={understanding}
      />
    </div>
  );
}
