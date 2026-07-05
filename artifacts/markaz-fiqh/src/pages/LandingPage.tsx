import { useMemo } from 'react';
import { Link } from 'wouter';
import { BookOpen, Layers, Library, GraduationCap, ArrowRight } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useListClasses, useListInstructors } from '@workspace/api-client-react';
import {
  ClassCard,
  ClassCardSkeleton,
  InstructorSection,
  type ClassSummary,
} from '@/pages/CatalogPage';

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
        <div className="max-w-2xl">
          <h1 className="font-serif text-[32px] sm:text-[40px] font-bold leading-[1.15] sm:leading-[46px] text-foreground">
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
export default function LandingPage() {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <HeroSection />

        <FeaturedClassesSection classes={featuredClasses} isLoading={classesQuery.isLoading} />

        <CategorySection categoryCounts={categoryCounts} isLoading={classesQuery.isLoading} />

        {(instructorsQuery.isLoading || instructors.length > 0) && (
          <section className="bg-background">
            <div className="container mx-auto px-5 sm:px-8 lg:px-16 py-12 sm:py-16 max-w-[1200px]">
              <h2 className="font-serif text-[26px] font-semibold text-foreground leading-8 mb-6">
                Pengajar Kami
              </h2>
              <InstructorSection
                instructors={instructors}
                isLoading={instructorsQuery.isLoading}
                selectedInstructorId={null}
                onSelect={() => {}}
              />
            </div>
          </section>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
