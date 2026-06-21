import { generateObject } from "ai";
import { model } from "@/lib/ai";
import { VoiceProfileSchema, FAST_SLUG } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { answers } = (await req.json()) as { answers: { q: string; a: string }[] };
  const transcript = answers.map((x) => `Q: ${x.q}\nA: ${x.a}`).join("\n\n");

  try {
    const { object } = await generateObject({
      model: model("anthropic/claude-sonnet-4.6"),
      schema: VoiceProfileSchema,
      system:
        "You are a literary voice analyst for Christian ministry authors. From an interview, distill a precise, faithful 'Voice DNA' profile. Preserve the author's exact signature phrases verbatim. Infer cadence, tone, and theology from how they speak. Be specific and concrete, never generic. If a field is thin, make a careful inference consistent with their stream.",
      prompt: `Distill the Voice DNA from this interview:\n\n${transcript}`,
    });
    return Response.json({ profile: object });
  } catch (e) {
    // Fallback to a faster model if the primary is unavailable
    try {
      const { object } = await generateObject({
        model: model(FAST_SLUG),
        schema: VoiceProfileSchema,
        prompt: `Distill a Voice DNA profile from this interview:\n\n${transcript}`,
      });
      return Response.json({ profile: object });
    } catch (e2) {
      return Response.json({ error: String(e2 ?? e) }, { status: 500 });
    }
  }
}
