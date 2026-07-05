import { useParams, Link } from 'wouter';
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
} from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/data/mockClasses';
import { useGetClassById } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';

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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <BookOpen className="w-7 h-7 text-muted-foreground" />
        </div>
        <h1 className="font-serif text-2xl font-bold">Kelas Tidak Ditemukan</h1>
        <p className="text-muted-foreground max-w-sm">
          Kelas yang kamu cari tidak tersedia atau belum dipublikasikan.
        </p>
        <Button asChild>
          <Link href="/">Kembali ke Katalog</Link>
        </Button>
      </main>
    </div>
  );
}

// ── Loading ────────────────────────────────────────────────────────────────
function ClassDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Memuat detail kelas...</p>
      </main>
    </div>
  );
}

// ── Detail Page ────────────────────────────────────────────────────────────
export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: cls, isLoading, isError } = useGetClassById(id ?? '');

  if (isLoading) return <ClassDetailLoading />;
  if (isError || !cls || cls.status !== 'published') return <ClassNotFound />;

  const hasDiscount = cls.discountPrice !== null;
  const totalMinutes = cls.totalDurationMinutes ?? 0;
  const checkoutPath = user
    ? `/checkout?classId=${cls.id}`
    : `/login?redirect=${encodeURIComponent(`/checkout?classId=${cls.id}`)}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* ── Breadcrumb ── */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-3">
            <Link
              href="/"
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
                {hasDiscount && (
                  <Badge className="bg-brand-gold-pale text-brand-gold-hover hover:bg-brand-gold-pale border-brand-gold-pale text-xs font-semibold">
                    Sedang Promo
                  </Badge>
                )}
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
                  <span className="text-sm text-muted-foreground">
                    {cls.moduleCount} modul
                  </span>
                </div>

                <Accordion type="multiple" className="space-y-2">
                  {cls.modules.map((mod) => (
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
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </div>

            {/* ── Right Column: Purchase Card ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border bg-card shadow-md overflow-hidden">
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
                  <Button asChild size="lg" className="w-full text-base font-semibold">
                    <Link href={checkoutPath}>Beli Kelas Sekarang</Link>
                  </Button>

                  {!user && (
                    <p className="text-xs text-center text-muted-foreground">
                      Kamu akan diminta masuk dengan Google terlebih dahulu.
                    </p>
                  )}
                </div>

                <Separator />

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
    </div>
  );
}
