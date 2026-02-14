/**
 * Creates 5 client tools and updates the ElevenLabs agent.
 * Run: npx tsx scripts/update-agent.ts
 */

const API_KEY = "sk_18b603e83f129224d6895e3632fff389e8541f341396b1d8";
const AGENT_ID = "agent_3401khbc9w5efv086mz09qp4bj77";
const BASE_URL = "https://api.elevenlabs.io/v1/convai";

import { SYSTEM_PROMPT } from "../src/lib/system-prompt";

// --- Tool definitions ---

const TOOLS = [
  {
    name: "update_todos",
    description:
      "Update the coaching progress checklist shown on the user's screen. Call on your first message and whenever the coaching plan changes. Each call sends the COMPLETE list of todos.",
    parameters: {
      type: "object",
      required: ["todos", "understanding"],
      properties: {
        todos: {
          type: "array",
          description: "All coaching todo items. Each has id, text, and completed status.",
          items: {
            type: "object",
            required: ["id", "text", "completed"],
            properties: {
              id: { type: "string", description: "Unique identifier, e.g. 'step-1'" },
              text: { type: "string", description: "Description of the coaching step" },
              completed: { type: "boolean", description: "Whether this step is done" },
            },
          },
        },
        understanding: {
          type: "string",
          description:
            "Your comprehensive understanding of the user: role, team, cycle, constraints, strategies. Persists across sessions.",
        },
      },
    },
  },
  {
    name: "update_strategy",
    description:
      "Update the Strategy section on the user's screen. Call when the user shares strategic context, company goals, or high-level direction.",
    parameters: {
      type: "object",
      required: ["strategy"],
      properties: {
        strategy: {
          type: "string",
          description: "1-3 sentences summarizing the strategic direction or company goal.",
        },
      },
    },
  },
  {
    name: "update_kpis",
    description:
      "Update the KPIs / Lagging Indicators section on the user's screen. Call when metrics or KPIs come up in conversation.",
    parameters: {
      type: "object",
      required: ["kpis"],
      properties: {
        kpis: {
          type: "array",
          description: "All KPIs/metrics the user cares about.",
          items: {
            type: "object",
            required: ["label", "value", "description"],
            properties: {
              label: { type: "string", description: "KPI name, e.g. 'Customer Retention'" },
              value: { type: "string", description: "Current or target value, e.g. '85%' or '→ 95%'" },
              description: { type: "string", description: "What this metric measures" },
            },
          },
        },
      },
    },
  },
  {
    name: "update_okr",
    description:
      "Update the OKR Draft on the user's screen. This is the primary coaching output. Call as soon as you can formulate an Objective.",
    parameters: {
      type: "object",
      required: ["objective", "key_results"],
      properties: {
        objective: {
          type: "string",
          description: "The OKR objective - qualitative, inspirational, time-bound.",
        },
        key_results: {
          type: "array",
          description: "Key results. Can be empty if only the Objective is ready.",
          items: {
            type: "object",
            required: ["label", "text", "progress"],
            properties: {
              label: { type: "string", description: "e.g. KR 1, KR 2" },
              text: { type: "string", description: "Quantitative and measurable" },
              progress: { type: "number", description: "0-100, use 0 for new drafts" },
            },
          },
        },
      },
    },
  },
  {
    name: "update_initiatives",
    description:
      "Update the Initiatives section on the user's screen. Call when concrete actions or projects come up that support the OKR.",
    parameters: {
      type: "object",
      required: ["initiatives"],
      properties: {
        initiatives: {
          type: "array",
          description: "Concrete actions that drive key results.",
          items: {
            type: "object",
            required: ["text", "linked_kr"],
            properties: {
              text: { type: "string", description: "Description of the initiative" },
              linked_kr: { type: "string", description: "Which KR this supports, e.g. 'KR 1' or empty string" },
            },
          },
        },
      },
    },
  },
];

async function createTool(tool: (typeof TOOLS)[number]): Promise<string> {
  const body = {
    tool_config: {
      type: "client",
      name: tool.name,
      description: tool.description,
      response_timeout_secs: 1,
    },
    parameters: tool.parameters,
  };

  const res = await fetch(`${BASE_URL}/tools`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`Failed to create tool ${tool.name}:`, res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log(`  Created: ${tool.name} -> ${data.id}`);
  return data.id;
}

async function updateAgent(toolIds: string[]) {
  console.log("\nStep 2: Updating agent with tools and prompt...");

  const patchBody = {
    name: "Workpath AI Companion",
    conversation_config: {
      agent: {
        first_message: "Hey! Ich bin dein AI Companion von Workpath. Zusammen entwickeln wir richtig gute OKRs — ich stelle dir dazu ein paar Fragen, und Schritt für Schritt bauen wir dein OKR auf. Unten links siehst du immer, wo wir gerade stehen. Los geht's — erzähl mir kurz, in welchem Team du arbeitest und was dich gerade beschäftigt.",
        language: "de",
        prompt: {
          prompt: SYSTEM_PROMPT,
          tool_ids: toolIds,
        },
      },
    },
    platform_settings: {
      overrides: {
        conversation_config_override: {
          agent: {
            first_message: true,
            language: true,
            prompt: {
              prompt: true,
            },
          },
        },
      },
    },
  };

  const res = await fetch(`${BASE_URL}/agents/${AGENT_ID}`, {
    method: "PATCH",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patchBody),
  });

  if (!res.ok) {
    console.error("Failed to update agent:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  const prompt = data.conversation_config?.agent?.prompt;

  console.log("  Agent name:", data.name);
  console.log("  Tool IDs:", JSON.stringify(prompt?.tool_ids));
  console.log(
    "  Tools:",
    JSON.stringify(prompt?.tools?.map((t: { name: string }) => t.name))
  );
  console.log("  LLM:", prompt?.llm);
  console.log("  First message:", data.conversation_config?.agent?.first_message?.slice(0, 80) + "...");
  console.log("  Prompt preview:", prompt?.prompt?.slice(0, 100) + "...");
}

async function main() {
  console.log("=== Workpath AI Companion — 5-Tool Setup ===\n");

  console.log("Step 1: Creating tools...");
  const toolIds: string[] = [];
  for (const tool of TOOLS) {
    const id = await createTool(tool);
    toolIds.push(id);
  }

  await updateAgent(toolIds);

  console.log("\n=== Done! ===");
  console.log("Tool IDs:", JSON.stringify(toolIds));
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
