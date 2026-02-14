"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import WorkspaceDisplay from "@/components/WorkspaceDisplay";
import VoiceCoach from "@/components/VoiceCoach";
import DebugPanel from "@/components/DebugPanel";
import type { ChatMessage, WorkspaceUpdate, WorkspaceSection, OKR, CompletedSession } from "@/lib/types";
import { loadState, saveState, createDefaultState } from "@/lib/storage";

export default function Home() {
  // Current session state
  const [sections, setSections] = useState<WorkspaceSection[]>([]);
  const [okr, setOkr] = useState<OKR | null>(null);
  const [understanding, setUnderstanding] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [language, setLanguage] = useState<"de" | "en">("de");

  // Cross-session state
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [userContext, setUserContext] = useState("");

  // Hydration guard
  const [isHydrated, setIsHydrated] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setLanguage(saved.language);
      setMessages(saved.currentSession.messages);
      setSections(saved.currentSession.sections);
      setOkr(saved.currentSession.okr);
      setUnderstanding(saved.currentSession.understanding);
      setCompletedSessions(saved.completedSessions);
      setUserContext(saved.userContext);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage on state changes (debounced)
  useEffect(() => {
    if (!isHydrated) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveState({
        version: 1,
        language,
        currentSession: {
          messages,
          sections,
          okr,
          understanding,
        },
        completedSessions,
        userContext,
      });
    }, 300);
  }, [isHydrated, language, messages, sections, okr, understanding, completedSessions, userContext]);

  const handleWorkspaceUpdate = useCallback((update: WorkspaceUpdate) => {
    setSections(update.sections);
    setOkr(update.okr);
    setUnderstanding(update.understanding);
    if (update.understanding) {
      setUserContext(update.understanding);
    }
  }, []);

  const handleMessagesChange = useCallback((newMessages: ChatMessage[]) => {
    setMessages(newMessages);
  }, []);

  const handleNewOkr = useCallback(() => {
    // Save current session to history if there's an OKR
    if (okr) {
      const session: CompletedSession = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        okr,
        sections,
        understanding,
        messages,
      };
      setCompletedSessions((prev) => [...prev, session]);
    }
    // Clear current session but preserve userContext
    setSections([]);
    setOkr(null);
    setUnderstanding("");
    setMessages([]);
  }, [okr, sections, understanding, messages]);

  const handleReset = useCallback(() => {
    const fresh = createDefaultState(language);
    setSections(fresh.currentSession.sections);
    setOkr(fresh.currentSession.okr);
    setUnderstanding(fresh.currentSession.understanding);
    setMessages(fresh.currentSession.messages);
    setCompletedSessions(fresh.completedSessions);
    setUserContext(fresh.userContext);
  }, [language]);

  const showNewOkrButton = okr !== null || sections.length > 0;

  // Don't render until hydrated to prevent flash
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#1C1E31]" />
    );
  }

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
          <div className="flex items-center gap-3">
            {showNewOkrButton && (
              <button
                onClick={handleNewOkr}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#C2C5CE] bg-[#363953]/60 hover:bg-[#363953] border border-[#363953] hover:border-[#48BCFE]/30 rounded-lg transition-all duration-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New OKR
              </button>
            )}
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
              onWorkspaceUpdate={handleWorkspaceUpdate}
              onMessagesChange={handleMessagesChange}
              existingSections={sections}
              existingOkr={okr}
              existingUnderstanding={understanding}
              userContext={userContext}
              completedSessions={completedSessions}
              language={language}
              onLanguageChange={setLanguage}
            />
          </section>

          {/* Right column: Workspace Display (2/3) */}
          <section className="w-full lg:w-2/3">
            <WorkspaceDisplay sections={sections} okr={okr} />
          </section>
        </div>
      </main>

      {/* Debug Panel */}
      <DebugPanel
        messages={messages}
        sections={sections}
        okr={okr}
        understanding={understanding}
        userContext={userContext}
        completedSessions={completedSessions}
        onReset={handleReset}
      />
    </div>
  );
}
