"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { INTERVIEW } from "@/lib/types";
import { useProfile } from "@/lib/store";
import { Logo } from "@/components/ui";
import {
  ArrowLeft, ArrowRight, BookText, Church, Flame, Heart,
  Mic, Quote, User, Users, Loader2, Sparkles,
} from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  user: User, church: Church, flame: Flame, mic: Mic,
  quote: Quote, book: BookText, heart: Heart, users: Users,
};

export default function Interview() {
  const router = useRouter();
  const { save } = useProfile();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(INTERVIEW.length).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"interview" | "paste">("interview");
  const [sample, setSample] = useState("");
  const [sampleName, setSampleName] = useState("");

  const distillFromText = async () => {
    if (sample.trim().length < 80) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/voice-from-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sample, name: sampleName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      save(data.profile);
      router.push("/studio?fresh=1");
    } catch {
      setError("The Scribe could not read this sample. Check your OpenRouter key and try again.");
      setLoading(false);
    }
  };

  const q = INTERVIEW[step];
  const Icon = ICONS[q.icon] ?? User;
  const isLast = step === INTERVIEW.length - 1;
  const filled = answers[step].trim().length > 0;
  const progress = ((step + 1) / INTERVIEW.length) * 100;

  const setAnswer = (v: string) =>
    setAnswers((a) => a.map((x, i) => (i === step ? v : x)));

  const next = async () => {
    if (!isLast) { setStep((s) => s + 1); return; }
    setLoading(true);
    setError("");
    try {
      const payload = INTERVIEW.map((item, i) => ({ q: item.q, a: answers[i] }));
      const res = await fetch("/api/voice-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      save(data.profile);
      router.push("/studio?fresh=1");
    } catch (e) {
      setError("The Scribe could not distill your voice. Check your OpenRouter key and try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-full place-items-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-ink text-parchment">
            <Sparkles size={26} className="animate-pulse" />
          </div>
          <h2 className="font-serif text-2xl">Distilling your Voice DNA…</h2>
          <p className="mt-2 text-ink-soft">
            Listening for your cadence, your phrases, your anchor scriptures.
          </p>
          <Loader2 className="mx-auto mt-6 animate-spin text-gold-deep" />
        </motion.div>
      </div>
    );
  }

  if (mode === "paste") {
    return (
      <div className="flex min-h-full flex-col">
        <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/"><Logo /></Link>
          <button onClick={() => setMode("interview")} className="text-sm text-ink-soft transition hover:text-ink">
            Take the interview instead →
          </button>
        </header>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-10">
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-card shadow-sm">
            <Sparkles size={22} className="text-gold-deep" />
          </div>
          <h1 className="font-serif text-3xl leading-tight md:text-4xl">Already have a sermon or sample?</h1>
          <p className="mt-3 text-ink-soft">
            Paste a transcript or a few pages you&rsquo;ve written. The Scribe will reverse-engineer your Voice DNA
            from how you actually sound — your phrases, scriptures, cadence and themes.
          </p>
          <input
            value={sampleName}
            onChange={(e) => setSampleName(e.target.value)}
            placeholder="Your name or pen name (optional)"
            className="mt-6 w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:border-gold"
          />
          <textarea
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            placeholder="Paste your sermon transcript or writing sample here…"
            rows={12}
            className="mt-3 w-full resize-none rounded-2xl border bg-card p-5 leading-relaxed shadow-sm outline-none transition focus:border-gold"
          />
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs text-ink-soft">{sample.trim() ? `${sample.trim().split(/\s+/).length} words` : "Min. ~80 words"}</span>
            <button
              onClick={distillFromText}
              disabled={sample.trim().length < 80}
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-medium text-parchment shadow-lg transition hover:bg-gold-deep disabled:opacity-40"
            >
              Distill my voice
              <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/"><Logo /></Link>
        <span className="text-sm text-ink-soft">
          {step + 1} / {INTERVIEW.length}
        </span>
      </header>

      <div className="mx-auto w-full max-w-3xl px-6">
        <div className="h-1 w-full overflow-hidden rounded-full bg-parchment-2">
          <motion.div
            className="h-full bg-gold-deep"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-card shadow-sm">
              <Icon size={22} className="text-gold-deep" />
            </div>
            <h1 className="font-serif text-3xl leading-tight md:text-4xl">{q.q}</h1>
            <p className="mt-3 text-ink-soft">{q.hint}</p>
            <textarea
              autoFocus
              value={answers[step]}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && filled) next();
              }}
              placeholder={q.placeholder}
              rows={5}
              className="mt-6 w-full resize-none rounded-2xl border bg-card p-5 text-lg leading-relaxed shadow-sm outline-none transition focus:border-gold"
            />
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ink-soft transition enabled:hover:text-ink disabled:opacity-30"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-3">
            {!isLast && (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="text-sm text-ink-soft transition hover:text-ink"
              >
                Skip
              </button>
            )}
            <button
              onClick={next}
              disabled={!filled && isLast}
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-medium text-parchment shadow-lg transition hover:bg-gold-deep disabled:opacity-40"
            >
              {isLast ? "Distill my voice" : "Next"}
              <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-ink-soft">
          Tip: press ⌘/Ctrl + Enter to continue ·{" "}
          <button onClick={() => setMode("paste")} className="underline transition hover:text-ink">
            or paste a sermon sample instead
          </button>
        </p>
      </main>
    </div>
  );
}
