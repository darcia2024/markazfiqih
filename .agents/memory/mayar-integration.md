---
name: Mayar integration status
description: Mayar payment gateway integration — where the real implementation lives and how webhook security works.
---

# Mayar integration status

## Where it actually lives

The live payment flow runs entirely on **Supabase Edge Functions**
(`supabase/functions/`), NOT the Express `api-server`. The frontend
(`src/lib/payments.ts`) calls Supabase functions directly with the user's
Supabase JWT — it never talks to `api-server` for payments.

- `checkout/` — creates the local `invoices`/`invoice_items` rows, then calls Mayar's invoice/create API
- `mayar-webhook/` — receives Mayar's webhook, deployed with `--no-verify-jwt` (Mayar can't send a Supabase JWT)
- `payment-status/` — polled by the frontend; re-verifies with Mayar if still pending (safety net if webhook fails/is late)
- `simulate-success/` — dev-only manual fulfillment, gated by `ALLOW_SIMULATE_SUCCESS`
- `_shared/mayar.ts` — Mayar API client (create invoice, get invoice detail, `isPaidStatus`)
- `_shared/fulfillment.ts` — single idempotent `fulfillInvoice()` used by all three of the above (atomic pending→paid transition, enrollment/ebook upsert, cart clear)

Any `artifacts/api-server/src/routes/checkout.ts` or `webhooks.ts` code is a
leftover/parallel implementation that the frontend does not call — don't
assume that's the live path without checking `payments.ts` first.

## Webhook security model (already implemented)

Two layers, matches what's needed for a trustworthy webhook without HMAC support:
1. Shared-secret token via `Authorization: Bearer <token>` or `?token=` query param, checked with constant-time compare against `MAYAR_WEBHOOK_SECRET`.
2. Re-confirms status by calling Mayar's `GET /hl/v2/invoices/{id}` directly — the webhook payload is never trusted for the paid/unpaid decision.

**Why:** Mayar doesn't sign webhooks with HMAC, so payload contents alone can't be trusted; re-querying Mayar's API is what makes a forged webhook call harmless.

**How to apply:** if asked to harden or debug Mayar webhooks again, check this file lives up to date — verify via `curl` that the deployed function URL responds (401 without token = deployed and working, not a 404).

Register in Mayar dashboard: `https://<project-ref>.supabase.co/functions/v1/mayar-webhook?token=<MAYAR_WEBHOOK_SECRET>`. Note `MAYAR_WEBHOOK_TOKEN` (a similarly-named secret sometimes present) is NOT referenced anywhere in code — only `MAYAR_WEBHOOK_SECRET` is used.
