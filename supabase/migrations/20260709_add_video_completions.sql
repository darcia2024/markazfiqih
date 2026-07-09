CREATE TABLE IF NOT EXISTS video_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  video_index INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, class_id, video_index)
);

ALTER TABLE video_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_completions: user lihat milik sendiri"
  ON video_completions FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "video_completions: user insert milik sendiri"
  ON video_completions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "video_completions: user update milik sendiri"
  ON video_completions FOR UPDATE
  USING (auth.uid()::text = user_id);
