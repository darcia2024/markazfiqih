import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Blokir endpoint simulasi di production.
  // Set ALLOW_SIMULATE_SUCCESS=false untuk menonaktifkan tanpa deploy ulang.
  if (Deno.env.get('ALLOW_SIMULATE_SUCCESS') === 'false') {
    return new Response(
      JSON.stringify({ error: 'Endpoint simulasi tidak tersedia di mode produksi.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { invoiceId } = await req.json() as { invoiceId: string };

    // Ambil invoice + items, pastikan milik user ini
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('id, user_id, status, voucher_id, invoice_items(class_id, ebook_id)')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single();

    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice tidak ditemukan' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Idempotent guard: jika sudah paid, kembalikan sukses tanpa efek samping
    if ((invoice as any).status === 'paid') {
      return new Response(
        JSON.stringify({ success: true, invoiceId, alreadyPaid: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Atomic transition: hanya update bila status MASIH 'pending'
    // Ini mencegah race condition jika endpoint dipanggil dua kali bersamaan.
    const { count: updatedCount } = await supabaseAdmin
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .eq('status', 'pending')
      .select('id', { count: 'exact', head: true });

    if (!updatedCount) {
      // Transisi tidak terjadi — kembalikan sukses jika sudah paid (concurrent request)
      return new Response(
        JSON.stringify({ success: true, invoiceId, alreadyPaid: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Increment voucher usage — hanya berjalan karena transisi baru saja terjadi (tepat sekali)
    // PERLU: kolom invoices.voucher_id sudah ada (jalankan migrasi ALTER TABLE dulu)
    if ((invoice as any).voucher_id) {
      const { error: rpcError } = await supabaseAdmin
        .rpc('increment_voucher_usage', { voucher_id: (invoice as any).voucher_id });
      if (rpcError) {
        // Log error tapi jangan rollback — enrollment tetap dibuat (voucher minor vs enrollment kritis)
        console.error('increment_voucher_usage failed:', rpcError.message);
      }
    }

    // Buat enrollments untuk tiap kelas
    const enrollments = invoice.invoice_items
      .filter((item: any) => item.class_id)
      .map((item: any) => ({
        user_id: user.id,
        class_id: item.class_id,
      }));

    if (enrollments.length > 0) {
      const { error: enrollError } = await supabaseAdmin
        .from('enrollments')
        .upsert(enrollments, { onConflict: 'user_id,class_id', ignoreDuplicates: true });

      if (enrollError) throw enrollError;
    }

    // Buat ebook_purchases untuk tiap ebook di invoice
    const ebookItems = invoice.invoice_items.filter((item: any) => item.ebook_id);
    if (ebookItems.length > 0) {
      const ebookPurchases = ebookItems.map((item: any) => ({
        user_id: user.id,
        ebook_id: item.ebook_id,
      }));
      const { error: ebookPurchaseError } = await supabaseAdmin
        .from('ebook_purchases')
        .upsert(ebookPurchases, { onConflict: 'user_id,ebook_id', ignoreDuplicates: true });
      if (ebookPurchaseError) throw ebookPurchaseError;
    }

    // Kosongkan cart
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({ success: true, invoiceId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
