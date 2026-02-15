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

// --- Coaching to-do items (left side) ---

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

// --- Right-side: Impact / Outcome / Output ---

export interface KPI {
  label: string;
  value: string;
  description: string;
}

export interface Initiative {
  text: string;
  linked_kr: string;
}

export interface Impact {
  strategy: string | null;
  kpis: KPI[];
}

export interface Output {
  initiatives: Initiative[];
}

// --- Workspace update (single tool payload for right side) ---

export interface WorkspaceData {
  impact: Impact;
  outcome: OKR | null;
  output: Output;
}

// --- Multi-session history ---

export interface CompletedSession {
  id: string;
  timestamp: number;
  okr: OKR;
  impact: Impact;
  output: Output;
  understanding: string;
  messages: ChatMessage[];
}

// --- Persisted state ---

export interface PersistedState {
  version: 3;
  language: "de" | "en";
  currentSession: {
    messages: ChatMessage[];
    todos: TodoItem[];
    impact: Impact;
    outcome: OKR | null;
    output: Output;
    understanding: string;
  };
  completedSessions: CompletedSession[];
  userContext: string;
}
