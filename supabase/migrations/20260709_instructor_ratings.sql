-- Prompt 118: Rating Pengajar (terpisah dari Review & Rating kelas)
-- Jalankan di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS instructor_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, instructor_id, class_id)
);

ALTER TABLE instructor_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instructor_ratings: publik bisa baca"
  ON instructor_ratings FOR SELECT
  USING (true);

-- Hanya yang enroll di kelas itu boleh kasih rating pengajarnya
CREATE POLICY "instructor_ratings: hanya yang enroll bisa insert"
  ON instructor_ratings FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id
    AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.class_id = instructor_ratings.class_id
      AND e.user_id = auth.uid()::text
    )
  );

CREATE POLICY "instructor_ratings: user edit rating sendiri"
  ON instructor_ratings FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
