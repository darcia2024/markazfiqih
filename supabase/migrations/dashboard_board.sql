-- Migration: dashboard_board
-- Jalankan manual di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS dashboard_board (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE dashboard_board ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dashboard_board: semua user login bisa baca yang aktif"
  ON dashboard_board FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true
  ));

CREATE POLICY "dashboard_board: admin bisa kelola"
  ON dashboard_board FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  );

-- Seed 1 papan default
INSERT INTO dashboard_board (title, content, is_active)
VALUES ('Selamat Datang di Kelas Markaz Fiqih', '', true);
