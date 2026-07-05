# Panel Admin Sederhana

Mengelola konten kelas dan menangani pesanan yang status pembayarannya bermasalah.

## Spesifikasi

### Tujuan
Menyediakan pusat kendali bagi admin untuk mengelola konten kelas fiqih dan menyelesaikan kendala pesanan yang gagal diproses otomatis, memastikan operasional berjalan tanpa hambatan.
### Selesai bila
- Admin dapat masuk ke panel khusus setelah login, dan melihat menu sesuai wewenang.
- Daftar pesanan dengan status tertunda muncul lengkap dengan tombol sinkronisasi ulang untuk memicu pengecekan manual ke Mayar.
- Admin mampu membangun kelas baru, menyusun modul di dalamnya, dan memasukkan video dars menggunakan ID YouTube tanpa merusak struktur.
- Status publikasi setiap kelas dapat diubah antara Draft (tersembunyi) dan Published (tampil di katalog) cukup dengan satu klik.
- Admin dapat mencari pengguna dan mencabut akses kelas yang dimilikinya; setelah dicabut, video kelas tidak lagi dapat diputar oleh pengguna tersebut.

## Sub-fitur: Sinkronisasi Ulang Pembayaran

Tombol yang memicu pengecekan ulang status ke Mayar API oleh admin untuk pesanan yang webhook-nya gagal.

### Tujuan
Memberi admin tombol untuk memerintahkan sistem memeriksa ulang status transaksi di Mayar ketika webhook gagal, agar akses kelas segera terbuka tanpa menunggu lama.
### Selesai bila
- Admin melihat pesanan yang masih tertunda atau bermasalah, dan di sampingnya tersedia tombol “Sinkronkan Ulang”.
- Setelah tombol ditekan, sistem bertukar data dengan Mayar dan memperbarui status pesanan menjadi sukses atau gagal sesuai hasil pengecekan.
- Bila hasil sukses, sistem otomatis membuat enrollment sehingga pengguna langsung bisa mengakses kelas, dan admin mendapat notifikasi keberhasilan.

## Sub-fitur: Manajemen Kelas & Modul

Antarmuka untuk admin membuat struktur kelas, menambah modul, dan menambahkan dars dengan ID video YouTube.

### Tujuan
Memberikan antarmuka bagi admin untuk membuat, mengedit, dan menghapus hierarki pembelajaran (Kelas, Modul, Dars) lengkap dengan informasi video YouTube.
### Selesai bila
- Admin dapat membuat kelas baru dengan mengisi judul, deskripsi, harga asli, harga diskon, serta gambar sampul.
- Di dalam kelas, admin bisa menambahkan modul baru beserta urutannya, lalu mengisinya dengan dars yang memiliki judul dan ID video YouTube.
- Semua entitas (kelas, modul, dars) dapat diubah atau dihapus, dan perubahan langsung tercermin di halaman publik jika kelas sudah diterbitkan.

## Sub-fitur: Pengaturan Status Publikasi Kelas

Admin dapat mengubah status kelas antara Draft (tidak tampil) dan Published (tampil di katalog) untuk mengontrol publikasi.

### Tujuan
Memungkinkan admin mengontrol visibilitas kelas di katalog publik melalui pengaturan status Draft atau Published.
### Selesai bila
- Di halaman pengaturan kelas terdapat pengubah status yang hanya bisa diakses admin: pilihan “Draft” dan “Published”.
- Saat Draft, kelas tidak muncul di daftar, pencarian, maupun halaman detail bagi pengguna biasa.
- Ketika diubah ke Published, kelas langsung tampil di katalog dan sudah bisa dibeli oleh siapa pun yang mengunjungi.
- Label status di panel admin selalu menunjukkan keadaan terkini (misal: “Draft” atau “Published”).

## Sub-fitur: Pencabutan Akses

Mencabut akses pengguna dari kelas secara manual untuk refund atau pelanggaran, menghapus/menonaktifkan enrollments agar video tidak bisa diakses.

### Tujuan
Memberi admin wewenang untuk mencabut akses belajar pengguna dari kelas tertentu, baik karena refund, pelanggaran, atau alasan lainnya, sehingga video kelas tidak lagi bisa diakses.
### Selesai bila
- Admin dapat mencari pengguna berdasarkan nama atau email, lalu melihat daftar kelas yang sedang diakses pengguna tersebut.
- Pada setiap akses yang terdaftar, tersedia tombol “Cabut Akses” yang bila diklik akan menghapus atau menonaktifkan enrollment.
- Setelah pencabutan, pengguna tidak dapat memutar video kelas terkait; setiap permintaan video akan ditolak oleh sistem.
- Tindakan pencabutan tercatat dan dapat dilihat oleh admin sebagai riwayat (opsional).

## Task

### 1. Buat halaman pencarian pengguna & daftar kelas

### 2. Buat halaman manajemen kelas dengan data tiruan

### 3. Buat layout utama panel admin dengan sidebar navigasi

### 4. Tambahkan indikator status Draft/Published pada baris kelas

### 5. Buat komponen daftar kelas terenroll dengan status akses

### 6. Buat halaman daftar pesanan dengan tab status tertunda

### 7. Buat tombol ubah status publikasi dengan toggle

### 8. Pasang tombol sinkronisasi ulang pada setiap baris pesanan

### 9. Implementasi tombol cabut akses dengan modal konfirmasi

### 10. Tangani state loading dan empty pada pencarian pengguna

### 11. Buat halaman daftar kelas dengan tabel ringkas

### 12. Implementasikan optimistic update pada tombol ubah status

### 13. Filter kelas Draft dari katalog publik di halaman katalog

### 14. Buat form tambah dan edit kelas beserta data tiruan

### 15. Tangani notifikasi sukses/gagal setelah cabut akses

### 16. Tambahkan kolom status_publikasi pada tabel kelas

### 17. Buat form tambah modul ke dalam kelas terpilih

### 18. Buat endpoint cari pengguna berdasarkan email atau nama

### 19. Buat endpoint API untuk ubah status publikasi kelas

### 20. Buat endpoint daftar enrollments pengguna dengan status

### 21. Buat form tambah dars dengan input ID YouTube

### 22. Modifikasi endpoint daftar kelas admin sertakan status

### 23. Buat endpoint cabut akses kelas per enrollment

### 24. Pasang tombol ubah status publikasi Draft/Published per kelas

### 25. Buat halaman pencarian pengguna dan daftar aksesnya

### 26. Modifikasi skema enrollment untuk status akses

### 27. Filter endpoint katalog publik hanya tampilkan Published

### 28. Pasang tombol cabut akses pada setiap baris enrollment pengguna

### 29. Buat endpoint sinkronisasi ulang pembayaran ke Mayar API

### 30. Buat endpoint CRUD kelas

### 31. Buat endpoint CRUD modul di dalam kelas

### 32. Buat endpoint CRUD dars di dalam modul

### 33. Buat endpoint ubah status publikasi kelas

### 34. Buat endpoint pencarian pengguna dan list enrollments

### 35. Buat endpoint pencabutan akses enrollment pengguna

### 36. Pasang proteksi admin pada seluruh endpoint panel
