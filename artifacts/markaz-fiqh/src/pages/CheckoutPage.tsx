import { useMemo } from 'react';
import { Link, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Infinity, BookOpen, Clock, Tag } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getClassById, formatPrice, countTotalDars, countTotalDuration } from '@/data/mockClasses';

// ── Fallback kelas jika tidak ada classId di URL ─────────────────────────────
const FALLBACK_CLASS_ID = 'fiqih-thaharah';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} menit`;
  return m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
}

function CartContent() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const classId = params.get('classId') || FALLBACK_CLASS_ID;
  const cls = getClassById(classId);

  // Jika kelas tidak ditemukan, fallback ke kelas pertama
  const activeClass = cls ?? getClassById(FALLBACK_CLASS_ID)!;

  const hasDiscount = activeClass.discount_price !== null;
  const finalPrice = hasDiscount ? activeClass.discount_price! : activeClass.base_price;
  const totalDars = useMemo(() => countTotalDars(activeClass), [activeClass]);
  const totalMinutes = useMemo(() => countTotalDuration(activeClass), [activeClass]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-3">
          <Link
            href={`/class/${activeClass.id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Kembali ke Detail Kelas
          </Link>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-10 lg:py-14">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 space-y-1"
        >
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
            Langkah 1 dari 2
          </p>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Keranjang Belanja
          </h1>
          <p className="text-muted-foreground">
            Periksa detail kelas dan harga sebelum melanjutkan pembayaran.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── Kiri: Info Kelas ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Kartu Kelas */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={activeClass.cover_image}
                  alt={activeClass.title}
                  className="w-full h-full object-cover"
                />
                {hasDiscount && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-brand-gold hover:bg-brand-gold text-white text-xs font-semibold">
                      <Tag className="w-3 h-3 mr-1" />
                      Promo
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-5 space-y-3">
                <p className="text-xs text-muted-foreground font-medium">
                  {activeClass.instructor.name}
                </p>
                <h2 className="font-serif text-xl font-bold text-foreground leading-snug">
                  {activeClass.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {activeClass.description}
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {activeClass.modules.length} modul · {totalDars} pelajaran
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(totalMinutes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Infinity className="w-3.5 h-3.5" />
                    Akses seumur hidup
                  </span>
                </div>
              </div>
            </div>

            {/* Jaminan */}
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Pembayaran Aman
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Transaksi diproses melalui Mayar.id dengan enkripsi SSL. Data kartu dan
                  rekening kamu tidak disimpan di server kami.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Kanan: Ringkasan Harga ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="sticky top-24 rounded-xl border bg-card shadow-md overflow-hidden">
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground">Ringkasan Pesanan</h3>

                <div className="space-y-3 text-sm">
                  {/* Harga asli */}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Harga asli</span>
                    <span
                      className={
                        hasDiscount
                          ? 'line-through text-muted-foreground'
                          : 'font-medium text-foreground'
                      }
                    >
                      {formatPrice(activeClass.base_price)}
                    </span>
                  </div>

                  {/* Diskon */}
                  {hasDiscount && (
                    <div className="flex justify-between items-center text-brand-gold-hover">
                      <span className="flex items-center gap-1 font-medium">
                        <Tag className="w-3.5 h-3.5" />
                        Diskon promo
                      </span>
                      <span className="font-medium">
                        -{formatPrice(activeClass.base_price - activeClass.discount_price!)}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(finalPrice)}
                  </span>
                </div>

                {/* CTA */}
                <Button
                  asChild
                  size="lg"
                  className="w-full text-base font-semibold mt-2"
                >
                  <Link href={`/payment?classId=${activeClass.id}`}>
                    Bayar Sekarang
                  </Link>
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Dengan melanjutkan, kamu setuju dengan syarat layanan kami.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 Markaz Fiqh. Semua Hak Dilindungi.
      </footer>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CartContent />
    </ProtectedRoute>
  );
}
