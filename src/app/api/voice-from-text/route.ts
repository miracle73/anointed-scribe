import { generateObject } from "ai";
import { model } from "@/lib/ai";
import { VoiceProfileSchema, FAST_SLUG } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { text, name } = (await req.json()) as { text: string; name?: string };
  const sample = text.slice(0, 12000);

  const system =
    "You are a literary voice analyst. From a real sermon transcript or writing sample, reverse-engineer the author's 'Voice DNA'. Extract their ACTUAL signature phrases verbatim, the scriptures they quote, their recurring themes, vocabulary, cadence and theological framework — observed from the text itself, not invented. Be precise and faithful to the evidence.";

  const prompt = `${name ? `Author: ${name}\n\n` : ""}Analyze this sample and distill the author's Voice DNA from how they actually write/speak:\n\n"""\n${sample}\n"""`;

  try {
    const { object } = await generateObject({
      model: model("anthropic/claude-sonnet-4.6"),
      schema: VoiceProfileSchema,
      system,
      prompt,
    });
    return Response.json({ profile: object });
  } catch (e) {
    try {
      const { object } = await generateObject({ model: model(FAST_SLUG), schema: VoiceProfileSchema, prompt });
      return Response.json({ profile: object });
    } catch (e2) {
      return Response.json({ error: String(e2 ?? e) }, { status: 500 });
    }
  }
}
