# Design System — Markaz Fiqih

## 1. Visual Theme & Atmosphere

Markaz Fiqih adalah lembaga keilmuan fiqih yang berlandaskan turats dan madzhab Syafi'i — bukan platform kursus umum. Desainnya harus terasa **terpercaya, tenang, dan berbobot keilmuan**, bukan riuh seperti aplikasi startup konsumer. Warna merah dari identitas brand (logo rumah + buku terbuka) dipertahankan sebagai warna utama, dipasangkan dengan emas sebagai aksen sekunder yang merujuk pada nuansa "kitab" klasik, di atas latar krem hangat yang nyaman dibaca untuk konten teks panjang (materi fiqih, deskripsi kitab, dsb).

**Key Characteristics**
- Merah marun sebagai warna brand utama — dipakai konsisten untuk CTA, elemen aktif, dan aksen identitas, TIDAK dipakai berlebihan di background besar
- Emas sebagai aksen sekunder — dipakai untuk badge, harga promo, rating, dan penanda "premium/populer", memberi sentuhan nuansa kitab klasik
- Latar krem hangat (bukan putih steril, bukan merah pekat) untuk kenyamanan membaca konten panjang
- Tipografi tegas namun tetap hangat — mencerminkan lembaga keilmuan yang serius tapi approachable
- Sudut membulat sedang (tidak terlalu tajam, tidak terlalu bulat) — kesan rapi dan modern tanpa kehilangan kesan formal
- Elemen dekoratif diminimalkan — fokus pada keterbacaan konten, karena materi yang disajikan padat dan butuh konsentrasi

## 2. Color Palette & Roles

### Primary (Brand Red)

- **Merah Utama** (`#A31F2C`): Warna brand utama, dipetik dari logo. Untuk CTA utama, tombol beli, active states, dan elemen identitas.
- **Merah Hover** (`#85181F`): Varian gelap untuk hover state tombol/link merah.
- **Merah Aktif** (`#671319`): Untuk active/pressed state, dan aksen kontras tinggi.
- **Merah Pekat** (`#4A0E12`): Varian paling gelap, untuk heading besar yang butuh aksen merah kuat di atas latar krem.

### Accent (Gold — Aksen Kitab)

- **Emas** (`#B8862E`): Aksen sekunder brand — badge "Populer", rating bintang, label harga diskon, penanda status premium.
- **Emas Hover** (`#966B1F`): Hover state untuk elemen bertema emas.
- **Emas Pucat** (`#F6EBD3`): Background badge/tag bertema emas.

### Neutral Scale (Basis Konten)

- **Teks Utama** (`#241C1B`): Warna teks hitam-hangat untuk body text dan heading — netral, BUKAN merah, demi kenyamanan baca konten panjang.
- **Teks Sekunder** (`#5C4F4C`): Untuk deskripsi, label, teks pendukung.
- **Teks Tersier** (`#8C7D79`): Untuk caption, placeholder, teks nonaktif.

### Surface & Background

- **Krem Dasar** (`#FBF7F4`): Warna latar utama halaman — hangat, nyaman dibaca, bukan putih steril.
- **Putih** (`#FFFFFF`): Background kartu (card), modal, elemen yang perlu menonjol dari latar krem.
- **Tint Merah Pucat** (`#FBEEEF`): Untuk section background yang butuh sentuhan brand ringan (dipakai jarang, jangan mendominasi).
- **Border Netral** (`#E8DEDA`): Border/divider default — netral, tidak mencolok.
- **Border Brand** (`#E1A3A9`): Border bertema merah, dipakai khusus pada elemen yang memang berkaitan langsung dengan aksi brand (misal input yang sedang fokus).

### Semantic / Status

- **Sukses** (`#2F8F5B`): Status pembayaran sukses, kelas published, progress selesai.
- **Sukses Pucat** (`#DCF3E5`): Background badge sukses.
- **Destruktif/Error** (`#D92D20`): Aksi hapus, cabut akses, gagal bayar. **Sengaja dibuat lebih oranye dibanding Merah Utama** (`#A31F2C`) agar tidak tertukar dengan warna brand — selalu dampingi dengan ikon, jangan andalkan warna saja.
- **Destruktif Pucat** (`#FBE4E1`): Background badge/alert error.

## 3. Typography Rules

### Font Family

**Primary Font (Heading & UI):** Plus Jakarta Sans
- Stack: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Karakter tegas dan geometris, senada dengan bentuk huruf bold di logo "Markaz", tetap terasa modern.

**Secondary Font (Body/Konten Panjang):** Inter
- Stack: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Dipilih khusus untuk keterbacaan tinggi pada teks panjang (deskripsi kelas, materi, silabus kitab).

### Hierarchy

| Role | Font | Size | Weight | Line Height | Notes |
|------|------|------|--------|-------------|-------|
| Display | Plus Jakarta Sans | 40px | 700 | 46px | Hero section, judul utama landing |
| Heading 1 | Plus Jakarta Sans | 32px | 700 | 38px | Judul halaman |
| Heading 2 | Plus Jakarta Sans | 26px | 600 | 32px | Judul section |
| Heading 3 | Plus Jakarta Sans | 20px | 600 | 26px | Judul kartu kelas, judul modul |
| Heading 4 | Plus Jakarta Sans | 16px | 600 | 22px | Label komponen, judul dars |
| Body Large | Inter | 16px | 400 | 26px | Deskripsi kelas, paragraf pembuka |
| Body Regular | Inter | 14px | 400 | 22px | Body text standar |
| Body Small | Inter | 13px | 400 | 20px | Teks pendukung, metadata |
| Button | Plus Jakarta Sans | 14px | 600 | 20px | Semua teks tombol |
| Label | Plus Jakarta Sans | 13px | 600 | 18px | Form label, badge, tag |
| Caption | Inter | 12px | 400 | 16px | Metadata kecil, timestamp |

### Principles

- **Keterbacaan di atas segalanya:** karena konten fiqih seringkali panjang dan padat, body text SELALU pakai Inter, bukan Plus Jakarta Sans.
- **Heading = identitas brand:** Plus Jakarta Sans dengan weight tebal (600–700) dipakai konsisten di semua heading untuk membangun karakter visual yang kuat.
- **Line height lega** (1.4–1.6) khusus untuk body text — audiens sering membaca materi panjang dalam sesi lama.
- **Warna teks default netral (`#241C1B`)**, bukan merah — merah disediakan khusus untuk elemen interaktif dan aksen, bukan untuk teks umum.

## 4. Component Stylings

### Buttons

#### Primary Button
- **Background:** `#A31F2C`
- **Text Color:** `#FFFFFF`
- **Padding:** `10px 20px`
- **Font:** Plus Jakarta Sans, `14px`, weight `600`
- **Border Radius:** `10px`
- **Height:** `44px`
- **Hover State:** Background `#85181F`
- **Active State:** Background `#671319`
- **Disabled State:** Background `#E1A3A9`, Text Color `#FFFFFF`, Cursor `not-allowed`

#### Secondary Button
- **Background:** `transparent`
- **Text Color:** `#A31F2C`
- **Padding:** `10px 20px`
- **Border Radius:** `10px`
- **Border:** `2px solid #A31F2C`
- **Height:** `44px`
- **Hover State:** Background `#FBEEEF`, Border Color `#85181F`, Text Color `#85181F`

#### Ghost Button
- **Background:** `transparent`
- **Text Color:** `#241C1B`
- **Padding:** `10px 16px`
- **Font Weight:** `400`
- **Border:** `none`
- **Hover State:** Background `#F3ECE8`

#### Gold Accent Button (khusus aksi premium/promo)
- **Background:** `#B8862E`
- **Text Color:** `#FFFFFF`
- **Padding:** `10px 20px`
- **Border Radius:** `10px`
- **Hover State:** Background `#966B1F`
- **Usage:** dipakai terbatas — misal tombol "Klaim Promo", bukan tombol umum.

### Cards & Containers

#### Kelas Card (Course Card)
- **Background:** `#FFFFFF`
- **Border Radius:** `14px`
- **Border:** `1px solid #E8DEDA`
- **Box Shadow:** `0px 2px 8px rgba(163, 31, 44, 0.06), 0px 4px 16px rgba(163, 31, 44, 0.08)`
- **Hover State:** Box Shadow `0px 6px 16px rgba(163, 31, 44, 0.10)`, Transform `translateY(-2px)`
- **Thumbnail:** rasio 16:9, border-radius top `14px`

#### Section Container
- **Background:** `#FBF7F4` (krem) atau `#FFFFFF`, selang-seling per section untuk memisahkan zona konten
- **Padding:** `48px 64px` desktop, `32px 20px` mobile

### Inputs & Forms

#### Text Input
- **Background:** `#FFFFFF`
- **Text Color:** `#241C1B`
- **Padding:** `10px 14px`
- **Border Radius:** `8px`
- **Border:** `1px solid #E8DEDA`
- **Height:** `44px`
- **Focus State:** Border Color `#A31F2C`, Box Shadow `0px 0px 0px 3px #FBEEEF`
- **Placeholder Color:** `#8C7D79`

#### Form Label
- **Font:** Plus Jakarta Sans, `13px`, weight `600`
- **Color:** `#241C1B`
- **Margin Bottom:** `8px`

### Navigation

#### Header Navigation Item
- **Text Color:** `#241C1B`
- **Height:** `72px`
- **Hover State:** Background `#F3ECE8`
- **Active State:** Border Bottom `3px solid #A31F2C`, Text Color `#A31F2C`

### Badges & Tags (penting — dipakai untuk harga diskon & status kelas)

#### Badge Diskon/Promo
- **Background:** `#F6EBD3`
- **Text Color:** `#966B1F`
- **Padding:** `4px 10px`
- **Border Radius:** `6px`
- **Font:** `12px`, weight `600`

#### Harga Coret (Strikethrough)
- **Harga Asli:** Text Color `#8C7D79`, `text-decoration: line-through`
- **Harga Diskon:** Text Color `#A31F2C`, weight `700`, ukuran lebih besar dari harga asli

#### Badge Status: Published
- **Background:** `#DCF3E5`, **Text:** `#1E6B41`

#### Badge Status: Draft
- **Background:** `#F3ECE8`, **Text:** `#5C4F4C`

#### Badge Populer/Rating (Gold)
- **Background:** `#F6EBD3`, **Text:** `#966B1F`, ikon bintang emas `#B8862E`

### Progress Bar (untuk progress tracker kelas)
- **Track Background:** `#E8DEDA`
- **Fill:** `#A31F2C`
- **Height:** `8px`, **Border Radius:** `999px`
- **Fill Selesai 100%:** ganti warna fill jadi `#2F8F5B` sebagai penanda kelas tuntas

## 5. Layout Principles

### Spacing System
Base unit `4px`, skala: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64` — sama seperti standar umum, konsisten dipakai di semua komponen.

### Border Radius Scale
- `8px` — Input fields
- `10px` — Button
- `14px` — Card
- `999px` — Avatar, badge bulat, progress bar

### Whitespace Philosophy
Karena konten fiqih padat secara informasi, whitespace dipakai untuk **memberi napas antar section**, bukan untuk dekorasi. Section dipisah `48–64px` secara vertikal. Card diberi padding cukup (`20–24px`) agar teks kurikulum/modul tidak terasa sesak.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| None | No shadow | Teks, background, elemen flat |
| Subtle | `0px 1px 2px rgba(163, 31, 44, 0.05)` | Hover ringan |
| Base | `0px 2px 8px rgba(163, 31, 44, 0.06), 0px 4px 16px rgba(163, 31, 44, 0.08)` | Card default, navbar, dropdown |
| Elevated | `0px 6px 16px rgba(163, 31, 44, 0.10)` | Card hover, panel checkout |
| High | `0px 12px 24px rgba(163, 31, 44, 0.14)` | Modal, toast, dialog konfirmasi |

**Shadow Philosophy:** Shadow pakai tint merah brand dengan opacity rendah — halus, tidak berat, konsisten dengan nuansa krem-merah keseluruhan. Jangan pernah pakai shadow hitam polos (`rgba(0,0,0,...)`), karena bikin tone jadi dingin dan gak sesuai karakter brand.

## 7. Do's and Don'ts

### Do
- **Pakai Merah Utama (`#A31F2C`) hanya untuk elemen interaktif/brand** — tombol CTA, link, active state, aksen heading tertentu.
- **Pakai krem (`#FBF7F4`) sebagai background dominan**, bukan putih steril atau merah pekat.
- **Pakai Emas (`#B8862E`) secara terbatas** — untuk badge promo, rating, status premium saja, jangan dipakai sebagai warna dasar UI.
- **Body text selalu pakai Inter**, heading selalu pakai Plus Jakarta Sans.
- **Bedakan warna Error (`#D92D20`) dari Merah Brand (`#A31F2C`)** secara sengaja, dan selalu dampingi aksi destruktif (cabut akses, hapus) dengan ikon + label teks, jangan andalkan warna saja.

### Don't
- **Jangan pakai merah brand untuk background section berukuran besar** — bikin lelah mata dan berat untuk konten yang harus dibaca lama.
- **Jangan campur border radius** — input `8px`, button `10px`, card `14px`, konsisten di semua tempat.
- **Jangan pakai warna di luar palet ini**, termasuk jangan improvisasi warna merah/emas lain yang mendekati tapi beda dari hex yang ditentukan.
- **Jangan pakai Plus Jakarta Sans untuk body text panjang** — hanya untuk heading dan elemen UI singkat (tombol, label, badge).
- **Jangan gunakan warna semata untuk membedakan status kelas (draft/published)** — selalu sertai label teks di badge, bukan cuma warna.

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Padding | Key Changes |
|------|-------|---------|-------------|
| Mobile | 375–767px | 20px | Single column, navigasi hamburger |
| Tablet | 768–1023px | 32px | 2 kolom untuk grid kelas |
| Desktop | 1024–1439px | 48px | 3–4 kolom grid kelas |
| Large | 1440px+ | 64px | Max-width container, spacing lega |

### Touch Targets
- Minimum height elemen interaktif: `44px`
- Minimum spacing antar elemen: `8px`

### Kelas Grid
- Desktop: 3–4 kolom
- Tablet: 2 kolom
- Mobile: 1 kolom, full width

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA:** `#A31F2C` — tombol Beli, Daftar, Bayar Sekarang
- **Primary Hover:** `#85181F`
- **Heading/Text Utama:** `#241C1B` (netral, BUKAN merah)
- **Teks Sekunder:** `#5C4F4C`
- **Background Halaman:** `#FBF7F4` (krem, bukan putih)
- **Background Card:** `#FFFFFF`
- **Aksen Emas (badge/promo/rating):** `#B8862E`
- **Sukses:** `#2F8F5B`
- **Error/Destruktif:** `#D92D20` (sengaja beda dari brand red)
- **Border Default:** `#E8DEDA`

### Iteration Guide
1. **Semua heading pakai Plus Jakarta Sans weight 600–700**, semua body text pakai Inter weight 400.
2. **Tombol utama selalu `#A31F2C` background + putih text**, hover jadi `#85181F`.
3. **Card pakai border-radius 14px + shadow tint merah (bukan hitam)** — lihat section Depth & Elevation.
4. **Background halaman default krem (`#FBF7F4`)**, card di atasnya pakai putih supaya kontras dan menonjol.
5. **Harga diskon: harga asli dicoret warna `#8C7D79`, harga final warna `#A31F2C` weight 700, ukuran lebih besar.**
6. **Badge status kelas (Draft/Published) WAJIB pakai warna + teks label**, jangan cuma warna.
7. **Progress bar fill pakai `#A31F2C`, berubah jadi `#2F8F5B` kalau progress 100%.**
8. **Jangan pernah pakai warna merah brand untuk aksi destruktif (hapus/cabut akses)** — pakai `#D92D20` yang sedikit lebih oranye supaya gak tertukar dengan tombol brand biasa.
9. **Spacing pakai skala 4px** (4, 8, 12, 16, 20, 24, 32, 40, 48, 64) — jangan pakai nilai sembarang.
10. **Emas (`#B8862E`) dipakai terbatas** — hanya untuk badge/rating/promo, bukan warna dasar komponen apapun.
