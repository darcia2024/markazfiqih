// ─────────────────────────────────────────────────────────────────────────────
// Fulfillment: satu-satunya tempat invoice berubah jadi 'paid' dan akses dibuka.
//
// Dipanggil dari:
//   - mayar-webhook   (saat Mayar kirim event payment.received)
//   - payment-status  (jaring pengaman kalau webhook telat/gagal)
//   - simulate-success (khusus development)
//
// Aman dipanggil berkali-kali (idempoten): transisi pending → paid dilakukan
// secara atomik, jadi enrollment & voucher tidak pernah dobel.
//
// PENTING (perbaikan): kalau pembukaan akses GAGAL setelah status terlanjur
// jadi 'paid' (mis. error constraint di enrollments), status dikembalikan ke
// 'pending' sebelum error dilempar. Tanpa ini, invoice "nyangkut" sebagai
// paid-tanpa-akses selamanya, karena pemanggilan berikutnya langsung berhenti
// di cek `status === 'paid'` dan tidak pernah mencoba enrollment lagi.
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any;

export type FulfillResult = {
  status: 'paid';
  alreadyPaid: boolean;
};

export async function fulfillInvoice(
  admin: SupabaseAdmin,
  invoiceId: string,
): Promise<FulfillResult> {
  const { data: invoice, error } = await admin
    .from('invoices')
    .select('id, user_id, status, voucher_id, total_amount, invoice_items(class_id, ebook_id)')
    .eq('id', invoiceId)
    .single();

  if (error || !invoice) throw new Error('Invoice tidak ditemukan.');

  if (invoice.status === 'paid') {
    return { status: 'paid', alreadyPaid: true };
  }

  // Transisi atomik: berhasil kalau status masih 'pending' ATAU 'failed'
  // (invoice bisa sudah ditandai gagal/kedaluwarsa lokal, tapi user tetap
  // membayar QRIS/invoice Mayar-nya — uang tetap masuk, akses tetap harus dibuka).
  // Dua request bersamaan → hanya satu yang dapat updatedCount > 0.
  const { data: updatedRows } = await admin
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .in('status', ['pending', 'failed'])
    .select('id');
  const updatedCount = updatedRows?.length ?? 0;

  if (!updatedCount) {
    return { status: 'paid', alreadyPaid: true };
  }

  try {
    // ── Voucher: naikkan used_count tepat sekali, hanya di transisi ini ──────
    if (invoice.voucher_id) {
      const { error: rpcError } = await admin.rpc('increment_voucher_usage', {
        voucher_id: invoice.voucher_id,
      });
      if (rpcError) {
        // Jangan gagalkan fulfillment — akses kelas jauh lebih kritis daripada
        // hitungan pemakaian voucher. Cukup catat di log.
        console.error('increment_voucher_usage gagal:', rpcError.message);
      }
    }

    const items = (invoice.invoice_items ?? []) as Array<{ class_id: string | null; ebook_id: string | null }>;

    // ── Enrollment kelas ────────────────────────────────────────────────────
    const classRows = items
      .filter((i) => i.class_id)
      .map((i) => ({ user_id: invoice.user_id, class_id: i.class_id }));

    if (classRows.length > 0) {
      const { error: enrollError } = await admin
        .from('enrollments')
        .upsert(classRows, { onConflict: 'user_id,class_id', ignoreDuplicates: true });
      if (enrollError) throw enrollError;
    }

    // ── Pembelian ebook ─────────────────────────────────────────────────────
    const ebookRows = items
      .filter((i) => i.ebook_id)
      .map((i) => ({ user_id: invoice.user_id, ebook_id: i.ebook_id }));

    if (ebookRows.length > 0) {
      const { error: ebookError } = await admin
        .from('ebook_purchases')
        .upsert(ebookRows, { onConflict: 'user_id,ebook_id', ignoreDuplicates: true });
      if (ebookError) throw ebookError;
    }

    // ── Kosongkan keranjang ─────────────────────────────────────────────────
    await admin.from('cart_items').delete().eq('user_id', invoice.user_id);

    return { status: 'paid', alreadyPaid: false };
  } catch (grantError) {
    // Kembalikan status supaya webhook retry / polling payment-status bisa
    // mencoba fulfillment lagi. Kalau revert-nya sendiri gagal, tetap lempar
    // error asli — log di pemanggil yang akan memperlihatkannya.
    console.error(
      `fulfillInvoice: pembukaan akses gagal untuk invoice ${invoiceId}, status dikembalikan ke pending. Error:`,
      grantError,
    );
    await admin
      .from('invoices')
      .update({ status: 'pending', paid_at: null })
      .eq('id', invoiceId)
      .eq('status', 'paid');
    throw grantError;
  }
}
