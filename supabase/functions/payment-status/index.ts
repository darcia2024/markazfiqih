import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getMayarInvoice, isPaidStatus } from '../_shared/mayar.ts';
import { fulfillInvoice } from '../_shared/fulfillment.ts';

// ─────────────────────────────────────────────────────────────────────────────
// GET status pembayaran — dipanggil halaman pembayaran tiap beberapa detik.
//
// Bukan cuma baca database. Kalau invoice masih 'pending', fungsi ini bertanya
// langsung ke Mayar. Jadi kalau webhook telat, nyangkut, atau gagal terkirim,
// user tetap dapat aksesnya begitu dia balik ke halaman kita.
//
// Body: { invoiceId: string }
// ─────────────────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    const { invoiceId } = (await req.json()) as { invoiceId?: string };
    if (!invoiceId) return json({ error: 'invoiceId wajib diisi' }, 400);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('id, user_id, status, total_amount, mayar_invoice_id, mayar_payment_url, expires_at, paid_at')
      .eq('id', invoiceId)
      .eq('user_id', user.id) // invoice orang lain = tidak ada
      .maybeSingle();

    if (!invoice) return json({ error: 'Invoice tidak ditemukan' }, 404);

    const base = {
      id: invoice.id,
      totalAmount: invoice.total_amount,
      paymentUrl: invoice.mayar_payment_url,
      expiresAt: invoice.expires_at,
    };

    if (invoice.status === 'paid') {
      return json({ ...base, status: 'paid', paidAt: invoice.paid_at });
    }
    if (invoice.status === 'failed') {
      return json({ ...base, status: 'failed' });
    }

    // ── Masih pending: tanya langsung ke Mayar ────────────────────────────────
    if (invoice.mayar_invoice_id) {
      const detail = await getMayarInvoice(invoice.mayar_invoice_id);

      if (detail && isPaidStatus(detail.status)) {
        // Nominal bisa SAH lebih kecil dari invoice lokal karena discount code
        // Mayar — tidak lagi menolak, hanya dicatat untuk audit.
        if (detail.amount !== invoice.total_amount) {
          console.warn(
            `Nominal tidak cocok (kemungkinan discount code Mayar) untuk invoice ${invoice.id}: Mayar=${detail.amount} lokal=${invoice.total_amount}`,
          );
        }
        const result = await fulfillInvoice(supabaseAdmin, invoice.id);
        return json({ ...base, status: 'paid', reconciled: !result.alreadyPaid });
      }
    }

    // ── Kedaluwarsa ───────────────────────────────────────────────────────────
    if (invoice.expires_at && new Date(invoice.expires_at) < new Date()) {
      await supabaseAdmin
        .from('invoices')
        .update({ status: 'failed' })
        .eq('id', invoice.id)
        .eq('status', 'pending');
      return json({ ...base, status: 'failed', reason: 'expired' });
    }

    return json({ ...base, status: 'pending' });
  } catch (error) {
    console.error('payment-status error:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
