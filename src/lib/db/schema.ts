import { pgTable, text, bigint, jsonb } from "drizzle-orm/pg-core";

/** One Voice DNA per user (stored as JSON for flexibility). */
export const voiceProfiles = pgTable("voice_profiles", {
  userId: text("user_id").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const books = pgTable("books", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const manuscripts = pgTable("manuscripts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull().default(""),
  body: text("body").notNull().default(""),
  model: text("model").notNull().default(""),
  bookId: text("book_id"),
  order: bigint("order", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
