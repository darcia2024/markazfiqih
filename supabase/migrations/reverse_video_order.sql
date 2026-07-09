-- Prompt 111: Toggle "Balik Urutan Video" per kelas
-- Jalankan manual di Supabase Dashboard → SQL Editor
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS reverse_video_order BOOLEAN NOT NULL DEFAULT false;
