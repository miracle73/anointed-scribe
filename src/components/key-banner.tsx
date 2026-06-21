"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

/** Shows a clear warning if OPENROUTER_API_KEY is missing — prevents silent demo failures. */
export function KeyBanner() {
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setMissing(!d.keySet))
      .catch(() => setMissing(true));
  }, []);

  if (!missing) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-[#b04a3a] px-4 py-2 text-center text-sm text-white">
      <AlertTriangle size={15} />
      <span>
        No OpenRouter API key found. Add <code className="rounded bg-black/20 px-1">OPENROUTER_API_KEY</code> to
        your environment, then restart, to enable AI generation.
      </span>
    </div>
  );
}
