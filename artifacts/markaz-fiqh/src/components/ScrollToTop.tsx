import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Reset posisi scroll ke atas setiap kali route berubah (mis. dari katalog
 * yang sudah di-scroll jauh ke bawah, lalu pindah ke keranjang — tanpa ini
 * halaman baru akan ikut ter-scroll ke posisi yang sama).
 *
 * Dipasang sekali di root App, di dalam WouterRouter supaya punya akses ke
 * location. Tidak merender apapun.
 *
 * Pakai requestAnimationFrame agar scroll terjadi setelah browser selesai
 * paint halaman baru — tanpa ini window.scrollTo bisa terpanggil saat DOM
 * halaman lama masih ada sehingga tidak berpengaruh pada halaman berikutnya.
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
    return () => cancelAnimationFrame(id);
  }, [location]);

  return null;
}
