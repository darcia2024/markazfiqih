import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getMayarInvoice, isPaidStatus } from '../_shared/mayar.ts';
import { fulfillInvoice } from '../_shared/fulfillment.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Mayar — dipanggil server Mayar, BUKAN browser user.
//
// Dua lapis pengaman:
//   1. Token rahasia (header Authorization: Bearer <token>  ATAU  ?token=<token>)
//   2. Konfirmasi ulang ke API Mayar: status invoice benar-benar 'paid'?
//
// Lapis 2 yang bikin ini aman. Payload webhook palsu tidak akan pernah lolos,
// karena status akhirnya selalu ditanyakan langsung ke Mayar pakai API key kita.
//
// PENTING: fungsi ini harus dideploy dengan --no-verify-jwt, karena Mayar tidak
// mengirim JWT Supabase:
//   supabase functions deploy mayar-webhook --no-verify-jwt
// ─────────────────────────────────────────────────────────────────────────────

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Perbandingan konstan-waktu supaya token tidak bisa ditebak lewat timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    });
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    // ── Lapis 1: token rahasia ────────────────────────────────────────────────
    const expected = Deno.env.get('MAYAR_WEBHOOK_SECRET') ?? '';
    if (!expected || expected === 'PLACEHOLDER_ISI_NANTI') {
      console.error('MAYAR_WEBHOOK_SECRET belum diset.');
      return json({ error: 'Webhook belum dikonfigurasi' }, 503);
    }

    const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    const queryToken = new URL(req.url).searchParams.get('token') ?? '';
    const supplied = bearer || queryToken;

    if (!supplied || !safeEqual(supplied, expected)) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const payload = await req.json();

    // Debug: catat seluruh payload + header yang masuk. Format webhook Mayar
    // belum 100% dipastikan, jadi log ini dipakai untuk verifikasi di awal.
    console.log(
      'mayar-webhook payload diterima:',
      JSON.stringify({
        headers: Object.fromEntries(req.headers.entries()),
        body: payload,
      }),
    );

    const event: string = payload?.event ?? '';

    // Mayar mengirim beberapa event (payment.reminder, membership.*, shipper.*).
    // Yang membuka akses hanya payment.received.
    if (event !== 'payment.received') {
      return json({ received: true, ignored: event || 'unknown' });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ── Cari invoice lokal ────────────────────────────────────────────────────
    // Jalur utama: extraData.idProd — kita isi sendiri saat createMayarInvoice.
    // Jalur cadangan: dokumentasi webhook Mayar TIDAK menjamin extraData ikut
    // terkirim di payload payment.received. Kalau tidak ada, cocokkan
    // data.id / data.transactionId dari payload dengan kolom mayar_invoice_id.
    // Ini tetap aman: pencocokan payload HANYA dipakai untuk MENEMUKAN baris —
    // keputusan paid/tidak tetap dikonfirmasi ulang ke API Mayar (Lapis 2)
    // memakai mayar_invoice_id yang tersimpan di DB, bukan dari payload.
    const idProd: string | undefined = payload?.data?.extraData?.idProd;
    const payloadMayarIds: string[] = [payload?.data?.id, payload?.data?.transactionId]
      .filter((v): v is string => typeof v === 'string' && v.length > 0);

    const invoiceColumns = 'id, status, total_amount, mayar_invoice_id';
    let invoice:
      | { id: string; status: string; total_amount: number; mayar_invoice_id: string | null }
      | null = null;

    if (idProd) {
      const { data } = await supabaseAdmin
        .from('invoices')
        .select(invoiceColumns)
        .eq('id', idProd)
        .maybeSingle();
      invoice = data;
    }

    if (!invoice && payloadMayarIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('invoices')
        .select(invoiceColumns)
        .in('mayar_invoice_id', payloadMayarIds)
        .maybeSingle();
      invoice = data;
      if (invoice) {
        console.log(
          `mayar-webhook: invoice ${invoice.id} ditemukan lewat fallback mayar_invoice_id (extraData.idProd tidak ada di payload).`,
        );
      }
    }

    if (!invoice) {
      // Balas 200 supaya Mayar berhenti retry untuk pembayaran yang memang
      // bukan berasal dari checkout kita (mis. produk lain di akun Mayar yang sama).
      console.error(
        'Invoice lokal tidak ditemukan. idProd:', idProd ?? '(kosong)',
        'kandidat mayar id:', JSON.stringify(payloadMayarIds),
      );
      return json({ received: true, unknownInvoice: true });
    }

    if (invoice.status === 'paid') {
      return json({ received: true, alreadyPaid: true });
    }

    // ── Lapis 2: konfirmasi ke Mayar (ini yang bikin webhook palsu tidak berguna) ─
    // HANYA gunakan mayar_invoice_id yang tersimpan lokal (bukan payload webhook).
    if (!invoice.mayar_invoice_id) {
      console.error('Tidak ada mayar_invoice_id lokal untuk invoice', invoice.id);
      return json({ received: true, missingLocalReference: true }, 202);
    }

    const detail = await getMayarInvoice(invoice.mayar_invoice_id);

    if (!detail || !isPaidStatus(detail.status)) {
      console.warn('Webhook bilang paid, tapi Mayar bilang:', detail?.status ?? 'not found');
      return json({ received: true, verified: false }, 202);
    }

    // Nominal bisa SAH lebih kecil dari invoice lokal karena discount code Mayar
    // (voucher UI kita sudah dihapus, diskon kini lewat Mayar). Tidak lagi
    // menolak pembayaran — hanya dicatat untuk audit.
    if (detail.amount !== invoice.total_amount) {
      console.warn(
        `Nominal tidak cocok (kemungkinan discount code Mayar) untuk invoice ${invoice.id}: Mayar=${detail.amount} lokal=${invoice.total_amount}`,
      );
    }

    const result = await fulfillInvoice(supabaseAdmin, invoice.id);

    return json({ received: true, ...result });
  } catch (error) {
    console.error('mayar-webhook error:', error);
    // 500 → Mayar akan retry. Ini yang kita mau kalau errornya sementara.
    return json({ error: (error as Error).message }, 500);
  }
});
