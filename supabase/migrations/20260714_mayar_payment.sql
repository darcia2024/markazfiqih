-- ═══════════════════════════════════════════════════════════════════════════
-- Integrasi pembayaran Mayar — jalankan SEKALI di Supabase SQL Editor
-- (atau: supabase db push)
--
-- Aman diulang: semua pakai IF NOT EXISTS / OR REPLACE.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Kolom tambahan di invoices ──────────────────────────────────────────
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS mayar_invoice_id  TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS mayar_payment_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS expires_at        TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS voucher_id        UUID
  REFERENCES class_vouchers(id) ON DELETE SET NULL;

-- Satu invoice Mayar = satu invoice lokal. Kalau webhook datang dua kali
-- dengan id yang sama, tidak mungkin nyasar ke baris lain.
CREATE UNIQUE INDEX IF NOT EXISTS invoices_mayar_invoice_id_key
  ON invoices (mayar_invoice_id)
  WHERE mayar_invoice_id IS NOT NULL;

-- Dipakai fungsi checkout untuk mencari invoice pending yang masih hidup.
CREATE INDEX IF NOT EXISTS invoices_user_pending_idx
  ON invoices (user_id, status, created_at DESC);

-- ── 2. Naikkan pemakaian voucher secara atomik ─────────────────────────────
-- Dipanggil dari edge function lewat rpc('increment_voucher_usage').
-- Wajib atomik: dua pembayaran barengan tidak boleh menembus max_uses.
CREATE OR REPLACE FUNCTION increment_voucher_usage(voucher_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE class_vouchers
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE id = voucher_id;
$$;

REVOKE ALL ON FUNCTION increment_voucher_usage(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_voucher_usage(UUID) TO service_role;

-- ── 3. RLS: user hanya boleh MEMBACA invoice miliknya ──────────────────────
-- Tidak ada policy INSERT/UPDATE/DELETE untuk user biasa. Invoice hanya boleh
-- dibuat dan diubah oleh edge function (service_role, yang melewati RLS).
-- Tanpa ini, user bisa meng-update status invoice-nya sendiri jadi 'paid'.
ALTER TABLE invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select_own" ON invoices;
CREATE POLICY "invoices_select_own" ON invoices
  FOR SELECT TO authenticated
  USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "invoice_items_select_own" ON invoice_items;
CREATE POLICY "invoice_items_select_own" ON invoice_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.user_id::text = auth.uid()::text
    )
  );
