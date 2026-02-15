"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import type { ChatMessage, TodoItem, Impact, OKR, Output, WorkspaceData, CompletedSession } from "@/lib/types";
import TodoList from "./TodoList";

const NUM_BARS = 72;
const TWO_PI = Math.PI * 2;

// Workpath brand colors (RGB)
const GREEN = { r: 102, g: 156, b: 137 };      // #669C89 - coach speaking
const BLUE = { r: 72, g: 188, b: 254 };         // #48BCFE - user speaking
const IDLE = { r: 131, g: 136, b: 149 };         // #838895 - grey-dark idle

interface VoiceCoachProps {
  onTodosUpdate: (todos: TodoItem[], understanding: string) => void;
  onWorkspaceUpdate: (data: Partial<WorkspaceData>) => void;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  existingTodos: TodoItem[];
  existingImpact: Impact;
  existingOutcome: OKR | null;
  existingOutput: Output;
  existingUnderstanding: string;
  userContext: string;
  completedSessions: CompletedSession[];
  language: "de" | "en";
  onLanguageChange: (lang: "de" | "en") => void;
}

export default function VoiceCoach({
  onTodosUpdate,
  onWorkspaceUpdate,
  onMessagesChange,
  existingTodos,
  existingImpact,
  existingOutcome,
  existingOutput,
  existingUnderstanding,
  userContext,
  completedSessions,
  language,
  onLanguageChange,
}: VoiceCoachProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>(existingTodos);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Visualization data refs
  const barsRef = useRef<number[]>(new Array(NUM_BARS).fill(0));
  const targetBarsRef = useRef<number[]>(new Array(NUM_BARS).fill(0));

  // Refs for stable callback access to latest props
  const onTodosUpdateRef = useRef(onTodosUpdate);
  const onWorkspaceUpdateRef = useRef(onWorkspaceUpdate);
  useEffect(() => { onTodosUpdateRef.current = onTodosUpdate; }, [onTodosUpdate]);
  useEffect(() => { onWorkspaceUpdateRef.current = onWorkspaceUpdate; }, [onWorkspaceUpdate]);

  // Sync todos from parent when they change externally
  useEffect(() => {
    setTodos(existingTodos);
  }, [existingTodos]);

  // Sync messages to parent
  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  const addMessage = useCallback(
    (role: "user" | "coach", text: string) => {
      setMessages((prev) => [
        ...prev,
        { role, text, timestamp: Date.now() },
      ]);
    },
    []
  );

  // Helper to safely parse params (may arrive as string or object)
  const safeParse = (params: unknown): Record<string, unknown> => {
    if (typeof params === "string") {
      try { return JSON.parse(params); } catch { return {}; }
    }
    return (params as Record<string, unknown>) || {};
  };

  // Normalize a todo item — LLM may send {item, completed} instead of {id, text, completed}
  const normalizeTodo = (raw: Record<string, unknown>, index: number): TodoItem => {
    const text = typeof raw.text === "string" ? raw.text
      : typeof raw.item === "string" ? raw.item
      : String(raw.text ?? raw.item ?? `Step ${index + 1}`);
    const id = typeof raw.id === "string" ? raw.id : `step-${index + 1}`;
    const completed = raw.completed === true;
    return { id, text, completed };
  };

  // Normalize KPI — LLM may send strings instead of objects
  const normalizeKpi = (raw: unknown): { label: string; value: string; description: string } | null => {
    if (typeof raw === "string") return { label: raw, value: "", description: "" };
    if (raw && typeof raw === "object") {
      const r = raw as Record<string, unknown>;
      return {
        label: String(r.label ?? r.name ?? ""),
        value: String(r.value ?? r.target ?? ""),
        description: String(r.description ?? ""),
      };
    }
    return null;
  };

  // Client tools — defined once, using refs for stable prop access
  const clientTools = useRef({
    update_todos: (rawParams: Record<string, unknown>) => {
      const params = safeParse(rawParams);
      console.log("[VoiceCoach] update_todos called:", JSON.stringify(params).slice(0, 500));
      const rawTodos = Array.isArray(params.todos) ? params.todos : [];
      const newTodos = rawTodos.map((t: Record<string, unknown>, i: number) => normalizeTodo(t, i));
      const understanding = (typeof params.understanding === "string" ? params.understanding : "");
      setTodos(newTodos);
      onTodosUpdateRef.current(newTodos, understanding);
      return "ok";
    },
    update_workspace: (rawParams: Record<string, unknown>) => {
      const params = safeParse(rawParams);
      console.log("[VoiceCoach] update_workspace called:", JSON.stringify(params).slice(0, 500));

      const update: Partial<WorkspaceData> = {};

      // Parse impact — handle both nested and flat formats
      if (params.impact && typeof params.impact === "object") {
        const imp = params.impact as Record<string, unknown>;
        const rawKpis = Array.isArray(imp.kpis) ? imp.kpis : [];
        update.impact = {
          strategy: typeof imp.strategy === "string" ? imp.strategy : null,
          kpis: rawKpis.map(normalizeKpi).filter((k): k is NonNullable<typeof k> => k !== null),
        };
      }
      // Also check top-level strategy (LLM sometimes puts it there)
      if (typeof params.strategy === "string" && !update.impact) {
        update.impact = {
          strategy: params.strategy,
          kpis: [],
        };
      }

      // Parse outcome (OKR)
      if (params.outcome && typeof params.outcome === "object") {
        const out = params.outcome as Record<string, unknown>;
        update.outcome = {
          objective: typeof out.objective === "string" ? out.objective : "",
          key_results: Array.isArray(out.key_results) ? out.key_results : [],
        };
      }

      // Parse output (initiatives)
      if (params.output && typeof params.output === "object") {
        const o = params.output as Record<string, unknown>;
        update.output = {
          initiatives: Array.isArray(o.initiatives) ? o.initiatives : [],
        };
      }

      onWorkspaceUpdateRef.current(update);
      return "ok";
    },
  }).current;

  const conversation = useConversation({
    clientTools,
    onConnect: () => {
      console.log("[VoiceCoach] Connected");
      setConnectionError(null);
    },
    onDisconnect: () => {
      console.log("[VoiceCoach] Disconnected");
      setIsSessionActive(false);
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[VoiceCoach] Error:", msg);
      setConnectionError(msg);
      setIsSessionActive(false);
    },
    onMessage: (message: { source?: string; message?: string }) => {
      if (message.message) {
        const role = message.source === "user" ? "user" : "coach";
        addMessage(role, message.message);
      }
    },
    onDebug: (msg: unknown) => {
      console.log("[VoiceCoach] debug:", JSON.stringify(msg).slice(0, 300));
    },
    onUnhandledClientToolCall: (params: { tool_name: string; tool_call_id: string }) => {
      console.warn("[VoiceCoach] UNHANDLED client tool:", params.tool_name, params.tool_call_id);
    },
  });

  const { status, isSpeaking } = conversation;

  // Build session overrides — three scenarios
  // basePrompt is fetched from ElevenLabs (single source of truth)
  const buildOverrides = (basePrompt: string) => {
    const langInstruction = language === "de"
      ? "\n\n## Language\nRespond in German (Deutsch). The user's interface is set to German."
      : "";

    const hasMidSession = existingTodos.length > 0 || existingOutcome !== null || existingImpact.strategy !== null || existingImpact.kpis.length > 0 || existingOutput.initiatives.length > 0;
    const hasUserContext = userContext.length > 0 || completedSessions.length > 0;

    // Scenario C: Resume mid-session
    if (hasMidSession) {
      const stateJson = JSON.stringify({
        impact: existingImpact,
        outcome: existingOutcome,
        output: existingOutput,
      });

      const resumePrompt = basePrompt + langInstruction + `\n\n## Session Context (Resuming Mid-Session)\nThe user was in the middle of a coaching session. Current state:\n${stateJson}${existingUnderstanding ? `\n\nYour understanding: ${existingUnderstanding}` : ""}${userContext ? `\n\nAccumulated user context: ${userContext}` : ""}\n\nContinue coaching from where you left off. Don't re-introduce yourself. Call update_todos immediately with the current todos, and update_workspace to restore the screen, then continue the conversation.`;

      const firstMessage = language === "de"
        ? "Willkommen zurück! Lass uns da weitermachen, wo wir aufgehört haben."
        : "Welcome back! Let's continue where we left off.";

      return {
        agent: {
          language,
          firstMessage,
          prompt: { prompt: resumePrompt },
        },
      };
    }

    // Scenario B: Returning user, starting new OKR
    if (hasUserContext) {
      const historySnippets = completedSessions
        .slice(-5)
        .map((s, i) => `${i + 1}. "${s.okr.objective}"`)
        .join("\n");

      const returningPrompt = basePrompt + langInstruction + `\n\n## Returning User Context\nThis user has worked with you before. Here's what you know about them:\n\n${userContext}${historySnippets ? `\n\nPrevious OKRs drafted:\n${historySnippets}` : ""}\n\nSkip the initial introductions — you already know this user. Greet them warmly and ask what they'd like to work on next. Call update_todos immediately with a fresh coaching roadmap.`;

      const firstMessage = language === "de"
        ? "Schön, dich wieder zu sehen! Was möchtest du dieses Mal angehen — ein neues OKR für dasselbe Team, oder etwas ganz anderes?"
        : "Great to see you again! What would you like to work on this time — a new OKR for the same team, or something different?";

      return {
        agent: {
          language,
          firstMessage,
          prompt: { prompt: returningPrompt },
        },
      };
    }

    // Scenario A: Fresh user — only override language (prompt and first message come from ElevenLabs)
    return { agent: { language } };
  };

  // Start or end session
  const handleToggle = async () => {
    if (isSessionActive) {
      await conversation.endSession();
      setIsSessionActive(false);
      return;
    }

    setConnectionError(null);

    try {
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      if (!agentId) {
        throw new Error("NEXT_PUBLIC_ELEVENLABS_AGENT_ID is not set");
      }

      let sessionConfig: Parameters<typeof conversation.startSession>[0];
      let systemPrompt = "";

      try {
        const res = await fetch("/api/elevenlabs-signed-url");
        if (res.ok) {
          const data = await res.json();
          sessionConfig = { signedUrl: data.signedUrl };
          systemPrompt = data.systemPrompt || "";
        } else {
          throw new Error("No signed URL");
        }
      } catch {
        sessionConfig = {
          agentId,
          connectionType: "websocket" as const,
        };
      }

      const overrides = buildOverrides(systemPrompt);
      (sessionConfig as Record<string, unknown>).overrides = overrides;

      // Pass clientTools directly in startSession for reliable dispatch
      (sessionConfig as Record<string, unknown>).clientTools = clientTools;

      console.log("[VoiceCoach] Starting session with clientTools:", Object.keys(clientTools));
      await conversation.startSession(sessionConfig);
      setIsSessionActive(true);
    } catch (err) {
      console.error("Failed to start session:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setConnectionError(msg);
    }
  };

  // Canvas visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.28;

      ctx.clearRect(0, 0, w, h);
      time += 0.016;

      let inputVolume = 0;
      let inputFreqData: Uint8Array | undefined;
      let outputFreqData: Uint8Array | undefined;

      if (isSessionActive) {
        try {
          inputVolume = conversation.getInputVolume();
          inputFreqData = conversation.getInputByteFrequencyData();
          outputFreqData = conversation.getOutputByteFrequencyData();
        } catch {
          // SDK not ready yet
        }
      }

      const isCoachSpeaking = isSpeaking;
      const isUserSpeaking = inputVolume > 0.05;
      const isActive = isSessionActive && (isCoachSpeaking || isUserSpeaking);

      const c = isCoachSpeaking ? GREEN : isUserSpeaking ? BLUE : IDLE;

      // Update bar targets
      if (isActive && (inputFreqData || outputFreqData)) {
        const freqData = isCoachSpeaking ? outputFreqData : inputFreqData;
        if (freqData && freqData.length > 0) {
          for (let i = 0; i < NUM_BARS; i++) {
            const freqIndex = Math.floor((i / NUM_BARS) * Math.min(freqData.length, 64));
            const value = freqData[freqIndex] / 255;
            targetBarsRef.current[i] = value * 0.9;
          }
        }
      } else if (isSessionActive) {
        for (let i = 0; i < NUM_BARS; i++) {
          targetBarsRef.current[i] = (Math.sin(i * 0.1 + time * 1.2) * 0.5 + 0.5) * 0.1;
        }
      } else {
        for (let i = 0; i < NUM_BARS; i++) {
          targetBarsRef.current[i] = (Math.sin(i * 0.1 + time * 0.8) * 0.5 + 0.5) * 0.05;
        }
      }

      for (let i = 0; i < NUM_BARS; i++) {
        barsRef.current[i] += (targetBarsRef.current[i] - barsRef.current[i]) * 0.15;
      }

      // Ambient glow rings
      for (let ring = 3; ring >= 0; ring--) {
        const ringRadius = baseRadius + 15 + ring * 20;
        const alpha = isActive ? 0.04 + ring * 0.01 : 0.01 + ring * 0.005;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, TWO_PI);
        ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${isActive ? alpha : alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Radial bars
      for (let i = 0; i < NUM_BARS; i++) {
        const angle = (i / NUM_BARS) * TWO_PI - Math.PI / 2;
        const barHeight = barsRef.current[i] * 45 + 3;
        const innerR = baseRadius + 8;
        const outerR = innerR + barHeight;
        const x1 = cx + Math.cos(angle) * innerR;
        const y1 = cy + Math.sin(angle) * innerR;
        const x2 = cx + Math.cos(angle) * outerR;
        const y2 = cy + Math.sin(angle) * outerR;
        const intensity = barsRef.current[i];
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${0.6 + intensity * 0.4})`);
        gradient.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, ${intensity * 0.15})`);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Inner glow
      const glowGradient = ctx.createRadialGradient(cx, cy, baseRadius * 0.5, cx, cy, baseRadius + 8);
      const glowAlpha = isActive ? 0.1 : 0.04;
      glowGradient.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${glowAlpha})`);
      glowGradient.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius + 8, 0, TWO_PI);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Avatar border
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, TWO_PI);
      const borderAlpha = isCoachSpeaking ? 0.4 : isUserSpeaking ? 0.3 : isSessionActive ? 0.15 : 0.1;
      ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${borderAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isSessionActive, isSpeaking, conversation]);

  const hasHistory = messages.length > 0;
  const latestCoachMessage = [...messages].reverse().find((m) => m.role === "coach")?.text ?? null;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Voice visualization */}
      <div className="relative w-full flex justify-center items-center" style={{ height: 260 }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} />

        <button onClick={handleToggle} className="relative z-10 cursor-pointer group" style={{ width: 120, height: 120 }}>
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#FADA51]/40 transition-colors duration-500">
            <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#363953" />
                  <stop offset="100%" stopColor="#1C1E31" />
                </linearGradient>
                <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dba887" />
                  <stop offset="100%" stopColor="#c4946f" />
                </linearGradient>
                <linearGradient id="hair" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2a1810" />
                  <stop offset="100%" stopColor="#1a0f0a" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="100" fill="url(#bg-grad)" />
              <ellipse cx="100" cy="195" rx="65" ry="50" fill="#669C89" opacity="0.9" />
              <ellipse cx="100" cy="200" rx="55" ry="40" fill="#4D7D6C" />
              <rect x="88" y="130" width="24" height="25" rx="4" fill="url(#skin)" />
              <ellipse cx="100" cy="105" rx="38" ry="42" fill="url(#skin)" />
              <ellipse cx="100" cy="80" rx="42" ry="38" fill="url(#hair)" />
              <ellipse cx="60" cy="95" rx="10" ry="30" fill="url(#hair)" />
              <ellipse cx="140" cy="95" rx="10" ry="30" fill="url(#hair)" />
              <path d="M62 85 Q80 55 100 60 Q120 55 138 85 Q135 65 100 58 Q65 65 62 85Z" fill="url(#hair)" />
              <ellipse cx="85" cy="105" rx="5" ry="3.5" fill="#1C1E31" />
              <ellipse cx="115" cy="105" rx="5" ry="3.5" fill="#1C1E31" />
              <circle cx="86" cy="104" r="1.2" fill="white" opacity="0.8" />
              <circle cx="116" cy="104" r="1.2" fill="white" opacity="0.8" />
              <path d="M77 97 Q85 94 93 96" stroke="#2a1810" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M107 96 Q115 94 123 97" stroke="#2a1810" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M98 108 Q100 116 102 108" stroke="#b8856a" strokeWidth="1" fill="none" />
              <path d="M88 120 Q100 128 112 120" stroke="#a0705a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <circle cx="62" cy="110" r="2" fill="#EFC92D" opacity="0.8" />
              <circle cx="138" cy="110" r="2" fill="#EFC92D" opacity="0.8" />
            </svg>
          </div>
          {isSessionActive && (
            <div className="absolute inset-0 -m-2 rounded-full border-2 border-[#FADA51]/25 animate-pulse-ring" />
          )}
        </button>
      </div>

      {/* Latest agent message */}
      {latestCoachMessage && (
        <p className="mt-3 text-sm text-[#C2C5CE] text-center leading-relaxed px-2 max-w-sm">
          {latestCoachMessage}
        </p>
      )}

      {/* Status indicator */}
      <div className="mt-2 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          isSessionActive
            ? isSpeaking ? "bg-[#669C89] animate-pulse"
              : status === "connected" ? "bg-[#48BCFE] animate-pulse" : "bg-[#FADA51]"
            : connectionError ? "bg-[#D9513C]"
              : hasHistory ? "bg-[#838895]" : "bg-[#838895]/60"
        }`} />
        <span className={`text-xs font-medium tracking-wide uppercase ${
          isSessionActive
            ? isSpeaking ? "text-[#669C89]"
              : status === "connected" ? "text-[#48BCFE]" : "text-[#FADA51]"
            : connectionError ? "text-[#D9513C]" : "text-[#838895]"
        }`}>
          {isSessionActive
            ? isSpeaking ? "Speaking" : status === "connected" ? "Listening" : "Connecting..."
            : connectionError ? "Error" : hasHistory ? "Paused — click to continue" : "Click to start"}
        </span>
      </div>

      {/* Language toggle */}
      <div className="mt-3 flex items-center rounded-full bg-[#363953]/60 border border-[#363953] p-0.5">
        <button
          onClick={() => onLanguageChange("de")}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all duration-200 ${
            language === "de" ? "bg-[#FADA51] text-[#1C1E31]" : "text-[#838895] hover:text-[#C2C5CE]"
          }`}
        >
          DE
        </button>
        <button
          onClick={() => onLanguageChange("en")}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all duration-200 ${
            language === "en" ? "bg-[#FADA51] text-[#1C1E31]" : "text-[#838895] hover:text-[#C2C5CE]"
          }`}
        >
          EN
        </button>
      </div>

      {/* Coaching progress */}
      <TodoList todos={todos} />
    </div>
  );
}
