-- Prompt 119: Fitur Jual Ebook — Bagian 1 (Database, Checkout, Admin)
-- Jalankan di Supabase SQL Editor SEBELUM lanjut ke bagian lain manapun.

-- Tabel produk ebook
CREATE TABLE IF NOT EXISTS ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author TEXT,
  cover_image TEXT,
  price INTEGER NOT NULL,
  discount_price INTEGER,
  gdrive_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;

-- PENTING (perbaikan setelah code review): RLS di Postgres adalah row-level,
-- BUKAN column-level. Kalau tabel `ebooks` dibuka SELECT untuk publik (siapa
-- saja yang login) pada baris published, maka gdrive_url di baris itu tetap
-- bisa diambil langsung lewat query eksplisit dari client mana pun — sama
-- sekali tidak aman untuk mengandalkan "frontend hanya select kolom tertentu".
--
-- Solusi: SELECT langsung ke tabel `ebooks` HANYA untuk admin. Publik/pembeli
-- membaca lewat VIEW `ebooks_catalog` (tanpa kolom gdrive_url), dan link
-- download hanya bisa didapat lewat function `get_ebook_download_url()` yang
-- SECURITY DEFINER dan memvalidasi kepemilikan di sisi database.
CREATE POLICY "ebooks: admin bisa baca semua (termasuk gdrive_url)"
  ON ebooks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true)
  );

CREATE POLICY "ebooks: admin bisa insert"
  ON ebooks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true));

CREATE POLICY "ebooks: admin bisa update"
  ON ebooks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true));

CREATE POLICY "ebooks: admin bisa delete"
  ON ebooks FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid()::text AND user_profiles.is_admin = true));

-- View katalog publik: TIDAK ADA kolom gdrive_url sama sekali, jadi
-- walaupun client mencoba SELECT *, gdrive_url tidak mungkin ikut terbawa.
CREATE OR REPLACE VIEW ebooks_catalog AS
SELECT id, title, description, author, cover_image, price, discount_price, display_order
FROM ebooks
WHERE status = 'published';

GRANT SELECT ON ebooks_catalog TO anon, authenticated;

-- Function untuk ambil link download — HANYA berhasil kalau pemanggil
-- (auth.uid()) benar-benar sudah beli ebook tersebut. SECURITY DEFINER
-- supaya function ini boleh baca kolom gdrive_url walau pemanggilnya
-- (anon/authenticated role) tidak punya akses SELECT langsung ke `ebooks`.
CREATE OR REPLACE FUNCTION get_ebook_download_url(p_ebook_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  v_url TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Harus login.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM ebook_purchases
    WHERE user_id = auth.uid()::text AND ebook_id = p_ebook_id
  ) THEN
    RAISE EXCEPTION 'Kamu belum membeli ebook ini.';
  END IF;

  SELECT gdrive_url INTO v_url FROM ebooks WHERE id = p_ebook_id;
  RETURN v_url;
END;
$;

GRANT EXECUTE ON FUNCTION get_ebook_download_url(UUID) TO authenticated;

-- Tabel kepemilikan ebook (mirip enrollments untuk kelas)
CREATE TABLE IF NOT EXISTS ebook_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  ebook_id UUID NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ebook_id)
);

ALTER TABLE ebook_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ebook_purchases: user lihat milik sendiri"
  ON ebook_purchases FOR SELECT
  USING (auth.uid()::text = user_id);

-- Tambah kolom ebook_id ke cart_items & invoice_items (mengikuti pola
-- class_id/bundle_id yang sudah ada)
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE;

-- PENTING: invoice_items.class_id awalnya NOT NULL (dulu setiap invoice_item
-- pasti untuk 1 kelas, termasuk bundle yang di-split per kelas). Ebook TIDAK
-- di-split per kelas, jadi class_id harus boleh NULL untuk baris ebook.
ALTER TABLE invoice_items ALTER COLUMN class_id DROP NOT NULL;
ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS invoice_items_one_item_type_check;
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_one_item_type_check
  CHECK (
    (class_id IS NOT NULL AND ebook_id IS NULL) OR
    (class_id IS NULL AND ebook_id IS NOT NULL)
  );

-- Update constraint cart_items: sekarang harus TEPAT SATU dari
-- class_id / bundle_id / ebook_id yang terisi (drop constraint lama,
-- buat yang baru)
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_class_or_bundle_check;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_one_item_type_check
  CHECK (
    (class_id IS NOT NULL AND bundle_id IS NULL AND ebook_id IS NULL) OR
    (class_id IS NULL AND bundle_id IS NOT NULL AND ebook_id IS NULL) OR
    (class_id IS NULL AND bundle_id IS NULL AND ebook_id IS NOT NULL)
  );
