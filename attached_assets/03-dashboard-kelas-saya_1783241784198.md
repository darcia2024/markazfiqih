# Dashboard Kelas Saya

Melihat semua kelas yang sudah dibeli dan memantau progress belajar masing-masing kelas.

## Spesifikasi

### Tujuan
Menyediakan halaman pusat bagi pengguna untuk melihat seluruh kelas yang sudah dibeli dan memantau progres belajar mereka, sehingga memudahkan melanjutkan studi.

### Selesai bila
- Pengguna melihat judul 'Kelas Saya' dan daftar semua kelas yang telah mereka beli.
- Setiap kartu kelas menampilkan judul kelas, persentase penyelesaian, dan tombol untuk melanjutkan belajar.
- Hanya pengguna yang sudah login yang dapat mengakses halaman ini; jika belum login, mereka dialihkan ke proses login Google.
- Jika pengguna belum memiliki kelas sama sekali, akan muncul ilustrasi dan teks yang mengajak untuk menjelajahi katalog kelas.
- Halaman dapat diakses melalui navigasi utama atau URL langsung.

## Sub-fitur: Daftar Kelas Dimiliki

Menampilkan semua kelas yang sudah berhasil dibeli oleh user.

### Tujuan
Menampilkan semua kelas yang telah berhasil dibeli oleh pengguna dalam bentuk grid atau daftar yang rapi.

### Selesai bila
- Semua kelas dengan status Enrollment aktif untuk pengguna yang sedang login ditampilkan sebagai kartu kelas.
- Setiap kartu kelas menampilkan gambar sampul kelas, judul kelas, dan informasi singkat lainnya.
- Jika tidak ada kelas yang dimiliki, ditampilkan pesan 'Kamu belum memiliki kelas' dan tombol 'Jelajahi Katalog' yang mengarah ke halaman katalog.

## Sub-fitur: Pelacak Progress Kelas

Melihat indikator persentase penyelesaian untuk setiap kelas yang sudah dibeli.

### Tujuan
Menampilkan indikator kemajuan belajar untuk setiap kelas agar pengguna tahu sejauh mana mereka telah menyelesaikan materi.

### Selesai bila
- Setiap kartu kelas menampilkan teks 'X% Selesai', di mana X adalah persentase yang dihitung dari (jumlah Dars selesai / total Dars kelas) * 100%.
- Terdapat bar progres visual di setiap kartu kelas yang terisi sesuai dengan persentase penyelesaian.
- Persentase dan bar progres ikut diperbarui saat seorang pengguna kembali ke halaman ini setelah menyelesaikan Dars.

## Sub-fitur: Lanjutkan Belajar

Tombol cepat untuk langsung masuk ke dars terakhir yang belum selesai dalam suatu kelas.

### Tujuan
Menyediakan cara tercepat bagi pengguna untuk melanjutkan pelajaran dari titik terakhir yang mereka tinggalkan di suatu kelas.

### Selesai bila
- Setiap kartu kelas memiliki tombol 'Lanjutkan Belajar' yang akan langsung mengarahkan pengguna ke halaman pemutar video.
- Halaman pemutar video akan otomatis fokus ke Dars pertama yang belum ditandai 'Selesai' dalam kelas itu.
- Jika semua Dars dalam kelas sudah selesai, tombol berubah menjadi 'Lihat Kelas' atau teks 'Tuntas', yang akan mengarahkan ke daftar modul di halaman kelas.

## Task

### 1. Buat halaman Dashboard Kelas Saya dengan data tiruan

### 2. Buat komponen KelasCard dengan informasi kelas

### 3. Tambahkan progress bar dan teks persentase ke KelasCard

### 4. Implementasikan tampilan saat belum memiliki kelas

### 5. Implementasikan tombol Lanjutkan Belajar dengan variasi status

### 6. Pasang guard autentikasi pada halaman Dashboard

### 7. Buat model dan migrasi Enrollment

### 8. Buat endpoint GET /api/my-courses

### 9. Implementasi perhitungan progress kelas dan penentuan Dars berikutnya

### 10. Tambahkan middleware otentikasi pada endpoint my-courses
