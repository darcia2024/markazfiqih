import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import {
  PlayCircle,
  BookOpen,
  Clock,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Trophy,
  TrendingUp,
  Loader2,
  Flame,
  Medal,
  Award,
  Crown,
  type LucideIcon,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Phone, Pencil, Check, X } from 'lucide-react';
import { listEnrollments, listActiveDashboardMessages, getActiveDashboardBoard, getUserPhone, updateUserPhone, type EnrollmentItem } from '@/lib/db';

// ── Phone Card ────────────────────────────────────────────────────────────────
function PhoneCard({ userId }: { userId: string }) {
  const [savedPhone, setSavedPhone] = useState<string | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUserPhone(userId)
      .then((phone) => {
        setSavedPhone(phone);
        if (phone) setPhoneInput(phone);
      })
      .catch(() => setSavedPhone(null));
  }, [userId]);

  const handleSave = async () => {
    const cleaned = phoneInput.trim().replace(/\s/g, '');
    if (!cleaned) { setError('Nomor HP tidak boleh kosong.'); return; }
    if (!/^\+?\d{8,15}$/.test(cleaned)) { setError('Format tidak valid. Contoh: 08123456789'); return; }
    setError(null);
    setIsSaving(true);
    try {
      await updateUserPhone(userId, cleaned);
      setSavedPhone(cleaned);
      setEditing(false);
      toast.success('Nomor HP berhasil disimpan.');
    } catch {
      setError('Gagal menyimpan. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (savedPhone === undefined) return null;

  return (
    <div className="rounded-2xl border bg-card p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Phone className="h-4 w-4 text-primary" />
        <p className="font-semibold text-sm text-foreground">Nomor WhatsApp/HP</p>
      </div>
      {editing ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="tel"
              placeholder="08123456789"
              value={phoneInput}
              onChange={(e) => { setPhoneInput(e.target.value); setError(null); }}
              className="h-9 text-sm"
              disabled={isSaving}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSave(); if (e.key === 'Escape') setEditing(false); }}
              autoFocus
            />
            <Button size="sm" className="h-9 shrink-0" onClick={handleSave} disabled={isSaving || !phoneInput.trim()}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-9 shrink-0" onClick={() => { setEditing(false); setError(null); if (savedPhone) setPhoneInput(savedPhone); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      ) : savedPhone ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{savedPhone}</p>
          <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" /> Ubah
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Belum diisi. Diperlukan untuk konfirmasi pembayaran.</p>
          <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => setEditing(true)}>
            Isi Sekarang
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Dashboard Board Card ──────────────────────────────────────────────────────
function DashboardBoardCard() {
  const { data: board } = useQuery({
    queryKey: ['dashboard-board'],
    queryFn: getActiveDashboardBoard,
  });

  if (!board) return null;

  return (
    <div className="rounded-2xl border bg-card p-5 mb-6 text-center">
      <p className="font-serif text-base font-bold text-foreground mb-1">{board.title}</p>
      {board.content && (
        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{board.content}</p>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 4 && h <= 10) return 'Selamat Pagi';
  if (h >= 11 && h <= 14) return 'Selamat Siang';
  if (h >= 15 && h <= 17) return 'Selamat Sore';
  return 'Selamat Malam';
}

const MOTIVASI_FALLBACK = 'Semoga ilmu yang dipelajari hari ini berkah.';

function formatTanggal(d: Date): string {
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatJam(d: Date): string {
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDuration(min: number | null) {
  if (!min) return '-';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} jam ${m > 0 ? m + ' mnt' : ''}` : `${m} mnt`;
}

// ── Badge Pencapaian ──────────────────────────────────────────────────────────
type BadgeDefinition = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  threshold: number;
};

const ACHIEVEMENT_BADGES: BadgeDefinition[] = [
  {
    id: 'first-class',
    label: 'Langkah Pertama',
    description: 'Setiap perjalanan ilmu dimulai dari satu langkah. Kamu baru saja memulainya.',
    icon: Sparkles,
    threshold: 1,
  },
  {
    id: 'three-classes',
    label: 'Istiqomah',
    description: 'Konsistensi adalah kunci dalam menuntut ilmu. Tiga kelas telah kamu tuntaskan dengan tekun.',
    icon: Flame,
    threshold: 3,
  },
  {
    id: 'five-classes',
    label: 'Penuntut Ilmu',
    description: 'Rasulullah bersabda, menuntut ilmu adalah kewajiban setiap muslim. Kamu sedang menjalankannya dengan sungguh-sungguh.',
    icon: Medal,
    threshold: 5,
  },
  {
    id: 'ten-classes',
    label: 'Ahli Fiqih Pemula',
    description: 'Sepuluh kelas bukan angka kecil. Pemahamanmu tentang fiqih madzhab Syafi\'i kian terstruktur.',
    icon: Award,
    threshold: 10,
  },
  {
    id: 'twenty-classes',
    label: 'Penjaga Sanad Ilmu',
    description: 'Dua puluh kelas telah kamu tuntaskan. Ilmu yang tersambung sanadnya, kini juga tersambung padamu.',
    icon: Crown,
    threshold: 20,
  },
];

function AchievementBadges({ totalCompleted }: { totalCompleted: number }) {
  return (
    <div className="bg-card rounded-[14px] border p-5 shadow-sm">
      <p className="font-serif font-semibold mb-4">Pencapaian</p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {ACHIEVEMENT_BADGES.map((badge) => {
          const unlocked = totalCompleted >= badge.threshold;
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              title={`${badge.label}: ${badge.description}${!unlocked ? ` (butuh ${badge.threshold} kelas selesai)` : ''}`}
              className={`flex flex-col items-center gap-1.5 text-center p-3 rounded-xl border transition-opacity ${
                unlocked
                  ? 'border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5'
                  : 'border-border opacity-40 grayscale'
              }`}
            >
              <Icon className={`w-6 h-6 ${unlocked ? 'text-[hsl(var(--accent))]' : 'text-muted-foreground'}`} />
              <p className="text-[11px] font-semibold leading-tight">{badge.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── KelasCard ─────────────────────────────────────────────────────────────────
function KelasCard({ enrollment, index }: { enrollment: EnrollmentItem; index: number }) {
  const cls = enrollment.class;
  const { totalDarsCount, completedDarsCount, totalDurationMinutes } = cls;
  const pct = totalDarsCount > 0 ? Math.round((completedDarsCount / totalDarsCount) * 100) : 0;
  const isComplete = totalDarsCount > 0 ? pct === 100 : enrollment.isCompleted;
  const learnUrl = `/learn/${cls.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col rounded-lg border bg-card shadow-sm hover:shadow-lg transition-friendly overflow-hidden"
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
              <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                <Button asChild variant="outline" className="w-full gap-2 text-sm">
                  <Link href={learnUrl}>
                    <RotateCcw className="w-4 h-4" />
                    Tonton Ulang
                  </Link>
                </Button>
              </motion.div>
            </div>
          ) : pct > 0 ? (
            <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
              <Button asChild className="w-full gap-2 text-sm">
                <Link href={learnUrl}>
                  <PlayCircle className="w-4 h-4" />
                  Lanjutkan Belajar
                </Link>
              </Button>
            </motion.div>
          ) : (
            <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
              <Button asChild className="w-full gap-2 text-sm" variant="default">
                <Link href={learnUrl}>
                  <Sparkles className="w-4 h-4" />
                  Mulai Belajar
                </Link>
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Summary Stats Bar ─────────────────────────────────────────────────────────
function StatsSummary({ enrollments }: { enrollments: EnrollmentItem[] }) {
  const totalOwned = enrollments.length;
  const totalCompleted = enrollments.filter(
    (e) =>
      (e.class.totalDarsCount > 0 && e.class.completedDarsCount === e.class.totalDarsCount) ||
      (e.class.totalDarsCount === 0 && e.isCompleted),
  ).length;
  // Kelas video tunggal (totalDarsCount = 0) ikut disertakan: dianggap
  // "1 dars total", selesai (1) kalau isCompleted, belum (0) kalau belum
  const totalDarsAcross = enrollments.reduce(
    (s, e) => s + (e.class.totalDarsCount > 0 ? e.class.totalDarsCount : 1),
    0,
  );
  const totalDoneDars = enrollments.reduce(
    (s, e) =>
      s + (e.class.totalDarsCount > 0 ? e.class.completedDarsCount : e.isCompleted ? 1 : 0),
    0,
  );
  const overallPct =
    totalDarsAcross > 0 ? Math.round((totalDoneDars / totalDarsAcross) * 100) : 0;
  const totalMinutes = enrollments.reduce((s, e) => s + (e.class.totalDurationMinutes ?? 0), 0);
  const totalJam = totalMinutes > 0
    ? totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)} jam`
      : `${totalMinutes} mnt`
    : '-';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border bg-card p-5 shadow-sm">
      {[
        { label: 'Kelas Dimiliki',        value: totalOwned,        icon: BookOpen,    color: 'text-primary'    },
        { label: 'Kelas Tuntas',          value: totalCompleted,    icon: Trophy,      color: 'text-success'    },
        { label: 'Progress Keseluruhan',  value: `${overallPct}%`,  icon: TrendingUp,  color: 'text-brand-gold' },
        { label: 'Total Waktu Konten',    value: totalJam,          icon: Clock,       color: 'text-muted-foreground' },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="text-center space-y-1">
          <Icon className={`w-5 h-5 mx-auto ${color}`} />
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Sidebar Progress Belajar ──────────────────────────────────────────────────
function ProgressSidebar({ enrollments }: { enrollments: EnrollmentItem[] }) {
  return (
    <aside className="hidden lg:block sticky top-20 self-start">
      <div className="bg-card rounded-[14px] border p-5 shadow-sm">
        <p className="font-serif font-semibold mb-4">Progress Belajar</p>
        <div className="space-y-4">
          {enrollments.map((enrollment) => {
            const { totalDarsCount, completedDarsCount } = enrollment.class;
            const pct =
              totalDarsCount > 0
                ? Math.round((completedDarsCount / totalDarsCount) * 100)
                : enrollment.isCompleted ? 100 : 0;
            return (
              <div key={enrollment.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{enrollment.class.title}</p>
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                  <motion.div
                    className={`h-full rounded-full ${pct === 100 ? 'bg-success' : 'bg-[hsl(var(--accent))]'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// ── Halaman Utama ─────────────────────────────────────────────────────────────
function DashboardContent() {
  const { user } = useAuth();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => listEnrollments(user!.id),
    enabled: !!user?.id,
  });

  const { data: dashboardMessages = [] } = useQuery({
    queryKey: ['dashboard-messages'],
    queryFn: listActiveDashboardMessages,
    staleTime: 5 * 60 * 1000,
  });

  // Pilih satu pesan secara acak setiap kali data selesai dimuat.
  const motivasi = useMemo(() => {
    if (dashboardMessages.length === 0) return MOTIVASI_FALLBACK;
    return dashboardMessages[Math.floor(Math.random() * dashboardMessages.length)].message;
  }, [dashboardMessages]);

  const search = new URLSearchParams(window.location.search);
  const showEmpty = search.get('demo') === 'empty';
  const classesToShow = showEmpty ? [] : enrollments;

  const allInProgressEnrollments = classesToShow.filter((e) => {
    if (e.class.totalDarsCount === 0) return !e.isCompleted;
    const pct = Math.round((e.class.completedDarsCount / e.class.totalDarsCount) * 100);
    return pct < 100;
  });
  const inProgressEnrollments = allInProgressEnrollments.slice(0, 3);
  const hasMoreInProgress = allInProgressEnrollments.length > inProgressEnrollments.length;

  return (
    <AppShell>
      {/* Page header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-2 shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--accent))] mb-2">
              {getGreeting()}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              Assalamu'alaikum,{' '}
              {user?.nickname ?? user?.name?.split(' ')[0] ?? 'Sahabat'}!
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">{motivasi}</p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 pt-1">
            <p className="text-sm text-muted-foreground">{formatTanggal(now)}</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">{formatJam(now)}</p>
          </div>
        </motion.div>
      </div>
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8 lg:py-10">
        <DashboardBoardCard />
        <PhoneCard userId={user!.id} />

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : classesToShow.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center text-center py-24 px-4 rounded-xl border bg-card"
          >
            <BookOpen className="w-12 h-12 text-primary/40 mx-auto mb-6" />
            <p className="text-lg font-semibold text-foreground mb-2">
              Kamu belum memulai kelas apapun
            </p>
            <p className="text-muted-foreground max-w-sm mb-6">
              Yuk mulai perjalanan belajarmu dari katalog kelas kami.
            </p>
            <motion.div className="inline-block" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
              <Button asChild size="lg" className="gap-2">
                <Link href="/katalog">
                  <Sparkles className="w-4 h-4" />
                  Jelajahi Katalog
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StatsSummary enrollments={enrollments} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <AchievementBadges
                totalCompleted={enrollments.filter(
                  (e) =>
                    (e.class.totalDarsCount > 0 && e.class.completedDarsCount === e.class.totalDarsCount) ||
                    (e.class.totalDarsCount === 0 && e.isCompleted),
                ).length}
              />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
              <div className="space-y-8">
                {/* Lanjutkan Belajar */}
                {inProgressEnrollments.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="font-serif text-xl font-bold">Lanjutkan Belajar</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <AnimatePresence>
                        {inProgressEnrollments.map((enrollment, idx) => (
                          <KelasCard key={enrollment.id} enrollment={enrollment} index={idx} />
                        ))}
                      </AnimatePresence>
                    </div>
                    {hasMoreInProgress && (
                      <div className="flex justify-center sm:justify-start pt-1">
                        <motion.div className="inline-block" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                          <Button asChild variant="outline" size="sm">
                            <Link href="/my-classes">Lihat Semua Kelas Saya</Link>
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </div>
                )}

                {/* Ajakan tambah kelas */}
                <div className="rounded-xl border-2 border-dashed bg-muted/20 flex flex-col sm:flex-row items-center gap-4 p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="font-semibold text-foreground text-sm">Tambah kelas baru</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Masih banyak ilmu fiqih yang bisa dipelajari, temukan kelas lainnya di
                      katalog.
                    </p>
                  </div>
                  <motion.div className="inline-block shrink-0" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/katalog">Lihat Katalog</Link>
                    </Button>
                  </motion.div>
                </div>
              </div>

              <ProgressSidebar enrollments={enrollments} />
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

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
