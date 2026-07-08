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

// ── Jalur Ilmu (data kurikulum spesifik Markaz Fiqih) ───────────────────────
const CURRICULUM_STAGES = [
  {
    stage: '01',
    title: 'Fiqih Tematik',
    subtitle: 'Dasar yang Kokoh',
    topics: ['Thaharah', 'Sholat', 'Zakat & Puasa', 'Muamalah Sehari-hari'],
    description:
      'Mulai dari bab thaharah hingga muamalah — materi fiqih yang relevan langsung untuk kehidupan, disusun per tema agar mudah dicerna.',
  },
  {
    stage: '02',
    title: 'Fiqih Kitab',
    subtitle: 'Kajian Klasik',
    topics: ['Matan Taqrib', 'Fath al-Qarib', 'Minhaj al-Thalibin', 'Al-Muhadzzab'],
    description:
      'Baca dan pahami kitab-kitab rujukan madzhab Syafi\'i langsung dari sumbernya — dibimbing pengajar yang telah mempelajari kitab-kitab ini di Kairo.',
  },
  {
    stage: '03',
    title: 'Akademi',
    subtitle: 'Program Panjang',
    topics: ['Kurikulum Bertahap', 'Ujian Berkala', 'Ijazah Kelulusan', 'Komunitas Alumni'],
    description:
      'Program terstruktur jangka panjang untuk penguasaan fiqih menyeluruh — dengan ujian berkala, mentoring, dan komunitas alumni aktif.',
  },
];

// ────────────────────────────────────────────────────────────────────────────
// SECTION 1: Hero
// ────────────────────────────────────────────────────────────────────────────
function HeroSection({
  socialLinks,
}: {
  socialLinks: Array<{ label: string; icon: typeof Instagram | typeof TikTokIcon; href: string }>;
}) {
  return (
    <section className="relative bg-gradient-to-br from-primary to-[hsl(var(--brand-red-hover))] overflow-hidden">
      {/* Pola garis diagonal sangat subtle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, white 0, white 1px, transparent 0, transparent 50%)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 container mx-auto px-5 sm:px-8 lg:px-16 max-w-[1200px]">
        <div className="grid lg:grid-cols-2 gap-0 min-h-[480px] sm:min-h-[560px] items-center py-16 sm:py-20">

          {/* Kolom kiri — teks utama */}
          <div className="flex flex-col items-start text-left">

            {/* Label lokasi */}
            <div className="inline-flex items-center gap-2 border border-white/20 bg-white/10 rounded-full px-3.5 py-1.5 mb-7">
              <MapPin className="h-3 w-3 text-[hsl(var(--accent))]" />
              <span className="text-xs font-medium text-white/80 tracking-wide">
                Dari Kairo, untuk Indonesia
              </span>
            </div>

            {/* Judul — dua baris dengan kontras ukuran ekstrem */}
            <h1 className="font-serif font-bold text-white leading-[1.05] tracking-tight">
              <span className="block text-5xl sm:text-6xl lg:text-7xl">
                Fiqih dari
              </span>
              <span
                className="block text-5xl sm:text-6xl lg:text-7xl"
                style={{ color: 'hsl(var(--accent))' }}
              >
                Sumbernya.
              </span>
              <span className="block text-2xl sm:text-3xl lg:text-4xl text-white/80 font-normal mt-3 font-sans">
                Terstruktur dari Dasar.
              </span>
            </h1>

            <p className="text-white/70 text-base mt-6 leading-relaxed max-w-lg">
              Markaz Fiqih dibangun oleh pelajar Indonesia di Kairo — belajar fiqih
              madzhab Syafi'i dari pengajar yang menimba ilmu langsung di Al-Azhar.
              Bukan kumpulan ceramah acak. Kurikulum dari thaharah hingga kajian kitab
              klasik, tersusun dengan sanad yang jelas.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-[48px] px-8 text-sm font-semibold rounded-[10px] bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--brand-gold-hover))] shadow-lg"
              >
                <Link href="/katalog">Mulai Belajar</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-[48px] px-6 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-[10px]"
              >
                <Link href="/katalog">
                  Lihat Kelas
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Social links — kecil, di bawah CTA */}
            <div className="mt-8 flex items-center gap-3">
              <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">
                Ikuti
              </span>
              {socialLinks.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href || '#'}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-[hsl(var(--accent))] hover:scale-110 transition-all duration-200"
                >
                  <Icon className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>

          {/* Kolom kanan — kutipan misi + ornamen visual */}
          <div className="hidden lg:flex flex-col items-end justify-center pl-16">
            <div className="relative">
              {/* Blok kutipan besar */}
              <blockquote className="text-right">
                <p className="font-serif text-4xl xl:text-5xl font-bold italic text-white/20 leading-tight select-none">
                  &ldquo;
                </p>
                <p className="font-serif text-xl xl:text-2xl font-bold italic text-white leading-relaxed max-w-xs">
                  Membumikan Fiqih di Setiap Lini Kehidupan
                </p>
                <p className="mt-3 text-sm text-white/50 font-medium tracking-widest uppercase">
                  — Markaz Fiqih
                </p>
              </blockquote>

              {/* Garis dekoratif gold */}
              <div className="mt-8 flex justify-end">
                <div className="h-px w-32 bg-gradient-to-l from-[hsl(var(--accent))] to-transparent" />
              </div>
              <div className="mt-2 flex justify-end">
                <div className="h-px w-20 bg-gradient-to-l from-[hsl(var(--accent))]/40 to-transparent" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 2: Stats Bold
// ────────────────────────────────────────────────────────────────────────────
function StatsSection({
  totalClasses,
  totalInstructors,
  studentCountLabel,
}: {
  totalClasses: number;
  totalInstructors: number;
  studentCountLabel: string | null | undefined;
}) {
  const stats = [
    {
      value: totalClasses > 0 ? `${totalClasses}` : '—',
      label: 'Kelas',
      sub: 'fiqih terstruktur',
    },
    {
      value: totalInstructors > 0 ? `${totalInstructors}` : '—',
      label: 'Pengajar',
      sub: 'dari Al-Azhar Kairo',
    },
    {
      value: studentCountLabel ?? '—',
      label: 'Santri',
      sub: 'sudah bergabung',
    },
  ];

  return (
    <section className="bg-[hsl(var(--brand-red-deep))]">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 max-w-[1200px]">
        <div className="grid grid-cols-3 divide-x divide-white/10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center py-10 sm:py-12 px-4"
            >
              <span
                className="font-serif font-bold text-4xl sm:text-5xl lg:text-6xl leading-none tracking-tight"
                style={{ color: 'hsl(var(--accent))' }}
              >
                {stat.value}
              </span>
              <span className="mt-2 text-base sm:text-lg font-semibold text-white tracking-wide">
                {stat.label}
              </span>
              <span className="mt-1 text-xs text-white/50 hidden sm:block">
                {stat.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 3: Jalur Ilmu (Kurikulum)
// ────────────────────────────────────────────────────────────────────────────
function CurriculumSection() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-20 max-w-[1200px]">

        {/* Header */}
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold tracking-widest text-[hsl(var(--accent))] uppercase mb-3">
            Jalur Ilmu
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            Bukan Ceramah Acak.{' '}
            <span className="text-primary">Kurikulum Terstruktur.</span>
          </h2>
          <p className="text-muted-foreground text-base mt-4 leading-relaxed max-w-xl">
            Setiap kelas dirancang mengikuti urutan keilmuan madzhab Syafi'i — dari
            fondasi fiqih tematik hingga kajian kitab-kitab klasik yang menjadi
            rujukan ulama selama berabad-abad.
          </p>
        </div>

        {/* Tiga tahapan — layout asimetris: satu besar, dua lebih kecil di sisi */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {CURRICULUM_STAGES.map((stage, idx) => (
            <div
              key={stage.stage}
              className={[
                'relative flex flex-col rounded-xl overflow-hidden border',
                idx === 0
                  ? 'lg:col-span-1 bg-gradient-to-br from-primary to-[hsl(var(--brand-red-hover))] border-transparent text-white'
                  : 'bg-card border-border',
              ].join(' ')}
            >
              {/* Nomor tahap watermark */}
              <span
                className={[
                  'absolute top-4 right-5 font-serif text-[80px] font-bold leading-none select-none pointer-events-none',
                  idx === 0 ? 'text-white/10' : 'text-foreground/5',
                ].join(' ')}
              >
                {stage.stage}
              </span>

              <div className="relative z-10 p-7 flex flex-col flex-1">
                <p
                  className={[
                    'text-[10px] font-bold uppercase tracking-[0.15em] mb-2',
                    idx === 0 ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--accent))]',
                  ].join(' ')}
                >
                  {stage.subtitle}
                </p>
                <h3
                  className={[
                    'font-serif text-xl font-bold mb-3',
                    idx === 0 ? 'text-white' : 'text-foreground',
                  ].join(' ')}
                >
                  {stage.title}
                </h3>
                <p
                  className={[
                    'text-sm leading-relaxed mb-5',
                    idx === 0 ? 'text-white/70' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {stage.description}
                </p>

                {/* Topik-topik sebagai tag */}
                <div className="mt-auto flex flex-wrap gap-2">
                  {stage.topics.map((topic) => (
                    <span
                      key={topic}
                      className={[
                        'text-[11px] font-medium px-2.5 py-1 rounded-full',
                        idx === 0
                          ? 'bg-white/15 text-white/85'
                          : 'bg-muted text-muted-foreground',
                      ].join(' ')}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-start">
          <Button asChild variant="outline" className="h-[44px] px-6 text-sm font-semibold rounded-[10px] border-2 border-[hsl(var(--accent))] text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/5">
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
// SECTION 4: Pengajar (dipindah naik, sebelum kelas)
// ────────────────────────────────────────────────────────────────────────────
function InstructorsSection({
  instructors,
  isLoading,
}: {
  instructors: Array<{ id: string; name: string; photoUrl: string; bio?: string }>;
  isLoading: boolean;
}) {
  return (
    <section className="bg-muted/30 border-y border-border">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-20 max-w-[1200px]">

        {/* Header — dua kolom: label kiri, teks kanan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 items-end">
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold tracking-widest text-[hsl(var(--accent))] uppercase mb-3">
              Pengajar
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              Ilmu yang Bersanad.{' '}
              <span className="text-primary">Pengajar dari Kairo.</span>
            </h2>
          </div>
          <div className="lg:text-right">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Setiap pengajar Markaz Fiqih menimba ilmu langsung di Kairo — bukan sekadar
              praktisi, tapi penuntut ilmu yang meneruskan tradisi keilmuan klasik.
            </p>
          </div>
        </div>

        {/* Grid pengajar — horizontal card dengan bio visible */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {instructors.map((instructor) => (
              <div
                key={instructor.id}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow"
              >
                <Avatar className="h-14 w-14 shrink-0 border-2 border-[hsl(var(--accent))]/30">
                  <AvatarImage
                    src={instructor.photoUrl}
                    alt={instructor.name}
                    loading="lazy"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {instructor.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-foreground leading-tight">
                    {instructor.name}
                  </p>
                  <p className="text-xs font-medium text-primary mt-0.5 mb-2">
                    Pengajar Fiqih — Kairo, Mesir
                  </p>
                  {instructor.bio && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {instructor.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 5: Kelas Pilihan
// ────────────────────────────────────────────────────────────────────────────
function FeaturedClassesSection({
  classes,
  isLoading,
}: {
  classes: ClassSummary[];
  isLoading: boolean;
}) {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-20 max-w-[1200px]">

        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[hsl(var(--accent))] uppercase mb-3">
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
            <ClassCard key={cls.id} cls={cls} index={idx} />
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
// SECTION 6: Galeri + Testimoni (digabung)
// ────────────────────────────────────────────────────────────────────────────
const GALLERY_PHOTOS = [
  { src: '/gallery/foto-1.jpeg', alt: 'Suasana kajian santri Markaz Fiqih' },
  { src: '/gallery/foto-2.jpeg', alt: 'Haflah Takrim Akademi Markaz Fiqih' },
  { src: '/gallery/foto-3.jpeg', alt: 'Sesi pembelajaran bersama pengajar' },
  { src: '/gallery/foto-4.jpeg', alt: 'Pengajian rutin Markaz Fiqih' },
  { src: '/gallery/foto-5.jpeg', alt: 'Santri belajar fiqih bersama' },
  { src: '/gallery/foto-6.jpeg', alt: 'Kajian bersama pengajar Markaz Fiqih' },
];

function CommunitySection({
  testimonials,
}: {
  testimonials: Array<{
    id: string;
    name: string;
    role: string | null;
    content: string;
    photoUrl: string | null;
  }>;
}) {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-20 max-w-[1200px]">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest text-[hsl(var(--accent))] uppercase mb-3">
            Komunitas
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            Belajar Bersama,{' '}
            <span className="text-primary">Tumbuh Bersama.</span>
          </h2>
        </div>

        {/* Layout: galeri kiri (2 col) + testimoni kanan (1 col) pada desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

          {/* Galeri — mengambil 2/3 lebar */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {GALLERY_PHOTOS.map((photo, idx) => (
              <div
                key={idx}
                className={[
                  'overflow-hidden rounded-xl',
                  // Foto pertama lebih besar (2 kolom) di grid xl
                  idx === 0 ? 'xl:col-span-2 aspect-[16/9]' : 'aspect-[4/3]',
                ].join(' ')}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>

          {/* Testimoni — 1/3 lebar, scroll vertikal */}
          <div className="flex flex-col gap-4">
            {testimonials.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                Testimoni segera hadir.
              </div>
            )}
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
                  className="relative rounded-xl border border-[hsl(var(--brand-gold))]/25 bg-card p-6 overflow-hidden"
                >
                  {/* Aksen gold kiri */}
                  <div className="absolute top-0 left-0 h-full w-[3px] rounded-l-xl bg-gradient-to-b from-[hsl(var(--accent))] to-[hsl(var(--accent))]/20" />

                  {/* Quote mark besar */}
                  <span
                    className="font-serif text-5xl font-bold leading-none select-none"
                    style={{ color: 'hsl(var(--accent) / 0.25)' }}
                    aria-hidden="true"
                  >
                    &ldquo;
                  </span>
                  <p className="text-sm italic text-foreground leading-relaxed -mt-2 mb-5">
                    {t.content}
                  </p>
                  <div className="flex items-center gap-3 pt-3 border-t border-border">
                    {t.photoUrl ? (
                      <img
                        src={t.photoUrl}
                        alt={t.name}
                        loading="lazy"
                        className="h-8 w-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{t.name}</p>
                      {t.role && (
                        <p className="text-[11px] text-muted-foreground">{t.role}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 7: Social / CTA bawah
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

          {/* Kiri — teks */}
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
              Ada pertanyaan tentang kelas?
            </h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-md">
              Chat langsung dengan admin atau ikuti kami di media sosial untuk
              mendapat info kelas terbaru, jadwal kajian, dan cuplikan materi.
            </p>
          </div>

          {/* Kanan — aksi */}
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
// Footer
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
// Halaman Landing
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
  const instructors = rawInstructors.map((inst) => ({
    ...inst,
    bio: inst.bio ?? undefined,
  }));
  const testimonials = Array.isArray(testimonialsQuery.data) ? testimonialsQuery.data : [];
  const settings = settingsQuery.data;

  const featuredClasses = useMemo(() => allClasses.slice(0, 4), [allClasses]);
  const socialLinks = useMemo(() => buildSocialLinks(settings ?? undefined), [settings]);

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
        {/* 1. Hero — sudut naratif Kairo / sanad */}
        <HeroSection socialLinks={socialLinks} />

        {/* 2. Stats bold — angka besar sebagai statement visual */}
        <StatsSection
          totalClasses={allClasses.length}
          totalInstructors={instructors.length}
          studentCountLabel={settings?.studentCountLabel}
        />

        {/* 3. Jalur Ilmu — kurikulum spesifik Markaz, bukan "5 langkah cara pakai" */}
        <CurriculumSection />

        {/* 4. Pengajar — naik sebelum kelas, establish kredibilitas dulu */}
        {(instructorsQuery.isLoading || instructors.length > 0) && (
          <InstructorsSection
            instructors={instructors}
            isLoading={instructorsQuery.isLoading}
          />
        )}

        {/* 5. Kelas Pilihan */}
        <FeaturedClassesSection
          classes={featuredClasses}
          isLoading={classesQuery.isLoading}
        />

        {/* 6. Komunitas — galeri + testimoni digabung */}
        <CommunitySection testimonials={testimonials} />

        {/* 7. Social / kontak */}
        <ContactSection
          socialLinks={socialLinks}
          contactPhone={settings?.contactPhone ?? null}
        />
      </main>

      <LandingFooter />
    </div>
  );
}
