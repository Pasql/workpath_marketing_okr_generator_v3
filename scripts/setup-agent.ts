/**
 * Setup script for creating the ElevenLabs Conversational AI agent.
 *
 * Run: npx tsx scripts/setup-agent.ts
 *
 * Prerequisites:
 * - ELEVENLABS_API_KEY set in .env.local
 * - OPENAI_API_KEY set in .env.local (used by the agent for LLM inference)
 *
 * This script:
 * 1. Creates an agent on ElevenLabs with OKR coaching config
 * 2. Prints the agent ID for you to add to .env.local
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const ENV_PATH = resolve(__dirname, "../.env.local");

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  if (!existsSync(ENV_PATH)) return env;
  const content = readFileSync(ENV_PATH, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    env[key] = value;
  }
  return env;
}

const OKR_COACHING_PROMPT = `You are an expert OKR coach at Workpath, one of the leading OKR platforms. You help people write clear, measurable, and ambitious OKRs (Objectives and Key Results).

## Your Coaching Approach
- Start by understanding what the user wants to achieve and their context
- Ask ONE focused question at a time — don't overwhelm with multiple questions
- After gathering enough context (2-3 exchanges), call the update_okr tool with a draft OKR
- Continue refining: ask about measurability, ambition level, time frame, and alignment
- Call update_okr again with improvements after each meaningful refinement
- Keep responses concise (2-3 sentences max) since they'll be spoken aloud
- Be warm, encouraging, and specific in your coaching

## OKR Best Practices to Apply
- Objectives should be qualitative, inspirational, and time-bound
- Key Results should be quantitative, measurable, and challenging but achievable
- Aim for 3-5 Key Results per Objective
- Key Results should be outcomes, not tasks/activities
- Good KRs have a clear metric and target number
- Progress starts at 0 for new drafts

## Tool Usage
- Call update_okr whenever you have enough information to create or improve the OKR
- Include your understanding of the user's goals in the understanding field
- Don't wait for perfection — show early drafts and iterate
- Each update should be a complete OKR (not just changes)`;

const FIRST_MESSAGE =
  "Hey! I'm your OKR coach. I'm here to help you create a great OKR. What goal or area would you like to focus on?";

async function main() {
  const env = loadEnv();
  const apiKey = env.ELEVENLABS_API_KEY;

  if (!apiKey || apiKey.includes("your_")) {
    console.error(
      "❌ ELEVENLABS_API_KEY not set in .env.local. Please add your key first."
    );
    process.exit(1);
  }

  console.log("🔧 Creating ElevenLabs Conversational AI agent...\n");

  // Create the agent
  const response = await fetch(
    "https://api.elevenlabs.io/v1/convai/agents/create",
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Workpath OKR Coach",
        conversation_config: {
          agent: {
            prompt: {
              prompt: OKR_COACHING_PROMPT,
              llm: "gpt-4o",
              temperature: 0.7,
              tools: [
                {
                  type: "client",
                  name: "update_okr",
                  description:
                    "Update the OKR displayed on screen. Call whenever you have enough info to create or improve the draft OKR. Always include all fields.",
                  parameters: {
                    type: "object",
                    properties: {
                      objective: {
                        type: "string",
                        description: "The OKR objective — qualitative, inspirational, time-bound",
                      },
                      key_results: {
                        type: "array",
                        description: "Array of 3-5 key results",
                        items: {
                          type: "object",
                          properties: {
                            label: {
                              type: "string",
                              description: "Short label like 'KR 1', 'KR 2', etc.",
                            },
                            text: {
                              type: "string",
                              description: "The key result text — quantitative and measurable",
                            },
                            progress: {
                              type: "number",
                              description: "Progress percentage 0-100. Use 0 for new drafts.",
                            },
                          },
                          required: ["label", "text", "progress"],
                        },
                      },
                      understanding: {
                        type: "string",
                        description:
                          "Your current understanding of what the user wants to achieve, their context, and any constraints mentioned",
                      },
                    },
                    required: ["objective", "key_results", "understanding"],
                  },
                },
              ],
            },
            first_message: FIRST_MESSAGE,
            language: "en",
          },
          tts: {
            voice_id: "EXAVITQu4vr4xnSDxMaL", // Sarah — warm, friendly female voice
            model_id: "eleven_flash_v2_5",
          },
        },
        platform_settings: {
          auth: {
            enable_auth: true, // require signed URL
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Failed to create agent (${response.status}):`);
    console.error(errorText);

    if (response.status === 422) {
      console.log(
        "\n💡 The API format may have changed. You can create the agent manually:"
      );
      console.log("   1. Go to https://elevenlabs.io/app/conversational-ai");
      console.log("   2. Create a new agent");
      console.log("   3. Set LLM to OpenAI GPT-4o");
      console.log("   4. Paste the system prompt from this script");
      console.log('   5. Add a client tool named "update_okr"');
      console.log("   6. Copy the agent ID to .env.local");
    }
    process.exit(1);
  }

  const data = await response.json();
  const agentId = data.agent_id;

  console.log(`✅ Agent created successfully!`);
  console.log(`   Agent ID: ${agentId}\n`);

  // Update .env.local
  let envContent = readFileSync(ENV_PATH, "utf-8");
  envContent = envContent.replace(
    /NEXT_PUBLIC_ELEVENLABS_AGENT_ID=.*/,
    `NEXT_PUBLIC_ELEVENLABS_AGENT_ID=${agentId}`
  );
  writeFileSync(ENV_PATH, envContent);

  console.log(`✅ Updated .env.local with agent ID`);
  console.log(`\n🚀 Setup complete! Run 'npm run dev' to start.`);
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
