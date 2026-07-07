# Markaz Fiqh

Platform belajar fiqih madzhab Syafi'i secara terstruktur — kelas, modul, dan pengajar.

## Run & Operate

- **Frontend** (port 5000): `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/markaz-fiqh run dev`
- **API Server** (port 8080): `PORT=8080 pnpm --filter @workspace/api-server run dev`
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required secrets & env vars (set via Replit Secrets / Env Vars):
  - `VITE_SUPABASE_URL` *(env var)* — Supabase project URL (Settings → API → Project URL); juga dipakai backend sebagai fallback `SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY` *(secret)* — Supabase anon/public key (Settings → API → Project API Keys)
  - `SUPABASE_SERVICE_ROLE_KEY` *(secret)* — service_role key untuk auth backend (Settings → API → Project API Keys)
  - `FRONTEND_URL` *(env var)* — URL frontend di Replit, dipakai untuk CORS backend
  - `ADMIN_USER_IDS` *(env var)* — UUID Supabase user admin, pisahkan koma
  - `SESSION_SECRET` *(secret)* — sudah diset, tersedia jika dibutuhkan

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

Platform belajar fiqih Syafi'i dengan fitur:
- Katalog kelas individual + halaman Paket Bundle (`/paket-bundle`)
- Keranjang belanja mendukung kelas individual **dan** bundle
- Checkout via Supabase Edge Function → Mayar payment gateway (mode dev: simulasi)
- Enrollment otomatis setelah pembayaran confirmed
- Dashboard siswa, halaman "Kelas Saya", progress belajar
- Admin panel (kelas, instruktur, pesanan, testimonial, pengaturan)

## User preferences

- Jangan migrasi ke Replit DB — tetap pakai Supabase (database + auth + edge functions)

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
