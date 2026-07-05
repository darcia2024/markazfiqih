# Pembelian & Pembayaran

Membeli kelas secara one-time purchase melalui keranjang dan pembayaran digital yang aman.

## Spesifikasi

### Tujuan
Memungkinkan pengguna membeli kelas satu kali bayar dengan melihat ringkasan biaya, melakukan pembayaran digital, dan memantau status transaksi hingga berhasil.
### Selesai bila
- Pengguna dapat mengakses halaman keranjang setelah memilih kelas dan login, melihat detail kelas dan harga final.
- Pengguna dapat memulai proses pembayaran melalui panel Mayar yang tertanam di website tanpa keluar halaman.
- Pengguna melihat halaman status pembayaran yang otomatis memuat ulang hingga transaksi selesai.
- Pengguna yang sudah membeli kelas langsung diarahkan ke dashboard Kelas Saya setelah pembayaran sukses.

## Sub-fitur: Keranjang Belanja

Halaman konfirmasi sebelum bayar yang menampilkan kelas yang dipilih dan harga final yang harus dibayar.

### Tujuan
Menampilkan ringkasan kelas yang akan dibeli dan total harga yang harus dibayar sebagai konfirmasi sebelum melanjutkan ke pembayaran.
### Selesai bila
- Halaman menampilkan judul kelas, harga asli, dan harga diskon jika ada (dengan coretan).
- Harga final yang harus dibayar ditampilkan jelas (contoh: "Total: Rp 150.000").
- Tombol "Bayar Sekarang" tersedia untuk memulai checkout.

## Sub-fitur: Checkout & Pembayaran

Memproses pembayaran untuk kelas di keranjang melalui gateway Mayar API dalam satu panel website.

### Tujuan
Memproses pembayaran kelas di keranjang menggunakan Mayar API yang tertanam di website sehingga pengguna bisa membayar dengan berbagai metode tanpa meninggalkan halaman.
### Selesai bila
- Setelah klik "Bayar Sekarang", sistem membuat invoice melalui Mayar API dan menampilkan panel pembayaran di halaman yang sama.
- Panel pembayaran mendukung metode pembayaran yang disediakan Mayar (QRIS, virtual account, dll.).
- Pengguna dapat menyelesaikan pembayaran sesuai instruksi yang muncul.
- Jika invoice masih berlaku (pending), sistem menggunakan kembali invoice yang ada tanpa membuat ganda.

## Sub-fitur: Status Pembayaran

Halaman auto-refresh yang menampilkan status 'menunggu' atau 'sukses' setelah user melakukan pembayaran.

### Tujuan
Menampilkan status pembayaran terkini dengan mekanisme auto-refresh untuk menunggu konfirmasi sukses dari Mayar sebelum mengalihkan pengguna ke dashboard kelas.
### Selesai bila
- Setelah pengguna menyelesaikan pembayaran di panel Mayar, halaman menampilkan status "Pembayaran sedang diproses" dengan indikator loading.
- Halaman secara otomatis memperbarui status (auto-refresh/polling) hingga transaksi berubah menjadi 'sukses' atau 'gagal'.
- Ketika status berubah menjadi 'sukses', halaman menampilkan pesan sukses dan otomatis mengalihkan ke dashboard "Kelas Saya".
- Jika status 'gagal', tampilkan pesan kegagalan dan opsi untuk mencoba lagi atau kembali ke katalog.

## Task

### 1. Buat halaman keranjang dengan data tiruan

### 2. Buat panel checkout tertanam dengan data tiruan

### 3. Buat halaman status pembayaran dengan polling tiruan

### 4. Tambah tombol Bayar Sekarang di keranjang

### 5. Buat tabel keranjang dan migrasi database

### 6. Buat API endpoint kelola keranjang

### 7. Buat service integrasi Mayar API invoice

### 8. Buat API endpoint checkout dan pembayaran

### 9. Buat webhook handler untuk notifikasi Mayar

### 10. Buat service enrollment otomatis setelah sukses

### 11. Buat API endpoint status transaksi

### 12. Buat mekanisme re-sync status manual admin
