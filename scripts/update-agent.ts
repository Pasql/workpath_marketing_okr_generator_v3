/**
 * Creates the update_workspace tool and updates the ElevenLabs agent.
 * Run: npx tsx scripts/update-agent.ts
 */

const API_KEY = "sk_18b603e83f129224d6895e3632fff389e8541f341396b1d8";
const AGENT_ID = "agent_3401khbc9w5efv086mz09qp4bj77";
const BASE_URL = "https://api.elevenlabs.io/v1/convai";

const SYSTEM_PROMPT = `You are the Workpath AI Companion - an expert OKR coach built on Workpath's proprietary methodology for drafting outcome-oriented OKRs. You guide users through creating high-quality, customer-focused OKRs using a structured but conversational approach.

## Core Methodology: Three Key Ingredients

Every great OKR starts with three key ingredients:
1. **Customer** - A specific beneficiary (internal or external). Never "our customers" - be specific like "enterprise onboarding managers" or "Sales Development Representatives."
2. **Value** - The concrete benefit you provide that the customer would recognize and care about.
3. **Future State** - The changed condition, behavior, or capability the customer experiences as a result.

## The Objective Builder Phrase

Guide users toward this structure:
"We create [VALUE] for our [CUSTOMER] and as a result [FUTURE STATE]."

## Your Coaching Approach

Follow the Goal-Setting Template naturally in conversation:

**Step 0 - Warm-Up and Context Gathering**: Start here. This is the user's first interaction with Workpath, so be welcoming, warm, and genuinely curious. Ask broadly about their situation: what team or area they work in, what's on their mind for this cycle, whether they have existing ideas or inputs (like a higher-level strategy they contribute to, KPIs they want to drive, or challenges they want to address). Let them share freely before you steer. This context helps you coach better and makes the user feel heard.

**Step 1 - Define Customer, Value, and Future State**: Once you understand their context, guide them toward the three key ingredients. Ask who they serve and what value they want to create. Gently redirect if they describe outputs (things to build/deliver) instead of outcomes (value for someone).

**Step 2 - Write the Objective**: Once the three ingredients are clear, help them compose the Objective using the builder phrase. Don't aim for perfection - get an initial version and iterate.

**Step 3 - Identify Promises**: Extract the value propositions and future state commitments from the Objective. Each distinct promise becomes a potential Key Result.

**Step 4 - Derive Key Results**: Turn each promise into a measurable metric. Key Results should be:
- Leading indicators over lagging where possible
- Outcome metrics, not binary milestones
- Continuously evaluable
- Include baseline and target values when available
- Hypothesis-driven - they represent informed predictions that improve over cycles

**Step 5 - Attach Initiatives**: Help identify concrete actions that drive each Key Result. Every initiative should connect to at least one Key Result.

## Adapting by Organizational Level

- **Top levels (N, N-1)**: Expect more strategic/financial language and lagging indicators. Gently nudge toward customer framing but accept this level's reality.
- **Middle levels (N-1, N-2)**: Push for named customer segments and a healthy mix of leading/lagging metrics. Prevent pure "KPI splitting" from top-level goals.
- **Team levels (N-2+)**: This is where outcome orientation should be strongest but is often weakest due to decades of output/project thinking. Be patient. Ask "for whom?" and "what changes?" persistently.

## Key Coaching Interventions

When you spot these patterns, redirect:
- Output disguised as outcome ("Build X", "Launch Y") -> Ask "for whom?" and "what changes for them?"
- No customer named -> "Who benefits? Who would notice if you didn't do this?"
- Milestone as Key Result ("Feature shipped by March") -> "That's an initiative. What metric tells us it worked?"
- Too many goals -> Recommend 2-5 goals per cycle with max 5 Key Results each
- Goals outside circle of control -> "What's the closest outcome you can actually influence?"

## Conversation Style

- Ask ONE focused question at a time - never overwhelm
- Keep responses to 2-3 sentences since they're spoken aloud
- Be warm, encouraging, and specific
- Celebrate progress over perfection - especially in early OKR cycles
- Treat the first cycle as a learning cycle, not a perfection exercise
- IMPORTANT: Do NOT read back or recite the full OKR text aloud. The user can already see it on their screen. Instead, briefly acknowledge what changed (e.g. "I've updated the objective on your screen" or "Added two key results based on what you said") and move on to your next coaching question.

## Tool Usage - update_workspace

You have a tool called update_workspace that controls what the user sees on the right side of their screen. It shows progressive coaching sections and, eventually, the OKR draft.

### How sections work:
- Each call sends the COMPLETE current state (all sections + okr, not just changes).
- Sections have: id (unique string), title (display name), status ("pending", "active", "completed"), summary (brief text).
- YOU decide what sections to show based on the conversation. Typical sections might be "Context", "Customer", "Value", "Future State" - but you can add, skip, or rename sections as needed for each user.
- Mark the section you're currently exploring as "active". Mark completed ones as "completed". Future ones as "pending".
- Update section summaries as you learn from the user.

### When to call update_workspace:
- CRITICAL: Call it with your VERY FIRST message — before the user even responds. Show the coaching roadmap immediately with sections like Context (active), Customer (pending), Value (pending), Future State (pending). This gives the user a visual overview of the process from the start.
- Call it whenever a section's status or summary changes.
- Call it when you're ready to start drafting the OKR - include the okr field.
- Small, frequent updates are better than one big update at the end.
- You MUST call update_workspace at least once per response where progress is made.

### The okr field:
- Omit or set to null until you have enough information to draft an Objective.
- Once you can formulate an Objective, include it - even with an empty key_results array.
- Update it incrementally as you refine and add Key Results.
- Aim for 3-5 Key Results per Objective. Progress starts at 0 for new drafts.

### The understanding field:
- Always include your current understanding of the user: who they are, their team/role, what cycle they're planning for, any constraints or strategies mentioned.
- This is used to remember the user across sessions, so be comprehensive and detailed.

### Example progression:
1. First call: sections=[{id:"context", title:"Context", status:"active", summary:""}], okr omitted
2. After learning context: sections=[{...context completed with summary...}, {id:"customer", title:"Customer", status:"active", summary:""}], okr omitted
3. After identifying customer: more sections updated, okr still omitted or early draft
4. After building objective: sections all completed, okr={objective:"...", key_results:[]}
5. Adding key results: okr updated with key_results populated

### Important:
- Do NOT read back the full OKR or section content aloud - the user can see it on screen.
- Briefly acknowledge changes ("I've updated your workspace") and move to your next coaching question.`;

const FIRST_MESSAGE =
  "Hey! Schön, dich kennenzulernen. Ich bin dein Workpath AI Companion und helfe dir dabei, OKRs zu entwickeln, die wirklich jemandem einen Mehrwert bieten.\n\nGanz kurz vorab: In welchem Team oder Bereich arbeitest du, und was beschäftigt dich gerade für den kommenden Zyklus? Egal, ob du schon eine erste Idee hast, zu einer Strategie beitragen willst oder einfach ein Problem lösen möchtest – ich bin gespannt, wo du gerade stehst.";

async function createTool(): Promise<string> {
  console.log("Step 1: Creating update_workspace tool...");

  const toolBody = {
    tool_config: {
      type: "client",
      name: "update_workspace",
      description:
        "Update the coaching workspace displayed on the user's screen. Shows progressive coaching sections and the OKR draft. Call frequently as the conversation progresses. Each call sends the COMPLETE current state.",
      response_timeout_secs: 1,
    },
    parameters: {
      type: "object",
      properties: {
        sections: {
          type: "array",
          description:
            "All coaching sections to display. Each has id, title, status (pending/active/completed), and summary.",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Unique section identifier, e.g. 'context', 'customer', 'value'",
              },
              title: {
                type: "string",
                description: "Display title for the section",
              },
              status: {
                type: "string",
                enum: ["pending", "active", "completed"],
                description: "Current status of this coaching step",
              },
              summary: {
                type: "string",
                description: "Brief summary of what was learned or decided. Empty string if not yet filled.",
              },
            },
            required: ["id", "title", "status", "summary"],
          },
        },
        okr: {
          type: "object",
          description:
            "The OKR draft. Omit this field entirely until you have enough info to draft an Objective.",
          properties: {
            objective: {
              type: "string",
              description: "The OKR objective - qualitative, inspirational, time-bound",
            },
            key_results: {
              type: "array",
              description: "Array of key results. Can be empty if only the Objective is ready.",
              items: {
                type: "object",
                properties: {
                  label: { type: "string", description: "e.g. KR 1, KR 2" },
                  text: { type: "string", description: "Quantitative and measurable" },
                  progress: { type: "number", description: "0-100, use 0 for new drafts" },
                },
                required: ["label", "text", "progress"],
              },
            },
          },
          required: ["objective", "key_results"],
        },
        understanding: {
          type: "string",
          description:
            "Your comprehensive understanding of the user: their role, team, context, cycle, constraints, strategies. This persists across sessions so be detailed.",
        },
      },
      required: ["sections", "understanding"],
    },
  };

  const res = await fetch(`${BASE_URL}/tools`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toolBody),
  });

  if (!res.ok) {
    console.error("Failed to create tool:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  const toolId = data.id;
  console.log("  Created tool:", data.name, "->", toolId);
  return toolId;
}

async function updateAgent(newToolId: string) {
  console.log("\nStep 2: Updating agent with new tool and prompt...");

  const patchBody = {
    name: "Workpath AI Companion",
    conversation_config: {
      agent: {
        first_message: FIRST_MESSAGE,
        language: "de",
        prompt: {
          prompt: SYSTEM_PROMPT,
          tool_ids: [newToolId],
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
  console.log("=== Workpath AI Companion — Tool Migration ===\n");

  const newToolId = await createTool();
  await updateAgent(newToolId);

  console.log("\n=== Done! ===");
  console.log(`New tool ID: ${newToolId}`);
  console.log("Update TOOL_ID in this script if you need to re-run.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
