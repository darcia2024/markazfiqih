import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Reset posisi scroll ke atas setiap kali route berubah (mis. dari katalog
 * yang sudah di-scroll jauh ke bawah, lalu pindah ke keranjang — tanpa ini
 * halaman baru akan ikut ter-scroll ke posisi yang sama).
 *
 * Dipasang sekali di root App, di dalam WouterRouter supaya punya akses ke
 * location. Tidak merender apapun.
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}
