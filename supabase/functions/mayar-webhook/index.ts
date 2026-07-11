import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' },
    });
  }

  try {
    // Verifikasi token rahasia dari query parameter URL.
    // URL webhook di dashboard Mayar harus diset ke:
    //   https://<project>.supabase.co/functions/v1/mayar-webhook?token=<MAYAR_WEBHOOK_TOKEN>
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const expectedToken = Deno.env.get('MAYAR_WEBHOOK_SECRET');

    if (!expectedToken || expectedToken === 'PLACEHOLDER_ISI_NANTI' || token !== expectedToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();

    // Sesuai dokumentasi resmi Mayar: event = 'payment.received', data.status = true (boolean)
    if (payload.event !== 'payment.received' || payload.data?.status !== true) {
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mayarInvoiceId = payload.data.id;
    const extraData = payload.data.extraData ?? {};
    // idProd dikirim saat membuat invoice di checkout/index.ts via extraData
    const invoiceId = extraData.idProd;

    if (!invoiceId) {
      console.error('Webhook Mayar tidak punya idProd di extraData:', payload);
      return new Response(JSON.stringify({ error: 'Missing invoice reference' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('id, user_id, status, invoice_items(class_id, bundle_id, ebook_id)')
      .eq('id', invoiceId)
      .single();
    if (invoiceError || !invoice) throw invoiceError ?? new Error('Invoice tidak ditemukan');

    if (invoice.status === 'paid') {
      // Sudah diproses sebelumnya — webhook Mayar bisa terkirim berkali-kali, aman diabaikan
      return new Response(JSON.stringify({ received: true, already_paid: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await supabaseAdmin
      .from('invoices')
      .update({
        status: 'paid',
        mayar_invoice_id: mayarInvoiceId,
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    // Buat enrollments untuk tiap kelas (upsert untuk cegah duplikat)
    const classItems = (invoice.invoice_items as any[]).filter((i) => i.class_id);
    if (classItems.length > 0) {
      const enrollments = classItems.map((item: any) => ({
        user_id: invoice.user_id,
        class_id: item.class_id,
      }));
      const { error: enrollError } = await supabaseAdmin
        .from('enrollments')
        .upsert(enrollments, { onConflict: 'user_id,class_id', ignoreDuplicates: true });
      if (enrollError) throw enrollError;
    }

    // Buat ebook_purchases untuk tiap ebook di invoice
    const ebookItems = (invoice.invoice_items as any[]).filter((i) => i.ebook_id);
    if (ebookItems.length > 0) {
      const ebookPurchases = ebookItems.map((item: any) => ({
        user_id: invoice.user_id,
        ebook_id: item.ebook_id,
      }));
      const { error: ebookPurchaseError } = await supabaseAdmin
        .from('ebook_purchases')
        .upsert(ebookPurchases, { onConflict: 'user_id,ebook_id', ignoreDuplicates: true });
      if (ebookPurchaseError) throw ebookPurchaseError;
    }

    // Kosongkan cart setelah pembayaran berhasil
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', invoice.user_id);

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('mayar-webhook error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
