-- Prompt 102: Sistem Review & Rating per Kelas
-- Jalankan di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS class_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, user_id)
);

ALTER TABLE class_reviews ENABLE ROW LEVEL SECURITY;

-- Semua orang (termasuk yang belum login) boleh baca review
CREATE POLICY "class_reviews: publik bisa baca"
  ON class_reviews FOR SELECT
  USING (true);

-- Hanya pelajar yang punya enrollment aktif yang boleh insert
CREATE POLICY "class_reviews: hanya yang enroll bisa insert"
  ON class_reviews FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id
    AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.class_id = class_reviews.class_id
      AND e.user_id = auth.uid()::text
    )
  );

-- User cuma boleh edit review miliknya sendiri
CREATE POLICY "class_reviews: user edit review sendiri"
  ON class_reviews FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "class_reviews: user hapus review sendiri"
  ON class_reviews FOR DELETE
  USING (auth.uid()::text = user_id);
