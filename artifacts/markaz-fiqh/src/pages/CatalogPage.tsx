import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Link, useSearch, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Search,
  BookOpen,
  Bell,
  Clock,
  ShoppingCart,
  Check,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useListClasses, useListInstructors } from '@workspace/api-client-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDuration(totalMinutes: number | null): string | null {
  if (totalMinutes == null) return null;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) return `${hours} jam${mins > 0 ? ` ${mins} menit` : ''}`;
  return `${totalMinutes} menit`;
}

export { formatPrice, formatDuration };

export const LEVEL_LABEL: Record<string, string> = {
  pemula: 'Pemula',
  menengah: 'Menengah',
  lanjutan: 'Lanjutan',
};

export const LEVEL_BADGE_VARIANT: Record<string, 'success' | 'gold' | 'destructive-pale'> = {
  pemula: 'success',
  menengah: 'gold',
  lanjutan: 'destructive-pale',
};

// ── Header ───────────────────────────────────────────────────────────────
function CatalogHeader() {
  const { user } = useAuth();
  const { count } = useCart();
  return (
    <div className="flex items-center justify-between px-6 lg:px-10 pt-8 pb-2">
      <h1 className="font-serif text-[32px] font-bold text-foreground leading-tight">
        Jelajahi Kelas
      </h1>
      <div className="flex items-center gap-3">
        {user && (
          <Link
            href="/keranjang"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-friendly"
            aria-label="Keranjang"
          >
            <ShoppingCart className="h-5 w-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground"
                >
                  {count > 9 ? '9+' : count}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Avatar className="h-9 w-9 border border-border">
          {user ? (
            <>
              <AvatarImage src={user.avatar_url} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </>
          ) : (
            <AvatarFallback className="bg-muted text-muted-foreground">?</AvatarFallback>
          )}
        </Avatar>
      </div>
    </div>
  );
}

// ── Instructor section ───────────────────────────────────────────────────
export function InstructorSection({
  instructors,
  isLoading,
  selectedInstructorId,
  onSelect,
}: {
  instructors: Array<{ id: string; name: string; photoUrl: string; classCount: number }>;
  isLoading: boolean;
  selectedInstructorId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (!isLoading && instructors.length === 0) return null;

  return (
    <section className="mb-8">
      <h3 className="text-xl font-semibold text-foreground mb-4">Instruktur</h3>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-24">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))
          : instructors.map((instructor) => (
              <button
                key={instructor.id}
                type="button"
                onClick={() =>
                  onSelect(selectedInstructorId === instructor.id ? null : instructor.id)
                }
                className={`flex flex-col items-center gap-2 shrink-0 w-24 p-2 rounded-lg transition-colors ${
                  selectedInstructorId === instructor.id
                    ? 'bg-primary/5 ring-1 ring-primary/30'
                    : 'hover:bg-muted'
                }`}
              >
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage src={instructor.photoUrl} alt={instructor.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {instructor.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold text-foreground text-center leading-tight line-clamp-2">
                  {instructor.name}
                </p>
                <p className="text-xs text-muted-foreground">{instructor.classCount} Kelas</p>
              </button>
            ))}
      </div>
    </section>
  );
}

// ── Class card ───────────────────────────────────────────────────────────
export type ClassSummary = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  basePrice: number;
  discountPrice: number | null;
  status: 'draft' | 'published';
  level: 'pemula' | 'menengah' | 'lanjutan' | null;
  category: string | null;
  instructor: { id: string; name: string; photoUrl: string };
  moduleCount: number;
  totalDurationMinutes: number | null;
};

export function ClassCard({ cls, index }: { cls: ClassSummary; index: number }) {
  const hasDiscount = cls.discountPrice != null;
  const durationLabel = formatDuration(cls.totalDurationMinutes);
  const { user } = useAuth();
  const { classIdsInCart, addToCart, isAdding } = useCart();
  const [location, setLocation] = useLocation();
  const inCart = classIdsInCart.has(cls.id);

  const handleCartAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setLocation(`/login?redirect=${encodeURIComponent('/katalog')}`);
      return;
    }
    if (inCart) {
      setLocation('/keranjang');
      return;
    }
    try {
      await addToCart(cls.id);
      toast.success('Berhasil ditambahkan ke keranjang');
    } catch (error) {
      console.error('Gagal menambahkan ke keranjang:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menambahkan ke keranjang. Coba lagi.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      layout
      className="h-full"
    >
      <Link href={`/class/${cls.id}`} className="group block h-full">
        <div className="h-full flex flex-col rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-friendly">
          <div className="relative aspect-video overflow-hidden bg-muted">
            <img
              src={cls.coverImage}
              alt={cls.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {cls.level && (
              <div className="absolute top-3 left-3">
                <Badge variant={LEVEL_BADGE_VARIANT[cls.level]} className="text-[11px]">
                  {LEVEL_LABEL[cls.level]}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1 p-4 gap-2">
            <h4 className="text-base font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.75rem] group-hover:text-primary transition-colors">
              {cls.title}
            </h4>

            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={cls.instructor.photoUrl} alt={cls.instructor.name} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {cls.instructor.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[13px] text-muted-foreground truncate">
                {cls.instructor.name}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-tertiary">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {cls.moduleCount} Modul
              </span>
              {durationLabel && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {durationLabel}
                </span>
              )}
            </div>

            <div className="mt-auto pt-2 flex items-end justify-between gap-2 min-h-[3.25rem]">
              <div className="flex flex-col">
                {hasDiscount ? (
                  <>
                    <span className="text-[13px] text-text-tertiary line-through leading-tight">
                      {formatPrice(cls.basePrice)}
                    </span>
                    <span className="text-lg font-bold text-primary leading-tight">
                      {formatPrice(cls.discountPrice!)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[13px] leading-tight invisible select-none">&nbsp;</span>
                    <span className="text-lg font-bold text-foreground leading-tight">
                      {formatPrice(cls.basePrice)}
                    </span>
                  </>
                )}
              </div>
              <motion.div whileTap={{ scale: 0.92 }}>
                <Button
                  size="sm"
                  variant={inCart ? 'outline' : 'default'}
                  className="shrink-0 text-xs h-8 gap-1"
                  disabled={isAdding}
                  onClick={handleCartAction}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={inCart ? 'added' : 'add'}
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center"
                    >
                      {inCart ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <ShoppingCart className="w-3.5 h-3.5" />
                      )}
                    </motion.span>
                  </AnimatePresence>
                  {inCart ? 'Di Keranjang' : 'Tambah'}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ClassCardSkeleton() {
  return (
    <div className="h-full flex flex-col rounded-lg border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 flex flex-col gap-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-5 w-1/3 mt-2" />
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-base text-muted-foreground max-w-sm">
        Belum ada kelas yang cocok dengan pencarianmu
      </p>
      <Button variant="ghost" size="sm" className="mt-4" onClick={onReset}>
        Reset Filter
      </Button>
    </motion.div>
  );
}

// ── Halaman Katalog ───────────────────────────────────────────────────────
function CatalogContent() {
  const searchParamsString = useSearch();
  const initialCategory = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    return params.get('category') ?? 'all';
  }, [searchParamsString]);

  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<'all' | 'pemula' | 'menengah' | 'lanjutan'>('all');
  const [category, setCategory] = useState<'all' | string>(initialCategory);
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);

  const classesQuery = useListClasses({
    search: search || undefined,
    level: level === 'all' ? undefined : level,
    category: category === 'all' ? undefined : category,
    instructorId: selectedInstructorId ?? undefined,
    sort,
  });
  const instructorsQuery = useListInstructors();

  const classes = (classesQuery.data ?? []) as ClassSummary[];
  const instructors = instructorsQuery.data ?? [];

  const isLoading = classesQuery.isLoading;
  const isEmpty = !isLoading && classes.length === 0;

  const handleReset = () => {
    setSearch('');
    setLevel('all');
    setCategory('all');
    setSort('newest');
    setSelectedInstructorId(null);
  };

  const hasActiveFilters = useMemo(
    () => Boolean(search || level !== 'all' || category !== 'all' || selectedInstructorId),
    [search, level, category, selectedInstructorId],
  );

  return (
    <AppShell>
      <CatalogHeader />
      <main className="px-6 lg:px-10 py-8 max-w-[1400px]">

        {/* Search + filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Cari kelas fiqih..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-sm"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
              <SelectTrigger className="h-9 w-auto min-w-[110px] rounded-full px-4 text-[13px] border-secondary-border bg-secondary">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Level</SelectItem>
                <SelectItem value="pemula">Pemula</SelectItem>
                <SelectItem value="menengah">Menengah</SelectItem>
                <SelectItem value="lanjutan">Lanjutan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={(v) => setCategory(v)}>
              <SelectTrigger className="h-9 w-auto min-w-[130px] rounded-full px-4 text-[13px] border-secondary-border bg-secondary">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="Fiqih Tematik">Fiqih Tematik</SelectItem>
                <SelectItem value="Fiqih Kitab">Fiqih Kitab</SelectItem>
                <SelectItem value="Akademi">Akademi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="h-9 w-auto min-w-[110px] rounded-full px-4 text-[13px] border-secondary-border bg-secondary">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="price_asc">Termurah</SelectItem>
                <SelectItem value="price_desc">Termahal</SelectItem>
                <SelectItem value="popular">Terpopuler</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <InstructorSection
          instructors={instructors}
          isLoading={instructorsQuery.isLoading}
          selectedInstructorId={selectedInstructorId}
          onSelect={setSelectedInstructorId}
        />

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Semua Kelas</h2>

          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => <ClassCardSkeleton key={i} />)}

              {!isLoading &&
                classes.map((cls, idx) => <ClassCard key={cls.id} cls={cls} index={idx} />)}

              {isEmpty && (
                <EmptyState
                  onReset={hasActiveFilters ? handleReset : () => window.location.reload()}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </AppShell>
  );
}

export default function CatalogPage() {
  return (
    <ProtectedRoute>
      <CatalogContent />
    </ProtectedRoute>
  );
}
