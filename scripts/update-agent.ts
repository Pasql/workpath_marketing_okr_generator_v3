/**
 * Creates 2 client tools and attaches them to the ElevenLabs agent.
 * System prompt and first message are managed directly on ElevenLabs (single source of truth).
 * Run: npx tsx scripts/update-agent.ts
 */

const API_KEY = "sk_18b603e83f129224d6895e3632fff389e8541f341396b1d8";
const AGENT_ID = "agent_3401khbc9w5efv086mz09qp4bj77";
const BASE_URL = "https://api.elevenlabs.io/v1/convai";

// --- Tool definitions ---

const TOOLS = [
  {
    name: "update_todos",
    description:
      'Update the coaching progress checklist. Call on your first message and whenever progress changes. Parameters: {"todos": [{"id": "step-1", "text": "Collect context", "completed": false}, ...], "understanding": "User is a product manager at..."}. Each todo MUST have id (string like step-1), text (string), completed (boolean). understanding is a string summarizing what you know about the user.',
  },
  {
    name: "update_workspace",
    description:
      'Update the workspace. Only include fields you want to change. Parameters: {"impact": {"strategy": "string or null", "kpis": [{"label": "Retention", "value": "85%", "description": "Customer retention rate"}]}, "outcome": {"objective": "We create...", "key_results": [{"label": "KR 1", "text": "Increase X from Y to Z", "progress": 0}]}, "output": {"initiatives": [{"text": "Launch campaign", "linked_kr": "KR 1"}]}}. Focus on outcome (OKR) as primary output.',
  },
];

async function createTool(tool: (typeof TOOLS)[number]): Promise<string> {
  const body = {
    tool_config: {
      type: "client",
      name: tool.name,
      description: tool.description,
      response_timeout_secs: 10,
      expects_response: true,
    },
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
  console.log("\nStep 2: Attaching tools to agent...");

  // Only update tool IDs and overrides — prompt and first message are managed on ElevenLabs
  const patchBody = {
    conversation_config: {
      agent: {
        prompt: {
          tool_ids: toolIds,
        },
      },
      conversation: {
        client_events: [
          "audio",
          "interruption",
          "user_transcript",
          "agent_response",
          "agent_response_correction",
          "client_tool_call",
        ],
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
  console.log("  client_events:", JSON.stringify(data.conversation_config?.conversation?.client_events));
}

async function main() {
  console.log("=== Workpath AI Companion — Tool Setup ===\n");

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
