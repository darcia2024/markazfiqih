# Memory Index

- [Supabase Direct Query Pattern](supabase-direct-query.md) — frontend reads/writes go through src/lib/db.ts, not the Express backend; query key conventions, computed fields, type rules.
- [Orval Zod naming](orval-zod-naming.md) — generated Zod schema/type names don't always match OpenAPI-implied names; always grep generated file first.
- [Markaz Fiqh page layouts](markaz-fiqh-layouts.md) — CatalogPage has its own sidebar+header, not the shared Navbar; global UI additions must be added in both places.
- [Supabase SSL configuration](supabase-ssl.md) — use `ssl: true` (not `rejectUnauthorized: false`) in Pool + drizzle config; drizzle-kit push needs TTY workaround for non-interactive envs.
- [Auth middleware pattern](auth-middleware-pattern.md) — requireAuth + requireAdmin pattern; optionalAuth for public endpoints that need admin-conditional behavior (e.g. GET /classes?includeAll).
- [Mayar integration status](mayar-integration.md) — webhook skeleton exists but always returns 501 until Mayar API docs are received; 3 Mayar env vars needed.
- [Supabase JS Node version requirement](supabase-js-node-version.md) — supabase-js needs Node 22+ (native WebSocket) even if realtime is unused; Node 20 fails at client creation.
