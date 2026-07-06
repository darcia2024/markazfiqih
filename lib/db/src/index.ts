import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "SUPABASE_DATABASE_URL (or DATABASE_URL) must be set. Add your Postgres connection string as a secret.",
  );
}

// Global caching for serverless environments.
// In serverless (e.g. Vercel Functions), each invocation may reuse the same
// Node.js process but re-execute module-level code. Without this pattern,
// a new Pool (and connection) would be created on every invocation, quickly
// exhausting Postgres's connection limit. By caching on `globalThis` we
// guarantee at most one Pool per process lifetime.
declare global {
  // eslint-disable-next-line no-var
  var __pool: pg.Pool | undefined;
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

if (!globalThis.__pool) {
  // max: 1 keeps connection usage minimal in serverless where many function
  // instances may run concurrently. Each instance only needs one connection.
  globalThis.__pool = new Pool({ connectionString, max: 1, ssl: true });
}

if (!globalThis.__db) {
  globalThis.__db = drizzle(globalThis.__pool, { schema });
}

export const pool = globalThis.__pool;
export const db = globalThis.__db;

export * from "./schema";
