export interface KeyResult {
  label: string;
  text: string;
  progress: number;
}

export interface OKR {
  objective: string;
  key_results: KeyResult[];
}

export interface OKRUpdate {
  objective: string;
  key_results: KeyResult[];
  understanding: string;
}

export interface ChatMessage {
  role: "user" | "coach";
  text: string;
  timestamp: number;
}

// --- Workspace (agent-driven, flexible sections) ---

export type SectionStatus = "pending" | "active" | "completed";

export interface WorkspaceSection {
  id: string;
  title: string;
  status: SectionStatus;
  summary: string;
}

export interface WorkspaceUpdate {
  sections: WorkspaceSection[];
  okr: OKR | null;
  understanding: string;
}

// --- Multi-session history ---

export interface CompletedSession {
  id: string;
  timestamp: number;
  okr: OKR;
  sections: WorkspaceSection[];
  understanding: string;
  messages: ChatMessage[];
}

// --- Persisted state ---

export interface PersistedState {
  version: 1;
  language: "de" | "en";
  currentSession: {
    messages: ChatMessage[];
    sections: WorkspaceSection[];
    okr: OKR | null;
    understanding: string;
  };
  completedSessions: CompletedSession[];
  userContext: string;
}
