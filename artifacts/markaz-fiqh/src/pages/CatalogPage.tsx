import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Clock, Tag } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PUBLISHED_CLASSES,
  formatPrice,
  countTotalDars,
  countTotalDuration,
  type MockClass,
} from '@/data/mockClasses';

// ── Kartu Kelas ──────────────────────────────────────────────────────────────
function ClassCard({ cls, index }: { cls: MockClass; index: number }) {
  const hasDiscount = cls.discount_price !== null;
  const totalDars = countTotalDars(cls);
  const totalMinutes = countTotalDuration(cls);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const durationLabel =
    totalHours > 0
      ? `${totalHours} jam ${remainingMins > 0 ? remainingMins + ' menit' : ''}`
      : `${totalMinutes} menit`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      layout
    >
      <Link href={`/class/${cls.id}`} className="group block h-full">
        <div className="h-full flex flex-col rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          {/* Cover Image */}
          <div className="relative aspect-video overflow-hidden bg-muted">
            <img
              src={cls.cover_image}
              alt={cls.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {hasDiscount && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-brand-gold hover:bg-brand-gold text-white text-xs font-semibold px-2 py-0.5 shadow">
                  <Tag className="w-3 h-3 mr-1" />
                  Promo
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 p-5 gap-3">
            {/* Instructor */}
            <p className="text-xs text-muted-foreground font-medium truncate">
              {cls.instructor.name}
            </p>

            {/* Title */}
            <h3 className="font-serif text-lg font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {cls.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
              {cls.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {totalDars} pelajaran
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {durationLabel}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t pt-3 mt-1">
              {/* Price */}
              <div className="flex items-baseline gap-2 mb-3">
                {hasDiscount ? (
                  <>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(cls.discount_price!)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(cls.base_price)}
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(cls.base_price)}
                  </span>
                )}
              </div>

              {/* CTA */}
              <Button className="w-full" size="sm">
                Lihat Detail
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Halaman Katalog ───────────────────────────────────────────────────────────
export default function CatalogPage() {
  const [query, setQuery] = useState('');

  const filteredClasses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PUBLISHED_CLASSES;
    return PUBLISHED_CLASSES.filter(
      (cls) =>
        cls.title.toLowerCase().includes(q) ||
        cls.description.toLowerCase().includes(q) ||
        cls.instructor.name.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative bg-primary py-20 lg:py-28 overflow-hidden">
          {/* Decorative pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                Ilmu Fiqih,
                <br />
                <span className="text-brand-gold-pale">Tersusun Rapi</span>
              </h1>
              <p className="mt-4 text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                Kurikulum terstruktur dari asatidzah kompeten. Belajar dengan
                urutan yang benar, dari dasar hingga mahir.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative max-w-xl mx-auto mt-8"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Cari kelas fiqih… (misal: thaharah, zakat, nikah)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 pr-4 py-3 h-12 text-base bg-white border-0 rounded-xl shadow-lg placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-brand-gold"
              />
            </motion.div>
          </div>
        </section>

        {/* ── Catalog Grid ── */}
        <section className="py-14 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Section header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                {query ? (
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    Hasil pencarian{' '}
                    <span className="text-primary">"{query}"</span>
                  </h2>
                ) : (
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    Semua Kelas
                  </h2>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredClasses.length} kelas tersedia
                </p>
              </div>

              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery('')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Hapus pencarian
                </Button>
              )}
            </div>

            {/* Grid */}
            <AnimatePresence mode="popLayout">
              {filteredClasses.length > 0 ? (
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredClasses.map((cls, idx) => (
                    <ClassCard key={cls.id} cls={cls} index={idx} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    Kelas tidak ditemukan
                  </h3>
                  <p className="text-muted-foreground max-w-sm">
                    Tidak ada kelas yang cocok dengan kata kunci{' '}
                    <strong>"{query}"</strong>. Coba kata kunci lain atau
                    telusuri semua kelas.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => setQuery('')}
                  >
                    Lihat Semua Kelas
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 Markaz Fiqh. Semua Hak Dilindungi.
      </footer>
    </div>
  );
}
