import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url =
  process.env.DATABASE_URL ||
  process.env.STORAGE_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "";

export const db = drizzle(neon(url), { schema });
