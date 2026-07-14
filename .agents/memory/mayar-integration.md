---
name: Mayar integration status
description: Mayar payment gateway integration — API details, webhook security, and what's implemented.
---

# Mayar integration status

## API Details (from docs.mayar.id)

### Create Invoice
- **Endpoint**: `POST https://api.mayar.id/hl/v1/invoice/create`
- **Auth**: `Authorization: Bearer {MAYAR_API_KEY}`
- **Required body fields**: `name`, `email`, `mobile`, `redirectUrl`, `description`, `expiredAt` (ISO 8601), `items[]` (quantity, rate, description), `extraData`
- **Response**: `data.id` = Mayar invoice ID (store as `mayarInvoiceId`), `data.link` = payment URL (redirect user here)

### Webhook
- **No HMAC signature** — Mayar does NOT use HMAC/signature verification
- **Security via URL token**: register webhook as `https://<domain>/webhooks/mayar?token=<MAYAR_WEBHOOK_SECRET>`
- **Event for payment**: `event.received === "payment.received"` (the field is nested: `payload.event.received`)
- **Mayar invoice ID in webhook**: `payload.data.id` — match this to local `invoices.mayar_invoice_id`
- **Always return 200** so Mayar doesn't retry on non-payment events (reminders, membership changes, etc.)

## What's implemented (done)

- `artifacts/api-server/src/routes/checkout.ts`: POST /checkout now calls Mayar invoice/create API, stores `mayarInvoiceId`, returns actual `paymentUrl`
- `artifacts/api-server/src/routes/webhooks.ts`: POST /webhooks/mayar now processes `payment.received` events and calls `markInvoiceAsPaid`
- `artifacts/api-server/src/lib/supabase-admin.ts`: shared Supabase admin client (used by requireAuth + checkout)
- User info (name, email, mobile) fetched from Supabase auth admin API at checkout time

## User steps to go live

1. **Set env vars**: `MAYAR_API_KEY`, `MAYAR_WEBHOOK_SECRET`, `MAYAR_BASE_URL=https://api.mayar.id/hl/v1`
2. **Register webhook URL** on Mayar Dashboard → Integration → Webhook:
   `https://<deployed-domain>/webhooks/mayar?token=<MAYAR_WEBHOOK_SECRET>`
3. **Set ADMIN_USER_IDS** to real Supabase user UUIDs (currently set to placeholder "a")

## Env vars needed from Mayar
- `MAYAR_API_KEY` — from Mayar Dashboard → API / Developer
- `MAYAR_WEBHOOK_SECRET` — secret string you choose; pass it as `?token=` in the webhook URL
- `MAYAR_BASE_URL` — `https://api.mayar.id/hl/v1` (sandbox: `https://api.mayar.club/hl/v1`)

**Why URL token for security:** Mayar doesn't support HMAC. Anyone who knows your webhook URL could send fake events. The `?token=` param acts as a shared secret — only Mayar (which you register the URL with) will call it with the correct token.
