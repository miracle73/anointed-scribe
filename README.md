# The Scribe ✍️

An AI writing assistant built for **apostolic, prophetic and Spirit-filled Christian authors**. The Scribe interviews an author the way a ghostwriter would, distills their **Voice DNA**, then drafts full manuscripts that sound unmistakably like *them* — not a generic chatbot.

> "A gifted ghostwriter who has studied the author for years."

---

## ✨ What makes it different

This is **not** a generic writing tool. Every generation is conditioned on the individual author's voice — their signature phrases, anchor scriptures, personal stories, cadence and theological framework.

| Feature | What it does |
|---|---|
| **Voice DNA** | A guided interview *or* a pasted sermon/sample is distilled (structured AI output) into a reusable voice profile. |
| **Sermon import** | Paste a real transcript and The Scribe reverse-engineers the voice from how the author *actually* sounds. |
| **Manuscripts in voice** | Generate chapters, outlines, introductions and devotionals — streamed live. |
| **Co-writer** | Select any passage to rewrite, expand, make preachable, or find the scriptures the author would reach for. |
| **Ghost-text** ⌨️ | As you type in the editor, an inline grey suggestion finishes your sentence in your voice — press `Tab` to accept. |
| **Voice Fidelity meter** 📊 | A *second* AI audits each draft and scores how on-voice it is across cadence, phrasing, scripture, tone and theology — with specific suggestions. |
| **Multi-engine** | A user-selectable "Scribe Engine" routes between multiple frontier models via OpenRouter. The voice travels with the author — same voice, different brain. |

## 🧠 The core idea: voice as a system prompt

The Voice DNA profile (`src/lib/types.ts` → `VoiceProfileSchema`) is rendered into a strict system directive (`src/lib/ai.ts` → `voiceSystemPrompt`) that is injected into **every** AI call — generation, co-writer, ghost-text and fidelity. Personalization is therefore model-independent.

## 🛠 Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** · **Framer Motion** · **Lucide** · Fraunces + Inter
- **Vercel AI SDK v6** with **OpenRouter** (`@openrouter/ai-sdk-provider`)
- **Zod** for structured AI output (Voice DNA + Fidelity report)
- Client-side persistence via `localStorage` (structured for a drop-in move to Neon + Drizzle + Clerk)

## 🚀 Getting started

```bash
npm install
cp .env.local.example .env.local   # then add your OpenRouter key
npm run dev                         # http://localhost:3000
```

`.env.local`:

```
OPENROUTER_API_KEY=sk-or-...        # from https://openrouter.ai/keys
```

A red banner appears in-app if the key is missing or invalid.

## 📁 Project structure

```
src/
  app/
    page.tsx            Landing
    interview/          Voice-capture interview + sermon import
    studio/             Writing studio (editor, library, co-writer, fidelity)
    api/
      voice-profile/    Interview  -> Voice DNA      (generateObject)
      voice-from-text/  Sample     -> Voice DNA      (generateObject)
      generate/         Topic      -> manuscript     (streamText)
      assist/           Co-writer actions            (streamText)
      ghost/            Inline next-words suggestion (generateText)
      fidelity/         Draft      -> voice score    (generateObject)
      health/           Reports whether the key is set
  components/           ui, editor (ghost-text), fidelity, voice-editor, key-banner
  lib/                  ai, types, store, export, utils
```

## ☁️ Deploy

```bash
npx vercel            # link/create the project
npx vercel --prod     # production URL
```

Add `OPENROUTER_API_KEY` in the Vercel project's Environment Variables.

---

Built with care, routed through OpenRouter.
