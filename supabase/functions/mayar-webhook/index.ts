import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' },
    });
  }

  try {
    // Verifikasi signature Mayar — WAJIB: tolak jika secret belum dikonfigurasi
    // atau header signature tidak ada (fail closed, bukan fail open)
    const webhookSecret = Deno.env.get('MAYAR_WEBHOOK_SECRET');
    if (!webhookSecret || webhookSecret === 'PLACEHOLDER_ISI_NANTI') {
      // Blokir semua request webhook selama secret belum diisi dengan nilai asli
      return new Response(JSON.stringify({ error: 'Webhook secret belum dikonfigurasi' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const signature = req.headers.get('x-mayar-signature');
    const rawBody = await req.text();

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing signature header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expectedSignature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(rawBody)
    );
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature !== expectedHex) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(rawBody);

    // Cek apakah statusnya paid
    // (sesuaikan field dengan format webhook Mayar yang sebenarnya)
    if (payload.status !== 'paid') {
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mayarInvoiceId = payload.id;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Cari invoice di database berdasarkan mayar_invoice_id
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(class_id)')
      .eq('mayar_invoice_id', mayarInvoiceId)
      .single();

    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update invoice jadi paid
    await supabaseAdmin
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoice.id);

    // Buat enrollments
    const enrollments = invoice.invoice_items.map((item: any) => ({
      user_id: invoice.user_id,
      class_id: item.class_id,
    }));

    const { error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .upsert(enrollments, { onConflict: 'user_id,class_id', ignoreDuplicates: true });

    if (enrollError) throw enrollError;

    // Kosongkan cart
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', invoice.user_id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
