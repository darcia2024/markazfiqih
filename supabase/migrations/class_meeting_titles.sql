-- Prompt 127: Judul/Deskripsi per Pertemuan untuk kelas video playlist
CREATE TABLE IF NOT EXISTS class_meeting_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  video_index INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  UNIQUE (class_id, video_index)
);

ALTER TABLE class_meeting_titles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_meeting_titles: publik bisa baca" ON class_meeting_titles;
CREATE POLICY "class_meeting_titles: publik bisa baca"
  ON class_meeting_titles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "class_meeting_titles: admin bisa kelola" ON class_meeting_titles;
CREATE POLICY "class_meeting_titles: admin bisa kelola"
  ON class_meeting_titles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  );
