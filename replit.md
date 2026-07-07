# Markaz Fiqh

Platform belajar fiqih madzhab Syafi'i secara terstruktur — kelas, modul, dan pengajar.

## Run & Operate

- **Frontend** (port 5000): `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/markaz-fiqh run dev`
- **API Server** (port 8080): `PORT=8080 pnpm --filter @workspace/api-server run dev`
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required secrets (set via Replit Secrets):
  - `SUPABASE_DATABASE_URL` — Supabase Postgres connection string (Settings → Database → URI)
  - `VITE_SUPABASE_URL` — Supabase project URL (Settings → API → Project URL)
  - `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key (Settings → API → Project API Keys)
  - `SUPABASE_URL` — same as VITE_SUPABASE_URL, used by the backend
  - `SUPABASE_SERVICE_ROLE_KEY` — service_role key for backend auth (Settings → API → Project API Keys)
  - `SESSION_SECRET` — secret for session signing (any random string)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
