---
name: Auth middleware pattern
description: How requireAuth, requireAdmin, and optionalAuth work together in the API server; where userId must come from token not client.
---

# Auth middleware pattern

## Pattern
- `requireAuth` — verifies Supabase JWT via service role key, sets `req.auth.userId`. Rejects 401 if missing/invalid.
- `requireAdmin` — checks `req.auth.userId` ∈ `ADMIN_USER_IDS` env var. Must be after requireAuth. Rejects 403.
- `optionalAuth` — like requireAuth but never rejects. Sets `req.auth` if token is valid, skips if not. For public endpoints that need admin-conditional logic (e.g. GET /classes?includeAll=true).

**Why:** All user-owned endpoints must ignore client-supplied userId and use `req.auth.userId` exclusively. Otherwise any user can read/modify another user's data (IDOR).

**How to apply:**
- Any endpoint that touches user data (cart, enrollments, checkout, progress, profile) → `requireAuth`, then override userId from `req.auth.userId`.
- Any write to protected resources (classes CRUD, instructors CRUD, testimonials CRUD, settings PUT) → `requireAuth + requireAdmin`.
- Public read endpoints that have an admin-only query param → `optionalAuth`, then check `req.auth` + ADMIN_USER_IDS_SET.
- Ownership checks (DELETE cart item, GET/PUT invoice, simulate-*) → after requireAuth, verify `resource.userId === req.auth.userId`, return 404 (not 403) on mismatch to avoid leaking existence.

## Files
- `src/middlewares/requireAuth.ts`
- `src/middlewares/requireAdmin.ts`
- `src/middlewares/optionalAuth.ts`
