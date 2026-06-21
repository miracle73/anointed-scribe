import { streamText } from "ai";
import { model, voiceSystemPrompt } from "@/lib/ai";
import { FAST_SLUG, type VoiceProfile } from "@/lib/types";

export const maxDuration = 60;

const ACTIONS: Record<string, (sel: string) => string> = {
  rewrite: (s) => `Rewrite the following passage in the author's voice, keeping the meaning but making it unmistakably theirs. Return ONLY the rewritten passage:\n\n${s}`,
  expand: (s) => `Continue/expand the following passage by 1-2 paragraphs in the author's voice. Return ONLY the new continuation:\n\n${s}`,
  scripture: (s) => `Suggest 3-4 scriptures this author would cite to support this passage, with one line each on how they'd use it:\n\n${s}`,
  punchier: (s) => `Make this passage more declarative and preachable in the author's voice — shorter sentences, more conviction. Return ONLY the revision:\n\n${s}`,
  continue: (s) => `Write the next paragraph that should follow this text, in the author's voice. Return ONLY the next paragraph:\n\n${s}`,
};

export async function POST(req: Request) {
  const { profile, action, selection, prompt, modelSlug } = (await req.json()) as {
    profile: VoiceProfile;
    action?: string;
    selection?: string;
    prompt?: string;
    modelSlug?: string;
  };

  const userPrompt =
    action && ACTIONS[action]
      ? ACTIONS[action](selection ?? "")
      : prompt ?? "Help the author with their manuscript in their voice.";

  const result = streamText({
    model: model(modelSlug || FAST_SLUG),
    system: voiceSystemPrompt(profile),
    prompt: userPrompt,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
