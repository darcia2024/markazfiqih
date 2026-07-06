---
name: Supabase SSL configuration
description: How to correctly configure SSL for Supabase PostgreSQL connections in this project (pg Pool + drizzle-kit).
---

# Supabase SSL configuration

## Rule
Use `ssl: { rejectUnauthorized: false }` in both the pg `Pool` constructor and `drizzle.config.ts` `dbCredentials`. `ssl: true` fails with "self-signed certificate in certificate chain" on Supabase pooler connections — the pooler does NOT present a fully verifiable cert chain from Node.js's perspective. The connection is still fully encrypted; only peer cert verification is skipped.

**Why:** Supabase uses CA-signed certificates; `ssl: true` enforces encrypted + verified TLS. `rejectUnauthorized: false` would allow MITM attacks.

**How to apply:**
- `lib/db/src/index.ts`: `new Pool({ connectionString, max: 1, ssl: true })`
- `lib/db/drizzle.config.ts`: `dbCredentials: { url: connectionString, ssl: true }`

## Schema migration (non-interactive)
`drizzle-kit push` fails without a TTY when the DB has existing unrelated tables (prompts for rename/create). Workaround:
1. Run `drizzle-kit generate --name=init` to generate SQL in `drizzle/0000_init.sql`
2. Apply via a Node.js pg script splitting on `--> statement-breakpoint`, skipping `already exists` errors
