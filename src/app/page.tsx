"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import WorkspaceDisplay from "@/components/WorkspaceDisplay";
import VoiceCoach from "@/components/VoiceCoach";
import DebugPanel from "@/components/DebugPanel";
import type { ChatMessage, TodoItem, Impact, OKR, Output, WorkspaceData, CompletedSession } from "@/lib/types";
import { loadState, saveState, createDefaultState, EMPTY_IMPACT, EMPTY_OUTPUT } from "@/lib/storage";

export default function Home() {
  // Current session state
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [impact, setImpact] = useState<Impact>({ ...EMPTY_IMPACT });
  const [outcome, setOutcome] = useState<OKR | null>(null);
  const [output, setOutput] = useState<Output>({ ...EMPTY_OUTPUT });
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
      setTodos(saved.currentSession.todos);
      setImpact(saved.currentSession.impact);
      setOutcome(saved.currentSession.outcome);
      setOutput(saved.currentSession.output);
      setUnderstanding(saved.currentSession.understanding);
      setCompletedSessions(saved.completedSessions);
      setUserContext(saved.userContext);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage (debounced)
  useEffect(() => {
    if (!isHydrated) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveState({
        version: 3,
        language,
        currentSession: {
          messages,
          todos,
          impact,
          outcome,
          output,
          understanding,
        },
        completedSessions,
        userContext,
      });
    }, 300);
  }, [isHydrated, language, messages, todos, impact, outcome, output, understanding, completedSessions, userContext]);

  // Tool callbacks
  const handleTodosUpdate = useCallback((newTodos: TodoItem[], newUnderstanding: string) => {
    setTodos(newTodos);
    setUnderstanding(newUnderstanding);
    if (newUnderstanding) setUserContext(newUnderstanding);
  }, []);

  const handleWorkspaceUpdate = useCallback((data: Partial<WorkspaceData>) => {
    if (data.impact) setImpact(data.impact);
    if (data.outcome) setOutcome(data.outcome);
    if (data.output) setOutput(data.output);
  }, []);

  const handleMessagesChange = useCallback((m: ChatMessage[]) => setMessages(m), []);

  const handleNewOkr = useCallback(() => {
    if (outcome) {
      const session: CompletedSession = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        okr: outcome,
        impact,
        output,
        understanding,
        messages,
      };
      setCompletedSessions((prev) => [...prev, session]);
    }
    setTodos([]);
    setImpact({ ...EMPTY_IMPACT });
    setOutcome(null);
    setOutput({ ...EMPTY_OUTPUT });
    setUnderstanding("");
    setMessages([]);
  }, [outcome, impact, output, understanding, messages]);

  const handleReset = useCallback(() => {
    const fresh = createDefaultState(language);
    setTodos(fresh.currentSession.todos);
    setImpact(fresh.currentSession.impact);
    setOutcome(fresh.currentSession.outcome);
    setOutput(fresh.currentSession.output);
    setUnderstanding(fresh.currentSession.understanding);
    setMessages(fresh.currentSession.messages);
    setCompletedSessions(fresh.completedSessions);
    setUserContext(fresh.userContext);
  }, [language]);

  const showNewOkrButton = outcome !== null || todos.length > 0 || impact.strategy !== null;

  if (!isHydrated) {
    return <div className="min-h-screen bg-[#1C1E31]" />;
  }

  return (
    <div className="min-h-screen bg-[#1C1E31] relative overflow-hidden">
      {/* Gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#48BCFE]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-[#FADA51]/[0.02] rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FADA51]/15 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#FADA51]">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            <span className={`text-xs ${outcome ? "text-[#FADA51]" : "text-[#838895]"}`}>
              {outcome ? "Drafting OKR..." : "Ready to coach"}
            </span>
          </div>
        </header>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <section className="w-full lg:w-1/3 lg:sticky lg:top-8">
            <VoiceCoach
              onTodosUpdate={handleTodosUpdate}
              onWorkspaceUpdate={handleWorkspaceUpdate}
              onMessagesChange={handleMessagesChange}
              existingTodos={todos}
              existingImpact={impact}
              existingOutcome={outcome}
              existingOutput={output}
              existingUnderstanding={understanding}
              userContext={userContext}
              completedSessions={completedSessions}
              language={language}
              onLanguageChange={setLanguage}
            />
          </section>

          <section className="w-full lg:w-2/3">
            <WorkspaceDisplay
              impact={impact}
              outcome={outcome}
              output={output}
            />
          </section>
        </div>
      </main>

      <DebugPanel
        messages={messages}
        todos={todos}
        impact={impact}
        outcome={outcome}
        output={output}
        understanding={understanding}
        userContext={userContext}
        completedSessions={completedSessions}
        onReset={handleReset}
      />
    </div>
  );
}
