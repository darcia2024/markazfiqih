-- Prompt 91: Tabel pesan salam Dashboard yang bisa dikelola admin.
-- Jalankan manual di Supabase SQL Editor.

CREATE TABLE dashboard_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE dashboard_messages ENABLE ROW LEVEL SECURITY;

-- Semua user login bisa membaca pesan yang aktif (ditampilkan di Dashboard)
CREATE POLICY "dashboard_messages: publik baca yang aktif"
  ON dashboard_messages FOR SELECT
  USING (is_active = true);

-- Hanya admin yang bisa insert/update/delete
CREATE POLICY "dashboard_messages: admin kelola"
  ON dashboard_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()::text
      AND user_profiles.is_admin = true
    )
  );

-- Data awal: pesan yang sebelumnya hardcode di DashboardPage.tsx
INSERT INTO dashboard_messages (message) VALUES
  ('Lanjutkan perjalanan menuntut ilmumu.'),
  ('Konsistensi kecil hari ini, hasil besar nanti.'),
  ('Semoga ilmu yang dipelajari hari ini berkah.'),
  ('Satu pelajaran hari ini lebih baik dari tidak sama sekali.');
