# Pemutar Video Kelas

Menonton video dars dari YouTube secara terstruktur lengkap dengan progress dan navigasi antar pelajaran.

## Spesifikasi

### Tujuan
Menyediakan antarmuka terpadu bagi pelajar untuk menonton video pelajaran (dars) dari YouTube secara langsung di dalam aplikasi, lengkap dengan navigasi modul/dars dan pencatatan progres belajar.
### Selesai bila
- Pengguna dapat memutar video dars dari YouTube tanpa pernah melihat atau menyalin tautan aslinya.
- Di sisi layar, tersedia daftar modul dan dars yang memungkinkan pengguna berpindah pelajaran dengan satu klik.
- Setiap dars memiliki tombol "Tandai Selesai" yang bila diklik akan memperbarui progres kelas secara visual dan persisten.
- Progress setiap dars (selesai/belum) terlihat jelas di sidebar sehingga pengguna tahu mana yang sudah dan belum ditonton.

## Sub-fitur: Player Video

Memutar video dars dari YouTube Unlisted yang sumbernya diambil otomatis tanpa perlu user mencari link.

### Tujuan
Memastikan pengguna dapat langsung menyaksikan video dars dari YouTube Unlisted melalui pemutar di halaman kelas, dengan ID video diambil otomatis oleh sistem tanpa campur tangan pengguna.
### Selesai bila
- Pemutar video muncul di area utama halaman dan langsung memuat video dari dars pertama yang belum selesai (atau dars pertama modul pertama jika semua belum selesai).
- Pengguna tidak melihat atau perlu memasukkan tautan YouTube; video langsung bermain dari ID yang disediakan server.

## Sub-fitur: Sidebar Navigasi Modul & Dars

Melihat daftar isi kelas berupa modul dan dars, serta berpindah antar pelajaran dengan mudah.

### Tujuan
Memberikan peta konten kelas secara visual agar pengguna dapat melihat struktur modul dan seluruh dars, serta berpindah ke pelajaran lain dengan mudah.
### Selesai bila
- Sidebar menampilkan daftar modul dengan judulnya, dan di bawah tiap modul terdapat daftar judul dars yang dapat diklik.
- Dars yang sedang aktif ditonton ditandai secara visual (misalnya dengan latar berbeda).
- Dars yang sudah ditandai selesai memiliki indikator khusus (misalnya ikon centang) di samping judulnya.
- Mengklik judul dars mana pun di sidebar langsung mengganti video yang diputar di pemutar utama.

## Sub-fitur: Tombol Tandai Selesai

Menekan tombol setelah selesai menonton dars untuk memperbarui progress penyelesaian kelas.

### Tujuan
Memberikan kendali kepada pengguna untuk menyatakan bahwa ia telah menyelesaikan menonton sebuah dars, sehingga progres kelasnya terhitung dan termonitor.
### Selesai bila
- Tombol "Tandai Selesai" tersedia di dekat pemutar video, terlihat jelas dan mudah dijangkau.
- Saat tombol diklik, status dars berubah menjadi selesai secara instan dan persentase progres kelas di sidebar/dashboard ikut diperbarui.
- Jika sebuah dars sudah selesai, tombol berubah menjadi "Selesai" (non-aktif atau dengan tampilan berbeda), dan pengguna tetap bisa menonton ulang videonya.

## Task

### 1. Buat halaman layout pemutar video dengan data tiruan

### 2. Implementasi komponen pemutar video YouTube dinamis

### 3. Buat sidebar navigasi modul dan dars interaktif

### 4. Integrasikan sidebar dengan pemutar video untuk ganti pelajaran

### 5. Tambahkan tombol Tandai Selesai dan perbarui status lokal

### 6. Tampilkan indikator progress kelas di sidebar

### 7. Buat skema database untuk module, lesson, enrollment, dan completion

### 8. Implementasi endpoint API untuk mengambil daftar module dan lesson dengan status

### 9. Implementasi endpoint API untuk tandai selesai lesson

### 10. Implementasi endpoint API untuk menghitung progress kelas

### 11. Amankan akses video ID hanya melalui API setelah enrollment

### 12. Middleware pengecekan enrollment untuk akses halaman pemutar
