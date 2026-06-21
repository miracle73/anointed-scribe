import { z } from "zod";

/** The structured "Voice DNA" distilled from the interview. */
export const VoiceProfileSchema = z.object({
  penName: z.string().describe("The author's name or pen name"),
  oneLine: z.string().describe("A single vivid sentence capturing who this author is as a voice"),
  tradition: z.string().describe("Their ministry stream, e.g. apostolic, prophetic, deliverance, grace"),
  toneTags: z.array(z.string()).describe("4-6 adjectives for their tone, e.g. fiery, tender, declarative"),
  cadence: z.string().describe("How their sentences move: rhythm, length, use of repetition and refrain"),
  signaturePhrases: z.array(z.string()).describe("Exact phrases this author repeats; preserve verbatim"),
  anchorScriptures: z.array(z.string()).describe("Scripture references they return to most"),
  themes: z.array(z.string()).describe("Recurring theological themes and burdens"),
  stories: z.array(z.string()).describe("Personal testimonies/illustrations they tell, summarized"),
  vocabulary: z.array(z.string()).describe("Distinctive words/terms they favor"),
  addressStyle: z.string().describe("How they address the reader, e.g. 'Beloved', 'Somebody', direct second-person"),
  avoid: z.array(z.string()).describe("Things that would feel off-voice for them"),
  doctrine: z.string().describe("A short note on their theological framework and emphases"),
});

export type VoiceProfile = z.infer<typeof VoiceProfileSchema>;

export type InterviewAnswer = { q: string; a: string };

export type Manuscript = {
  id: string;
  title: string;
  topic: string;
  body: string;
  model: string;
  bookId?: string;
  order?: number;
  createdAt: number;
  updatedAt: number;
};

export type Book = {
  id: string;
  title: string;
  subtitle: string;
  createdAt: number;
};

export type Engine = {
  id: string;
  label: string;
  blurb: string;
  emoji: string;
  slug: string;
};

export const ENGINES: Engine[] = [
  { id: "scribe", label: "Scribe", blurb: "Deepest voice fidelity", emoji: "✍️", slug: "anthropic/claude-opus-4.8" },
  { id: "lite", label: "Scribe Lite", blurb: "Fast drafts & quick edits", emoji: "⚡", slug: "anthropic/claude-haiku-4.5" },
  { id: "prophetic", label: "Prophetic", blurb: "Alternative voice (GPT)", emoji: "🔮", slug: "openai/gpt-4o" },
  { id: "gemini", label: "Gemini", blurb: "Alternative voice", emoji: "🌿", slug: "google/gemini-2.5-flash" },
];

export const FAST_SLUG = "anthropic/claude-haiku-4.5";

/** The structured interview — questions a ghostwriter would ask on day one. */
export const INTERVIEW = [
  { key: "name", icon: "user", q: "What name do you write under?", hint: "Your name or pen name as it should appear.", placeholder: "e.g. Apostle Grace Eze" },
  { key: "tradition", icon: "church", q: "What is your ministry stream?", hint: "Apostolic, prophetic, deliverance, grace, teaching… mix freely.", placeholder: "e.g. Apostolic & prophetic, grace-centered" },
  { key: "burden", icon: "flame", q: "What message burns in you the most?", hint: "The themes you keep coming back to — your burden.", placeholder: "e.g. The believer's authority, intimacy with the Spirit, kingdom dominion" },
  { key: "voice", icon: "mic", q: "How do you sound when you preach?", hint: "Fiery and declarative? Tender and pastoral? Describe your delivery.", placeholder: "e.g. I build slowly then crescendo, lots of repetition, I call people 'somebody'" },
  { key: "phrases", icon: "quote", q: "What phrases do people know you for?", hint: "Your catchphrases and refrains — write them exactly as you say them.", placeholder: "e.g. 'Somebody shout grace!', 'In this season…', 'Receive it now'" },
  { key: "scriptures", icon: "book", q: "Which scriptures do you always return to?", hint: "Your anchor verses.", placeholder: "e.g. Ephesians 1:17, Acts 1:8, Romans 8:14" },
  { key: "story", icon: "heart", q: "Tell me a testimony you often share.", hint: "A personal story or encounter you retell from the pulpit.", placeholder: "e.g. The night in 2009 I encountered the Lord and…" },
  { key: "reader", icon: "users", q: "Who are you writing to, and how do you address them?", hint: "Your reader, and the words you use to reach them.", placeholder: "e.g. Hungry believers; I call them 'Beloved' and speak directly" },
] as const;
