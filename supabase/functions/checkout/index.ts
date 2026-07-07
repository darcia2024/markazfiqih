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

    // Parse body — ambil voucherCode kalau ada
    let voucherCode: string | null = null;
    try {
      const body = await req.json();
      voucherCode = body?.voucherCode ? String(body.voucherCode).toUpperCase().trim() : null;
    } catch {
      // body kosong atau bukan JSON — tidak apa-apa
    }

    // Pakai service role untuk operasi database (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Ambil cart items user — join ke classes dan bundles (beserta bundle_classes)
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id, class_id, bundle_id,
        classes ( id, title, cover_image, base_price, discount_price ),
        bundles (
          id, title, bundle_price,
          bundle_classes ( class_id, classes ( id, title, cover_image ) )
        )
      `)
      .eq('user_id', user.id);

    if (cartError) throw cartError;
    if (!cartItems || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Keranjang kosong' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Validasi voucher (hanya berlaku untuk kelas individual) ──────────────
    let voucherApplied = false;
    let voucherClassId: string | null = null;
    let voucherDiscountPrice: number | null = null;

    if (voucherCode) {
      // Kumpulkan semua class_id dari item kelas biasa (bukan bundle)
      const classIds = cartItems
        .filter((item: any) => item.class_id != null)
        .map((item: any) => item.class_id);

      if (classIds.length > 0) {
        const { data: voucherRow } = await supabaseAdmin
          .from('class_vouchers')
          .select('id, class_id, discount_price, max_uses, used_count')
          .in('class_id', classIds)
          .eq('code', voucherCode)
          .eq('is_active', true)
          .maybeSingle();

        const isVoucherValid =
          voucherRow &&
          (voucherRow.max_uses === null || (voucherRow.used_count ?? 0) < voucherRow.max_uses);

        if (!isVoucherValid) {
          return new Response(
            JSON.stringify({ error: 'Kode voucher tidak valid untuk kelas di keranjang ini.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        voucherApplied = true;
        voucherClassId = voucherRow.class_id;
        voucherDiscountPrice = voucherRow.discount_price;

        // Catat pemakaian voucher
        await supabaseAdmin
          .from('class_vouchers')
          .update({ used_count: (voucherRow.used_count ?? 0) + 1 })
          .eq('id', voucherRow.id);
      }
    }

    // ── Validasi bundle: tiap bundle harus punya minimal 1 kelas ─────────────
    for (const item of cartItems as any[]) {
      if (item.bundle_id && item.bundles) {
        const bundleClasses = (item.bundles.bundle_classes ?? [])
          .map((bc: any) => bc.classes)
          .filter(Boolean);
        if (bundleClasses.length === 0) {
          return new Response(
            JSON.stringify({ error: `Bundle "${item.bundles.title}" tidak memiliki kelas yang valid. Hubungi admin.` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // ── Deteksi duplikasi: kelas individual yang juga ada di dalam bundle ─────
    // Kumpulkan semua class_id yang sudah dicakup oleh bundle dalam keranjang
    const classIdsCoveredByBundle = new Set<string>();
    for (const item of cartItems as any[]) {
      if (item.bundle_id && item.bundles) {
        for (const bc of (item.bundles.bundle_classes ?? [])) {
          if (bc.class_id) classIdsCoveredByBundle.add(bc.class_id);
        }
      }
    }
    // Jika ada item kelas individual yang sudah tercakup bundle, tolak checkout
    const duplicateClassItems = (cartItems as any[]).filter(
      (item) => item.class_id && classIdsCoveredByBundle.has(item.class_id)
    );
    if (duplicateClassItems.length > 0) {
      const titles = duplicateClassItems
        .map((item: any) => item.classes?.title ?? item.class_id)
        .join(', ');
      return new Response(
        JSON.stringify({
          error: `Keranjang mengandung kelas yang sudah termasuk dalam paket bundle: ${titles}. Hapus kelas individual tersebut sebelum checkout.`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Hitung total ──────────────────────────────────────────────────────────
    let totalAmount = 0;
    for (const item of cartItems as any[]) {
      if (item.bundle_id && item.bundles) {
        // Item bundle — gunakan bundle_price
        totalAmount += item.bundles.bundle_price ?? 0;
      } else if (item.class_id && item.classes) {
        // Item kelas biasa — terapkan voucher kalau ada
        if (voucherApplied && item.class_id === voucherClassId) {
          totalAmount += voucherDiscountPrice!;
        } else {
          totalAmount += item.classes.discount_price ?? item.classes.base_price ?? 0;
        }
      }
    }

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

    // ── Buat invoice items ────────────────────────────────────────────────────
    // Untuk kelas biasa: 1 row per kelas
    // Untuk bundle: 1 row per kelas DALAM bundle (harga dibagi rata, sisa ke kelas pertama)
    const invoiceItemsToInsert: any[] = [];
    const invoiceItemsForResponse: any[] = [];

    for (const item of cartItems as any[]) {
      if (item.bundle_id && item.bundles) {
        const bundle = item.bundles;
        const bundleClasses = (bundle.bundle_classes ?? [])
          .map((bc: any) => bc.classes)
          .filter(Boolean);

        const bundlePrice: number = bundle.bundle_price ?? 0;
        const classCount = bundleClasses.length;

        if (classCount === 0) continue;

        // Bagi rata harga bundle ke tiap kelas — sisa pembulatan ke kelas pertama
        const pricePerClass = Math.floor(bundlePrice / classCount);
        const remainder = bundlePrice - pricePerClass * classCount;

        bundleClasses.forEach((cls: any, idx: number) => {
          const price = idx === 0 ? pricePerClass + remainder : pricePerClass;
          invoiceItemsToInsert.push({
            invoice_id: invoice.id,
            class_id: cls.id,
            bundle_id: item.bundle_id,
            price,
          });
          invoiceItemsForResponse.push({
            id: `${item.id}-${cls.id}`,
            classId: cls.id,
            title: cls.title ?? '',
            price,
            coverImage: cls.cover_image ?? '',
          });
        });
      } else if (item.class_id && item.classes) {
        const price =
          voucherApplied && item.class_id === voucherClassId
            ? voucherDiscountPrice!
            : (item.classes.discount_price ?? item.classes.base_price ?? 0);

        invoiceItemsToInsert.push({
          invoice_id: invoice.id,
          class_id: item.class_id,
          price,
        });
        invoiceItemsForResponse.push({
          id: item.id,
          classId: item.class_id,
          title: item.classes.title ?? '',
          price,
          coverImage: item.classes.cover_image ?? '',
        });
      }
    }

    if (invoiceItemsToInsert.length > 0) {
      const { error: itemsError } = await supabaseAdmin
        .from('invoice_items')
        .insert(invoiceItemsToInsert);
      if (itemsError) throw itemsError;
    }

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
    //     voucherApplied,
    //   }), {
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //   });
    // }

    // Development fallback (sebelum Mayar aktif):
    return new Response(
      JSON.stringify({
        id: invoice.id,
        userId: invoice.user_id,
        totalAmount: invoice.total_amount,
        status: invoice.status,
        mayarInvoiceId: null,
        paymentUrl: null,
        voucherApplied,
        items: invoiceItemsForResponse,
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
