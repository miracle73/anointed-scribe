import { generateText } from "ai";
import { model, voiceSystemPrompt } from "@/lib/ai";
import { FAST_SLUG, type VoiceProfile } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { profile, before } = (await req.json()) as { profile: VoiceProfile; before: string };
  const tail = before.slice(-1200);

  try {
    const { text } = await generateText({
      model: model(FAST_SLUG),
      system:
        voiceSystemPrompt(profile) +
        "\n\n# GHOSTWRITER MODE\nYou are completing the author's sentence as they type. Continue from EXACTLY where the text stops. Return ONLY the next 6-14 words that should come next — no quotes, no preamble, no repetition of what is already written. Match their voice precisely.",
      prompt: `Continue this, returning only the next few words:\n\n${tail}`,
      temperature: 0.7,
    });
    let suggestion = text.trim().replace(/^["'""]|["'""]$/g, "");
    if (tail.endsWith(" ") && suggestion.startsWith(" ")) suggestion = suggestion.trimStart();
    if (!tail.endsWith(" ") && !suggestion.startsWith(" ")) suggestion = " " + suggestion;
    return Response.json({ suggestion });
  } catch {
    return Response.json({ suggestion: "" });
  }
}
