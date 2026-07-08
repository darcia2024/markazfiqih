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

// ── Data kurikulum ───────────────────────────────────────────────────────────
const CURRICULUM_STAGES = [
  {
    stage: '01',
    title: 'Fiqih Tematik',
    subtitle: 'Fondasi',
    topics: ['Thaharah', 'Sholat', 'Zakat & Puasa', 'Muamalah Sehari-hari'],
    description:
      'Mulai dari bab thaharah hingga muamalah — materi fiqih yang relevan langsung untuk kehidupan, disusun per tema agar mudah dicerna.',
  },
  {
    stage: '02',
    title: 'Fiqih Kitab',
    subtitle: 'Kajian Klasik',
    topics: ['Matan Taqrib', 'Fath al-Qarib', 'Minhaj al-Thalibin', 'Al-Muhadzdzab'],
    description:
      "Baca dan pahami kitab-kitab rujukan madzhab Syafi'i langsung dari sumbernya — dibimbing pengajar yang telah mempelajari kitab-kitab ini di Kairo.",
  },
  {
    stage: '03',
    title: 'Akademi',
    subtitle: 'Program Panjang',
    topics: ['Kurikulum Bertahap', 'Ujian Berkala', 'Ijazah Kelulusan', 'Alumni Aktif'],
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

          {/* Kolom kiri */}
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 border border-white/20 bg-white/10 rounded-full px-3.5 py-1.5 mb-7">
              <MapPin className="h-3 w-3 text-[hsl(var(--accent))]" />
              <span className="text-xs font-medium text-white/80 tracking-wide">
                Dari Kairo, untuk Indonesia
              </span>
            </div>

            <h1 className="font-serif font-bold text-white leading-[1.05] tracking-tight">
              <span className="block text-5xl sm:text-6xl lg:text-7xl">
                Fiqih yang
              </span>
              <span
                className="block text-5xl sm:text-6xl lg:text-7xl"
                style={{ color: 'hsl(var(--accent))' }}
              >
                Bersanad.
              </span>
              <span className="block text-2xl sm:text-3xl lg:text-4xl text-white/80 font-normal mt-3 font-sans">
                Kurikulum dari Kairo.
              </span>
            </h1>

            <p className="text-white/70 text-base mt-6 leading-relaxed max-w-lg">
              Markaz Fiqih bukan platform kursus online generik. Ini adalah kurikulum
              madzhab Syafi'i yang tersusun dari thaharah hingga kajian kitab klasik,
              diajarkan oleh pelajar Indonesia yang berguru langsung di Al-Azhar Kairo.
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

          {/* Kolom kanan — kutipan misi */}
          <div className="hidden lg:flex flex-col items-end justify-center pl-16">
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
            <div className="mt-8 flex justify-end">
              <div className="h-px w-32 bg-gradient-to-l from-[hsl(var(--accent))] to-transparent" />
            </div>
            <div className="mt-2 flex justify-end">
              <div className="h-px w-20 bg-gradient-to-l from-[hsl(var(--accent))]/40 to-transparent" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 2: Manifesto + Stats
// Menggantikan StatsSection terpisah — statement editorial bold + angka embedded
// ────────────────────────────────────────────────────────────────────────────
function ManifestoSection({
  totalClasses,
  totalInstructors,
  studentCountLabel,
}: {
  totalClasses: number;
  totalInstructors: number;
  studentCountLabel: string | null | undefined;
}) {
  const stats = [
    { value: totalClasses > 0 ? `${totalClasses}` : '—', label: 'Kelas fiqih terstruktur' },
    { value: totalInstructors > 0 ? `${totalInstructors}` : '—', label: 'Pengajar dari Al-Azhar' },
    { value: studentCountLabel ?? '—', label: 'Santri sudah bergabung' },
  ];

  return (
    <section className="bg-[hsl(var(--brand-red-deep))]">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-20 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12 items-end">

          {/* Kiri: statement editorial */}
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-5"
              style={{ color: 'hsl(var(--accent))' }}>
              Kenapa berbeda
            </p>
            <p className="font-serif text-2xl sm:text-3xl lg:text-[2.1rem] text-white font-bold leading-[1.4] max-w-3xl">
              Bukan kumpulan ceramah yang dikemas ulang.{' '}
              <span className="text-white/45">
                Ini fiqih madzhab Syafi'i yang tersusun mengikuti urutan keilmuan
                klasik — persis seperti yang dipelajari pengajar kami di Al-Azhar Kairo.
              </span>
            </p>
          </div>

          {/* Kanan: tiga angka bold */}
          <div className="flex flex-row lg:flex-col gap-8 lg:gap-7 lg:text-right">
            {stats.map((stat) => (
              <div key={stat.label} className="flex-1 lg:flex-none">
                <p
                  className="font-serif text-4xl sm:text-5xl font-bold leading-none"
                  style={{ color: 'hsl(var(--accent))' }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-white/40 mt-1.5 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 3: Pengajar & Sanad
// Naik ke posisi 3 (sebelum kurikulum) — establish kredibilitas lebih awal
// ────────────────────────────────────────────────────────────────────────────
function InstructorsSection({
  instructors,
  isLoading,
}: {
  instructors: Array<{ id: string; name: string; photoUrl: string; bio?: string }>;
  isLoading: boolean;
}) {
  return (
    <section className="bg-background border-b border-border">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-20 max-w-[1200px]">

        {/* Header: label vertikal + headline */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 mb-14 items-start">
          <div className="lg:pt-1">
            <p
              className="text-[11px] font-bold tracking-[0.2em] uppercase"
              style={{ color: 'hsl(var(--accent))' }}
            >
              Pengajar
            </p>
            <div
              className="hidden lg:block mt-4 w-px h-16"
              style={{ background: 'linear-gradient(to bottom, hsl(var(--accent)), transparent)' }}
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Berguru dari{' '}
              <span className="text-primary">yang Berguru di Kairo.</span>
            </h2>
            <p className="text-muted-foreground text-base mt-4 leading-relaxed max-w-xl">
              Tradisi keilmuan Islam diwariskan melalui sanad — rantai guru ke murid yang
              menjaga validitas ilmu. Pengajar Markaz Fiqih menimba ilmu langsung di
              Kairo, membawa tradisi itu untuk santri di Indonesia.
            </p>
          </div>
        </div>

        {/* Grid pengajar */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {instructors.map((instructor) => (
              <div
                key={instructor.id}
                className="group relative rounded-2xl border border-border bg-card p-6 hover:border-[hsl(var(--accent))]/50 hover:shadow-md transition-all duration-200"
              >
                {/* Garis atas gold saat hover */}
                <div
                  className="absolute top-0 left-6 right-6 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'linear-gradient(to right, hsl(var(--accent)), transparent)' }}
                  aria-hidden="true"
                />
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 shrink-0 rounded-xl border border-border">
                    <AvatarImage src={instructor.photoUrl} alt={instructor.name} loading="lazy" />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-sm font-bold">
                      {instructor.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground leading-snug">
                      {instructor.name}
                    </p>
                    <p
                      className="text-xs font-semibold mt-0.5 mb-2"
                      style={{ color: 'hsl(var(--accent))' }}
                    >
                      Al-Azhar · Kairo, Mesir
                    </p>
                    {instructor.bio && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {instructor.bio}
                      </p>
                    )}
                  </div>
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
// SECTION 4: Jalur Kurikulum — layout timeline, bukan 3 kartu grid setara
// ────────────────────────────────────────────────────────────────────────────
function CurriculumSection() {
  return (
    <section className="bg-muted/30">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-20 max-w-[1200px]">

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 mb-14 items-start">
          <div className="lg:pt-1">
            <p
              className="text-[11px] font-bold tracking-[0.2em] uppercase"
              style={{ color: 'hsl(var(--accent))' }}
            >
              Jalur Ilmu
            </p>
            <div
              className="hidden lg:block mt-4 w-px h-16"
              style={{ background: 'linear-gradient(to bottom, hsl(var(--accent)), transparent)' }}
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Bukan Ceramah Acak.{' '}
              <span className="text-primary">Kurikulum Terstruktur.</span>
            </h2>
            <p className="text-muted-foreground text-base mt-4 leading-relaxed max-w-xl">
              Setiap kelas dirancang mengikuti urutan keilmuan madzhab Syafi'i — dari
              fondasi fiqih tematik hingga kajian kitab-kitab klasik yang menjadi
              rujukan ulama selama berabad-abad.
            </p>
          </div>
        </div>

        {/* Timeline: tiap tahap = satu baris penuh, bukan 1/3 kolom */}
        <div className="divide-y divide-border">
          {CURRICULUM_STAGES.map((stage, idx) => (
            <div
              key={stage.stage}
              className="grid grid-cols-1 lg:grid-cols-[100px_1fr_auto] gap-5 lg:gap-10 py-10 items-start"
            >
              {/* Nomor tahap — sangat besar, jadi statement visual sendiri */}
              <div className="flex lg:block items-center gap-3 lg:gap-0">
                <span
                  className="font-serif text-7xl sm:text-8xl font-bold leading-none select-none"
                  style={{
                    color: idx === 0
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--border))',
                  }}
                >
                  {stage.stage}
                </span>
                {/* Label subtitle tampil di samping nomor di mobile */}
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.18em] lg:hidden"
                  style={{ color: 'hsl(var(--accent))' }}
                >
                  {stage.subtitle}
                </p>
              </div>

              {/* Konten tengah */}
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2 hidden lg:block"
                  style={{ color: 'hsl(var(--accent))' }}
                >
                  {stage.subtitle}
                </p>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground mb-3 leading-snug">
                  {stage.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                  {stage.description}
                </p>
              </div>

              {/* Tag topik — kanan di desktop, bawah konten di mobile */}
              <div className="flex flex-wrap gap-2 lg:justify-end lg:max-w-[200px] lg:pt-8">
                {stage.topics.map((topic) => (
                  <span
                    key={topic}
                    className="text-[11px] font-medium px-3 py-1 rounded-full bg-background border border-border text-muted-foreground"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-start">
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
// SECTION 6: Testimoni — dipisah dari galeri, format lebih kuat
// Galeri foto dihapus — tidak menambah nilai pembeda
// ────────────────────────────────────────────────────────────────────────────
function TestimonialsSection({
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
  if (testimonials.length === 0) return null;

  return (
    <section className="bg-[hsl(var(--brand-red-tint))] border-y border-[hsl(var(--brand-red-border))]">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-20 max-w-[1200px]">

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 mb-12 items-start">
          <div className="lg:pt-1">
            <p
              className="text-[11px] font-bold tracking-[0.2em] uppercase"
              style={{ color: 'hsl(var(--primary))' }}
            >
              Kata Santri
            </p>
            <div
              className="hidden lg:block mt-4 w-px h-16"
              style={{ background: 'linear-gradient(to bottom, hsl(var(--primary)), transparent)' }}
              aria-hidden="true"
            />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            Mereka yang Sudah{' '}
            <span className="text-primary">Merasakannya.</span>
          </h2>
        </div>

        {/* Grid testimoni */}
        <div
          className={[
            'grid gap-5',
            testimonials.length === 1
              ? 'grid-cols-1 max-w-2xl'
              : 'grid-cols-1 lg:grid-cols-2',
          ].join(' ')}
        >
          {testimonials.map((t, idx) => {
            const initials = t.name
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase();
            return (
              <div
                key={t.id}
                className={[
                  'relative rounded-2xl bg-white border border-[hsl(var(--brand-red-border))]/40 p-8 flex flex-col',
                  // Testimoni pertama span 2 kolom jika ada 3+
                  testimonials.length >= 3 && idx === 0 ? 'lg:col-span-2' : '',
                ].join(' ')}
              >
                {/* Quote mark besar */}
                <span
                  className="font-serif font-bold leading-none select-none block mb-3"
                  style={{ fontSize: '3.5rem', lineHeight: 1, color: 'hsl(var(--accent) / 0.25)' }}
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                {/* Teks testimoni — lebih besar dari versi lama */}
                <p
                  className={[
                    'text-foreground leading-relaxed flex-1 italic',
                    idx === 0 && testimonials.length >= 3
                      ? 'text-base sm:text-lg'
                      : 'text-base',
                  ].join(' ')}
                >
                  {t.content}
                </p>

                {/* Atribusi */}
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
                  {t.photoUrl ? (
                    <img
                      src={t.photoUrl}
                      alt={t.name}
                      loading="lazy"
                      className="h-10 w-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{t.name}</p>
                    {t.role && (
                      <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
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
// SECTION 7: CTA Akhir + Social
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
              Ada pertanyaan tentang kelas?
            </h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-md">
              Chat langsung dengan admin atau ikuti kami di media sosial untuk
              mendapat info kelas terbaru, jadwal kajian, dan cuplikan materi.
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
        {/* 1. Hero — narasi bersanad + kurikulum dari Kairo */}
        <HeroSection socialLinks={socialLinks} />

        {/* 2. Manifesto + Stats — statement editorial, menggantikan stats section terpisah */}
        <ManifestoSection
          totalClasses={allClasses.length}
          totalInstructors={instructors.length}
          studentCountLabel={settings?.studentCountLabel}
        />

        {/* 3. Pengajar & Sanad — naik sebelum kurikulum, establish kredibilitas dulu */}
        {(instructorsQuery.isLoading || instructors.length > 0) && (
          <InstructorsSection
            instructors={instructors}
            isLoading={instructorsQuery.isLoading}
          />
        )}

        {/* 4. Jalur Kurikulum — timeline horizontal, bukan 3 kartu grid setara */}
        <CurriculumSection />

        {/* 5. Kelas Pilihan */}
        <FeaturedClassesSection
          classes={featuredClasses}
          isLoading={classesQuery.isLoading}
        />

        {/* 6. Testimoni — section tersendiri tanpa galeri foto */}
        <TestimonialsSection testimonials={testimonials} />

        {/* 7. CTA + Social */}
        <ContactSection
          socialLinks={socialLinks}
          contactPhone={settings?.contactPhone ?? null}
        />
      </main>

      <LandingFooter />
    </div>
  );
}
