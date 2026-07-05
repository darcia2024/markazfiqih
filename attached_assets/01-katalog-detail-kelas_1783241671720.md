# Katalog & Detail Kelas

Menjelajah, mencari, dan melihat detail lengkap kelas fiqih sebelum memutuskan membeli.

## Spesifikasi

### Tujuan
Memungkinkan pengguna menjelajah, mencari, dan melihat detail lengkap kelas fiqih sebelum memutuskan membeli.

### Selesai bila
- Pengguna dapat melihat daftar semua kelas yang dipublikasikan dengan informasi harga dan diskon.
- Pengguna dapat mencari kelas berdasarkan judul atau topik fiqih.
- Pengguna dapat melihat halaman detail kelas yang menampilkan deskripsi, daftar modul, harga asli, dan harga diskon (jika ada).
- Hanya kelas dengan status "Published" yang muncul di katalog dan detail.
- Harga diskon ditampilkan dengan coretan (strikethrough) pada harga asli.

## Sub-fitur: Daftar Kelas Tersedia

Melihat semua kelas yang ditawarkan dalam bentuk grid atau daftar dengan informasi harga dan diskon.

### Tujuan
Menampilkan semua kelas yang dipublikasikan dalam bentuk grid atau daftar dengan informasi harga dan diskon.

### Selesai bila
- Pengguna melihat daftar kelas dalam bentuk grid (desktop) atau daftar (mobile).
- Setiap item kelas menampilkan judul, gambar cover, harga asli, dan harga diskon (jika ada).
- Harga asli dicoret dan harga diskon tampil lebih menonjol saat ada promo.
- Hanya kelas dengan status "Published" yang muncul.

## Sub-fitur: Halaman Detail Kelas

Melihat deskripsi kelas, daftar modul, kurikulum, harga asli, dan harga diskon yang dicoret.

### Tujuan
Menampilkan informasi lengkap tentang satu kelas, termasuk deskripsi, daftar modul, harga asli, dan harga diskon.

### Selesai bila
- Halaman menampilkan judul kelas, gambar cover, deskripsi, dan nama pengajar.
- Harga asli dan harga diskon (jika ada) ditampilkan jelas, dengan harga asli dicoret.
- Daftar modul ditampilkan lengkap dengan judul modul dan jumlah Dars di dalamnya (atau rincian).
- Terdapat tombol "Beli Kelas" yang berfungsi memulai proses pembelian.

## Sub-fitur: Pencarian Kelas

Mencari kelas berdasarkan judul atau topik fiqih tertentu.

### Tujuan
Memungkinkan pengguna mencari kelas berdasarkan judul atau topik fiqih.

### Selesai bila
- Terdapat kotak pencarian di halaman katalog.
- Pengguna dapat mengetik kata kunci dan hasil pencarian muncul (real-time atau setelah menekan Enter).
- Hasil pencarian menampilkan daftar kelas yang judulnya mengandung kata kunci.
- Jika tidak ada hasil, muncul pesan "Kelas tidak ditemukan".
- Pencarian hanya mencari di kelas yang dipublikasikan.

## Task

### 1. Buat halaman katalog kelas dengan data tiruan

### 2. Implementasikan fitur pencarian kelas di katalog

### 3. Buat halaman detail kelas dengan data tiruan

### 4. Hubungkan navigasi katalog ke halaman detail

### 5. Buat migrasi tabel kelas, modul, dan dars

### 6. Buat API endpoint daftar kelas dengan pencarian

### 7. Buat API endpoint detail kelas beserta modul
