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
