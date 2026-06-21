"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";
import type { VoiceProfile } from "@/lib/types";

const toList = (s: string) => s.split(/\n|,/).map((x) => x.trim()).filter(Boolean);

/** Modal for refining the AI-generated Voice DNA. Arrays are edited one-per-line. */
export function VoiceEditor({
  profile, onSave, onClose,
}: {
  profile: VoiceProfile;
  onSave: (p: VoiceProfile) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<VoiceProfile>(profile);
  const set = <K extends keyof VoiceProfile>(k: K, v: VoiceProfile[K]) => setD((p) => ({ ...p, [k]: v }));

  const Text = ({ label, k }: { label: string; k: keyof VoiceProfile }) => (
    <label className="block">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      <input
        defaultValue={d[k] as string}
        onBlur={(e) => set(k, e.target.value as VoiceProfile[typeof k])}
        className="mt-1 w-full rounded-lg border bg-parchment px-3 py-2 text-sm outline-none focus:border-gold"
      />
    </label>
  );

  const Area = ({ label, k, hint }: { label: string; k: keyof VoiceProfile; hint?: string }) => (
    <label className="block">
      <span className="text-xs font-medium text-ink-soft">{label}{hint && <span className="text-ink-soft/60"> · {hint}</span>}</span>
      <textarea
        defaultValue={(Array.isArray(d[k]) ? (d[k] as string[]).join("\n") : (d[k] as string))}
        onBlur={(e) =>
          set(k, (Array.isArray(d[k]) ? toList(e.target.value) : e.target.value) as VoiceProfile[typeof k])
        }
        rows={Array.isArray(d[k]) ? 3 : 2}
        className="mt-1 w-full resize-none rounded-lg border bg-parchment px-3 py-2 text-sm outline-none focus:border-gold"
      />
    </label>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="font-serif text-lg">Refine your Voice DNA</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink"><X size={18} /></button>
        </div>
        <div className="grid gap-3 overflow-y-auto px-5 py-4 scrollbar-thin">
          <Text label="Name / pen name" k="penName" />
          <Area label="One-line essence" k="oneLine" />
          <Text label="Tradition" k="tradition" />
          <Area label="Tone tags" k="toneTags" hint="one per line" />
          <Area label="Cadence" k="cadence" />
          <Area label="Signature phrases" k="signaturePhrases" hint="verbatim, one per line" />
          <Area label="Anchor scriptures" k="anchorScriptures" hint="one per line" />
          <Area label="Themes" k="themes" hint="one per line" />
          <Area label="Personal stories" k="stories" hint="one per line" />
          <Area label="Vocabulary" k="vocabulary" hint="one per line" />
          <Text label="How you address the reader" k="addressStyle" />
          <Area label="Theology / framework" k="doctrine" />
          <Area label="Avoid (off-voice)" k="avoid" hint="one per line" />
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-ink-soft hover:text-ink">Cancel</button>
          <button onClick={() => { onSave(d); onClose(); }}
            className="flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm text-parchment transition hover:bg-gold-deep">
            <Save size={15} /> Save voice
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
