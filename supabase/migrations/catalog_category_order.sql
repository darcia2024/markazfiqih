-- Prompt 109: Tambah kolom urutan section kategori di halaman Katalog
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS catalog_category_order TEXT
  NOT NULL DEFAULT '["Fiqih Tematik","Fiqih Kitab","Akademi"]';
