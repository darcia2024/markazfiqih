-- Jalankan manual di Supabase SQL Editor.
-- Prompt 89 - Bagian A1: Menambahkan kolom display_order pada tabel classes
-- supaya admin bisa mengatur urutan tampil kelas secara manual.

ALTER TABLE classes ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Set nilai awal berdasarkan urutan created_at yang sudah ada, per kategori,
-- supaya urutan yang terlihat sekarang tidak berubah drastis sebelum admin
-- mengatur ulang secara manual:
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category ORDER BY created_at) AS rn
  FROM classes
)
UPDATE classes
SET display_order = ordered.rn
FROM ordered
WHERE classes.id = ordered.id;
