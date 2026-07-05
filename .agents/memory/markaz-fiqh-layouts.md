---
name: Markaz Fiqh page layout structure
description: Which pages share the global Navbar component vs. render their own bespoke header/sidebar.
---

`CatalogPage.tsx` does NOT use the shared `Navbar` component. It renders its own `CatalogSidebar` (fixed left nav) and `CatalogHeader` (top-right bell/avatar) defined locally in the same file.

**Why:** Global UI elements (e.g. cart icon + badge) added only to `Navbar` will not appear on the catalog page, since it bypasses `Navbar` entirely. This caused a missed spot when adding the cart icon — had to add it separately to `CatalogHeader`.

**How to apply:** When adding any global nav/header element (notifications, cart, account menu, etc.), check whether the target page uses `Navbar` or has its own local header/sidebar component before assuming one edit covers the whole app. Other pages (`CartPage`, likely `MyClassesPage`, `ClassDetailPage`) should be checked individually too.
