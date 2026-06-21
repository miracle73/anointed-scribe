"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui";
import { ArrowRight, BookOpen, Fingerprint, MessageCircleHeart, Sparkles, Gauge } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { useProfile } from "@/lib/store";

const features = [
  {
    icon: Fingerprint,
    title: "Voice DNA",
    body: "A guided interview — or a pasted sermon — distills your tone, cadence, signature phrases, anchor scriptures and stories into a living profile.",
  },
  {
    icon: BookOpen,
    title: "Manuscripts in your voice",
    body: "Generate chapters, outlines, intros and devotionals that read like you wrote them — not like a chatbot.",
  },
  {
    icon: MessageCircleHeart,
    title: "A co-writer beside you",
    body: "Rewrite, expand or sharpen any passage — and as you type, ghost-text finishes your sentence in your own voice.",
  },
  {
    icon: Gauge,
    title: "Voice Fidelity score",
    body: "A second AI audits every draft and scores how on-voice it is — cadence, phrasing, scripture, tone and theology.",
  },
];

export default function Home() {
  const { profile } = useProfile();
  const { isSignedIn } = useUser();
  const cta = profile ? "/studio" : "/interview";

  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <>
              <Link href={cta} className="rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm transition hover:border-gold">Open Studio</Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm text-ink-soft transition hover:text-ink">Sign in</Link>
              <Link href="/sign-up" className="rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm transition hover:border-gold">Begin</Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        <section className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-ink-soft"
            >
              <Sparkles size={13} className="text-gold-deep" />
              For apostolic, prophetic & Spirit-filled authors
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl"
            >
              Write your book in <em className="text-gold-deep">your own voice.</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-5 max-w-md text-lg text-ink-soft"
            >
              The Scribe interviews you the way a ghostwriter would, learns your
              theological voice, then drafts full manuscripts that sound
              unmistakably like you.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-8 flex items-center gap-3"
            >
              <Link
                href={cta}
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-medium text-parchment shadow-lg transition hover:bg-gold-deep"
              >
                {profile ? "Continue writing" : "Capture my voice"}
                <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
              </Link>
              {!profile && (
                <Link href="/interview" className="text-sm text-ink-soft underline-offset-4 transition hover:text-ink hover:underline">
                  or import from a sermon
                </Link>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="rotate-1 rounded-2xl border bg-card p-7 shadow-2xl">
              <div className="mb-3 flex items-center gap-2 text-xs text-ink-soft">
                <span className="h-2 w-2 rounded-full bg-gold" /> Chapter 3 · drafting in your voice
              </div>
              <div className="prose-scribe">
                <h1 className="!text-2xl">The Authority of the Sent One</h1>
                <p>
                  Beloved, <em>somebody shout grace</em> — for what God has placed
                  inside you is not for hiding. In this season, the Spirit is
                  restoring the believer to the place of dominion…
                </p>
                <blockquote>&ldquo;You shall receive power…&rdquo; — Acts 1:8</blockquote>
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-parchment-2 px-3 py-1 text-xs text-ink-soft">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-deep" />
                The Scribe is writing…
              </div>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-5 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border bg-card p-6 shadow-sm"
            >
              <f.icon size={22} className="text-gold-deep" />
              <h3 className="mt-4 font-serif text-xl">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.body}</p>
            </motion.div>
          ))}
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 text-sm text-ink-soft">
          <span>The Scribe</span>
          <span>Powered by OpenRouter</span>
        </div>
      </footer>
    </div>
  );
}
