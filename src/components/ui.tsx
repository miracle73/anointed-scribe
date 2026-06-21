"use client";

import { useState } from "react";
import { ENGINES, type Engine } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Feather, ChevronDown, Check } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-parchment shadow-sm">
        <Feather size={18} />
      </span>
      <span className="font-serif text-xl tracking-tight">The Scribe</span>
    </div>
  );
}

export function EnginePicker({
  value,
  onChange,
}: {
  value: Engine;
  onChange: (e: Engine) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-sm shadow-sm transition hover:border-gold"
      >
        <span>{value.emoji}</span>
        <span className="font-medium">{value.label}</span>
        <ChevronDown size={15} className="text-ink-soft" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border bg-card shadow-xl">
            <div className="border-b px-3 py-2 text-[11px] uppercase tracking-wider text-ink-soft">
              Scribe Engine
            </div>
            {ENGINES.map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  onChange(e);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-parchment-2"
              >
                <span className="mt-0.5 text-lg">{e.emoji}</span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {e.label}
                    {e.id === value.id && <Check size={14} className="text-gold-deep" />}
                  </span>
                  <span className="text-xs text-ink-soft">{e.blurb}</span>
                </span>
              </button>
            ))}
            <div className="border-t px-3 py-2 text-[11px] text-ink-soft">
              Same voice — different brain. Routed via OpenRouter.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export { ENGINES };

/** Minimal, safe markdown → HTML for manuscript prose. */
export function mdToHtml(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>");

  const lines = md.split("\n");
  const out: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flush(); continue; }
    if (line.startsWith("## ")) { flush(); out.push(`<h2>${inline(line.slice(3))}</h2>`); }
    else if (line.startsWith("# ")) { flush(); out.push(`<h1>${inline(line.slice(2))}</h1>`); }
    else if (line.startsWith("> ")) { flush(); out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); }
    else para.push(line);
  }
  flush();
  return out.join("\n");
}
