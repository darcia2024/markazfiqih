import { toast } from 'sonner';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Package2, ShoppingCart, Check, Tag } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { listBundles } from '@/lib/db';
import type { BundleItem } from '@/lib/db';
import { formatPrice } from '@/pages/CatalogPage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';

// ── Header ────────────────────────────────────────────────────────────────────

function BundlesHeader() {
  const { user } = useAuth();
  const { count } = useCart();
  return (
    <div className="flex items-center justify-between px-6 lg:px-10 pt-8 pb-2">
      <div>
        <h1 className="font-serif text-[32px] font-bold text-foreground leading-tight">
          Paket Bundle
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Beli beberapa kelas sekaligus dengan harga lebih hemat
        </p>
      </div>
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
    </div>
  );
}

// ── Kartu Bundle ──────────────────────────────────────────────────────────────

function BundleCard({ bundle, index }: { bundle: BundleItem; index: number }) {
  const { user } = useAuth();
  const { bundleIdsInCart, addBundleToCart, isAdding } = useCart();
  const [, setLocation] = useLocation();

  const inCart = bundleIdsInCart.has(bundle.id);
  const hemat = bundle.normalPrice - bundle.bundlePrice;
  const persen = Math.round((hemat / bundle.normalPrice) * 100);

  const handleCartAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setLocation(`/login?redirect=${encodeURIComponent('/paket-bundle')}`);
      return;
    }
    if (inCart) {
      setLocation('/keranjang');
      return;
    }
    try {
      await addBundleToCart(bundle.id);
      toast.success('Paket bundle berhasil ditambahkan ke keranjang');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal menambahkan ke keranjang. Coba lagi.',
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      layout
      className="h-full"
    >
      <div className="h-full flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
        {/* Header kartu */}
        <div className="bg-gradient-to-br from-primary/8 to-primary/3 px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Package2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground leading-tight">
                {bundle.title}
              </h3>
            </div>
            {persen > 0 && (
              <Badge className="shrink-0 bg-green-100 text-green-700 border-green-200 text-[11px] font-semibold">
                Hemat {persen}%
              </Badge>
            )}
          </div>
          {bundle.description && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {bundle.description}
            </p>
          )}
        </div>

        {/* Daftar kelas */}
        <div className="flex-1 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">
            {bundle.classes.length} Kelas di dalamnya
          </p>
          <ul className="space-y-1.5">
            {bundle.classes.map((cls) => (
              <li key={cls.id} className="flex items-center gap-2 text-sm text-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                <span className="line-clamp-1">{cls.title}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer harga + tombol */}
        <div className="px-5 pb-5 pt-3 border-t border-border flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(bundle.normalPrice)}
              </span>
            </div>
            <span className="text-xl font-bold text-primary leading-tight">
              {formatPrice(bundle.bundlePrice)}
            </span>
          </div>

          <motion.div whileTap={{ scale: 0.92 }}>
            <Button
              size="sm"
              variant={inCart ? 'outline' : 'default'}
              className="shrink-0 gap-1.5"
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
              {inCart ? 'Di Keranjang' : 'Tambah ke Keranjang'}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function BundleCardSkeleton() {
  return (
    <div className="h-full flex flex-col rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-border space-y-2">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
      <div className="flex-1 px-5 py-4 space-y-2">
        <Skeleton className="h-3 w-28 mb-3" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <div className="px-5 pb-5 pt-3 border-t border-border flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
    </div>
  );
}

function EmptyBundles() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Package2 className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-base text-muted-foreground max-w-sm">
        Belum ada paket bundle yang tersedia saat ini.
      </p>
      <Button asChild variant="ghost" size="sm" className="mt-4">
        <Link href="/katalog">Lihat Kelas Individual</Link>
      </Button>
    </motion.div>
  );
}

// ── Konten Halaman ────────────────────────────────────────────────────────────

function BundlesContent() {
  const bundlesQuery = useQuery({
    queryKey: ['bundles'],
    queryFn: listBundles,
  });

  const bundles = bundlesQuery.data ?? [];
  const isLoading = bundlesQuery.isLoading;

  return (
    <AppShell>
      <BundlesHeader />
      <main className="px-6 lg:px-10 py-8 max-w-[1400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <BundleCardSkeleton key={i} />)}

          {!isLoading && bundles.length === 0 && <EmptyBundles />}

          {!isLoading &&
            bundles.map((bundle, idx) => (
              <BundleCard key={bundle.id} bundle={bundle} index={idx} />
            ))}
        </div>
      </main>
    </AppShell>
  );
}

export default function BundlesPage() {
  return (
    <ProtectedRoute>
      <BundlesContent />
    </ProtectedRoute>
  );
}
