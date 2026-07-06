import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayCircle,
  BookOpen,
  Clock,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  GraduationCap,
  Trophy,
  TrendingUp,
  Loader2,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import {
  useListEnrollments,
  type EnrollmentItem,
} from '@workspace/api-client-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(min: number | null) {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} jam ${m > 0 ? m + ' mnt' : ''}` : `${m} mnt`;
}

// ── KelasCard ─────────────────────────────────────────────────────────────────
function KelasCard({ enrollment, index }: { enrollment: EnrollmentItem; index: number }) {
  const cls = enrollment.class;
  const { totalDarsCount, completedDarsCount, totalDurationMinutes } = cls;
  const pct = totalDarsCount > 0 ? Math.round((completedDarsCount / totalDarsCount) * 100) : 0;
  const isComplete = pct === 100;
  const learnUrl = `/learn/${cls.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="flex flex-col rounded-lg border bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-friendly overflow-hidden"
    >
      {/* Cover */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={cls.coverImage}
          alt={cls.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          {isComplete ? (
            <Badge className="bg-success-pale0 hover:bg-success-pale0 text-white gap-1 shadow">
              <Trophy className="w-3 h-3" />
              Tuntas
            </Badge>
          ) : pct > 0 ? (
            <Badge className="bg-primary hover:bg-primary text-white gap-1 shadow">
              <TrendingUp className="w-3 h-3" />
              Sedang Belajar
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 shadow">
              <BookOpen className="w-3 h-3" />
              Belum Dimulai
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        <p className="text-xs text-muted-foreground font-medium truncate">
          {cls.instructor.name}
        </p>

        <h3 className="font-serif text-lg font-bold text-foreground leading-snug line-clamp-2">
          {cls.title}
        </h3>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {cls.moduleCount} modul · {totalDarsCount} pelajaran
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(totalDurationMinutes)}
          </span>
        </div>

        {/* Progress Tracker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">
              {completedDarsCount} dari {totalDarsCount} pelajaran selesai
            </span>
            <span
              className={`font-bold text-sm ${
                isComplete ? 'text-success' : pct > 0 ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {pct}% Selesai
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isComplete ? 'bg-success-pale0' : 'bg-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: index * 0.1 + 0.2 }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-1">
          {isComplete ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 rounded-lg bg-success-pale border border-success-pale py-2.5 px-3">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <span className="text-sm font-semibold text-success">
                  Semua pelajaran selesai! 🎉
                </span>
              </div>
              <Button asChild variant="outline" className="w-full gap-2 text-sm">
                <Link href={learnUrl}>
                  <RotateCcw className="w-4 h-4" />
                  Tonton Ulang
                </Link>
              </Button>
            </div>
          ) : pct > 0 ? (
            <Button asChild className="w-full gap-2 text-sm">
              <Link href={learnUrl}>
                <PlayCircle className="w-4 h-4" />
                Lanjutkan Belajar
              </Link>
            </Button>
          ) : (
            <Button asChild className="w-full gap-2 text-sm" variant="default">
              <Link href={learnUrl}>
                <Sparkles className="w-4 h-4" />
                Mulai Belajar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center py-24 px-4"
    >
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
          <GraduationCap className="w-16 h-16 text-primary/40" />
        </div>
        <div className="absolute -top-1 -right-1 w-10 h-10 rounded-full bg-brand-gold-pale flex items-center justify-center shadow-sm border border-brand-gold-pale">
          <BookOpen className="w-5 h-5 text-brand-gold" />
        </div>
      </div>
      <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
        Kamu Belum Memiliki Kelas
      </h2>
      <p className="text-muted-foreground max-w-sm leading-relaxed mb-8">
        Mulai perjalanan menuntut ilmu fiqih dengan memilih kelas yang sesuai kebutuhanmu.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg" className="gap-2">
          <Link href="/katalog">
            <Sparkles className="w-4 h-4" />
            Jelajahi Katalog
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/katalog">Lihat Semua Kelas</Link>
        </Button>
      </div>
    </motion.div>
  );
}

const CLASS_FILTERS = ['Semua', 'Fiqih Tematik', 'Fiqih Kitab', 'Akademi'];

// ── Halaman Utama ─────────────────────────────────────────────────────────────
function MyClassesContent() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('Semua');

  const { data: enrollments = [], isLoading } = useListEnrollments(user?.id ?? '', {
    query: { enabled: !!user?.id },
  });

  const search = new URLSearchParams(window.location.search);
  const showEmpty = search.get('demo') === 'empty';
  const classesToShow = showEmpty ? [] : enrollments;

  return (
    <AppShell>
      {/* Top bar */}
      <div className="bg-primary h-16 flex items-center px-4 sm:px-6 lg:px-8 shrink-0">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-white">Kelas Saya</h1>
        </motion.div>
      </div>
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8 lg:py-10">

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CLASS_FILTERS.map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={activeFilter === filter ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : classesToShow.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-foreground">
                Semua Kelas Dimiliki
              </h2>
              <span className="text-sm text-muted-foreground">
                {classesToShow.length} kelas
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {classesToShow.map((enrollment, idx) => (
                  <KelasCard key={enrollment.id} enrollment={enrollment} index={idx} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 Markaz Fiqh. Semua Hak Dilindungi.
      </footer>
    </AppShell>
  );
}

export default function MyClassesPage() {
  return (
    <ProtectedRoute>
      <MyClassesContent />
    </ProtectedRoute>
  );
}
