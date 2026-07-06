import { useParams, Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Infinity,
  Lock,
  PlayCircle,
  PlaySquare,
  ShoppingCart,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/data/mockClasses';
import { useGetClassById } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

// ── Format duration ────────────────────────────────────────────────────────
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
}

// ── Not Found ──────────────────────────────────────────────────────────────
function ClassNotFound() {
  return (
    <AppShell>
      <main className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <BookOpen className="w-7 h-7 text-muted-foreground" />
        </div>
        <h1 className="font-serif text-2xl font-bold">Kelas Tidak Ditemukan</h1>
        <p className="text-muted-foreground max-w-sm">
          Kelas yang kamu cari tidak tersedia atau belum dipublikasikan.
        </p>
        <Button asChild>
          <Link href="/katalog">Kembali ke Katalog</Link>
        </Button>
      </main>
    </AppShell>
  );
}

// ── Loading ────────────────────────────────────────────────────────────────
function ClassDetailLoading() {
  return (
    <AppShell>
      <main className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Memuat detail kelas...</p>
      </main>
    </AppShell>
  );
}

// ── Circular Progress (SVG manual, tanpa dependency tambahan) ───────────────
function CircularProgress({ percent }: { percent: number }) {
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-muted"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="stroke-success transition-all duration-700 ease-out"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-success">{percent}%</span>
      </div>
    </div>
  );
}

// ── Placeholder daftar dars per modul (data dars asli belum tersedia dari API) ─
// TODO: ganti dengan data dars asli dari backend setelah endpoint tersedia.
const PLACEHOLDER_DARS_PER_MODULE = 3;

// ── Detail Page ────────────────────────────────────────────────────────────
export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: cls, isLoading, isError } = useGetClassById(id ?? '');
  // TODO: ganti isEnrolledDemo dengan pengecekan enrollment asli setelah backend siap
  const isEnrolledDemo =
    new URLSearchParams(window.location.search).get('demo') === 'enrolled';

  const { classIdsInCart, addToCart, isAdding } = useCart();
  const [, setLocation] = useLocation();

  if (isLoading) return <ClassDetailLoading />;
  if (isError || !cls || cls.status !== 'published') return <ClassNotFound />;

  const inCart = classIdsInCart.has(cls.id);

  const handleBuyClick = () => {
    if (!user) {
      setLocation(`/login?redirect=${encodeURIComponent(`/class/${cls.id}`)}`);
      return;
    }
    if (inCart) {
      setLocation('/keranjang');
      return;
    }
    addToCart(cls.id);
  };

  const hasDiscount = cls.discountPrice !== null;
  const totalMinutes = cls.totalDurationMinutes ?? 0;

  return (
    <AppShell>
      <main className="flex-1">
        {/* ── Breadcrumb ── */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-3">
            <Link
              href="/katalog"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Kembali ke Katalog
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* ── Left Column: Main Content ── */}
            <div className="lg:col-span-2 space-y-10">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {hasDiscount && (
                    <Badge className="bg-brand-gold-pale text-brand-gold-hover hover:bg-brand-gold-pale border-brand-gold-pale text-xs font-semibold">
                      Sedang Promo
                    </Badge>
                  )}
                  {isEnrolledDemo && (
                    <Badge variant="success" className="text-xs font-semibold">
                      Terdaftar
                    </Badge>
                  )}
                </div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  {cls.title}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {cls.description}
                </p>

                {/* Quick stats row */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    {cls.moduleCount} modul
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Total {formatDuration(totalMinutes)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Infinity className="w-4 h-4" />
                    Akses seumur hidup
                  </span>
                </div>
              </motion.div>

              {/* Cover Image */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="aspect-video rounded-xl overflow-hidden bg-muted shadow-sm"
              >
                <img
                  src={cls.coverImage}
                  alt={cls.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Instructor */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex items-start gap-4 p-5 rounded-xl border bg-card"
              >
                <Avatar className="w-14 h-14 shrink-0">
                  <AvatarImage src={cls.instructor.photoUrl} alt={cls.instructor.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                    {cls.instructor.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Pengajar
                  </p>
                  <p className="font-serif font-bold text-lg text-foreground">
                    {cls.instructor.name}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cls.instructor.bio}
                  </p>
                </div>
              </motion.div>

              {/* Curriculum */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    Kurikulum
                  </h2>
                  {!(cls.youtubePlaylistId && cls.modules.length === 0) && (
                    <span className="text-sm text-muted-foreground">
                      {cls.moduleCount} modul
                    </span>
                  )}
                </div>

                {cls.youtubePlaylistId && cls.modules.length === 0 ? (
                  /* Playlist mode: no module/dars breakdown */
                  <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <PlaySquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        Kelas ini berupa playlist video berkelanjutan
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Akses penuh playlist setelah kelas dibeli
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Normal mode: module/dars accordion */
                  <Accordion type="multiple" className="space-y-2">
                    {cls.modules.map((mod, modIdx) => (
                      <AccordionItem
                        key={mod.id}
                        value={mod.id}
                        className="border rounded-lg px-4 bg-card"
                      >
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-3 text-left">
                            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {mod.orderIndex}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">
                                {mod.title}
                              </p>
                              {mod.durationMinutes != null && (
                                <p className="text-xs text-muted-foreground font-normal mt-0.5">
                                  {formatDuration(mod.durationMinutes)}
                                </p>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-1">
                            {Array.from({ length: PLACEHOLDER_DARS_PER_MODULE }).map(
                              (_, darsIdx) => {
                                const globalDarsIndex =
                                  modIdx * PLACEHOLDER_DARS_PER_MODULE + darsIdx;
                                const isDoneDemo = globalDarsIndex < 3;

                                return (
                                  <div
                                    key={darsIdx}
                                    className="flex items-center gap-2.5 py-2 px-2 rounded-md text-sm text-muted-foreground"
                                  >
                                    {isEnrolledDemo ? (
                                      isDoneDemo ? (
                                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                                      ) : (
                                        <PlayCircle className="w-4 h-4 text-primary shrink-0" />
                                      )
                                    ) : (
                                      <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                                    )}
                                    <span>
                                      Pelajaran {darsIdx + 1} — {mod.title}
                                    </span>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </motion.div>
            </div>

            {/* ── Right Column: Purchase Card ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border bg-card shadow-md overflow-hidden">
                {isEnrolledDemo ? (
                  <>
                    {/* Progress Belajar (demo) */}
                    <div className="p-6 flex flex-col items-center gap-4 text-center">
                      <p className="text-sm font-semibold text-foreground">
                        Progress Belajar
                      </p>
                      <CircularProgress percent={75} />
                      <p className="text-xs text-muted-foreground">
                        3 dari {cls.moduleCount * PLACEHOLDER_DARS_PER_MODULE} pelajaran
                        selesai
                      </p>
                    </div>

                    <Separator />

                    <div className="p-6">
                      <Button asChild size="lg" className="w-full text-base font-semibold">
                        <Link href={`/learn/${cls.id}`}>Lanjutkan Belajar</Link>
                      </Button>
                    </div>

                    <Separator />
                  </>
                ) : (
                  <>
                    {/* Price section */}
                    <div className="p-6 space-y-1">
                      {hasDiscount ? (
                        <>
                          <p className="text-sm text-muted-foreground line-through">
                            {formatPrice(cls.basePrice)}
                          </p>
                          <p className="text-3xl font-bold text-primary">
                            {formatPrice(cls.discountPrice!)}
                          </p>
                          <Badge
                            variant="outline"
                            className="border-brand-gold text-brand-gold-hover text-xs mt-1"
                          >
                            Hemat{' '}
                            {formatPrice(cls.basePrice - cls.discountPrice!)}
                          </Badge>
                        </>
                      ) : (
                        <p className="text-3xl font-bold text-primary">
                          {formatPrice(cls.basePrice)}
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* CTA Button */}
                    <div className="p-6 space-y-4">
                      <Button
                        size="lg"
                        className="w-full text-base font-semibold gap-2"
                        disabled={isAdding}
                        onClick={handleBuyClick}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {inCart ? 'Lihat di Keranjang' : 'Tambah ke Keranjang'}
                      </Button>

                      {!user && (
                        <p className="text-xs text-center text-muted-foreground">
                          Kamu akan diminta masuk dengan Google terlebih dahulu.
                        </p>
                      )}
                    </div>

                    <Separator />
                  </>
                )}

                {/* Class details */}
                <div className="p-6 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Yang kamu dapatkan
                  </p>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2.5">
                      <BookOpen className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>
                        <strong>{cls.moduleCount}</strong> modul video pelajaran
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>Total {formatDuration(totalMinutes)} materi video</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Infinity className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>Akses seumur hidup (lifetime)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>Pembayaran aman via Mayar.id</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>Pelacak progres belajar otomatis</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Users className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>Akses grup diskusi santri</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 Markaz Fiqh. Semua Hak Dilindungi.
      </footer>
    </AppShell>
  );
}
