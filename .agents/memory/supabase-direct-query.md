---
name: Supabase Direct Query Pattern
description: How the frontend bypasses the Express backend and queries Supabase directly via src/lib/db.ts
---

## Pattern

All frontend data fetching goes through `artifacts/markaz-fiqh/src/lib/db.ts` which queries Supabase directly using the `@supabase/supabase-js` client from `@/lib/supabase`.

Functions exported: `listClasses`, `getClassById`, `listInstructors`, `listTestimonials`, `getSettings`, `listCartItems`, `addCartItem`, `removeCartItem`, `listEnrollments`, `checkEnrollment`.

Type exported: `EnrollmentItem` — used in DashboardPage, MyClassesPage, AppShell.

## Key design decisions

**Snake_case → camelCase mapping**: All Supabase columns are mapped in db.ts (e.g. `cover_image` → `coverImage`, `photo_url` → `photoUrl`). Pages never access raw Supabase column names.

**Nested joins for computed fields**: `listClasses` and `listEnrollments` join `modules(id, dars(id, duration_minutes))` to compute `moduleCount`, `totalDarsCount`, `totalDurationMinutes` client-side.

**CartItem type**: includes `instructor`, `moduleCount`, `totalDurationMinutes` because CartPage renders them. `listCartItems` joins instructors and modules/dars too.

**null guards**: Items with null `classes` join are filtered in `listCartItems` and `listEnrollments` so downstream code never needs to null-check `item.class`.

**Why:** The Express backend was not required for core data reads — bypassing it removes the need for a running backend for page loads.

## Query key conventions

- Classes: `['classes', search, level, category, instructorId]`
- Instructors: `['instructors']`
- Testimonials: `['testimonials']`
- Settings: `['settings']`
- Cart: `['cart', userId]` — used in CartContext AND CartPage invalidations
- Enrollments: `['enrollments', userId]`
- Class detail: `['class', id]`

**Critical:** CartPage previously used `getListCartItemsQueryKey` from api-client-react for invalidation. This was replaced with `['cart', userId]` to match CartContext. Any new cart mutation must invalidate `['cart', userId]`.

## Sorting (CatalogPage)

`sort` state is client-side only — Supabase always returns `ORDER BY created_at DESC`. Client applies `useMemo` sort after fetch for `price_asc`, `price_desc`, `popular` (by moduleCount).

## classCount for instructors

`listInstructors` does NOT return classCount. Pages that show classCount (CatalogPage, LandingPage) compute it by filtering classes data: `classes.filter(cls => cls.instructor.id === inst.id).length`.

## getSettings return type

Returns camelCase keys (`socialInstagram`, `founderName`, etc). LandingPage's `buildSocialLinks` expects this shape. Pass `settings ?? undefined` to avoid null vs undefined mismatch.

## bio field

`listInstructors` returns `bio: string | null`. Components expecting `bio?: string` need `bio: inst.bio ?? undefined` in the mapping.
