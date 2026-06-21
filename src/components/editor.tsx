"use client";

import { useEffect, useRef, useState } from "react";
import type { VoiceProfile } from "@/lib/types";

const BOX =
  "w-full font-serif text-lg leading-relaxed whitespace-pre-wrap break-words";

/**
 * Ghost-text editor: a transparent textarea layered over a mirror div that
 * renders the same text plus a greyed AI continuation. Press Tab to accept.
 * Suggestions only appear when the caret is at the end (keeps alignment exact).
 */
export function GhostEditor({
  value, onChange, profile,
}: {
  value: string;
  onChange: (s: string) => void;
  profile: VoiceProfile;
}) {
  const [ghost, setGhost] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  const atEnd = () => {
    const ta = taRef.current;
    return !!ta && ta.selectionStart === value.length && ta.selectionEnd === value.length;
  };

  useEffect(() => {
    setGhost("");
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 20) return;
    const id = ++reqId.current;
    timer.current = setTimeout(async () => {
      if (!atEnd()) return;
      try {
        const res = await fetch("/api/ghost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, before: value }),
        });
        const data = await res.json();
        if (id === reqId.current && atEnd() && data.suggestion) setGhost(data.suggestion);
      } catch {}
    }, 850);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const accept = () => {
    if (!ghost) return;
    onChange(value + ghost);
    setGhost("");
  };

  return (
    <div className="relative min-h-[60vh]">
      <div
        aria-hidden
        className={`${BOX} pointer-events-none absolute inset-0 text-ink`}
      >
        {value}
        {ghost && <span className="text-ink-soft/45">{ghost}</span>}
        {/* keeps trailing newline height */}
        {"​"}
      </div>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Tab" && ghost) { e.preventDefault(); accept(); }
          else if (e.key !== "Shift" && e.key !== "Meta" && e.key !== "Control") setGhost("");
        }}
        onScroll={(e) => {
          const m = (e.target as HTMLElement).previousElementSibling as HTMLElement;
          if (m) m.scrollTop = (e.target as HTMLElement).scrollTop;
        }}
        spellCheck
        className={`${BOX} relative min-h-[60vh] resize-none bg-transparent text-transparent caret-[var(--gold-deep)] outline-none`}
      />
      {ghost && (
        <div className="pointer-events-none absolute bottom-2 right-2 rounded-full border bg-card/90 px-2.5 py-1 text-[11px] text-ink-soft shadow-sm">
          Press <kbd className="font-sans font-semibold text-ink">Tab</kbd> to accept ✨
        </div>
      )}
    </div>
  );
}
