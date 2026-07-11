-- Migration: certificate_requests
-- Jalankan manual di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS certificate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  score TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, class_id)
);

ALTER TABLE certificate_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificate_requests: publik bisa baca (untuk verifikasi)"
  ON certificate_requests FOR SELECT
  USING (true);

CREATE POLICY "certificate_requests: hanya yang enroll bisa insert milik sendiri"
  ON certificate_requests FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id
    AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.class_id = certificate_requests.class_id
      AND e.user_id = auth.uid()::text
    )
  );

CREATE POLICY "certificate_requests: admin bisa kelola semua"
  ON certificate_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  );
