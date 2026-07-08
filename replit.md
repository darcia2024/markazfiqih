# Markaz Fiqh

Platform belajar fiqih online madzhab Syafi'i — pnpm monorepo dengan React frontend dan Express backend, menggunakan Supabase untuk database dan autentikasi.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite (`artifacts/markaz-fiqh`) |
| Backend | Express 5 (`artifacts/api-server`) |
| Database / Auth | Supabase (PostgreSQL + Google OAuth) |
| Payments | Mayar.id (skeleton, belum aktif) |
| Runtime | Node.js 22 |
| Package manager | pnpm (workspace monorepo) |

## Cara menjalankan

Dua workflow sudah dikonfigurasi dan berjalan otomatis:

| Workflow | Command | Port |
|---|---|---|
| Start application | `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/markaz-fiqh run dev` | 5000 |
| Backend API | `PORT=8080 pnpm --filter @workspace/api-server run dev` | 8080 |

## Environment variables / secrets yang dibutuhkan

| Key | Keterangan | Dimana |
|---|---|---|
| `VITE_SUPABASE_URL` | URL project Supabase (public) | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Anon public key | Supabase → Project Settings → API |
| `SUPABASE_URL` | URL project Supabase (backend) | sama dengan VITE_SUPABASE_URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (rahasia) | Supabase → Project Settings → API |
| `SUPABASE_DATABASE_URL` | Connection string PostgreSQL | Supabase → Project Settings → Database |
| `ADMIN_USER_IDS` | UUID user yang boleh akses `/admin`, dipisah koma | set manual |
| `SESSION_SECRET` | Secret untuk session | set manual |
| `MAYAR_API_KEY` | API key Mayar.id (opsional) | Mayar Dashboard |
| `MAYAR_WEBHOOK_SECRET` | Webhook secret Mayar.id (opsional) | Mayar Dashboard |

## Struktur monorepo

```
artifacts/
  markaz-fiqh/     # Frontend React + Vite
  api-server/      # Backend Express API
  mockup-sandbox/  # UI mockup dev server
packages/          # Shared libs (db, api-zod, dll)
attached_assets/   # Dokumen PRD dan aset desain
```

## User preferences

- Jangan migrasi database ke Replit — tetap pakai Supabase
- Pertahankan struktur monorepo yang ada
