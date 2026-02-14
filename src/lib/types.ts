export interface KeyResult {
  label: string;
  text: string;
  progress: number;
}

export interface OKR {
  objective: string;
  key_results: KeyResult[];
}

export interface ChatMessage {
  role: "user" | "coach";
  text: string;
  timestamp: number;
}

// --- Coaching to-do items ---

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

// --- Right-side structured sections ---

export interface KPI {
  label: string;
  value: string;
  description: string;
}

export interface Initiative {
  text: string;
  linked_kr: string;
}

// --- Multi-session history ---

export interface CompletedSession {
  id: string;
  timestamp: number;
  okr: OKR;
  strategy: string | null;
  kpis: KPI[];
  initiatives: Initiative[];
  understanding: string;
  messages: ChatMessage[];
}

// --- Persisted state ---

export interface PersistedState {
  version: 2;
  language: "de" | "en";
  currentSession: {
    messages: ChatMessage[];
    todos: TodoItem[];
    strategy: string | null;
    kpis: KPI[];
    okr: OKR | null;
    initiatives: Initiative[];
    understanding: string;
  };
  completedSessions: CompletedSession[];
  userContext: string;
}
