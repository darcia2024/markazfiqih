import { useState, useEffect } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  BookOpen,
  Clock,
  CheckCircle2,
  Sparkles,
  Loader2,
  XCircle,
  Package2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import type { CartClassItem, CartBundleItem } from '@/context/CartContext';
import { formatPrice } from '@/pages/CatalogPage';
import {
  useListRecommendedClasses,
  getListRecommendedClassesQueryKey,
} from '@workspace/api-client-react';
import { createCheckout, simulateSuccess, getInvoice, validateVoucher } from '@/lib/db';
import type { LocalInvoice } from '@/lib/db';

function formatDuration(totalMinutes: number | null): string | null {
  if (!totalMinutes) return null;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} menit`;
  return m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
}

function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-20 px-4"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
        <ShoppingCart className="h-9 w-9 text-muted-foreground" />
      </div>
      <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
        Keranjang Kamu Masih Kosong
      </h2>
      <p className="text-muted-foreground max-w-sm mb-6">
        Yuk jelajahi katalog kelas atau paket bundle kami dan mulai perjalanan belajar kamu hari ini.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg">
          <Link href="/katalog">Jelajahi Katalog Kelas</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/paket-bundle">Lihat Paket Bundle</Link>
        </Button>
      </div>
    </motion.div>
  );
}

function RecommendationCard({
  cls,
  onAdd,
  isAdding,
}: {
  cls: any;
  onAdd: (classId: string) => void;
  isAdding: boolean;
}) {
  const hasDiscount = cls.discountPrice != null;
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/class/${cls.id}`} className="block">
        <div className="aspect-video overflow-hidden bg-muted">
          <img src={cls.coverImage} alt={cls.title} className="w-full h-full object-cover" />
        </div>
      </Link>
      <div className="flex flex-col flex-1 p-3.5 gap-2">
        <Link href={`/class/${cls.id}`}>
          <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.5rem] hover:text-primary transition-colors">
            {cls.title}
          </h4>
        </Link>
        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5">
            <AvatarImage src={cls.instructor.photoUrl} alt={cls.instructor.name} />
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
              {cls.instructor.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">{cls.instructor.name}</span>
        </div>
        <div className="mt-auto pt-1 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-[11px] text-text-tertiary line-through leading-tight">
                {formatPrice(cls.basePrice)}
              </span>
            )}
            <span className="text-sm font-bold text-foreground leading-tight">
              {formatPrice(hasDiscount ? cls.discountPrice : cls.basePrice)}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs h-8"
            disabled={isAdding}
            onClick={() => onAdd(cls.id)}
          >
            + Keranjang
          </Button>
        </div>
      </div>
    </div>
  );
}

function CartSuccessView({ invoice, onBackToCatalog }: { invoice: LocalInvoice; onBackToCatalog: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto text-center py-16 px-4"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-pale0/20 mb-6">
        <CheckCircle2 className="h-10 w-10 text-success" />
      </div>
      <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Pembayaran Berhasil!</h2>
      <p className="text-muted-foreground mb-6">
        Kamu telah berhasil mendaftar ke {invoice.items.length} kelas. Selamat belajar!
      </p>
      <div className="rounded-xl border bg-card p-5 text-left space-y-3 mb-8">
        {invoice.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-12 h-9 rounded-md overflow-hidden bg-muted shrink-0">
              <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-1">{item.title}</p>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between text-sm font-bold">
          <span>Total Dibayar</span>
          <span className="text-primary">{formatPrice(invoice.totalAmount)}</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg">
          <Link href="/dashboard">Lihat Dashboard</Link>
        </Button>
        <Button variant="outline" size="lg" onClick={onBackToCatalog}>
          Jelajahi Kelas Lain
        </Button>
      </div>
    </motion.div>
  );
}

/** Tampil setelah user kembali dari Mayar — polling status invoice tiap 3 detik */
function WaitingForPaymentView({
  invoiceId,
  onSuccess,
  onFailed,
}: {
  invoiceId: string;
  onSuccess: (invoice: LocalInvoice) => void;
  onFailed: () => void;
}) {
  const { data: invoice } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId),
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (!invoice) return;
    if (invoice.status === 'paid') onSuccess(invoice);
    if (invoice.status === 'failed') onFailed();
  }, [invoice, onSuccess, onFailed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto text-center py-20 px-4"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
      <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
        Menunggu Konfirmasi Pembayaran
      </h2>
      <p className="text-muted-foreground">
        Halaman ini akan otomatis update setelah pembayaran dikonfirmasi.
        Jangan tutup tab ini.
      </p>
    </motion.div>
  );
}

// ── Cart item: kelas biasa ─────────────────────────────────────────────────────

function ClassCartItem({
  item,
  appliedVoucher,
  onRemove,
  isRemoving,
}: {
  item: CartClassItem;
  appliedVoucher: { classId: string; discountPrice: number } | null;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  const hasDiscount = item.class.discountPrice != null;
  const durationLabel = formatDuration(item.class.totalDurationMinutes);
  const voucherApplied = appliedVoucher?.classId === item.class.id;
  const displayPrice = voucherApplied
    ? appliedVoucher!.discountPrice
    : (item.class.discountPrice ?? item.class.basePrice);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex gap-4 rounded-lg border bg-card p-4 shadow-sm"
    >
      <Link href={`/class/${item.class.id}`} className="shrink-0">
        <div className="w-20 h-16 sm:w-28 sm:h-20 rounded-md overflow-hidden bg-muted">
          <img
            src={item.class.coverImage}
            alt={item.class.title}
            className="w-full h-full object-cover"
          />
        </div>
      </Link>
      <div className="flex-1 min-w-0 flex flex-col">
        <Link href={`/class/${item.class.id}`}>
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
            {item.class.title}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">{item.class.instructor.name}</p>
        <div className="flex items-center gap-3 text-xs text-text-tertiary mt-1.5">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {item.class.moduleCount} Modul
          </span>
          {durationLabel && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {durationLabel}
            </span>
          )}
        </div>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            {(hasDiscount || voucherApplied) && !voucherApplied && (
              <span className="text-xs text-text-tertiary line-through">
                {formatPrice(item.class.basePrice)}
              </span>
            )}
            {voucherApplied && (
              <span className="text-xs text-text-tertiary line-through">
                {formatPrice(item.class.discountPrice ?? item.class.basePrice)}
              </span>
            )}
            <span className="text-sm font-bold text-primary">
              {formatPrice(displayPrice)}
            </span>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            disabled={isRemoving}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
            aria-label="Hapus dari keranjang"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Cart item: bundle ─────────────────────────────────────────────────────────

function BundleCartItem({
  item,
  onRemove,
  isRemoving,
}: {
  item: CartBundleItem;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex gap-4 rounded-lg border border-primary/20 bg-primary/3 p-4 shadow-sm"
    >
      {/* Ikon bundle */}
      <div className="shrink-0 w-20 h-16 sm:w-28 sm:h-20 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center">
        <Package2 className="h-8 w-8 text-primary/60" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground line-clamp-1">
            {item.bundle.title}
          </h3>
          <Badge
            variant="outline"
            className="text-[10px] border-primary/30 text-primary bg-primary/5 shrink-0 px-1.5 py-0"
          >
            Paket Bundle
          </Badge>
        </div>
        {/* Daftar kelas singkat */}
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
          {item.bundle.classes.map((c) => c.title).join(' · ')}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {item.bundle.classes.length} kelas
        </p>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-text-tertiary line-through">
              {formatPrice(item.bundle.normalPrice)}
            </span>
            <span className="text-sm font-bold text-primary">
              {formatPrice(item.bundle.bundlePrice)}
            </span>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            disabled={isRemoving}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
            aria-label="Hapus dari keranjang"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CartContent() {
  const { user } = useAuth();
  const { items, isLoading, removeFromCart, isRemoving } = useCart();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();

  // Deteksi return dari Mayar: /keranjang?invoice=<id>
  const returnInvoiceId = new URLSearchParams(search).get('invoice');

  type Step = 'cart' | 'paying' | 'waiting' | 'success' | 'failed';
  const [checkoutStep, setCheckoutStep] = useState<Step>(
    returnInvoiceId ? 'waiting' : 'cart',
  );
  const [invoice, setInvoice] = useState<LocalInvoice | null>(null);
  const [waitingInvoiceId, setWaitingInvoiceId] = useState<string | null>(
    returnInvoiceId,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Voucher (hanya untuk kelas individual) ─────────────────────────────────
  const [voucherInputCode, setVoucherInputCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ classId: string; discountPrice: number } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  const handleRemoveAndRefreshRecommended = async (id: string) => {
    await removeFromCart(id);
    if (user) {
      queryClient.invalidateQueries({ queryKey: getListRecommendedClassesQueryKey({ userId: user.id }) });
    }
  };

  const recommendedQuery = useListRecommendedClasses(
    { userId: user?.id ?? '', limit: 4 },
    { query: { enabled: !!user, queryKey: getListRecommendedClassesQueryKey({ userId: user?.id ?? '', limit: 4 }) } },
  );

  const createCheckoutMutation = useMutation({ mutationFn: createCheckout });
  const simulateSuccessMutation = useMutation({
    mutationFn: (invoiceId: string) => simulateSuccess(invoiceId),
  });

  // Subtotal: bundle pakai bundlePrice, kelas pakai harga (voucher kalau ada)
  const subtotal = items.reduce((sum, item) => {
    if (item.type === 'bundle') {
      return sum + item.bundle.bundlePrice;
    }
    // kelas biasa
    if (appliedVoucher && item.class.id === appliedVoucher.classId) {
      return sum + appliedVoucher.discountPrice;
    }
    return sum + (item.class.discountPrice ?? item.class.basePrice);
  }, 0);

  const classItemCount = items.filter((i) => i.type === 'class').length;
  const bundleItemCount = items.filter((i) => i.type === 'bundle').length;

  const handleRemove = (id: string) => {
    void handleRemoveAndRefreshRecommended(id);
  };

  const handleApplyVoucher = async () => {
    const code = voucherInputCode.trim().toUpperCase();
    if (!code) return;
    setVoucherError(null);
    setAppliedVoucher(null);
    setIsValidatingVoucher(true);
    try {
      let firstValid: { classId: string; discountPrice: number } | null = null;
      for (const item of items) {
        if (item.type !== 'class') continue;
        const result = await validateVoucher(item.class.id, code);
        if (result.valid) {
          firstValid = { classId: item.class.id, discountPrice: result.discountPrice };
          break;
        }
      }
      if (firstValid) {
        setAppliedVoucher(firstValid);
      } else {
        setVoucherError('Kode voucher tidak valid atau sudah tidak berlaku.');
      }
    } catch {
      setVoucherError('Gagal memvalidasi voucher. Coba lagi.');
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const handleCheckout = async () => {
    if (!user || items.length === 0) return;
    setIsProcessing(true);
    try {
      const voucherCode = appliedVoucher ? voucherInputCode.trim().toUpperCase() : undefined;
      const createdInvoice = await createCheckoutMutation.mutateAsync(voucherCode);

      if (createdInvoice.paymentUrl) {
        setWaitingInvoiceId(createdInvoice.id);
        window.location.href = createdInvoice.paymentUrl;
        return;
      }

      setInvoice(createdInvoice);
      setCheckoutStep('paying');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout gagal. Coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (!invoice) return;
    setIsProcessing(true);
    try {
      await simulateSuccessMutation.mutateAsync(invoice.id);
      const paidInvoice = await getInvoice(invoice.id);
      setInvoice(paidInvoice);
      setCheckoutStep('success');
      queryClient.invalidateQueries({ queryKey: ['cart', user!.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Simulasi gagal. Coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = (paidInvoice: LocalInvoice) => {
    setInvoice(paidInvoice);
    setCheckoutStep('success');
    queryClient.invalidateQueries({ queryKey: ['cart', user!.id] });
    window.history.replaceState(null, '', '/keranjang');
  };

  const handlePaymentFailed = () => {
    setCheckoutStep('failed');
    window.history.replaceState(null, '', '/keranjang');
  };

  // ── Waiting ────────────────────────────────────────────────────────────────
  if (checkoutStep === 'waiting' && waitingInvoiceId) {
    return (
      <WaitingForPaymentView
        invoiceId={waitingInvoiceId}
        onSuccess={handlePaymentSuccess}
        onFailed={handlePaymentFailed}
      />
    );
  }

  // ── Failed ─────────────────────────────────────────────────────────────────
  if (checkoutStep === 'failed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto text-center py-20 px-4"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Pembayaran Gagal</h2>
        <p className="text-muted-foreground mb-8">
          Pembayaran tidak berhasil diproses. Kamu bisa coba lagi atau pilih metode lain.
        </p>
        <Button size="lg" onClick={() => setCheckoutStep('cart')}>
          Kembali ke Keranjang
        </Button>
      </motion.div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (checkoutStep === 'success' && invoice) {
    return (
      <CartSuccessView invoice={invoice} onBackToCatalog={() => setLocation('/katalog')} />
    );
  }

  // ── Paying (Dev-only simulasi) ─────────────────────────────────────────────
  if (checkoutStep === 'paying' && invoice) {
    return (
      <div className="max-w-2xl mx-auto py-10 lg:py-14 px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button
            onClick={() => setCheckoutStep('cart')}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Kembali ke Keranjang
          </button>
          <h1 className="font-serif text-2xl font-bold text-foreground">Simulasi Pembayaran</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Mode pengembangan — pembayaran Mayar belum aktif.
          </p>
        </motion.div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ringkasan Invoice
            </p>
            <div className="space-y-3">
              {invoice.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground line-clamp-1 flex-1">{item.title}</span>
                  <span className="text-muted-foreground shrink-0 ml-3">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary">{formatPrice(invoice.totalAmount)}</span>
            </div>
          </div>
          <div className="border-t p-5 space-y-3">
            <Button
              size="lg"
              className="w-full text-base font-semibold"
              disabled={isProcessing}
              onClick={handleSimulateSuccess}
            >
              {isProcessing ? 'Memproses…' : `Simulasi Lunas ${formatPrice(invoice.totalAmount)}`}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Tombol ini hanya muncul di mode pengembangan. Di production, user akan diarahkan ke halaman Mayar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Cart ───────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-3">
          <Link
            href="/katalog"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Lanjutkan Belanja
          </Link>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-10 lg:py-14">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">Keranjang Saya</h1>
          <p className="text-muted-foreground mt-1">
            {items.length > 0
              ? `${items.length} item siap untuk didaftarkan`
              : 'Belum ada item di keranjang'}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-4">
              <AnimatePresence>
                {items.map((item) => {
                  if (item.type === 'bundle') {
                    return (
                      <BundleCartItem
                        key={item.id}
                        item={item}
                        onRemove={handleRemove}
                        isRemoving={isRemoving}
                      />
                    );
                  }
                  return (
                    <ClassCartItem
                      key={item.id}
                      item={item}
                      appliedVoucher={appliedVoucher}
                      onRemove={handleRemove}
                      isRemoving={isRemoving}
                    />
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-24 rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="p-5 space-y-4">
                  <h3 className="font-semibold text-foreground text-sm">Ringkasan Belanja</h3>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    {classItemCount > 0 && (
                      <div className="flex justify-between">
                        <span>Kelas Individual</span>
                        <span>{classItemCount}</span>
                      </div>
                    )}
                    {bundleItemCount > 0 && (
                      <div className="flex justify-between">
                        <span>Paket Bundle</span>
                        <span>{bundleItemCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Input kode voucher — hanya tampil jika ada kelas individual */}
                  {classItemCount > 0 && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Kode voucher"
                          value={voucherInputCode}
                          onChange={(e) => {
                            setVoucherInputCode(e.target.value);
                            if (appliedVoucher) setAppliedVoucher(null);
                            if (voucherError) setVoucherError(null);
                          }}
                          className="h-9 text-sm"
                          disabled={isValidatingVoucher || !!appliedVoucher}
                          onKeyDown={(e) => { if (e.key === 'Enter') void handleApplyVoucher(); }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 shrink-0"
                          onClick={handleApplyVoucher}
                          disabled={!voucherInputCode.trim() || isValidatingVoucher || !!appliedVoucher}
                        >
                          {isValidatingVoucher ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pakai'}
                        </Button>
                      </div>
                      {appliedVoucher && (
                        <div className="flex items-center justify-between text-xs text-green-600">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Voucher diterapkan
                          </span>
                          <button
                            className="underline text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => { setAppliedVoucher(null); setVoucherInputCode(''); }}
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                      {voucherError && (
                        <p className="text-xs text-destructive">{voucherError}</p>
                      )}
                    </div>
                  )}

                  <Separator />

                  {appliedVoucher && (() => {
                    const originalItem = items.find(
                      (i) => i.type === 'class' && i.class.id === appliedVoucher.classId,
                    );
                    const originalPrice = originalItem && originalItem.type === 'class'
                      ? (originalItem.class.discountPrice ?? originalItem.class.basePrice)
                      : appliedVoucher.discountPrice;
                    const savings = originalPrice - appliedVoucher.discountPrice;
                    return savings > 0 ? (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Diskon voucher</span>
                        <span>−{formatPrice(savings)}</span>
                      </div>
                    ) : null;
                  })()}

                  <div className="flex justify-between font-bold text-base">
                    <span>Subtotal</span>
                    <span className="text-primary">{formatPrice(subtotal)}</span>
                  </div>
                  <Button
                    size="lg"
                    className="w-full text-base font-semibold"
                    disabled={isProcessing}
                    onClick={handleCheckout}
                  >
                    {isProcessing ? 'Memproses…' : 'Lanjutkan ke Pembayaran'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && (recommendedQuery.data?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-14"
          >
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-xl font-bold text-foreground">Kamu Mungkin Juga Suka</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {(recommendedQuery.data ?? []).map((cls: any) => (
                <RecommendationCardConnected key={cls.id} cls={cls} />
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </>
  );
}

function RecommendationCardConnected({ cls }: { cls: any }) {
  const { user } = useAuth();
  const { addToCart, isAdding } = useCart();
  const queryClient = useQueryClient();
  const [added, setAdded] = useState(false);

  const handleAdd = async (classId: string) => {
    try {
      await addToCart(classId);
      setAdded(true);
      if (user) {
        queryClient.invalidateQueries({ queryKey: getListRecommendedClassesQueryKey({ userId: user.id }) });
      }
      toast.success('Berhasil ditambahkan ke keranjang');
    } catch (error) {
      console.error('Gagal menambahkan ke keranjang:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menambahkan ke keranjang. Coba lagi.');
    }
  };

  if (added) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-primary/30 bg-primary/5 p-6 text-center min-h-[220px]">
        <CheckCircle2 className="w-8 h-8 text-primary mb-2" />
        <p className="text-sm font-medium text-foreground">Ditambahkan ke keranjang</p>
      </div>
    );
  }

  return <RecommendationCard cls={cls} onAdd={handleAdd} isAdding={isAdding} />;
}

export default function CartPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <CartContent />
        <footer className="border-t py-8 text-center text-sm text-muted-foreground">
          © 2026 Markaz Fiqh. Semua Hak Dilindungi.
        </footer>
      </AppShell>
    </ProtectedRoute>
  );
}
