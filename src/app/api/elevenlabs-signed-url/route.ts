import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return NextResponse.json(
      { error: "Missing ELEVENLABS_API_KEY or NEXT_PUBLIC_ELEVENLABS_AGENT_ID" },
      { status: 500 }
    );
  }

  try {
    // Fetch signed URL and agent prompt in parallel
    const [urlRes, agentRes] = await Promise.all([
      fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
        { headers: { "xi-api-key": apiKey } }
      ),
      fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
        { headers: { "xi-api-key": apiKey } }
      ),
    ]);

    if (!urlRes.ok) {
      const errorText = await urlRes.text();
      console.error("ElevenLabs signed URL error:", errorText);
      return NextResponse.json(
        { error: "Failed to get signed URL" },
        { status: urlRes.status }
      );
    }

    const urlData = await urlRes.json();
    let systemPrompt = "";

    if (agentRes.ok) {
      const agentData = await agentRes.json();
      systemPrompt = agentData?.conversation_config?.agent?.prompt?.prompt ?? "";
    }

    return NextResponse.json({
      signedUrl: urlData.signed_url,
      systemPrompt,
    });
  } catch (error) {
    console.error("Error fetching signed URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
