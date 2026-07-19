-- Migrasi RLS untuk tabel class_vouchers
-- Jalankan manual di Supabase SQL Editor
-- File ini idempoten — aman dijalankan berkali-kali

-- Aktifkan RLS (no-op jika sudah aktif)
ALTER TABLE class_vouchers ENABLE ROW LEVEL SECURITY;

-- ── Bersihkan policy lama terlebih dahulu ────────────────────────────────────
DROP POLICY IF EXISTS "class_vouchers: user bisa baca voucher aktif" ON class_vouchers;
DROP POLICY IF EXISTS "class_vouchers: admin bisa baca semua" ON class_vouchers;
DROP POLICY IF EXISTS "class_vouchers: admin bisa insert" ON class_vouchers;
DROP POLICY IF EXISTS "class_vouchers: admin bisa update" ON class_vouchers;
DROP POLICY IF EXISTS "class_vouchers: admin bisa delete" ON class_vouchers;

-- ── Policy SELECT ─────────────────────────────────────────────────────────────
-- User login biasa: hanya bisa baca voucher aktif (dipakai validateVoucher di frontend)
-- Admin: bisa baca semua (aktif maupun tidak)
CREATE POLICY "class_vouchers: user bisa baca voucher aktif"
  ON class_vouchers FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()::text
        AND user_profiles.is_admin = true
    )
  );

-- ── Policy INSERT ─────────────────────────────────────────────────────────────
CREATE POLICY "class_vouchers: admin bisa insert"
  ON class_vouchers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()::text
        AND user_profiles.is_admin = true
    )
  );

-- ── Policy UPDATE ─────────────────────────────────────────────────────────────
CREATE POLICY "class_vouchers: admin bisa update"
  ON class_vouchers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()::text
        AND user_profiles.is_admin = true
    )
  );

-- ── Policy DELETE ─────────────────────────────────────────────────────────────
CREATE POLICY "class_vouchers: admin bisa delete"
  ON class_vouchers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()::text
        AND user_profiles.is_admin = true
    )
  );
