---
name: Mayar integration status
description: What's scaffolded for Mayar payment gateway vs what still needs Mayar API docs to complete.
---

# Mayar integration status

## What's scaffolded (done without Mayar API docs)
- `GET /checkout/:id` — polls invoice status, used by CartPage after returning from payment gateway.
- `POST /checkout` returns `paymentUrl` field (null until Mayar is connected).
- CartPage: if `paymentUrl` → redirect to it; else → show dev simulate panel.
- CartPage: detects `?invoice=<id>` query param on load → 'waiting' step, polls every 3s via `useGetCheckout`.
- `POST /webhooks/mayar` skeleton exists but **always returns 501** until signature verification is implemented.
- `markInvoiceAsPaid()` helper in `src/lib/invoice-helpers.ts` — shared by simulate-success and (future) webhook.
- `simulate-success` and `simulate-fail` guarded by `NODE_ENV === "production"` check (404 in production).
- `.env.example` has `MAYAR_API_KEY`, `MAYAR_WEBHOOK_SECRET`, `MAYAR_BASE_URL` placeholders.

## What still needs Mayar API docs
- Actual API call in `POST /checkout` — endpoint, auth format, request body, response field names. TODO comment is in checkout.ts.
- Webhook signature verification in `src/routes/webhooks.ts` — header name, HMAC algorithm. TODO comments are there.
- `mayarInvoiceId` field on `invoicesTable` — needed to cross-reference Mayar's webhook payload to local invoice.
- InvoiceStatus values may need 'cancelled' or other states depending on what Mayar sends.

**Why:** Webhook endpoint intentionally returns 501 (not 200) until signature is verified. Accepting unverified webhooks = free enrollment exploit.

## Env vars needed from Mayar
- `MAYAR_API_KEY` — from Mayar Dashboard → API / Developer
- `MAYAR_WEBHOOK_SECRET` — for HMAC signature verification
- `MAYAR_BASE_URL` — default `https://api.mayar.id/hl/v1`
