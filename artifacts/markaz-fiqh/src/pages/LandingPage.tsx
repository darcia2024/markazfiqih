import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import {
  BookOpen,
  Layers,
  Library,
  GraduationCap,
  ArrowRight,
  Instagram,
  Facebook,
  Youtube,
  Clock,
  Quote,
  Music2,
  Search,
  ShoppingCart,
  CreditCard,
  Unlock,
  TrendingUp,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { listClasses, listInstructors, listTestimonials, getSettings } from '@/lib/db';
import {
  ClassCard,
  ClassCardSkeleton,
  type ClassSummary,
} from '@/pages/CatalogPage';

// ── Helper: konversi nomor lokal ke format wa.me (internasional) ────────────
function toWaUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) return `https://wa.me/${digits}`;
  if (digits.startsWith('0')) return `https://wa.me/62${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

// ── Ikon TikTok (belum tersedia di lucide-react, jadi pakai SVG custom) ────
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82c-.9-.88-1.4-2.08-1.4-3.32h-3.13v13.44c0 1.6-1.3 2.9-2.9 2.9a2.9 2.9 0 0 1 0-5.8c.27 0 .53.03.78.1V9.98a6.03 6.03 0 0 0-.78-.05A6.03 6.03 0 0 0 3.15 16a6.03 6.03 0 0 0 6.02 6.02A6.03 6.03 0 0 0 15.19 16V8.66a8.16 8.16 0 0 0 4.76 1.52V7.05a4.85 4.85 0 0 1-3.35-1.23Z" />
    </svg>
  );
}

// ── Nilai dasar lembaga ─────────────────────────────────────────────────
const CORE_VALUES = ['Keilmuan', 'Amanah', 'Profesionalisme', 'Pelayanan Umat'];

// ── Sosial media (URL diambil dari pengaturan situs) ────────────────────
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

// ── Category metadata (ikon & deskripsi singkat, jumlah dihitung dari data asli) ──
const CATEGORY_META: Record<string, { icon: typeof Layers; description: string }> = {
  'Fiqih Tematik': {
    icon: Layers,
    description: 'Bahasan fiqih per tema — thaharah, sholat, muamalah, dan lainnya.',
  },
  'Fiqih Kitab': {
    icon: Library,
    description: 'Kajian mendalam kitab-kitab fiqih klasik madzhab Syafi\'i.',
  },
  Akademi: {
    icon: GraduationCap,
    description: 'Program terstruktur jangka panjang untuk penguasaan fiqih menyeluruh.',
  },
};

const DEFAULT_CATEGORY_ICON = Layers;

// ── Hero ─────────────────────────────────────────────────────────────────
function HeroSection({
  socialLinks,
}: {
  socialLinks: Array<{ label: string; icon: typeof Instagram | typeof TikTokIcon; href: string }>;
}) {
  return (
    <section className="relative bg-gradient-to-br from-primary to-[hsl(var(--brand-red-hover))] overflow-hidden">
      {/* Grid dekoratif sangat subtle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Konten — satu kolom, center penuh */}
      <div className="relative z-10 flex flex-col items-center text-center px-5 sm:px-8 py-16 sm:py-20">

        {/* Badge pill */}
        <div className="inline-flex items-center gap-2 border border-white/15 bg-white/10 rounded-full px-4 py-1.5 mb-7">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
          <span className="text-xs font-medium text-white/80 tracking-wide">
            Kelas Terverifikasi &amp; Fleksibel
          </span>
        </div>

        {/* Judul */}
        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight max-w-4xl">
          Belajar Fiqih Terstruktur.{' '}
          <span className="block">Berkembang Lebih Cepat.</span>
        </h1>

        {/* Deskripsi */}
        <p className="text-white/75 text-base mt-6 leading-relaxed max-w-xl">
          Markaz Fiqih menghadirkan kelas-kelas fiqih madzhab Syafi'i yang tersusun rapi,
          dibimbing langsung oleh para pengajar berkompeten — mulai dari thaharah hingga
          kajian kitab klasik, semua bisa kamu pelajari sesuai ritme belajarmu sendiri.
        </p>

        {/* CTA */}
        <div className="mt-8">
          <Button
            asChild
            size="lg"
            className="h-[48px] px-8 text-sm font-semibold rounded-[10px] bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--brand-gold-hover))]"
          >
            <Link href="/katalog">Jelajahi Kelas</Link>
          </Button>
        </div>

        {/* Social links */}
        <div className="mt-10 flex items-center gap-3">
          <span className="text-xs font-medium text-white/75">Ikuti Kami</span>
          {socialLinks.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href || '#'}
              aria-label={label}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[hsl(var(--brand-red-deep))] hover:scale-105 transition-transform"
            >
              <Icon className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}

// ── Cara Belajar ─────────────────────────────────────────────────────────
const HOW_IT_WORKS: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: 'Jelajahi Katalog',
    description: 'Cari kelas fiqih sesuai minat dan levelmu.',
    icon: Search,
  },
  {
    title: 'Tambahkan ke Keranjang',
    description: 'Pilih satu atau beberapa kelas sekaligus.',
    icon: ShoppingCart,
  },
  {
    title: 'Bayar dengan Mudah',
    description: 'QRIS, e-wallet, virtual account, atau kartu.',
    icon: CreditCard,
  },
  {
    title: 'Kelas Langsung Terbuka',
    description: 'Akses otomatis begitu pembayaran terverifikasi.',
    icon: Unlock,
  },
  {
    title: 'Belajar & Pantau Progress',
    description: 'Tonton kapan saja, progressmu tersimpan otomatis.',
    icon: TrendingUp,
  },
];

function HowItWorksSection() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 max-w-[1200px]">
        {/* Blok teks atas */}
        <div className="max-w-2xl mb-8">
          <p className="text-xs font-semibold tracking-wider text-[hsl(var(--accent))] uppercase">
            Cara Belajar
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-2 text-foreground">
            Belajar Jadi Lebih Terarah
          </h2>
          <p className="text-muted-foreground text-base mt-3 leading-relaxed">
            Biar proses belajarmu makin jelas arahnya, ini lima langkah yang bakal
            kamu lalui — dari eksplor kelas sampai pantau progress belajar, semua
            dirancang biar simpel dan nggak ribet.
          </p>
        </div>

        {/* Grid 5 card horizontal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {HOW_IT_WORKS.map((step, index) => {
              const stepNum = index + 1;
              const isLast = index === HOW_IT_WORKS.length - 1;
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className={[
                    'relative rounded-lg overflow-hidden bg-gradient-to-br from-primary to-[hsl(var(--brand-red-hover))] p-5 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300',
                    isLast
                      ? 'border border-[hsl(var(--brand-gold))]/40 shadow-[0_0_20px_rgba(184,134,46,0.15)]'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {/* Icon */}
                  <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                  </div>

                  {/* Step badge */}
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-white/70 bg-white/10 px-2 py-1 rounded-full mb-2">
                    Langkah {stepNum}
                  </span>

                  <p className="font-serif font-semibold text-base leading-snug">
                    {step.title}
                  </p>
                  <p className="text-sm text-white/70 mt-1 leading-relaxed">{step.description}</p>

                  {/* Watermark number */}
                  <span className="absolute bottom-2 right-4 font-serif text-6xl font-bold text-white/10 leading-none select-none">
                    {stepNum}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}

// ── Kelas Pilihan ────────────────────────────────────────────────────────
function FeaturedClassesSection({
  classes,
  isLoading,
}: {
  classes: ClassSummary[];
  isLoading: boolean;
}) {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-12 sm:py-16 max-w-[1200px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-[26px] font-semibold text-foreground leading-8">
              Kelas Pilihan
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Kelas fiqih terbaru yang bisa kamu mulai hari ini
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => <ClassCardSkeleton key={i} />)}

          {!isLoading && classes.map((cls, idx) => <ClassCard key={cls.id} cls={cls} index={idx} />)}
        </div>

        {!isLoading && classes.length === 0 && (
          <p className="text-center text-muted-foreground py-10">
            Belum ada kelas yang dipublikasikan saat ini.
          </p>
        )}

        <div className="flex justify-center mt-10">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-[44px] px-6 text-sm font-semibold rounded-[10px] border-2 border-[hsl(var(--accent))] text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/5 hover:border-[hsl(var(--brand-gold-hover))] hover:text-[hsl(var(--brand-gold-hover))]"
          >
            <Link href="/katalog">
              Lihat Semua Kelas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ── Kategori Kelas ───────────────────────────────────────────────────────
function CategorySection({
  categoryCounts,
  isLoading,
}: {
  categoryCounts: Array<{ category: string; count: number }>;
  isLoading: boolean;
}) {
  if (!isLoading && categoryCounts.length === 0) return null;

  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-12 sm:py-16 max-w-[1200px]">
        <h2 className="font-serif text-[26px] font-semibold text-foreground leading-8 mb-6">
          Kategori Kelas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[220px] rounded-lg border border-border bg-card animate-pulse"
              />
            ))}

          {!isLoading &&
            categoryCounts.map(({ category, count }) => {
              const meta = CATEGORY_META[category];
              const Icon = meta?.icon ?? DEFAULT_CATEGORY_ICON;
              return (
                <Link
                  key={category}
                  href={`/katalog?category=${encodeURIComponent(category)}`}
                  className="group block h-full"
                >
                  <div className="relative h-full min-h-[220px] flex flex-col rounded-lg bg-gradient-to-br from-primary to-[hsl(var(--brand-red-hover))] p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-friendly overflow-hidden">

                    {/* Watermark icon dekoratif */}
                    <Icon className="absolute bottom-3 right-4 h-32 w-32 text-white opacity-10 group-hover:opacity-[0.15] group-hover:scale-110 transition-all duration-300 select-none pointer-events-none" />

                    {/* Konten utama */}
                    <div className="flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-white/15 text-white mb-4">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-white mb-2">
                        {category}
                      </h3>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {meta?.description ?? 'Kumpulan kelas fiqih dalam kategori ini.'}
                      </p>
                    </div>

                    {/* Footer dengan pemisah */}
                    <div className="border-t border-white/15 mt-4 pt-4 flex items-center justify-between">
                      <p className="text-sm font-semibold text-[hsl(var(--brand-gold-pale))]">
                        {count} Kelas
                      </p>
                      <ArrowRight className="h-4 w-4 text-white/50 group-hover:text-white/90 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </section>
  );
}

// ── Tentang Markaz Fiqih ─────────────────────────────────────────────────
function AboutSection({
  testimonials,
}: {
  testimonials: Array<{ id: string; name: string; role: string | null; content: string }>;
}) {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-start">

          {/* Kolom kiri — teks (3/5 lebar) */}
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold tracking-wider text-[hsl(var(--accent))] uppercase mb-4">
              Tentang Kami
            </p>

            {/* Quote misi dengan aksen garis gold */}
            <div className="flex gap-4 mb-6">
              <div className="w-1 flex-shrink-0 rounded-full bg-[hsl(var(--brand-gold))] opacity-80" />
              <p className="font-serif text-2xl font-bold italic text-primary leading-snug">
                &ldquo;Membumikan Fiqih di Setiap Lini Kehidupan&rdquo;
              </p>
            </div>

            <p className="text-base leading-[26px] text-muted-foreground mb-6">
              Markaz Fiqih adalah lembaga keilmuan independen yang berfokus pada pendidikan,
              publikasi, kaderisasi, dan pengembangan kajian fiqih berbasis turats madzhab
              Syafi'i.
            </p>

            {/* CORE_VALUES badges */}
            <div className="flex flex-wrap gap-2">
              {CORE_VALUES.map((value) => (
                <Badge key={value} variant="gold">
                  {value}
                </Badge>
              ))}
            </div>
          </div>

          {/* Kolom kanan — testimoni (2/5 lebar) */}
          {testimonials.length > 0 && (
            <div className="lg:col-span-2 flex flex-col gap-4">
              {testimonials.map((testimonial) => {
                const initials = testimonial.name
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase();
                return (
                  <div
                    key={testimonial.id}
                    className="bg-card rounded-xl shadow-md border border-[hsl(var(--brand-gold))]/20 p-6 relative overflow-hidden"
                  >
                    {/* Aksen gold tipis di pojok kiri atas */}
                    <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl bg-gradient-to-b from-[hsl(var(--brand-gold))] to-[hsl(var(--brand-gold))]/20" />

                    <Quote className="text-[hsl(var(--brand-gold-pale))] w-7 h-7 mb-3" />
                    <p className="text-sm italic text-foreground leading-relaxed mb-4">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>

                    {/* Footer: avatar + nama */}
                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                      <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-tight">
                          {testimonial.name}
                        </p>
                        {testimonial.role && (
                          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Peran default untuk pengajar (bisa disesuaikan per instruktur nanti) ──
const INSTRUCTOR_ROLE_LABEL = 'Pengajar Fiqih';

// ── Pengajar Kami ────────────────────────────────────────────────────────
function TeachersSection({
  instructors,
  isLoading,
}: {
  instructors: Array<{ id: string; name: string; photoUrl: string; bio?: string; classCount: number }>;
  isLoading: boolean;
}) {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-12 sm:py-16 max-w-[1200px]">
        <h2 className="font-serif text-[26px] font-semibold text-foreground leading-8 mb-6">
          Pengajar Kami
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-6 animate-pulse h-[220px]" />
            ))}

          {!isLoading &&
            instructors.map((instructor) => (
              <div
                key={instructor.id}
                className="flex flex-col items-center text-center gap-3 rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-friendly"
              >
                <Avatar className="h-16 w-16 border border-border">
                  <AvatarImage src={instructor.photoUrl} alt={instructor.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {instructor.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold text-foreground leading-tight">
                    {instructor.name}
                  </p>
                  <p className="text-xs font-medium text-primary mt-0.5">
                    {INSTRUCTOR_ROLE_LABEL}
                  </p>
                </div>
                {/* Separator antara header (avatar+nama) dan bio */}
                <div className="border-t border-border w-full" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {instructor.bio || `Mengampu ${instructor.classCount} kelas fiqih di Markaz Fiqih.`}
                </p>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

// ── Galeri Foto ───────────────────────────────────────────────────────────
const GALLERY_PHOTOS = [
  { src: '/gallery/foto-1.jpeg', alt: 'Suasana kajian santri Markaz Fiqih' },
  { src: '/gallery/foto-2.jpeg', alt: 'Haflah Takrim Akademi Markaz Fiqih' },
  { src: '/gallery/foto-3.jpeg', alt: 'Sesi pembelajaran bersama pengajar' },
  { src: '/gallery/foto-4.jpeg', alt: 'Pengajian rutin Markaz Fiqih' },
  { src: '/gallery/foto-5.jpeg', alt: 'Santri belajar fiqih bersama' },
  { src: '/gallery/foto-6.jpeg', alt: 'Kajian bersama pengajar Markaz Fiqih' },
];

function GallerySection() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-12 sm:py-16 max-w-[1200px]">
        <p className="text-xs font-semibold tracking-wider text-[hsl(var(--accent))] uppercase mb-2">
          Galeri
        </p>
        <h2 className="font-serif text-[26px] font-semibold text-foreground leading-8 mb-2">
          Kegiatan Kami
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          Bergabung bersama ratusan santri yang sudah merasakan manfaatnya
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {GALLERY_PHOTOS.map((photo, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-xl shadow-sm"
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full aspect-[4/3] object-cover transition-transform duration-300 ease-in-out hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Sosial Media ─────────────────────────────────────────────────────────
function SocialSection({
  socialLinks,
  contactPhone,
}: {
  socialLinks: Array<{ label: string; icon: typeof Instagram | typeof TikTokIcon; href: string }>;
  contactPhone: string | null;
}) {
  return (
    <section className="bg-gradient-to-br from-primary to-[hsl(var(--brand-red-hover))]">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-14 max-w-[1200px] text-center">
        <h2 className="font-serif text-2xl font-bold text-white mb-2">
          Ikuti &amp; Hubungi Kami
        </h2>
        <p className="text-sm text-white/70 mb-10 max-w-md mx-auto">
          Dapatkan kajian, info kelas terbaru, dan tanya langsung ke admin kami
          di media sosial atau WhatsApp.
        </p>

        {/* Ikon sosial media dengan label */}
        <div className="flex items-end justify-center gap-5 flex-wrap mb-10">
          {socialLinks.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href || '#'}
              aria-label={label}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              <span className="h-12 w-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-[hsl(var(--accent))] group-hover:border-[hsl(var(--accent))] group-hover:scale-110 group-hover:shadow-lg transition-all duration-200">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-medium text-white/60 group-hover:text-white/90 transition-colors">
                {label}
              </span>
            </a>
          ))}
        </div>

        {/* Tombol WhatsApp Admin — hanya tampil kalau contactPhone tersedia */}
        {contactPhone && (
          <a
            href={toWaUrl(contactPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 h-[48px] px-7 rounded-[10px] bg-[hsl(var(--accent))] text-white text-sm font-semibold hover:bg-[hsl(var(--brand-gold-hover))] hover:scale-[1.02] shadow-lg transition-all duration-200"
          >
            <MessageCircle className="h-4.5 w-4.5 shrink-0" />
            Chat Admin via WhatsApp
          </a>
        )}
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────
function LandingFooter({
  socialLinks,
}: {
  socialLinks: Array<{ label: string; icon: typeof Instagram | typeof TikTokIcon; href: string }>;
}) {
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-8 max-w-[1200px]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <img src="/logo.png" alt="Markaz Fiqih" className="h-7 w-auto brightness-0" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Markaz Fiqih. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Halaman Landing ──────────────────────────────────────────────────────
// Hanya ditampilkan untuk user yang belum login — user yang sudah login
// otomatis diarahkan ke halaman katalog (/katalog).
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
    classCount: allClasses.filter((cls) => cls.instructor?.id === inst.id).length,
  }));
  const testimonials = Array.isArray(testimonialsQuery.data) ? testimonialsQuery.data : [];
  const settings = settingsQuery.data;

  const featuredTestimonials = useMemo(() => testimonials.slice(0, 1), [testimonials]);
  const socialLinks = useMemo(() => buildSocialLinks(settings ?? undefined), [settings]);

  const featuredClasses = useMemo(() => allClasses.slice(0, 4), [allClasses]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const cls of allClasses) {
      if (!cls.category) continue;
      counts.set(cls.category, (counts.get(cls.category) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [allClasses]);

  useEffect(() => {
    if (!isAuthLoading && user) {
      setLocation('/dashboard');
    }
  }, [isAuthLoading, user, setLocation]);

  // Selagi status login dicek, atau user ternyata sudah login (sedang
  // menunggu redirect), jangan render konten landing sama sekali.
  if (isAuthLoading || user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <HeroSection socialLinks={socialLinks} />

        <HowItWorksSection />

        <FeaturedClassesSection classes={featuredClasses} isLoading={classesQuery.isLoading} />

        <CategorySection categoryCounts={categoryCounts} isLoading={classesQuery.isLoading} />

        <AboutSection testimonials={featuredTestimonials} />

        {(instructorsQuery.isLoading || instructors.length > 0) && (
          <TeachersSection
            instructors={instructors}
            isLoading={instructorsQuery.isLoading}
          />
        )}

        <GallerySection />

        <SocialSection socialLinks={socialLinks} contactPhone={settings?.contactPhone ?? null} />
      </main>

      <LandingFooter socialLinks={socialLinks} />
    </div>
  );
}
