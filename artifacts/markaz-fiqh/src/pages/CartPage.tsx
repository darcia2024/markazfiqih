import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  BookOpen,
  Clock,
  CheckCircle2,
  Sparkles,
  Package2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import type { CartClassItem, CartBundleItem, CartEbookItem } from '@/context/CartContext';
import { formatPrice } from '@/pages/CatalogPage';
import { listClasses, listEnrollments } from '@/lib/db';

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
      <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-6" />
      <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
        Keranjang Kamu Masih Kosong
      </h2>
      <p className="text-muted-foreground max-w-sm mb-6">
        Yuk jelajahi katalog kelas atau paket bundle kami dan mulai perjalanan belajar kamu hari ini.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
          <Button asChild size="lg">
            <Link href="/katalog">Jelajahi Katalog Kelas</Link>
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
          <Button asChild size="lg" variant="outline">
            <Link href="/paket-bundle">Lihat Paket Bundle</Link>
          </Button>
        </motion.div>
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
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }} className="shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8"
              disabled={isAdding}
              onClick={() => onAdd(cls.id)}
            >
              + Keranjang
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ── Cart item: kelas biasa ─────────────────────────────────────────────────────

function ClassCartItem({
  item,
  onRemove,
  isRemoving,
  isOwned,
}: {
  item: CartClassItem;
  onRemove: (id: string) => void;
  isRemoving: boolean;
  isOwned: boolean;
}) {
  const hasDiscount = item.class.discountPrice != null;
  const durationLabel = formatDuration(item.class.totalDurationMinutes);
  const displayPrice = item.class.discountPrice ?? item.class.basePrice;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={`flex flex-col gap-0 rounded-lg border bg-card shadow-sm overflow-hidden${isOwned ? ' border-amber-400/60' : ''}`}
    >
      {isOwned && (
        <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-amber-800 text-xs font-medium">
          <span>⚠</span>
          <span>Sudah kamu miliki — hapus item ini agar bisa lanjut bayar.</span>
        </div>
      )}
      <div className="flex gap-4 p-4">
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
            {hasDiscount && (
              <span className="text-xs text-text-tertiary line-through">
                {formatPrice(item.class.basePrice)}
              </span>
            )}
            <span className="text-sm font-bold text-primary">
              {formatPrice(displayPrice)}
            </span>
          </div>
          <motion.button
            onClick={() => onRemove(item.id)}
            disabled={isRemoving}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
            aria-label="Hapus dari keranjang"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      </div>
    </motion.div>
  );
}

// ── Cart item: ebook ──────────────────────────────────────────────────────────

function EbookCartItem({
  item,
  onRemove,
  isRemoving,
}: {
  item: CartEbookItem;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  const hasDiscount = item.ebook.discountPrice != null;
  const displayPrice = item.ebook.discountPrice ?? item.ebook.price;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex gap-4 rounded-lg border bg-card p-4 shadow-sm"
    >
      <div className="shrink-0 w-20 h-16 sm:w-28 sm:h-20 rounded-md overflow-hidden bg-muted">
        {item.ebook.coverImage ? (
          <img
            src={item.ebook.coverImage}
            alt={item.ebook.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">
            {item.ebook.title}
          </h3>
          <Badge
            variant="outline"
            className="text-[10px] border-primary/30 text-primary bg-primary/5 shrink-0 px-1.5 py-0"
          >
            Ebook
          </Badge>
        </div>
        {item.ebook.author && (
          <p className="text-xs text-muted-foreground mt-1">{item.ebook.author}</p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            {hasDiscount && (
              <span className="text-xs text-text-tertiary line-through">
                {formatPrice(item.ebook.price)}
              </span>
            )}
            <span className="text-sm font-bold text-primary">
              {formatPrice(displayPrice)}
            </span>
          </div>
          <motion.button
            onClick={() => onRemove(item.id)}
            disabled={isRemoving}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
            aria-label="Hapus dari keranjang"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
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
          <motion.button
            onClick={() => onRemove(item.id)}
            disabled={isRemoving}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
            aria-label="Hapus dari keranjang"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function CartContent() {
  const { user } = useAuth();
  const { items, isLoading, removeFromCart, isRemoving, classIdsInCart } = useCart();
  const [, setLocation] = useLocation();

  const handleRemoveAndRefreshRecommended = async (id: string) => {
    await removeFromCart(id);
  };

  const { data: allClasses = [] } = useQuery({
    queryKey: ['classes', 'all'],
    queryFn: () => listClasses(),
    enabled: !!user,
  });

  const { data: enrolledClassIds = new Set<string>() } = useQuery({
    queryKey: ['enrolled-class-ids', user?.id],
    queryFn: async () => new Set((await listEnrollments(user!.id)).map((e) => e.class.id)),
    enabled: !!user?.id,
  });

  // Kelas rekomendasi: kelas published yang belum ada di keranjang, belum dimiliki,
  // dan belum tercakup bundle yang ada di keranjang — maks 4
  const coveredByBundle = new Set(
    items
      .filter((i) => i.type === 'bundle')
      .flatMap((i) => (i as import('@/context/CartContext').CartBundleItem).bundle.classes.map((c) => c.id)),
  );
  const recommendedClasses = allClasses
    .filter(
      (cls) =>
        !classIdsInCart.has(cls.id) &&
        !enrolledClassIds.has(cls.id) &&
        !coveredByBundle.has(cls.id),
    )
    .slice(0, 4);

  // Subtotal: bundle pakai bundlePrice, kelas pakai harga (voucher kalau ada)
  const subtotal = items.reduce((sum, item) => {
    if (item.type === 'bundle') {
      return sum + item.bundle.bundlePrice;
    }
    if (item.type === 'ebook') {
      return sum + (item.ebook.discountPrice ?? item.ebook.price);
    }
    // kelas biasa
    return sum + (item.class.discountPrice ?? item.class.basePrice);
  }, 0);

  const classItemCount = items.filter((i) => i.type === 'class').length;
  const bundleItemCount = items.filter((i) => i.type === 'bundle').length;
  const ebookItemCount = items.filter((i) => i.type === 'ebook').length;

  const handleRemove = (id: string) => {
    void handleRemoveAndRefreshRecommended(id);
  };

  const handleCheckout = () => setLocation('/checkout');

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
                  if (item.type === 'ebook') {
                    return (
                      <EbookCartItem
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
                      onRemove={handleRemove}
                      isRemoving={isRemoving}
                      isOwned={enrolledClassIds.has(item.class.id)}
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
                    {ebookItemCount > 0 && (
                      <div className="flex justify-between">
                        <span>Ebook</span>
                        <span>{ebookItemCount}</span>
                      </div>
                    )}
                  </div>

                  {classItemCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Pembayaran selain Rupiah?{' '}
                      <a
                        href="https://docs.google.com/forms/d/e/1FAIpQLScmvdS21cixu6h261rDcKM0YscOm7z44upzZSO4leuOWY-dKg/viewform"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:text-primary/80"
                      >
                        klik disini
                      </a>.
                    </p>
                  )}

                  <Separator />

                  <div className="flex justify-between font-bold text-base">
                    <span>Subtotal</span>
                    <span className="text-primary">{formatPrice(subtotal)}</span>
                  </div>
                  {(() => {
                    const hasOwnedInCart = items.some(
                      (i) => i.type === 'class' && enrolledClassIds.has(i.class.id),
                    );
                    return (
                      <>
                        <motion.div whileHover={{ scale: hasOwnedInCart ? 1 : 1.02 }} whileTap={{ scale: hasOwnedInCart ? 1 : 0.98 }} transition={{ duration: 0.15 }}>
                          <Button
                            size="lg"
                            className="w-full text-base font-semibold"
                            disabled={items.length === 0 || hasOwnedInCart}
                            onClick={handleCheckout}
                          >
                            Lanjut ke pembayaran
                          </Button>
                        </motion.div>
                        {hasOwnedInCart && (
                          <p className="text-xs text-amber-700 text-center">
                            Ada kelas yang sudah kamu miliki di keranjang. Hapus dulu untuk melanjutkan.
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && recommendedClasses.length > 0 && (
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
              {recommendedClasses.map((cls) => (
                <RecommendationCardConnected key={cls.id} cls={cls as any} />
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
  const [added, setAdded] = useState(false);

  const handleAdd = async (classId: string) => {
    try {
      await addToCart(classId);
      setAdded(true);
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
