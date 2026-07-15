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

    // ── DEBUG: titik (a) — isi keranjang MENTAH tepat sebelum invoice dibuat ──
    // Log ini dipakai untuk investigasi bug "invoice hanya menghitung 1 item".
    // Aman untuk production: tidak berisi data sensitif, hanya id/jumlah.

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

    console.log(
      `[checkout] user=${user.id} cart_items dari DB: count=${cartItems?.length ?? 0}`,
      JSON.stringify((cartItems ?? []).map((i: any) => ({ id: i.id, class_id: i.class_id, bundle_id: i.bundle_id, ebook_id: i.ebook_id }))),
    );

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

    console.log(`[checkout] user=${user.id} totalAmount dihitung dari cart saat ini: ${totalAmount}`);

    // ── Invoice pending yang masih hidup: pakai ulang HANYA kalau keranjang ───
    // belum berubah sejak invoice itu dibuat.
    //
    // BUG YANG DIPERBAIKI: sebelumnya invoice pending langsung dipakai ulang
    // begitu ada (asal belum expired), tanpa mengecek apakah isi keranjang
    // berubah sejak invoice itu dibuat. Skenario nyata yang ditemukan di data:
    // user checkout dengan 1 kelas → dapat invoice+link Mayar (1 item) →
    // balik ke keranjang, tambah kelas ke-2 → klik "Bayar" lagi → kode lama
    // langsung mengembalikan invoice/link LAMA yang cuma 1 item, padahal
    // ringkasan di halaman checkout sudah menampilkan 2 item & total yang benar
    // (karena ringkasan itu baca live dari CartContext, bukan dari invoice).
    // Itu sebabnya total di invoice Mayar terasa "nyangkut" di kelas pertama.
    //
    // Fix: bandingkan fingerprint ISI (tipe:id:harga per item, di-sort) DAN
    // total_amount dari invoice pending dengan fingerprint+total yang dibentuk
    // dari keranjang saat ini. Hanya total saja tidak cukup — keranjang bisa
    // berubah (tukar kelas A dengan kelas B yang harganya kebetulan sama) tanpa
    // mengubah total, dan reuse-by-total-saja akan salah mengirim invoice_items
    // lama (user bayar tapi dapat kelas yang salah). Reuse hanya jika fingerprint
    // DAN total identik. Kalau beda → invoice itu basi (stale), JANGAN dipakai
    // ulang: set expires_at-nya ke masa lalu supaya tidak terpilih lagi, lalu
    // lanjut buat invoice baru yang mencakup SEMUA item di keranjang saat ini.
    const buildFingerprint = (rows: Array<{ class_id: string | null; bundle_id: string | null; ebook_id: string | null; price: number }>) =>
      rows
        .map((r) => `${r.bundle_id ? 'bundle' : r.ebook_id ? 'ebook' : 'class'}:${r.bundle_id ?? r.ebook_id ?? r.class_id}:${r.price}`)
        .sort()
        .join('|');

    // Fingerprint keranjang saat ini, dengan harga per-baris yang sama seperti
    // yang nanti dipakai untuk invoice_items (lihat pembentukan itemsToInsert
    // di bawah): kelas satuan pakai harga kelas (voucher-aware), bundle pakai
    // satu baris per bundle_id dengan harga bundle_price, ebook pakai harga ebook.
    const currentFingerprintRows: Array<{ class_id: string | null; bundle_id: string | null; ebook_id: string | null; price: number }> = [];
    for (const item of cartItems as any[]) {
      if (item.bundle_id && item.bundles) {
        currentFingerprintRows.push({ class_id: null, bundle_id: item.bundle_id, ebook_id: null, price: item.bundles.bundle_price ?? 0 });
      } else if (item.class_id && item.classes) {
        const price =
          voucherApplied && item.class_id === voucherClassId
            ? voucherDiscountPrice!
            : (item.classes.discount_price ?? item.classes.base_price ?? 0);
        currentFingerprintRows.push({ class_id: item.class_id, bundle_id: null, ebook_id: null, price });
      } else if (item.ebook_id && item.ebooks) {
        currentFingerprintRows.push({ class_id: null, bundle_id: null, ebook_id: item.ebook_id, price: item.ebooks.discount_price ?? item.ebooks.price ?? 0 });
      }
    }
    const currentFingerprint = buildFingerprint(currentFingerprintRows);

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
      const { data: reusableItems } = await supabaseAdmin
        .from('invoice_items')
        .select('class_id, bundle_id, ebook_id, price')
        .eq('invoice_id', reusable.id);

      // invoice_items menyimpan bundle sebagai satu baris per kelas anggota
      // (lihat itemsToInsert di bawah), sedangkan fingerprint keranjang di atas
      // punya satu baris per bundle_id. Kelompokkan dulu baris bundle di
      // invoice_items jadi satu baris per bundle_id (harga dijumlahkan) supaya
      // kedua fingerprint bisa dibandingkan dengan bentuk yang sama.
      const bundleTotals = new Map<string, number>();
      const nonBundleRows: Array<{ class_id: string | null; bundle_id: string | null; ebook_id: string | null; price: number }> = [];
      for (const r of (reusableItems ?? []) as any[]) {
        if (r.bundle_id) {
          bundleTotals.set(r.bundle_id, (bundleTotals.get(r.bundle_id) ?? 0) + (r.price ?? 0));
        } else {
          nonBundleRows.push({ class_id: r.class_id, bundle_id: null, ebook_id: r.ebook_id, price: r.price ?? 0 });
        }
      }
      for (const [bundleId, price] of bundleTotals) {
        nonBundleRows.push({ class_id: null, bundle_id: bundleId, ebook_id: null, price });
      }
      const reusableFingerprint = buildFingerprint(nonBundleRows);

      const totalMatches = reusable.total_amount === totalAmount;
      const fingerprintMatches = reusableFingerprint === currentFingerprint;
      const stillMatches = totalMatches && fingerprintMatches;

      console.log(
        `[checkout] user=${user.id} invoice pending ditemukan id=${reusable.id} total_amount=${reusable.total_amount} vs totalAmount_sekarang=${totalAmount} (match=${totalMatches}); fingerprint lama="${reusableFingerprint}" vs sekarang="${currentFingerprint}" (match=${fingerprintMatches}) → ${stillMatches ? 'REUSE' : 'STALE, invoice baru dibuat'}`,
      );

      if (stillMatches) {
        return json({
          id: reusable.id,
          paymentUrl: reusable.mayar_payment_url,
          expiresAt: reusable.expires_at,
          totalAmount: reusable.total_amount,
          reused: true,
        });
      }

      // Invoice basi: jangan biarkan bisa dipakai ulang lagi, dan jangan biarkan
      // link Mayar lamanya membingungkan (link tetap ada di Mayar, tapi secara
      // lokal invoice ini tidak akan pernah dianggap "reusable" lagi).
      await supabaseAdmin
        .from('invoices')
        .update({ expires_at: new Date(0).toISOString() })
        .eq('id', reusable.id);
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

    console.log(
      `[checkout] user=${user.id} invoice=${invoice.id} itemsForMayar (count=${itemsForMayar.length}):`,
      JSON.stringify(itemsForMayar),
    );

    // ── Validasi anomali: total dari itemsForMayar HARUS sama dengan totalAmount
    // yang sudah dihitung server dari keranjang. Kalau beda, jangan lanjut kirim
    // ke Mayar — ada bug di logic pembentukan itemsForMayar yang harus diketahui
    // segera, bukan baru ketahuan manual dari komplain user.
    const itemsForMayarSum = itemsForMayar.reduce((sum, i) => sum + i.price, 0);
    if (itemsForMayarSum !== totalAmount) {
      console.error(
        `[checkout] ANOMALI: user=${user.id} invoice=${invoice.id} sum(itemsForMayar)=${itemsForMayarSum} != totalAmount=${totalAmount}. itemsForMayar=${JSON.stringify(itemsForMayar)} cartItems=${JSON.stringify((cartItems as any[]).map((i) => ({ id: i.id, class_id: i.class_id, bundle_id: i.bundle_id, ebook_id: i.ebook_id })))}`,
      );
      // Batalkan invoice lokal yang baru dibuat supaya tidak menggantung sebagai 'pending' basi.
      await supabaseAdmin.from('invoices').update({ expires_at: new Date(0).toISOString() }).eq('id', invoice.id);
      return json(
        { error: 'Terjadi kesalahan saat menghitung total pembayaran. Coba muat ulang halaman dan ulangi.' },
        500,
      );
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
