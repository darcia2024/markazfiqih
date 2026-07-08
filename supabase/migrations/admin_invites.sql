-- Jalankan manual di Supabase SQL Editor.
-- Membuat tabel admin_invites untuk fitur "Undang Admin Baru via Email".

CREATE TABLE admin_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  invited_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  redeemed_by TEXT
);

ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_invites: admin bisa baca semua"
  ON admin_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()::text
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "admin_invites: admin bisa insert"
  ON admin_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()::text
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "admin_invites: admin bisa delete"
  ON admin_invites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()::text
      AND user_profiles.is_admin = true
    )
  );
