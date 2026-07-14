import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Semua panggilan pembayaran lewat Edge Function. Frontend tidak pernah
// menyentuh API Mayar langsung — API key hanya ada di server.
// ─────────────────────────────────────────────────────────────────────────────

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1`;

async function authedPost<T>(path: string, body: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Sesi kamu habis. Masuk lagi untuk melanjutkan.');

  const res = await fetch(`${FUNCTIONS_URL}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body ?? {}),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.error ?? 'Terjadi kesalahan. Coba lagi.');
  return payload as T;
}

export type CheckoutSession = {
  id: string;
  paymentUrl: string;
  expiresAt: string;
  totalAmount: number;
  voucherApplied?: boolean;
  /** true kalau tagihan pending yang lama dipakai ulang, bukan bikin baru */
  reused?: boolean;
};

/** Bikin invoice + tagihan Mayar. Harga dihitung ulang di server. */
export function startCheckout(voucherCode?: string): Promise<CheckoutSession> {
  return authedPost<CheckoutSession>('checkout', voucherCode ? { voucherCode } : {});
}

export type PaymentStatus = {
  id: string;
  status: 'pending' | 'paid' | 'failed';
  totalAmount: number;
  paymentUrl: string | null;
  expiresAt: string | null;
  paidAt?: string | null;
  reason?: 'expired';
};

/**
 * Cek status pembayaran. Fungsi ini juga memaksa server bertanya ke Mayar,
 * jadi ini yang menyelamatkan transaksi kalau webhook telat atau gagal.
 */
export function getPaymentStatus(invoiceId: string): Promise<PaymentStatus> {
  return authedPost<PaymentStatus>('payment-status', { invoiceId });
}
