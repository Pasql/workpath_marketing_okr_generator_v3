import type { PersistedState } from "./types";

const STORAGE_KEY = "workpath-okr-v3";

export function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 2) return null;
    return parsed as PersistedState;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded (e.g. Safari private browsing) — silently ignore
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function createDefaultState(language: "de" | "en" = "de"): PersistedState {
  return {
    version: 2,
    language,
    currentSession: {
      messages: [],
      todos: [],
      strategy: null,
      kpis: [],
      okr: null,
      initiatives: [],
      understanding: "",
    },
    completedSessions: [],
    userContext: "",
  };
}
