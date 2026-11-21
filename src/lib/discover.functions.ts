import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const describeLandmark = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ name: z.string().max(100), code: z.string().max(10) }).parse(d))
  .handler(async ({ data }) => {
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    const { streamText } = await import("ai");
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured");
    const anthropic = createAnthropic({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const result = streamText({
      model: anthropic("anthropic/claude-sonnet-5"),
      maxOutputTokens: 400,
      maxRetries: 0,
      system:
        "You are a cheerful campus explorer guide for the University of South Florida (Tampa). When a student discovers a building, reply with 2-3 short sentences: what the building is for, one fun or useful fact, and a tip for exploring it. Plain text, no markdown. If unsure of a fact, keep it general rather than inventing specifics.",
      messages: [{ role: "user", content: `I just discovered ${data.name} (${data.code}) at USF!` }],
    });
    try {
      return { text: await result.text };
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 402) return { text: "", error: "AI credits ran out — add credits to keep getting building facts." };
      if (status === 429) return { text: "", error: "Too many requests — try again in a moment." };
      return { text: "", error: "Couldn't fetch building facts right now." };
    }
  });
