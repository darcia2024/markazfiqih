import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ArrowRight,
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  MapPin,
} from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { listClasses, listInstructors, listTestimonials, getSettings } from '@/lib/db';
import {
  ClassCard,
  ClassCardSkeleton,
  type ClassSummary,
} from '@/pages/CatalogPage';

// ── Helper: konversi nomor lokal ke format wa.me ─────────────────────────────
function toWaUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) return `https://wa.me/${digits}`;
  if (digits.startsWith('0')) return `https://wa.me/62${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

// ── Ikon TikTok ──────────────────────────────────────────────────────────────
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82c-.9-.88-1.4-2.08-1.4-3.32h-3.13v13.44c0 1.6-1.3 2.9-2.9 2.9a2.9 2.9 0 0 1 0-5.8c.27 0 .53.03.78.1V9.98a6.03 6.03 0 0 0-.78-.05A6.03 6.03 0 0 0 3.15 16a6.03 6.03 0 0 0 6.02 6.02A6.03 6.03 0 0 0 15.19 16V8.66a8.16 8.16 0 0 0 4.76 1.52V7.05a4.85 4.85 0 0 1-3.35-1.23Z" />
    </svg>
  );
}

function buildSocialLinks(settings?: {
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
  socialYoutube: string;
}): Array<{ label: string; icon: typeof Instagram | typeof TikTokIcon; href: string }> {
  return [
    { label: 'Instagram', icon: Instagram, href: settings?.socialInstagram || '' },
    { label: 'Facebook', icon: Facebook, href: settings?.socialFacebook || '' },
    { label: 'TikTok', icon: TikTokIcon, href: settings?.socialTiktok || '' },
    { label: 'YouTube', icon: Youtube, href: settings?.socialYoutube || '' },
  ];
}

// ── Data cara belajar — 3 langkah gabungan dari 5 tahap ──────────────────────
const CURRICULUM_STAGES = [
  {
    stage: '01',
    title: 'Cari & Pilih',
    subtitle: 'Eksplorasi',
    topics: ['Jelajahi Katalog', 'Paket Bundle', 'Filter Level'],
    description:
      'Telusuri katalog kelas fiqih sesuai minat dan levelmu — dari pemula hingga kajian kitab. Temukan yang cocok, lalu tambahkan satu atau beberapa kelas sekaligus ke keranjang.',
  },
  {
    stage: '02',
    title: 'Bayar & Akses',
    subtitle: 'Pembayaran',
    topics: ['QRIS', 'Virtual Account', 'Akses Instan'],
    description:
      'Bayar lewat QRIS, e-wallet, virtual account, atau kartu — selesai dalam hitungan menit. Begitu pembayaran terverifikasi, kelas langsung terbuka otomatis di akunmu.',
  },
  {
    stage: '03',
    title: 'Belajar Fleksibel',
    subtitle: 'Pembelajaran',
    topics: ['Akses Selamanya', 'Progress Otomatis', 'Video On-Demand'],
    description:
      'Tonton materi kapan saja dan di mana saja sesuai waktumu. Progress belajar tersimpan otomatis — lanjutkan dari mana kamu berhenti tanpa kehilangan catatan.',
  },
];

// ── Tipe data bersama ─────────────────────────────────────────────────────────
type InstructorItem = { id: string; name: string; photoUrl: string; bio?: string };
type TestimonialItem = {
  id: string;
  name: string;
  role: string | null;
  content: string;
  photoUrl: string | null;
};

// ────────────────────────────────────────────────────────────────────────────
// SECTION 1: Hero — satu kolom, semua elemen center secara horizontal
// ────────────────────────────────────────────────────────────────────────────
function HeroSection({
  socialLinks: _socialLinks,
  totalClasses: _totalClasses,
  studentCountLabel: _studentCountLabel,
}: {
  socialLinks: Array<{ label: string; icon: typeof Instagram | typeof TikTokIcon; href: string }>;
  totalClasses: number;
  studentCountLabel: string | null | undefined;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary to-[hsl(var(--brand-red-hover))]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-multiply"
        style={{
          backgroundImage: "url('/hero-pattern.png')",
          backgroundSize: '900px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Masjid Al-Azhar — pojok kiri bawah */}
      <img
        src="/masjid-azhar.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 w-[240px] sm:w-[300px] lg:w-[360px] select-none"
        style={{ opacity: 0.22, mixBlendMode: 'luminosity', maskImage: 'linear-gradient(to top, black 30%, transparent 85%), linear-gradient(to right, black 40%, transparent 100%)', maskComposite: 'intersect' }}
      />

      <div className="relative z-10 container mx-auto px-5 sm:px-8 lg:px-16 max-w-[1200px]">
        {/* Satu kolom, semua center */}
        <div className="flex flex-col items-center text-center pt-14 pb-24 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32">

          {/* 1. Logo Markaz Fiqih — menggantikan badge lokasi */}
          <img
            src="/logo.png"
            alt="Markaz Fiqih"
            className="h-20 sm:h-24 w-auto mb-10 brightness-0 invert"
          />

          {/* 2. Judul — dua baris, baris pertama gold (lebih kecil), baris kedua putih */}
          <h1 className="font-serif font-bold leading-[1.15] tracking-tight max-w-4xl">
            <span
              className="block text-3xl sm:text-4xl lg:text-5xl font-semibold italic"
              style={{ color: '#FFCC00' }}
            >
              Ahlan wa Sahlan di
            </span>
            <span className="block text-6xl sm:text-7xl lg:text-8xl text-white mt-1">
              Kelas Markaz Fiqih
            </span>
          </h1>

          {/* 3. Paragraf deskripsi — max-w-2xl supaya enak dibaca saat di-center */}
          <p className="text-white/70 text-lg sm:text-xl mt-8 leading-relaxed max-w-2xl">
            Tempat belajar fiqih madzhab Syafi'i yang tersusun dan bersanad,
            dibangun dan diajar langsung oleh Mahasiswa Indonesia di Al-Azhar, Kairo.
          </p>

          {/* 4. Quote misi — dipindah ke alur utama, di bawah deskripsi */}
          <div className="mt-7 flex flex-col items-center gap-2 max-w-sm">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/60 to-transparent" />
            <p className="font-serif text-base italic text-white/55 leading-relaxed text-center">
              &ldquo;Membumikan Fiqih di Setiap Lini Kehidupan&rdquo;
            </p>
            <p className="text-xs font-medium text-white/35 tracking-widest uppercase">
              — Markaz Fiqih
            </p>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/60 to-transparent" />
          </div>

          {/* 5. Dua tombol CTA — center, berdampingan */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-[56px] px-10 text-base font-semibold rounded-[10px] text-primary hover:opacity-90 shadow-lg"
              style={{ backgroundColor: '#FFCC00' }}
            >
              <Link href="/katalog">Mulai Belajar</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="h-[56px] px-8 text-base font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-[10px] border border-white/20"
            >
              <Link href="/katalog">
                Lihat Kelas Tersedia
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 2: Kurikulum — format baru sesuai prompt
// Label + headline besar + 3-kolom grid (menggantikan layout timeline)
// ────────────────────────────────────────────────────────────────────────────
function CurriculumSection() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 max-w-[1200px]">

        <p className="text-xs font-semibold tracking-wider uppercase mb-4"
          style={{ color: 'hsl(var(--accent))' }}>
          Cara Belajar
        </p>

        <h2 className="font-serif text-4xl sm:text-5xl font-bold text-foreground max-w-2xl leading-tight">
          Dari cari kelas sampai mulai belajar —{' '}
          <span className="text-primary">cuma butuh 3 langkah.</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-14">
          {CURRICULUM_STAGES.map((stage) => (
            <div key={stage.stage} className="flex flex-col">
              {/* Nomor dekoratif */}
              <p
                className="font-serif text-6xl font-bold leading-none mb-5 select-none"
                style={{ color: 'hsl(var(--primary) / 0.12)' }}
              >
                {stage.stage}
              </p>
              {/* Label subtahap */}
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2"
                style={{ color: 'hsl(var(--accent))' }}>
                {stage.subtitle}
              </p>
              <h3 className="font-serif text-xl font-bold text-foreground mb-3 leading-snug">
                {stage.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {stage.description}
              </p>
              {/* Tag topik */}
              <div className="flex flex-wrap gap-2 mt-5">
                {stage.topics.map((topic) => (
                  <span
                    key={topic}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Button
            asChild
            variant="outline"
            className="h-[44px] px-6 text-sm font-semibold rounded-[10px] border-2 border-[hsl(var(--accent))] text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/5"
          >
            <Link href="/katalog">
              Lihat Semua Kelas
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 3: Grid Stat Asimetris — menggantikan ManifestoSection
// 4 kartu ukuran tidak seragam: pengajar utama (2×2), kelas (2×1),
// testimoni singkat (1×1), jumlah pengajar (1×1)
// ────────────────────────────────────────────────────────────────────────────
function AsymmetricStatsSection({
  totalClasses,
  totalInstructors,
  featuredInstructor,
  featuredTestimonial,
}: {
  totalClasses: number;
  totalInstructors: number;
  featuredInstructor: InstructorItem | null;
  featuredTestimonial: TestimonialItem | null;
}) {
  const instructorInitials = featuredInstructor
    ? featuredInstructor.name.split(' ').map((n) => n[0]).join('').substring(0, 2)
    : '';

  return (
    <section className="bg-muted/30 border-y border-border">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-20 max-w-[1200px]">

        {/* Header section — memindahkan narasi "tentang kami" ke sini */}
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold tracking-wider uppercase mb-4"
            style={{ color: 'hsl(var(--accent))' }}>
            Tentang Markaz Fiqih
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            Ilmu yang lahir dari komunitas,{' '}
            <span className="text-primary">bukan dari platform.</span>
          </h2>
          <p className="text-muted-foreground text-base mt-4 leading-relaxed">
            Kami adalah masisir — pelajar Indonesia yang belajar langsung di Al-Azhar Kairo.
            Bukan startup edukasi. Bukan konten YouTube yang dikemas ulang. Ini adalah
            proyek berbagi ilmu dari sesama masisir untuk semua yang ingin belajar
            fiqih Syafi'i dengan benar dan bersanad.
          </p>
        </div>

        {/* Grid asimetris 4-kolom, kartu ukuran tidak seragam */}
        <div
          className="grid grid-cols-1 sm:grid-cols-4 gap-4"
          style={{ gridAutoRows: 'minmax(160px, auto)' }}
        >
          {/* Kartu 1: Pengajar utama — 2 kolom × 2 baris */}
          <div className="sm:col-span-2 sm:row-span-2 relative rounded-2xl overflow-hidden bg-muted border border-border min-h-[320px]">
            {featuredInstructor?.photoUrl ? (
              <img
                src={featuredInstructor.photoUrl}
                alt={featuredInstructor.name}
                className="absolute inset-0 w-full h-full object-cover object-top"
                loading="lazy"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--brand-red-hover)))',
                }}
              />
            )}
            {/* Overlay gradien bawah */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1"
                style={{ color: 'hsl(var(--accent))' }}>
                Pengajar Utama
              </p>
              <p className="font-serif text-xl font-bold text-white leading-snug">
                {featuredInstructor?.name ?? '—'}
              </p>
              <p className="text-xs text-white/55 mt-0.5">Al-Azhar · Kairo, Mesir</p>
              {featuredInstructor?.bio && (
                <p className="text-xs text-white/65 mt-2 leading-relaxed line-clamp-2">
                  {featuredInstructor.bio}
                </p>
              )}
            </div>
            {/* Fallback initials jika tidak ada foto */}
            {!featuredInstructor?.photoUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-serif text-6xl font-bold text-white/20 select-none">
                  {instructorInitials}
                </span>
              </div>
            )}
          </div>

          {/* Kartu 2: Jumlah kelas — background gold solid, 2 kolom */}
          <div
            className="sm:col-span-2 rounded-2xl p-7 flex flex-col justify-between"
            style={{ backgroundColor: 'hsl(var(--accent))' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/65">
              Kelas fiqih tersedia
            </p>
            <div>
              <p className="font-serif font-bold text-white leading-none"
                style={{ fontSize: 'clamp(3.5rem, 8vw, 5rem)' }}>
                {totalClasses > 0 ? totalClasses : '—'}
              </p>
              <p className="text-sm font-medium text-white/75 mt-2">
                kelas terstruktur, mulai dari thaharah
              </p>
            </div>
          </div>

          {/* Kartu 3: Testimoni singkat — 1 kolom */}
          {featuredTestimonial ? (
            <div className="sm:col-span-1 rounded-2xl border border-border bg-card p-5 flex flex-col justify-between">
              <p
                className="font-serif text-3xl font-bold leading-none select-none mb-2"
                style={{ color: 'hsl(var(--accent) / 0.3)' }}
                aria-hidden="true"
              >
                &ldquo;
              </p>
              <p className="text-sm italic text-foreground leading-relaxed line-clamp-3 flex-1">
                {featuredTestimonial.content}
              </p>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                {featuredTestimonial.photoUrl ? (
                  <img
                    src={featuredTestimonial.photoUrl}
                    alt={featuredTestimonial.name}
                    className="h-7 w-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                    {featuredTestimonial.name
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold text-foreground leading-tight">
                    {featuredTestimonial.name}
                  </p>
                  {featuredTestimonial.role && (
                    <p className="text-[10px] text-muted-foreground">{featuredTestimonial.role}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="sm:col-span-1 rounded-2xl border border-border bg-muted/30 p-5" />
          )}

          {/* Kartu 4: Jumlah pengajar — background crimson deep, 1 kolom */}
          <div
            className="sm:col-span-1 rounded-2xl p-7 flex flex-col justify-between"
            style={{ backgroundColor: 'hsl(var(--brand-red-deep))' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
              Pengajar aktif
            </p>
            <div>
              <p
                className="font-serif font-bold leading-none"
                style={{
                  fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                  color: 'hsl(var(--accent))',
                }}
              >
                {totalInstructors > 0 ? totalInstructors : '—'}
              </p>
              <p className="text-xs text-white/50 mt-2">berguru di Al-Azhar Kairo</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 4: Pengajar — 1 pengajar utama dominan + sisanya list kecil
// ────────────────────────────────────────────────────────────────────────────
function InstructorsSection({
  instructors,
  isLoading,
}: {
  instructors: InstructorItem[];
  isLoading: boolean;
}) {
  const featured = instructors[0] ?? null;
  const others = instructors.slice(1);

  return (
    <section className="bg-background border-b border-border">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-20 max-w-[1200px]">

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-wider uppercase mb-4"
            style={{ color: 'hsl(var(--accent))' }}>
            Pengajar
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight max-w-xl">
            Belajar dari mereka yang berguru di Al-Azhar.
          </h2>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
            <div className="rounded-2xl bg-muted animate-pulse aspect-[4/5]" />
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {!isLoading && featured && (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">

            {/* Pengajar utama — kartu foto besar */}
            <div className="rounded-2xl overflow-hidden border border-border bg-card">
              {featured.photoUrl ? (
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={featured.photoUrl}
                    alt={featured.name}
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div
                  className="aspect-[4/5] flex items-center justify-center"
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--brand-red-hover)))',
                  }}
                >
                  <span className="font-serif text-6xl font-bold text-white/25 select-none">
                    {featured.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)}
                  </span>
                </div>
              )}
              <div className="p-6">
                <p className="font-serif text-xl font-bold text-foreground leading-snug">
                  {featured.name}
                </p>
                <p className="text-xs font-semibold mt-1 mb-3"
                  style={{ color: 'hsl(var(--accent))' }}>
                  Al-Azhar · Kairo, Mesir
                </p>
                {featured.bio && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {featured.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Pengajar lainnya — list horizontal kecil */}
            <div>
              {others.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">
                    Pengajar lainnya
                  </p>
                  <div className="flex flex-col gap-3">
                    {others.map((instructor) => (
                      <div
                        key={instructor.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-[hsl(var(--accent))]/40 hover:shadow-sm transition-all duration-200"
                      >
                        <Avatar className="h-12 w-12 shrink-0 rounded-xl border border-border">
                          <AvatarImage
                            src={instructor.photoUrl}
                            alt={instructor.name}
                            loading="lazy"
                          />
                          <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-sm font-bold">
                            {instructor.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-snug">
                            {instructor.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Al-Azhar · Kairo, Mesir
                          </p>
                          {instructor.bio && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {instructor.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Jika hanya 1 pengajar — tampilkan deskripsi tambahan */}
              {others.length === 0 && (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <p className="text-sm text-muted-foreground italic">
                    Pengajar lainnya segera bergabung.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {!isLoading && !featured && (
          <p className="text-sm text-muted-foreground">Pengajar segera hadir.</p>
        )}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 5: Kelas Pilihan — tidak diubah strukturnya
// ────────────────────────────────────────────────────────────────────────────
function FeaturedClassesSection({
  classes,
  isLoading,
}: {
  classes: ClassSummary[];
  isLoading: boolean;
}) {
  return (
    <section className="bg-muted/20">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-20 max-w-[1200px]">

        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p
              className="text-[11px] font-bold tracking-[0.2em] uppercase mb-3"
              style={{ color: 'hsl(var(--accent))' }}
            >
              Kelas Tersedia
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              Mulai Hari Ini
            </h2>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="shrink-0 text-sm text-[hsl(var(--accent))] hover:text-[hsl(var(--brand-gold-hover))] hover:bg-[hsl(var(--accent))]/5 font-medium hidden sm:flex"
          >
            <Link href="/katalog">
              Lihat semua
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading && Array.from({ length: 4 }).map((_, i) => <ClassCardSkeleton key={i} />)}
          {!isLoading && classes.map((cls, idx) => (
            <ClassCard key={cls.id} cls={cls} index={idx} enrolledClassIds={new Set()} />
          ))}
        </div>

        {!isLoading && classes.length === 0 && (
          <p className="text-center text-muted-foreground py-10">
            Belum ada kelas yang dipublikasikan saat ini.
          </p>
        )}

        <div className="flex justify-center mt-10 sm:hidden">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-[44px] px-6 text-sm font-semibold rounded-[10px] border-2 border-[hsl(var(--accent))] text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/5"
          >
            <Link href="/katalog">
              Lihat Semua Kelas
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 6: Testimoni — 3 card sejajar (prompt: slice(0,3))
// Style: quote icon, border gold aksen, avatar+nama+role di footer card
// ────────────────────────────────────────────────────────────────────────────
function TestimonialsSection({
  testimonials,
}: {
  testimonials: TestimonialItem[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <section className="bg-[hsl(var(--brand-red-tint))] border-y border-[hsl(var(--brand-red-border))]">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-20 max-w-[1200px]">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-wider uppercase mb-4"
            style={{ color: 'hsl(var(--primary))' }}>
            Kata Santri
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            Apa kata mereka yang sudah{' '}
            <span className="text-primary">belajar bersama kami?</span>
          </h2>
        </div>

        {/* 3 card sejajar di desktop, stack di mobile */}
        <div className={[
          'grid gap-5',
          testimonials.length === 1
            ? 'grid-cols-1 max-w-xl'
            : testimonials.length === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-3',
        ].join(' ')}>
          {testimonials.map((t) => {
            const initials = t.name
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase();
            return (
              <div
                key={t.id}
                className="relative rounded-2xl bg-white border border-[hsl(var(--brand-red-border))]/40 p-7 flex flex-col overflow-hidden"
              >
                {/* Aksen garis kiri gold */}
                <div
                  className="absolute top-0 left-0 h-full w-[3px] rounded-l-2xl"
                  style={{
                    background: 'linear-gradient(to bottom, hsl(var(--accent)), hsl(var(--accent) / 0.1))',
                  }}
                  aria-hidden="true"
                />

                {/* Quote mark besar */}
                <span
                  className="font-serif font-bold leading-none select-none block mb-3"
                  style={{ fontSize: '3rem', lineHeight: 1, color: 'hsl(var(--accent) / 0.25)' }}
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                {/* Konten testimoni */}
                <p className="text-sm italic text-foreground leading-relaxed flex-1">
                  {t.content}
                </p>

                {/* Footer: avatar + nama + role */}
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
                  {t.photoUrl ? (
                    <img
                      src={t.photoUrl}
                      alt={t.name}
                      loading="lazy"
                      className="h-9 w-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{t.name}</p>
                    {t.role && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.role}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 7: CTA Akhir + Social — tidak diubah strukturnya
// ────────────────────────────────────────────────────────────────────────────
function ContactSection({
  socialLinks,
  contactPhone,
}: {
  socialLinks: Array<{ label: string; icon: typeof Instagram | typeof TikTokIcon; href: string }>;
  contactPhone: string | null;
}) {
  return (
    <section className="bg-gradient-to-br from-primary to-[hsl(var(--brand-red-hover))]">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-14 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
              Mau mulai atau masih bingung?
            </h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-md">
              Chat langsung dengan kami — tanya soal kelas, jadwal kajian, atau
              metode belajar. Ikuti juga media sosial kami untuk cuplikan materi
              dan info kelas terbaru.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end gap-5">
            {contactPhone && (
              <a
                href={toWaUrl(contactPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 h-[48px] px-7 rounded-[10px] bg-[hsl(var(--accent))] text-white text-sm font-semibold hover:bg-[hsl(var(--brand-gold-hover))] shadow-lg transition-all duration-200 shrink-0"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                Chat via WhatsApp
              </a>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              {socialLinks.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href || '#'}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
                >
                  <span className="h-9 w-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium hidden sm:block">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Footer — tidak diubah
// ────────────────────────────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-8 max-w-[1200px]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <img
            src="/logo.png"
            alt="Markaz Fiqih"
            loading="lazy"
            className="h-7 w-auto brightness-0 dark:brightness-100 dark:invert"
          />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Markaz Fiqih. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Halaman Landing — root
// ────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();

  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: () => listClasses() });
  const instructorsQuery = useQuery({ queryKey: ['instructors'], queryFn: listInstructors });
  const testimonialsQuery = useQuery({ queryKey: ['testimonials'], queryFn: listTestimonials });
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const allClasses: ClassSummary[] = Array.isArray(classesQuery.data) ? classesQuery.data : [];
  const rawInstructors = Array.isArray(instructorsQuery.data) ? instructorsQuery.data : [];
  const instructors: InstructorItem[] = rawInstructors.map((inst) => ({
    ...inst,
    bio: inst.bio ?? undefined,
  }));
  // Prompt: slice(0, 3) untuk testimoni
  const allTestimonials: TestimonialItem[] = Array.isArray(testimonialsQuery.data)
    ? testimonialsQuery.data
    : [];
  const testimonials = allTestimonials.slice(0, 3);
  const settings = settingsQuery.data;

  const featuredClasses = useMemo(() => allClasses.slice(0, 4), [allClasses]);
  const socialLinks = useMemo(() => buildSocialLinks(settings ?? undefined), [settings]);

  // Untuk grid asimetris: pengajar pertama + testimoni pertama
  const featuredInstructor = instructors[0] ?? null;
  const featuredTestimonial = testimonials[0] ?? null;

  useEffect(() => {
    if (!isAuthLoading && user) {
      setLocation('/dashboard');
    }
  }, [isAuthLoading, user, setLocation]);

  if (isAuthLoading || user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero — copy lebih personal, badge kredibilitas dari data nyata */}
        <HeroSection
          socialLinks={socialLinks}
          totalClasses={allClasses.length}
          studentCountLabel={settings?.studentCountLabel}
        />

        {/* 2. Kurikulum — format baru: label + headline besar + 3-kolom grid */}
        <CurriculumSection />

        {/* 3. Grid asimetris — menggantikan ManifestoSection */}
        <AsymmetricStatsSection
          totalClasses={allClasses.length}
          totalInstructors={instructors.length}
          featuredInstructor={featuredInstructor}
          featuredTestimonial={featuredTestimonial}
        />

        {/* 4. Pengajar — 1 featured besar + sisanya list kecil */}
        {(instructorsQuery.isLoading || instructors.length > 0) && (
          <InstructorsSection
            instructors={instructors}
            isLoading={instructorsQuery.isLoading}
          />
        )}

        {/* 5. Kelas Pilihan — tidak diubah */}
        <FeaturedClassesSection
          classes={featuredClasses}
          isLoading={classesQuery.isLoading}
        />

        {/* 6. Testimoni — 3 card sejajar (slice(0,3)) */}
        <TestimonialsSection testimonials={testimonials} />

        {/* 7. CTA + Social — tidak diubah strukturnya */}
        <ContactSection
          socialLinks={socialLinks}
          contactPhone={settings?.contactPhone ?? null}
        />
      </main>

      <LandingFooter />
    </div>
  );
}
