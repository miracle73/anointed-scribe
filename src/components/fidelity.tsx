"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Gauge, Loader2, Check, Quote, RefreshCw, Lightbulb } from "lucide-react";
import type { VoiceProfile } from "@/lib/types";

export type FidelityReport = {
  overall: number;
  dimensions: { cadence: number; phrasing: number; scripture: number; tone: number; theology: number };
  phrasesUsed: string[];
  scripturesUsed: string[];
  highlights: string[];
  suggestions: string[];
  verdict: string;
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n || 0)));
const tone = (n: number) =>
  n >= 80 ? "#3f7d4e" : n >= 60 ? "#b8893a" : "#b04a3a";

function Ring({ value: raw }: { value: number }) {
  const value = clamp(raw);
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--line)" strokeWidth="9" />
        <motion.circle
          cx="55" cy="55" r={r} fill="none" stroke={tone(value)} strokeWidth="9"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (value / 100) * c }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <motion.div
            className="font-serif text-3xl leading-none"
            style={{ color: tone(value) }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          >
            {value}
          </motion.div>
          <div className="text-[10px] uppercase tracking-wider text-ink-soft">on-voice</div>
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value: raw }: { label: string; value: number }) {
  const value = clamp(raw);
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[11px]">
        <span className="capitalize text-ink-soft">{label}</span>
        <span style={{ color: tone(value) }}>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-parchment-2">
        <motion.div
          className="h-full rounded-full"
          style={{ background: tone(value) }}
          initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.7 }}
        />
      </div>
    </div>
  );
}

export function FidelityPanel({
  profile, text,
}: {
  profile: VoiceProfile;
  text: string;
}) {
  const [report, setReport] = useState<FidelityReport | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (busy || text.trim().length < 40) return;
    setBusy(true);
    try {
      const res = await fetch("/api/fidelity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, text }),
      });
      const data = await res.json();
      if (data.report) setReport(data.report);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Gauge size={15} className="text-gold-deep" /> Voice Fidelity
        </h3>
        <button
          onClick={run}
          disabled={busy || text.trim().length < 40}
          className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition hover:border-gold disabled:opacity-40"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {report ? "Re-check" : "Score this draft"}
        </button>
      </div>

      {!report && !busy && (
        <p className="mt-2 text-xs text-ink-soft">
          Audit how closely this draft matches {profile.penName}&rsquo;s voice — cadence, phrases, scripture, tone & theology.
        </p>
      )}

      {report && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
          <div className="flex items-center gap-4">
            <Ring value={report.overall} />
            <p className="flex-1 text-xs italic text-ink-soft">&ldquo;{report.verdict}&rdquo;</p>
          </div>

          <div className="mt-3 grid gap-2">
            <Bar label="cadence" value={report.dimensions.cadence} />
            <Bar label="phrasing" value={report.dimensions.phrasing} />
            <Bar label="scripture" value={report.dimensions.scripture} />
            <Bar label="tone" value={report.dimensions.tone} />
            <Bar label="theology" value={report.dimensions.theology} />
          </div>

          {(report.phrasesUsed.length > 0 || report.scripturesUsed.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {report.phrasesUsed.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 rounded-full bg-parchment-2 px-2 py-0.5 text-[10px]">
                  <Check size={10} className="text-gold-deep" /> {p}
                </span>
              ))}
              {report.scripturesUsed.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full bg-parchment-2 px-2 py-0.5 text-[10px]">
                  <Quote size={10} className="text-gold-deep" /> {s}
                </span>
              ))}
            </div>
          )}

          {report.suggestions.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t pt-3">
              {report.suggestions.map((s, i) => (
                <p key={i} className="flex gap-1.5 text-xs text-ink-soft">
                  <Lightbulb size={13} className="mt-0.5 shrink-0 text-gold-deep" /> {s}
                </p>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
