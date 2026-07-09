-- Cek dulu policy SELECT yang sudah ada, supaya tidak konflik nama
SELECT policyname FROM pg_policies WHERE tablename = 'class_vouchers';

-- Jika ada policy SELECT lama (biasanya bernama seperti "Enable read access for all users"
-- atau sejenisnya), drop dulu sebelum buat yang baru:
-- DROP POLICY IF EXISTS "nama_policy_lama" ON class_vouchers;

-- Policy SELECT baru: publik bisa baca voucher aktif, admin bisa baca semua
CREATE POLICY "class_vouchers: admin bisa baca semua"
  ON class_vouchers FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()::text
      AND user_profiles.is_admin = true
    )
  );

-- Policy INSERT: hanya admin
CREATE POLICY "class_vouchers: admin bisa insert"
  ON class_vouchers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()::text
      AND user_profiles.is_admin = true
    )
  );

-- Policy UPDATE: hanya admin
CREATE POLICY "class_vouchers: admin bisa update"
  ON class_vouchers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()::text
      AND user_profiles.is_admin = true
    )
  );

-- Policy DELETE: hanya admin
CREATE POLICY "class_vouchers: admin bisa delete"
  ON class_vouchers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()::text
      AND user_profiles.is_admin = true
    )
  );
