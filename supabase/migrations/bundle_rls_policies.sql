-- Prompt 115: RLS Policy Admin untuk tabel bundles & bundle_classes
-- Cek dulu policy yang sudah ada sebelum menjalankan:
--
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE tablename IN ('bundles', 'bundle_classes');
--
-- Jalankan hanya policy yang BELUM ada (sesuaikan jika sebagian sudah ada):

CREATE POLICY "bundles: admin bisa insert"
  ON bundles FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  );

CREATE POLICY "bundles: admin bisa update"
  ON bundles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  );

CREATE POLICY "bundles: admin bisa delete"
  ON bundles FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  );

CREATE POLICY "bundles: admin bisa baca semua"
  ON bundles FOR SELECT
  USING (
    status = 'published'
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  );

-- SELECT publik untuk bundle_classes — dibutuhkan agar listBundles() (public) bisa
-- join bundle_classes dan menampilkan daftar kelas di tiap bundle.
-- Cek dulu apakah policy ini sudah ada sebelum dijalankan (lihat query pg_policies di atas).
CREATE POLICY "bundle_classes: siapa saja bisa baca"
  ON bundle_classes FOR SELECT
  USING (true);

CREATE POLICY "bundle_classes: admin bisa kelola"
  ON bundle_classes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  );
