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
} from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import {
  useListClasses,
  useListInstructors,
  useListTestimonials,
  useGetSettings,
} from '@workspace/api-client-react';
import {
  ClassCard,
  ClassCardSkeleton,
  type ClassSummary,
} from '@/pages/CatalogPage';

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
    <section className="bg-background">
      <div className="relative rounded-[14px] overflow-hidden mx-4 mt-4">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1585036156171-384164a8c675?w=1200&q=80"
          alt="Kajian Fiqih"
          className="w-full h-[480px] sm:h-[520px] object-cover"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--brand-red-deep))]/90 via-[hsl(var(--brand-red-deep))]/40 to-transparent" />

        {/* Top-right: social icons */}
        <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
          <span className="text-xs font-medium text-white/90 mr-1">Ikuti Kami</span>
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

        {/* Bottom-left: text + CTA */}
        <div className="absolute bottom-8 left-8 sm:left-12 z-10 max-w-lg">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight">
            Belajar Fiqih Terstruktur.{' '}
            <span className="block">Berkembang Lebih Cepat.</span>
          </h1>
          <p className="text-white/80 text-base mt-3">
            Markaz Fiqih menghadirkan kelas-kelas fiqih madzhab Syafi'i yang tersusun rapi,
            dibimbing langsung oleh para pengajar berkompeten — mulai dari thaharah hingga
            kajian kitab klasik, semua bisa kamu pelajari sesuai ritme belajarmu sendiri.
          </p>
          <div className="mt-5">
            <Button
              asChild
              size="lg"
              className="h-[44px] px-6 text-sm font-semibold rounded-[10px] bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--brand-gold-hover))]"
            >
              <Link href="/katalog">Jelajahi Kelas</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Statistik ────────────────────────────────────────────────────────────
function StatsSection({
  classCount,
  instructorCount,
  studentCountLabel,
}: {
  classCount: number;
  instructorCount: number;
  studentCountLabel: string;
}) {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-12 max-w-[1200px]">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="font-serif text-3xl sm:text-4xl font-bold text-primary">
              {classCount}+
            </p>
            <p className="text-sm text-muted-foreground mt-1">Kelas Tersedia</p>
          </div>
          <div>
            <p className="font-serif text-3xl sm:text-4xl font-bold text-primary">
              {instructorCount}+
            </p>
            <p className="text-sm text-muted-foreground mt-1">Pengajar</p>
          </div>
          <div>
            <p className="font-serif text-3xl sm:text-4xl font-bold text-primary">
              {studentCountLabel}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Santri Aktif</p>
          </div>
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
            className="h-[44px] px-6 text-sm font-semibold rounded-[10px] border-2 border-primary text-primary hover:bg-[hsl(var(--brand-red-tint))] hover:border-brand-red-hover hover:text-brand-red-hover"
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
    <section className="bg-[hsl(var(--brand-red-tint))]">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-12 sm:py-16 max-w-[1200px]">
        <h2 className="font-serif text-[26px] font-semibold text-foreground leading-8 mb-6">
          Kategori Kelas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[140px] rounded-[14px] border border-border bg-card animate-pulse"
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
                  <div className="h-full flex flex-col gap-3 rounded-[14px] bg-[hsl(var(--brand-red-deep))] p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-white/10 text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-white">
                      {category}
                    </h3>
                    <p className="text-sm text-white/70">
                      {meta?.description ?? 'Kumpulan kelas fiqih dalam kategori ini.'}
                    </p>
                    <p className="text-sm font-semibold text-[hsl(var(--brand-gold-pale))] mt-auto pt-2">
                      {count} Kelas
                    </p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">
              Tentang Kami
            </p>
            <p className="font-serif text-2xl font-bold italic text-primary mt-3 mb-4">
              &ldquo;Membumikan Fiqih di Setiap Lini Kehidupan&rdquo;
            </p>
            <p className="text-base leading-[26px] text-muted-foreground">
              Markaz Fiqih adalah lembaga keilmuan independen yang berfokus pada pendidikan,
              publikasi, kaderisasi, dan pengembangan kajian fiqih berbasis turats madzhab
              Syafi'i.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {CORE_VALUES.map((value) => (
                <Badge key={value} variant="gold">
                  {value}
                </Badge>
              ))}
            </div>
          </div>

          {testimonials.length > 0 && (
            <div className="flex flex-col gap-5">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-card rounded-[14px] shadow-md p-8 relative">
                  <Quote className="text-[hsl(var(--brand-gold-pale))] w-10 h-10 mb-4" />
                  <p className="text-base italic text-foreground mb-4">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {testimonial.name}
                    {testimonial.role ? ` — ${testimonial.role}` : ''}
                  </p>
                </div>
              ))}
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
  founderName,
  founderBio,
  founderPhotoUrl,
}: {
  instructors: Array<{ id: string; name: string; photoUrl: string; bio?: string; classCount: number }>;
  isLoading: boolean;
  founderName: string;
  founderBio: string;
  founderPhotoUrl: string;
}) {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-12 sm:py-16 max-w-[1200px]">
        <h2 className="font-serif text-[26px] font-semibold text-foreground leading-8 mb-6">
          Pengajar Kami
        </h2>

        <div className="bg-[hsl(var(--brand-red-tint))] rounded-[14px] p-6 flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16 border border-border">
            <AvatarImage src={founderPhotoUrl} alt={founderName} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {founderName.split(' ').map((n) => n[0]).join('').substring(0, 2) || 'F'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-serif font-semibold text-foreground">{founderName}</p>
            <p className="text-sm text-muted-foreground">{founderBio}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-[14px] border border-border bg-card p-6 animate-pulse h-[220px]" />
            ))}

          {!isLoading &&
            instructors.map((instructor) => (
              <div
                key={instructor.id}
                className="flex flex-col items-center text-center gap-3 rounded-[14px] border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300"
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
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {instructor.bio || `Mengampu ${instructor.classCount} kelas fiqih di Markaz Fiqih.`}
                </p>
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
}: {
  socialLinks: Array<{ label: string; icon: typeof Instagram | typeof TikTokIcon; href: string }>;
}) {
  return (
    <section className="bg-[hsl(var(--brand-red-tint))]">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-12 max-w-[1200px] text-center">
        <h2 className="font-serif text-[22px] font-semibold text-foreground leading-8 mb-1">
          Ikuti Kami
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Dapatkan kajian dan info kelas terbaru di media sosial kami
        </p>

        <div className="flex items-center justify-center gap-3">
          {socialLinks.map(({ label, icon: Icon, href }) => (
            <Button
              key={label}
              asChild
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-full bg-card border border-border text-primary hover:text-primary"
            >
              <a href={href || '#'} aria-label={label} target="_blank" rel="noopener noreferrer">
                <Icon className="h-5 w-5" />
              </a>
            </Button>
          ))}
        </div>
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
        <div className="flex gap-3 justify-center mb-4">
          {socialLinks.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href || '#'}
              aria-label={label}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-serif text-base font-bold tracking-tight text-primary">
              Markaz Fiqih
            </span>
          </div>
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

  const classesQuery = useListClasses({ sort: 'newest' });
  const instructorsQuery = useListInstructors();
  const testimonialsQuery = useListTestimonials();
  const settingsQuery = useGetSettings();

  const allClasses: ClassSummary[] = Array.isArray(classesQuery.data) ? classesQuery.data : [];
  const instructors = Array.isArray(instructorsQuery.data) ? instructorsQuery.data : [];
  const testimonials = Array.isArray(testimonialsQuery.data) ? testimonialsQuery.data : [];
  const settings = settingsQuery.data;

  const featuredTestimonials = useMemo(() => testimonials.slice(0, 1), [testimonials]);
  const socialLinks = useMemo(() => buildSocialLinks(settings), [settings]);

  const featuredClasses = useMemo(() => allClasses.slice(0, 6), [allClasses]);

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
      setLocation('/katalog');
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

        <StatsSection
          classCount={allClasses.length}
          instructorCount={instructors.length}
          studentCountLabel={settings?.studentCountLabel || '100+'}
        />

        <FeaturedClassesSection classes={featuredClasses} isLoading={classesQuery.isLoading} />

        <CategorySection categoryCounts={categoryCounts} isLoading={classesQuery.isLoading} />

        <AboutSection testimonials={featuredTestimonials} />

        {(instructorsQuery.isLoading || instructors.length > 0) && (
          <TeachersSection
            instructors={instructors}
            isLoading={instructorsQuery.isLoading}
            founderName={settings?.founderName || ''}
            founderBio={settings?.founderBio || ''}
            founderPhotoUrl={settings?.founderPhotoUrl || ''}
          />
        )}

        <SocialSection socialLinks={socialLinks} />
      </main>

      <LandingFooter socialLinks={socialLinks} />
    </div>
  );
}
