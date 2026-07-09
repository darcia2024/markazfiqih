-- Prompt 103: Tambah kolom Soal Latihan & Ebook ke tabel classes
-- Jalankan SATU KALI di Supabase SQL Editor

ALTER TABLE classes ADD COLUMN IF NOT EXISTS soal_latihan_url TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS ebook_url TEXT;
