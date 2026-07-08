---
name: Supabase SSL configuration
description: How to correctly configure SSL for Supabase PostgreSQL connections in this project (pg Pool + drizzle-kit).
---

# Supabase SSL configuration

## Rule
Use `ssl: { rejectUnauthorized: false }` in both the pg `Pool` constructor and `drizzle.config.ts` `dbCredentials`. `ssl: true` fails with "self-signed certificate in certificate chain" on Supabase pooler connections — the pooler does NOT present a fully verifiable cert chain from Node.js's perspective. The connection is still fully encrypted; only peer cert verification is skipped.

**Why:** Supabase's pooler cert chain isn't fully verifiable from Node.js, so `ssl: true` (strict verification) fails to connect at all. `rejectUnauthorized: false` keeps the connection encrypted but skips peer verification — accepted tradeoff for this project.

**How to apply:**
- `lib/db/src/index.ts`: `new Pool({ connectionString, max: 1, ssl: { rejectUnauthorized: false } })` — this is what's actually in the code and confirmed working (verified 2026-07-08 after a fresh Supabase re-import: raw connection + real queries succeeded with this exact config).
- `lib/db/drizzle.config.ts`: mirror the same `ssl: { rejectUnauthorized: false }`.

## Schema migration (non-interactive)
`drizzle-kit push` fails without a TTY when the DB has existing unrelated tables (prompts for rename/create). Workaround:
1. Run `drizzle-kit generate --name=init` to generate SQL in `drizzle/0000_init.sql`
2. Apply via a Node.js pg script splitting on `--> statement-breakpoint`, skipping `already exists` errors
