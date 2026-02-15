import type { PersistedState } from "./types";

const STORAGE_KEY = "workpath-okr-v4";

export function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 3) return null;
    return parsed as PersistedState;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded — silently ignore
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export const EMPTY_IMPACT = { strategy: null, kpis: [] };
export const EMPTY_OUTPUT = { initiatives: [] };

export function createDefaultState(language: "de" | "en" = "de"): PersistedState {
  return {
    version: 3,
    language,
    currentSession: {
      messages: [],
      todos: [],
      impact: { ...EMPTY_IMPACT },
      outcome: null,
      output: { ...EMPTY_OUTPUT },
      understanding: "",
    },
    completedSessions: [],
    userContext: "",
  };
}
