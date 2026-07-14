import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createMayarInvoice } from '../_shared/mayar.ts';

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

    let voucherCode: string | null = null;
    try {
      const body = await req.json();
      voucherCode = body?.voucherCode ? String(body.voucherCode).toUpperCase().trim() : null;
    } catch {
      // body kosong — tidak apa-apa
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ── Invoice pending yang masih hidup: pakai ulang, jangan bikin baru ──────
    // Kalau user klik "Bayar" dua kali, atau balik lagi ke halaman checkout,
    // dia harus dapat tagihan yang sama — bukan tagihan kembar di Mayar.
    const { data: reusable } = await supabaseAdmin
      .from('invoices')
      .select('id, total_amount, mayar_payment_url, expires_at')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .not('mayar_payment_url', 'is', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reusable) {
      return json({
        id: reusable.id,
        paymentUrl: reusable.mayar_payment_url,
        expiresAt: reusable.expires_at,
        totalAmount: reusable.total_amount,
        reused: true,
      });
    }

    // ── Ambil isi keranjang ───────────────────────────────────────────────────
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id, class_id, bundle_id, ebook_id,
        classes ( id, title, cover_image, base_price, discount_price ),
        bundles (
          id, title, bundle_price,
          bundle_classes ( class_id, classes ( id, title, cover_image ) )
        ),
        ebooks ( id, title, price, discount_price )
      `)
      .eq('user_id', user.id);

    if (cartError) throw cartError;
    if (!cartItems?.length) return json({ error: 'Keranjang kosong.' }, 400);

    // ── Voucher (hanya untuk kelas individual) ────────────────────────────────
    let voucherApplied = false;
    let voucherClassId: string | null = null;
    let voucherDiscountPrice: number | null = null;
    let voucherRowId: string | null = null;

    if (voucherCode) {
      const classIds = (cartItems as any[]).filter((i) => i.class_id).map((i) => i.class_id);

      if (classIds.length > 0) {
        const { data: voucherRow } = await supabaseAdmin
          .from('class_vouchers')
          .select('id, class_id, discount_price, max_uses, used_count')
          .in('class_id', classIds)
          .eq('code', voucherCode)
          .eq('is_active', true)
          .maybeSingle();

        const valid =
          voucherRow &&
          (voucherRow.max_uses === null || (voucherRow.used_count ?? 0) < voucherRow.max_uses);

        if (!valid) {
          return json({ error: 'Kode voucher tidak berlaku untuk kelas di keranjang ini.' }, 400);
        }

        voucherApplied = true;
        voucherClassId = voucherRow.class_id;
        voucherDiscountPrice = voucherRow.discount_price;
        voucherRowId = voucherRow.id;
      }
    }

    // ── Validasi bundle ───────────────────────────────────────────────────────
    for (const item of cartItems as any[]) {
      if (item.bundle_id && item.bundles) {
        const bundleClasses = (item.bundles.bundle_classes ?? []).map((bc: any) => bc.classes).filter(Boolean);
        if (bundleClasses.length === 0) {
          return json(
            { error: `Paket "${item.bundles.title}" belum berisi kelas. Hubungi admin.` },
            400,
          );
        }
      }
    }

    // ── Kelas individual yang sudah tercakup bundle ───────────────────────────
    const coveredByBundle = new Set<string>();
    for (const item of cartItems as any[]) {
      if (item.bundle_id && item.bundles) {
        for (const bc of item.bundles.bundle_classes ?? []) {
          if (bc.class_id) coveredByBundle.add(bc.class_id);
        }
      }
    }
    const duplicates = (cartItems as any[]).filter((i) => i.class_id && coveredByBundle.has(i.class_id));
    if (duplicates.length > 0) {
      const titles = duplicates.map((i: any) => i.classes?.title ?? i.class_id).join(', ');
      return json(
        { error: `Kelas ini sudah termasuk dalam paket di keranjang: ${titles}. Hapus dulu kelas satuannya.` },
        400,
      );
    }

    // ── Kelas yang sudah dimiliki ─────────────────────────────────────────────
    const allClassIds = new Set<string>();
    for (const item of cartItems as any[]) {
      if (item.class_id) allClassIds.add(item.class_id);
      if (item.bundle_id && item.bundles) {
        for (const bc of item.bundles.bundle_classes ?? []) {
          if (bc.class_id) allClassIds.add(bc.class_id);
        }
      }
    }

    if (allClassIds.size > 0) {
      const { data: owned, error: ownedError } = await supabaseAdmin
        .from('enrollments')
        .select('class_id, classes(title)')
        .eq('user_id', user.id)
        .in('class_id', Array.from(allClassIds));
      if (ownedError) throw ownedError;

      if (owned?.length) {
        const titles = owned.map((e: any) => e.classes?.title ?? e.class_id).join(', ');
        return json({ error: `Kamu sudah punya kelas ini: ${titles}. Hapus dari keranjang dulu.` }, 400);
      }
    }

    // ── Ebook yang sudah dimiliki ─────────────────────────────────────────────
    const ebookIds = (cartItems as any[]).map((i) => i.ebook_id).filter((id): id is string => !!id);
    if (ebookIds.length > 0) {
      const { data: ownedEbooks, error: ownedEbookError } = await supabaseAdmin
        .from('ebook_purchases')
        .select('ebook_id, ebooks(title)')
        .eq('user_id', user.id)
        .in('ebook_id', ebookIds);
      if (ownedEbookError) throw ownedEbookError;

      if (ownedEbooks?.length) {
        const titles = ownedEbooks.map((e: any) => e.ebooks?.title ?? e.ebook_id).join(', ');
        return json({ error: `Kamu sudah punya ebook ini: ${titles}. Hapus dari keranjang dulu.` }, 400);
      }
    }

    // ── Hitung total (harga selalu dihitung di server, tidak pernah dari klien) ─
    let totalAmount = 0;
    for (const item of cartItems as any[]) {
      if (item.bundle_id && item.bundles) {
        totalAmount += item.bundles.bundle_price ?? 0;
      } else if (item.class_id && item.classes) {
        totalAmount +=
          voucherApplied && item.class_id === voucherClassId
            ? voucherDiscountPrice!
            : (item.classes.discount_price ?? item.classes.base_price ?? 0);
      } else if (item.ebook_id && item.ebooks) {
        totalAmount += item.ebooks.discount_price ?? item.ebooks.price ?? 0;
      }
    }

    if (totalAmount <= 0) {
      return json({ error: 'Total pembayaran tidak valid. Coba muat ulang keranjang.' }, 400);
    }

    // ── Nomor HP wajib (Mayar butuh `mobile`) ─────────────────────────────────
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('phone, nickname')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.phone) {
      return json({ error: 'Nomor WhatsApp belum diisi. Lengkapi dulu di halaman checkout.' }, 400);
    }

    // ── Simpan invoice lokal (status pending) ─────────────────────────────────
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        ...(voucherRowId ? { voucher_id: voucherRowId } : {}),
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // ── Baris invoice_items ───────────────────────────────────────────────────
    const itemsToInsert: any[] = [];
    const itemsForMayar: Array<{ title: string; price: number }> = [];

    for (const item of cartItems as any[]) {
      if (item.bundle_id && item.bundles) {
        const bundle = item.bundles;
        const bundleClasses = (bundle.bundle_classes ?? []).map((bc: any) => bc.classes).filter(Boolean);
        const bundlePrice: number = bundle.bundle_price ?? 0;
        const count = bundleClasses.length;
        if (count === 0) continue;

        // Harga paket dibagi rata ke tiap kelas; sisa pembulatan masuk kelas pertama.
        const per = Math.floor(bundlePrice / count);
        const remainder = bundlePrice - per * count;

        bundleClasses.forEach((cls: any, idx: number) => {
          itemsToInsert.push({
            invoice_id: invoice.id,
            class_id: cls.id,
            bundle_id: item.bundle_id,
            price: idx === 0 ? per + remainder : per,
          });
        });

        // Di Mayar cukup tampil sebagai satu baris paket, bukan pecahan kelas.
        itemsForMayar.push({ title: `Paket: ${bundle.title}`, price: bundlePrice });
      } else if (item.class_id && item.classes) {
        const price =
          voucherApplied && item.class_id === voucherClassId
            ? voucherDiscountPrice!
            : (item.classes.discount_price ?? item.classes.base_price ?? 0);

        itemsToInsert.push({ invoice_id: invoice.id, class_id: item.class_id, price });
        itemsForMayar.push({ title: item.classes.title ?? 'Kelas', price });
      } else if (item.ebook_id && item.ebooks) {
        const price = item.ebooks.discount_price ?? item.ebooks.price ?? 0;
        itemsToInsert.push({ invoice_id: invoice.id, ebook_id: item.ebook_id, price });
        itemsForMayar.push({ title: `Ebook: ${item.ebooks.title ?? ''}`, price });
      }
    }

    if (itemsToInsert.length > 0) {
      const { error: itemsError } = await supabaseAdmin.from('invoice_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;
    }

    // ── Buat tagihan di Mayar ─────────────────────────────────────────────────
    const frontendUrl = (Deno.env.get('FRONTEND_URL') ?? '').replace(/\/+$/, '');

    const mayarInvoice = await createMayarInvoice({
      name: (profile as any).nickname || user.email?.split('@')[0] || 'Pelajar Markaz Fiqih',
      email: user.email!,
      mobile: (profile as any).phone,
      description: `Markaz Fiqih — Pesanan ${invoice.id.slice(0, 8).toUpperCase()}`,
      redirectUrl: `${frontendUrl}/pembayaran/${invoice.id}`,
      expiredAt: expiresAt.toISOString(),
      items: itemsForMayar.map((i) => ({
        quantity: 1,
        rate: i.price,
        description: i.title.slice(0, 120),
      })),
      // idProd = jembatan balik dari webhook Mayar ke invoice lokal kita.
      extraData: { noCustomer: user.id, idProd: invoice.id },
    });

    await supabaseAdmin
      .from('invoices')
      .update({
        mayar_invoice_id: mayarInvoice.id,
        mayar_payment_url: mayarInvoice.link,
      })
      .eq('id', invoice.id);

    return json({
      id: invoice.id,
      paymentUrl: mayarInvoice.link,
      expiresAt: expiresAt.toISOString(),
      totalAmount,
      voucherApplied,
      reused: false,
    });
  } catch (error) {
    console.error('checkout error:', error);
    return json({ error: (error as Error).message ?? 'Checkout gagal.' }, 500);
  }
});
