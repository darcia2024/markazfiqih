-- Jalankan manual di Supabase SQL Editor.
-- Prompt 89 - Bagian B: Sembunyikan kelas Fiqih Kitab selain Safinatunnaja
-- (sementara) + update harga Safinatunnaja.

-- ── B1. Jalankan dulu untuk melihat kelas Fiqih Kitab yang ada saat ini ──
SELECT id, title, status, base_price, discount_price
FROM classes
WHERE category = 'Fiqih Kitab'
ORDER BY title;

-- ── B2. Sembunyikan (jadikan draft) semua kelas Fiqih Kitab selain Safinatunnaja ──
-- Jalankan setelah cek hasil B1 di atas. Menggunakan status='draft' (bukan hapus),
-- supaya data tetap ada dan bisa dipublish ulang kapan saja lewat Admin Panel.
UPDATE classes
SET status = 'draft'
WHERE category = 'Fiqih Kitab' AND title != 'Safinatunnaja';

-- ── B3. Update harga kelas Safinatunnaja dari 180.000 menjadi 129.000 ──
UPDATE classes SET base_price = 129000 WHERE title = 'Safinatunnaja';

-- ── Cek voucher terkait Safinatunnaja yang mungkin perlu ditinjau ulang ──
-- (misalnya voucher dengan discount_price masih mengacu ke harga lama 180.000)
SELECT v.id, v.code, v.discount_price, v.is_active, v.max_uses, v.used_count
FROM class_vouchers v
JOIN classes c ON c.id = v.class_id
WHERE c.title = 'Safinatunnaja';
