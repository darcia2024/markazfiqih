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
} from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useListClasses, useListInstructors } from '@workspace/api-client-react';
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

// ── Sosial media (arahkan ke URL asli nanti) ────────────────────────────
const SOCIAL_LINKS: Array<{ label: string; icon: typeof Instagram | typeof TikTokIcon }> = [
  { label: 'Instagram', icon: Instagram },
  { label: 'Facebook', icon: Facebook },
  { label: 'TikTok', icon: TikTokIcon },
  { label: 'YouTube', icon: Youtube },
];

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
function HeroSection() {
  return (
    <section className="bg-[hsl(var(--brand-red-tint))]">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-20 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">
              Selamat Datang di Markaz Fiqih
            </p>
            <h1 className="mt-3 font-serif text-[32px] sm:text-[40px] font-bold leading-[1.15] sm:leading-[46px] text-foreground">
              Belajar Fiqih Terstruktur, Bersama Pengajar Terpercaya
            </h1>
            <p className="mt-4 text-base leading-[26px] text-muted-foreground max-w-xl">
              Markaz Fiqih menghadirkan kelas-kelas fiqih madzhab Syafi'i yang tersusun rapi,
              dibimbing langsung oleh para pengajar berkompeten — mulai dari thaharah hingga
              kajian kitab klasik, semua bisa kamu pelajari sesuai ritme belajarmu sendiri.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="h-[44px] px-6 text-sm font-semibold rounded-[10px]">
                <Link href="/katalog">Jelajahi Semua Kelas</Link>
              </Button>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <img
              src="https://images.unsplash.com/photo-1584286595398-a59511e18ce2?w=800&q=80"
              alt="Kajian Fiqih"
              className="rounded-[14px] shadow-lg object-cover w-full h-[420px]"
            />
            <div className="absolute top-6 left-[-16px] bg-card rounded-full shadow-md px-4 py-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-primary" />
              Kurikulum Terstruktur
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-[-16px] bg-card rounded-full shadow-md px-4 py-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <GraduationCap className="h-4 w-4 text-primary" />
              Pengajar Kompeten
            </div>
            <div className="absolute bottom-6 left-[-16px] bg-card rounded-full shadow-md px-4 py-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Belajar Fleksibel
            </div>
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
                  <div className="h-full flex flex-col gap-3 rounded-[14px] border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {category}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {meta?.description ?? 'Kumpulan kelas fiqih dalam kategori ini.'}
                    </p>
                    <p className="text-sm font-semibold text-primary mt-auto pt-2">
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
function AboutSection() {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-14 sm:py-20 max-w-[900px] text-center">
        <h2 className="font-serif text-[26px] font-semibold text-foreground leading-8 mb-6">
          Tentang Markaz Fiqih
        </h2>

        <blockquote className="font-serif italic text-2xl sm:text-[28px] leading-snug text-primary mb-6">
          &ldquo;Membumikan Fiqih di Setiap Lini Kehidupan&rdquo;
        </blockquote>

        <p className="text-base leading-[26px] text-muted-foreground max-w-2xl mx-auto">
          Markaz Fiqih adalah lembaga keilmuan independen yang berfokus pada pendidikan,
          publikasi, kaderisasi, dan pengembangan kajian fiqih berbasis turats madzhab
          Syafi'i.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
          {CORE_VALUES.map((value) => (
            <Badge
              key={value}
              variant="outline"
              className="px-3.5 py-1.5 text-[13px] font-medium rounded-full border-brand-red-border text-primary bg-[hsl(var(--brand-red-tint))]"
            >
              {value}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Founder placeholder ──────────────────────────────────────────────────
// TODO: ganti dengan data founder asli (nama, foto, dan bio) begitu tersedia.
const FOUNDER_PLACEHOLDER = {
  id: 'founder-placeholder',
  name: 'Nama Founder',
  role: 'Pendiri Markaz Fiqih',
  photoUrl: 'https://ui-avatars.com/api/?name=Founder&background=A31F2C&color=fff',
  bio: 'Bio founder akan diisi kemudian',
};

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

          {/* Card Founder — data placeholder, lihat TODO di FOUNDER_PLACEHOLDER */}
          {!isLoading && (
            <div className="flex flex-col items-center text-center gap-3 rounded-[14px] border border-brand-red-border bg-[hsl(var(--brand-red-tint))] p-6 shadow-sm">
              <Avatar className="h-16 w-16 border border-border">
                <AvatarImage src={FOUNDER_PLACEHOLDER.photoUrl} alt={FOUNDER_PLACEHOLDER.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">NF</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold text-foreground leading-tight">
                  {FOUNDER_PLACEHOLDER.name}
                </p>
                <p className="text-xs font-medium text-primary mt-0.5">
                  {FOUNDER_PLACEHOLDER.role}
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {FOUNDER_PLACEHOLDER.bio}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Sosial Media ─────────────────────────────────────────────────────────
function SocialSection() {
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
          {SOCIAL_LINKS.map(({ label, icon: Icon }) => (
            <Button
              key={label}
              asChild
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-full bg-card border border-border text-primary hover:text-primary"
            >
              {/* TODO: ganti href="#" dengan URL akun media sosial resmi Markaz Fiqih */}
              <a href="#" aria-label={label} target="_blank" rel="noopener noreferrer">
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
function LandingFooter() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-8 max-w-[1200px]">
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

  const allClasses = (classesQuery.data ?? []) as ClassSummary[];
  const instructors = instructorsQuery.data ?? [];

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
        <HeroSection />

        <FeaturedClassesSection classes={featuredClasses} isLoading={classesQuery.isLoading} />

        <CategorySection categoryCounts={categoryCounts} isLoading={classesQuery.isLoading} />

        <AboutSection />

        {(instructorsQuery.isLoading || instructors.length > 0) && (
          <TeachersSection instructors={instructors} isLoading={instructorsQuery.isLoading} />
        )}

        <SocialSection />
      </main>

      <LandingFooter />
    </div>
  );
}
