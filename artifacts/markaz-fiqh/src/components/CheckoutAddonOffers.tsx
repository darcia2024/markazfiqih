import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Loader2, BookOpen } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { listClasses, listEnrollments } from '@/lib/db';
import { formatPrice } from '@/pages/CatalogPage';

const MAX_OFFERS = 3;

/**
 * Section add-on/upsell di halaman checkout: menawarkan 2-3 kelas lain yang
 * belum ada di keranjang dan belum dimiliki user, dengan tombol "+ Tambah"
 * yang langsung masuk ke keranjang (mempengaruhi ringkasan harga secara
 * real-time lewat CartContext yang sama dipakai "Pesanan kamu").
 */
export function CheckoutAddonOffers() {
  const { user } = useAuth();
  const { items, classIdsInCart, addToCart, isAdding } = useCart();

  const classesQuery = useQuery({
    queryKey: ['classes-addon-offers'],
    queryFn: () => listClasses(),
    staleTime: 5 * 60 * 1000,
  });

  const enrolledQuery = useQuery({
    queryKey: ['enrolled-class-ids', user?.id],
    queryFn: async () => {
      const enrollments = await listEnrollments(user!.id);
      return new Set(enrollments.map((e) => e.class.id));
    },
    enabled: !!user?.id,
  });

  // Kelas yang sudah termasuk dalam paket (bundle) di keranjang — jangan tawarkan lagi satuan.
  const coveredByBundle = new Set<string>();
  for (const item of items) {
    if (item.type === 'bundle') {
      for (const cls of item.bundle.classes) coveredByBundle.add(cls.id);
    }
  }

  const offers = useMemo(() => {
    const classes = classesQuery.data ?? [];
    const enrolled = enrolledQuery.data ?? new Set<string>();
    return classes
      .filter((c) => !classIdsInCart.has(c.id))
      .filter((c) => !enrolled.has(c.id))
      .filter((c) => !coveredByBundle.has(c.id))
      .slice(0, MAX_OFFERS);
    // coveredByBundle dan classIdsInCart berubah tiap render dari items yang sama;
    // items dipakai sebagai dependency supaya offer ikut refresh saat keranjang berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classesQuery.data, enrolledQuery.data, items]);

  if (classesQuery.isLoading || offers.length === 0) return null;

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h2 className="text-sm font-semibold text-foreground">Tambahkan kelas lain?</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Beberapa pelajar juga mengambil kelas ini sekalian.
        </p>
      </div>
      <ul className="divide-y">
        {offers.map((cls) => {
          const price = cls.discountPrice ?? cls.basePrice;
          return (
            <li key={cls.id} className="flex gap-3 px-5 py-3.5 items-center">
              <div className="w-14 h-10 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                {cls.coverImage ? (
                  <img src={cls.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="h-4 w-4 text-muted-foreground/60" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground line-clamp-1">{cls.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatPrice(price)}</p>
              </div>
              <button
                onClick={() => void addToCart(cls.id)}
                disabled={isAdding}
                className="inline-flex items-center gap-1 shrink-0 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Tambah
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
