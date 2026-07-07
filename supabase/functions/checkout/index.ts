import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verifikasi user dari JWT token
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

    // Ambil user dari token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pakai service role untuk operasi database (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Ambil cart items user
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select('id, class_id, classes(id, title, cover_image, base_price, discount_price)')
      .eq('user_id', user.id);

    if (cartError) throw cartError;
    if (!cartItems || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Keranjang kosong' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Hitung total
    const totalAmount = cartItems.reduce((sum: number, item: any) => {
      const price = item.classes?.discount_price ?? item.classes?.base_price ?? 0;
      return sum + price;
    }, 0);

    // Buat invoice di database
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Buat invoice items
    const invoiceItems = cartItems.map((item: any) => ({
      invoice_id: invoice.id,
      class_id: item.class_id,
      price: item.classes?.discount_price ?? item.classes?.base_price ?? 0,
    }));

    const { error: itemsError } = await supabaseAdmin.from('invoice_items').insert(invoiceItems);
    if (itemsError) throw itemsError;

    // --- MAYAR INTEGRATION ---
    // Uncomment ini setelah MAYAR_API_KEY tersedia:
    //
    // const mayarApiKey = Deno.env.get('MAYAR_API_KEY');
    // if (mayarApiKey) {
    //   const mayarResponse = await fetch('https://api.mayar.id/hl/v1/payment/create', {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${mayarApiKey}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       name: `Pembelian Kelas Markaz Fiqih`,
    //       amount: totalAmount,
    //       email: user.email,
    //       redirectUrl: `${Deno.env.get('FRONTEND_URL')}/keranjang?invoice=${invoice.id}`,
    //     }),
    //   });
    //   const mayarData = await mayarResponse.json();
    //   if (mayarData.data?.id) {
    //     await supabaseAdmin
    //       .from('invoices')
    //       .update({ mayar_invoice_id: mayarData.data.id })
    //       .eq('id', invoice.id);
    //   }
    //   return new Response(JSON.stringify({
    //     id: invoice.id,
    //     paymentUrl: mayarData.data?.link,
    //   }), {
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //   });
    // }

    // Development fallback (sebelum Mayar aktif):
    // Return invoice tanpa paymentUrl supaya CartPage tampilkan simulasi
    return new Response(
      JSON.stringify({
        id: invoice.id,
        userId: invoice.user_id,
        totalAmount: invoice.total_amount,
        status: invoice.status,
        mayarInvoiceId: null,
        paymentUrl: null,
        items: cartItems.map((item: any) => ({
          id: item.id,
          classId: item.class_id,
          title: item.classes?.title ?? '',
          price: item.classes?.discount_price ?? item.classes?.base_price ?? 0,
          coverImage: item.classes?.cover_image ?? '',
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
