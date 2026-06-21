import { generateObject } from "ai";
import { z } from "zod";
import { model } from "@/lib/ai";
import { FAST_SLUG, type VoiceProfile } from "@/lib/types";

export const maxDuration = 60;

export const FidelitySchema = z.object({
  overall: z.number().describe("Overall voice-fidelity score, integer 0-100"),
  dimensions: z.object({
    cadence: z.number().describe("0-100: how well the rhythm/sentence flow matches"),
    phrasing: z.number().describe("0-100: use of signature phrases & vocabulary"),
    scripture: z.number().describe("0-100: use of their anchor scriptures the way they would"),
    tone: z.number().describe("0-100: emotional tone & spiritual register match"),
    theology: z.number().describe("0-100: consistency with their theological framework"),
  }),
  phrasesUsed: z.array(z.string()).describe("Signature phrases from the profile that actually appear"),
  scripturesUsed: z.array(z.string()).describe("Anchor scriptures that actually appear"),
  highlights: z.array(z.string()).describe("Up to 3 short notes on what is most on-voice"),
  suggestions: z.array(z.string()).describe("Up to 3 specific, actionable tweaks to sound more like this author"),
  verdict: z.string().describe("One vivid sentence judging how much this sounds like the author"),
});

export async function POST(req: Request) {
  const { profile, text } = (await req.json()) as { profile: VoiceProfile; text: string };
  const v = profile;

  try {
    const { object } = await generateObject({
      model: model("anthropic/claude-sonnet-4.6"),
      schema: FidelitySchema,
      system: `You are a literary voice auditor. Judge how closely a draft matches a specific author's voice. Be discerning and honest — reward genuine voice match, penalize generic "Christian-sounding" filler. Score each dimension 0-100.`,
      prompt: `AUTHOR VOICE DNA:
Name: ${v.penName}
One-line: ${v.oneLine}
Tone: ${v.toneTags.join(", ")}
Cadence: ${v.cadence}
Signature phrases: ${v.signaturePhrases.join(" | ")}
Anchor scriptures: ${v.anchorScriptures.join(", ")}
Vocabulary: ${v.vocabulary.join(", ")}
Theology: ${v.doctrine}
Avoid: ${v.avoid.join("; ")}

DRAFT TO AUDIT:
"""
${text.slice(0, 6000)}
"""

Audit how well this draft matches ${v.penName}'s voice.`,
    });
    return Response.json({ report: object });
  } catch (e) {
    try {
      const { object } = await generateObject({
        model: model(FAST_SLUG),
        schema: FidelitySchema,
        prompt: `Score how well this draft matches ${v.penName} (phrases: ${v.signaturePhrases.join(", ")}; scriptures: ${v.anchorScriptures.join(", ")}; tone: ${v.toneTags.join(", ")}).\n\nDRAFT:\n${text.slice(0, 5000)}`,
      });
      return Response.json({ report: object });
    } catch (e2) {
      return Response.json({ error: String(e2 ?? e) }, { status: 500 });
    }
  }
}
