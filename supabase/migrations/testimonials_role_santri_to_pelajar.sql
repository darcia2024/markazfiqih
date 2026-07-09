-- Ganti label "Santri Markaz Fiqih" → "Pelajar Markaz Fiqih" di semua testimoni
UPDATE testimonials
SET role = 'Pelajar Markaz Fiqih'
WHERE role = 'Santri Markaz Fiqih';
