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
- `simulate-success` guarded by `ALLOW_SIMULATE_SUCCESS=false` env var.
- `.env.example` has `MAYAR_API_KEY`, `MAYAR_WEBHOOK_SECRET`, `MAYAR_BASE_URL` placeholders.

## What still needs Mayar API docs
- Actual API call in checkout edge function — endpoint, auth format, request body, response field names.
- Webhook signature verification — header name, HMAC algorithm.
- `mayarInvoiceId` field on `invoices` — needed to cross-reference Mayar's webhook payload to local invoice.
- InvoiceStatus values may need 'cancelled' or other states depending on what Mayar sends.

**Why:** Webhook endpoint intentionally returns 501 (not 200) until signature is verified. Accepting unverified webhooks = free enrollment exploit.

## Env vars needed from Mayar
- `MAYAR_API_KEY` — from Mayar Dashboard → API / Developer
- `MAYAR_WEBHOOK_SECRET` — for HMAC signature verification
- `MAYAR_BASE_URL` — default `https://api.mayar.id/hl/v1`

## Voucher timing (implemented)
- **checkout** edge function: stores `voucherRowId`, passes `voucher_id` to invoice insert (does NOT increment used_count)
- **simulate-success** edge function: increments used_count ONLY when pending→paid transition actually occurs
- Idempotency guard: checks `invoice.status`, then atomic update `.eq('status','pending')` + checks `updatedCount`; concurrent/repeated calls return `alreadyPaid: true` without double-increment
- **REQUIRED MIGRATION before deploy**: `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES class_vouchers(id) ON DELETE SET NULL;`
- **increment_voucher_usage** SQL function must be created in Supabase SQL Editor (provided separately)
