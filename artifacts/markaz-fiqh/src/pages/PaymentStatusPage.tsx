import { useEffect, useState, useRef } from 'react';
import { useSearch, useLocation, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, RefreshCw, ArrowLeft, BookOpen } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { getClassById, formatPrice } from '@/data/mockClasses';

// ── Simulasi siklus status pembayaran ────────────────────────────────────────
// pending → (setelah ~10 detik) → success
// Bisa di-trigger manual juga via tombol "Simulasi Gagal"

type PaymentStatus = 'pending' | 'success' | 'failed';

const POLL_INTERVAL_MS = 3000;   // cek setiap 3 detik
const AUTO_SUCCESS_AFTER = 10000; // otomatis sukses setelah 10 detik
const REDIRECT_DELAY_MS = 3000;  // redirect ke /my-classes setelah 3 detik dari sukses

function PendingView({
  className,
  pollCount,
  onSimulateSuccess,
  onSimulateFail,
}: {
  className: string;
  pollCount: number;
  onSimulateSuccess: () => void;
  onSimulateFail: () => void;
}) {
  return (
    <motion.div
      key="pending"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center text-center space-y-6 py-8"
    >
      {/* Animated loader */}
      <div className="relative w-24 h-24">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-primary/20"
        />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock className="w-8 h-8 text-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Menunggu Konfirmasi Pembayaran
        </h2>
        <p className="text-muted-foreground max-w-md">
          Sistem sedang menunggu konfirmasi dari Mayar. Halaman ini akan memperbarui
          status secara otomatis — jangan tutup halaman ini.
        </p>
      </div>

      {/* Kelas yang dibeli */}
      <div className="rounded-xl border bg-card px-6 py-4 w-full max-w-sm">
        <p className="text-xs text-muted-foreground mb-1">Kelas yang dibeli</p>
        <p className="font-semibold text-foreground line-clamp-2">{className}</p>
      </div>

      {/* Status polling */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </motion.div>
        <span>Memeriksa status… (pengecekan ke-{pollCount})</span>
      </div>

      {/* Dot progress indicator */}
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>

      <div className="border-t w-full pt-6 space-y-2">
        <p className="text-xs text-muted-foreground">
          Untuk keperluan demo — simulasikan respons webhook:
        </p>
        <div className="flex gap-3 justify-center">
          <Button size="sm" onClick={onSimulateSuccess} className="gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Simulasi Sukses
          </Button>
          <Button size="sm" variant="outline" onClick={onSimulateFail} className="gap-1.5 text-destructive hover:text-destructive">
            <XCircle className="w-4 h-4" />
            Simulasi Gagal
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function SuccessView({ className, price }: { className: string; price: string }) {
  const [countdown, setCountdown] = useState(Math.ceil(REDIRECT_DELAY_MS / 1000));
  const [, setLocation] = useLocation();

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          setLocation('/my-classes');
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [setLocation]);

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="flex flex-col items-center text-center space-y-6 py-8"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
      >
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Pembayaran Berhasil!
        </h2>
        <p className="text-muted-foreground max-w-md">
          Selamat! Kelas kamu sudah aktif. Mulai belajar sekarang dan raih ilmu yang bermanfaat.
        </p>
      </motion.div>

      {/* Detail transaksi */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-sm rounded-xl border bg-green-50 border-green-200 p-5 space-y-3"
      >
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Kelas</span>
          <span className="font-semibold text-foreground text-right max-w-[200px] line-clamp-2">{className}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Jumlah</span>
          <span className="font-bold text-green-700">{price}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="font-semibold text-green-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Berhasil
          </span>
        </div>
      </motion.div>

      {/* Countdown redirect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        <p className="text-sm text-muted-foreground">
          Mengarahkan ke{' '}
          <strong className="text-foreground">Kelas Saya</strong> dalam{' '}
          <span className="text-primary font-bold">{countdown}</span> detik…
        </p>
        <Button asChild size="lg" className="gap-2">
          <Link href="/my-classes">
            <BookOpen className="w-4 h-4" />
            Mulai Belajar Sekarang
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}

function FailedView({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      key="failed"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center text-center space-y-6 py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center"
      >
        <XCircle className="w-12 h-12 text-red-500" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Pembayaran Gagal
        </h2>
        <p className="text-muted-foreground max-w-md">
          Pembayaran tidak dapat diproses. Ini bisa terjadi karena saldo tidak cukup,
          koneksi terputus, atau waktu pembayaran habis.
        </p>
      </div>

      <div className="w-full max-w-sm rounded-xl border bg-red-50 border-red-200 p-4">
        <p className="text-sm text-red-700">
          Kode: <strong>PAYMENT_FAILED</strong> · Tidak ada saldo yang terpotong.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onRetry} size="lg" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali ke Katalog
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function StatusContent() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const classId = params.get('classId') || 'fiqih-thaharah';
  const cls = getClassById(classId) ?? getClassById('fiqih-thaharah')!;

  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finalPrice = formatPrice(cls.discount_price ?? cls.base_price);

  const clearTimers = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (autoRef.current) clearTimeout(autoRef.current);
  };

  useEffect(() => {
    if (status !== 'pending') { clearTimers(); return; }

    // Polling counter
    pollRef.current = setInterval(() => {
      setPollCount((c) => c + 1);
    }, POLL_INTERVAL_MS);

    // Auto-success setelah 10 detik
    autoRef.current = setTimeout(() => {
      setStatus('success');
    }, AUTO_SUCCESS_AFTER);

    return clearTimers;
  }, [status]);

  const handleRetry = () => {
    setPollCount(0);
    setStatus('pending');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-xl py-10 lg:py-16">
        {/* Progress step */}
        <div className="mb-10">
          <div className="flex items-center gap-0">
            {[
              { label: 'Keranjang', done: true },
              { label: 'Pembayaran', done: true },
              { label: 'Status', done: status === 'success' },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center">
                <div className={`flex flex-col items-center gap-1`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    step.done
                      ? 'bg-primary border-primary text-white'
                      : 'bg-background border-muted-foreground/40 text-muted-foreground'
                  }`}>
                    {step.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${step.done ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`h-0.5 w-16 mx-1 mb-4 rounded transition-colors ${
                    step.done ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-2xl border bg-card shadow-sm p-8">
          <AnimatePresence mode="wait">
            {status === 'pending' && (
              <PendingView
                className={cls.title}
                pollCount={pollCount}
                onSimulateSuccess={() => setStatus('success')}
                onSimulateFail={() => setStatus('failed')}
              />
            )}
            {status === 'success' && (
              <SuccessView className={cls.title} price={finalPrice} />
            )}
            {status === 'failed' && (
              <FailedView onRetry={handleRetry} />
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 Markaz Fiqh. Semua Hak Dilindungi.
      </footer>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <ProtectedRoute>
      <StatusContent />
    </ProtectedRoute>
  );
}
