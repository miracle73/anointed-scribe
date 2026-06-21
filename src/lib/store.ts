"use client";

import { useCallback, useEffect, useState } from "react";
import type { VoiceProfile, Manuscript, Book } from "./types";
import { uid } from "./utils";
import * as api from "./db/actions";

/* ---- one-time migration of legacy localStorage data into the DB ---- */
const MIG_FLAG = "scribe.migrated";
function legacyRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
let migPromise: Promise<void> | null = null;
function ensureMigrated(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!migPromise) {
    migPromise = (async () => {
      if (localStorage.getItem(MIG_FLAG)) return;
      const profile = legacyRead<VoiceProfile | null>("scribe.profile", null);
      const books = legacyRead<Book[]>("scribe.books", []);
      const manuscripts = legacyRead<Manuscript[]>("scribe.manuscripts", []);
      if (profile || books.length || manuscripts.length) {
        try { await api.importData({ profile, books, manuscripts }); } catch {}
      }
      localStorage.setItem(MIG_FLAG, "1");
    })();
  }
  return migPromise;
}

export function useProfile() {
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      await ensureMigrated();
      try { setProfile(await api.getProfile()); } catch {}
      setReady(true);
    })();
  }, []);
  const save = useCallback((p: VoiceProfile | null) => {
    setProfile(p);
    api.saveProfile(p).catch(() => {});
  }, []);
  return { profile, save, ready };
}

export function useManuscripts() {
  const [items, setItems] = useState<Manuscript[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      await ensureMigrated();
      try { setItems(await api.listManuscripts()); } catch {}
      setReady(true);
    })();
  }, []);
  const upsert = useCallback((m: Manuscript) => {
    setItems((prev) => [m, ...prev.filter((x) => x.id !== m.id)]);
    api.upsertManuscript(m).catch(() => {});
  }, []);
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    api.deleteManuscript(id).catch(() => {});
  }, []);
  return { items, upsert, remove, ready };
}

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      await ensureMigrated();
      try { setBooks(await api.listBooks()); } catch {}
      setReady(true);
    })();
  }, []);
  const create = useCallback((title: string, subtitle = ""): Book => {
    const b: Book = { id: uid(), title: title || "Untitled book", subtitle, createdAt: Date.now() };
    setBooks((prev) => [b, ...prev]);
    api.saveBook(b).catch(() => {});
    return b;
  }, []);
  const update = useCallback((id: string, patch: Partial<Book>) => {
    setBooks((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...patch } : b));
      const found = next.find((b) => b.id === id);
      if (found) api.saveBook(found).catch(() => {});
      return next;
    });
  }, []);
  const remove = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    api.deleteBook(id).catch(() => {});
  }, []);
  return { books, create, update, remove, ready };
}
