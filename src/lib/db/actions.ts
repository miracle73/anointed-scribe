"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { voiceProfiles, books, manuscripts } from "./schema";
import type { VoiceProfile, Manuscript, Book } from "../types";

async function uid(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/* ---- Voice profile ---- */
export async function getProfile(): Promise<VoiceProfile | null> {
  const userId = await uid();
  const rows = await db.select().from(voiceProfiles).where(eq(voiceProfiles.userId, userId)).limit(1);
  return rows[0] ? (rows[0].data as VoiceProfile) : null;
}

export async function saveProfile(data: VoiceProfile | null): Promise<void> {
  const userId = await uid();
  if (!data) {
    await db.delete(voiceProfiles).where(eq(voiceProfiles.userId, userId));
    return;
  }
  await db
    .insert(voiceProfiles)
    .values({ userId, data, updatedAt: Date.now() })
    .onConflictDoUpdate({ target: voiceProfiles.userId, set: { data, updatedAt: Date.now() } });
}

/* ---- Books ---- */
export async function listBooks(): Promise<Book[]> {
  const userId = await uid();
  const rows = await db.select().from(books).where(eq(books.userId, userId));
  return rows
    .map((b) => ({ id: b.id, title: b.title, subtitle: b.subtitle, createdAt: b.createdAt }))
    .sort((a, z) => z.createdAt - a.createdAt);
}

export async function saveBook(b: Book): Promise<void> {
  const userId = await uid();
  await db
    .insert(books)
    .values({ ...b, userId })
    .onConflictDoUpdate({ target: books.id, set: { title: b.title, subtitle: b.subtitle } });
}

export async function deleteBook(id: string): Promise<void> {
  const userId = await uid();
  await db.delete(books).where(and(eq(books.id, id), eq(books.userId, userId)));
}

/* ---- Manuscripts ---- */
export async function listManuscripts(): Promise<Manuscript[]> {
  const userId = await uid();
  const rows = await db.select().from(manuscripts).where(eq(manuscripts.userId, userId));
  return rows
    .map((m) => ({
      id: m.id, title: m.title, topic: m.topic, body: m.body, model: m.model,
      bookId: m.bookId ?? undefined, order: m.order ?? undefined,
      createdAt: m.createdAt, updatedAt: m.updatedAt,
    }))
    .sort((a, z) => z.updatedAt - a.updatedAt);
}

export async function upsertManuscript(m: Manuscript): Promise<void> {
  const userId = await uid();
  const row = { ...m, userId, bookId: m.bookId ?? null, order: m.order ?? null };
  await db
    .insert(manuscripts)
    .values(row)
    .onConflictDoUpdate({
      target: manuscripts.id,
      set: { title: m.title, topic: m.topic, body: m.body, model: m.model, bookId: m.bookId ?? null, order: m.order ?? null, updatedAt: m.updatedAt },
    });
}

export async function deleteManuscript(id: string): Promise<void> {
  const userId = await uid();
  await db.delete(manuscripts).where(and(eq(manuscripts.id, id), eq(manuscripts.userId, userId)));
}

/** One-time import of a user's localStorage data into the DB. */
export async function importData(payload: {
  profile: VoiceProfile | null;
  books: Book[];
  manuscripts: Manuscript[];
}): Promise<void> {
  if (payload.profile) await saveProfile(payload.profile);
  for (const b of payload.books) await saveBook(b);
  for (const m of payload.manuscripts) await upsertManuscript(m);
}
