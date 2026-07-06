# Memory Index

- [Orval Zod naming](orval-zod-naming.md) — generated Zod schema/type names don't always match OpenAPI-implied names; always grep generated file first.
- [Markaz Fiqh page layouts](markaz-fiqh-layouts.md) — CatalogPage has its own sidebar+header, not the shared Navbar; global UI additions must be added in both places.
- [Supabase SSL configuration](supabase-ssl.md) — use `ssl: true` (not `rejectUnauthorized: false`) in Pool + drizzle config; drizzle-kit push needs TTY workaround for non-interactive envs.
