import { streamText } from "ai";
import { model, voiceSystemPrompt } from "@/lib/ai";
import type { VoiceProfile } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { profile, topic, kind, modelSlug } = (await req.json()) as {
    profile: VoiceProfile;
    topic: string;
    kind: "chapter" | "outline" | "devotional" | "intro";
    modelSlug: string;
  };

  const instruction = {
    chapter: `Write a full, rich book chapter on: "${topic}". 900-1400 words. Give it a compelling chapter title on the first line as a markdown heading (# Title). Use the author's anchor scriptures and at least one of their personal stories. Build to a spiritual crescendo and close with a prophetic charge to the reader.`,
    outline: `Create a complete book outline on: "${topic}". Propose a book title, then 8-12 chapter titles, each with a one-sentence description — all in the author's voice and burden.`,
    devotional: `Write a 350-450 word daily devotional on: "${topic}". Open with one anchor scripture, teach with conviction, and end with a short declaration the reader speaks aloud.`,
    intro: `Write the book's introduction (600-900 words) for a book on: "${topic}". Make it personal — draw the reader in with a story and the burden behind the book.`,
  }[kind];

  const result = streamText({
    model: model(modelSlug),
    system: voiceSystemPrompt(profile),
    prompt: instruction,
    temperature: 0.8,
  });

  return result.toTextStreamResponse();
}
