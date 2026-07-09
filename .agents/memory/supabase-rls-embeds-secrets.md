---
name: Supabase RLS embeds and secret columns
description: RLS is row-level not column-level; protecting a secret column requires removing it from the publicly-readable table, not just "don't select it" in frontend code.
---

Postgres RLS policies control which *rows* a role can see, not which *columns*.
If a table has a secret column (e.g. a paid-content download URL) and the table
also has a public/authenticated SELECT policy for some subset of rows (e.g.
"published" rows), any client can still issue an explicit `select('secret_col')`
against those same rows — "the frontend code only selects safe columns" is not
a real security boundary.

**Why:** Discovered while building an ebook sales feature — the initial design
put `gdrive_url` on the same `ebooks` row that had a public
`status = 'published'` SELECT policy. A code-review pass correctly flagged
that this let any authenticated user pull `gdrive_url` directly via Supabase
client, bypassing the "must have purchased" check that only existed in
frontend logic.

**How to apply:** When a table mixes public-readable rows with a secret
column:
1. Make the base table SELECT-restricted to admin/service-role only.
2. Expose a `CREATE VIEW public_view AS SELECT <safe columns only> ...` for
   public/catalog reads (the secret column literally doesn't exist in the
   view, so no query can leak it).
3. Expose secret data only via a `SECURITY DEFINER` Postgres function that
   validates ownership (e.g. `EXISTS (SELECT 1 FROM purchases WHERE user_id =
   auth.uid() ...)`) server-side before returning it, called via
   `supabase.rpc(...)`.
4. Once the base table is admin-only, **any existing embedded-relation query**
   from a non-admin/non-service-role client (e.g. `cart_items.select('...,
   secret_table(...)')`) will silently return `null`/empty for that relation
   instead of erroring — grep for every embed of the now-restricted table and
   replace with a separate query against the safe view, keyed by id.
