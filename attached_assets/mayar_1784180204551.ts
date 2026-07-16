// ─────────────────────────────────────────────────────────────────────────────
// Klien Mayar Headless API — dipakai oleh checkout / mayar-webhook / payment-status
//
// Env yang dibutuhkan:
//   MAYAR_API_KEY   → Mayar Dashboard → Integrasi → API Key
//   MAYAR_BASE_URL  → https://api.mayar.id  (produksi)  |  https://api.mayar.club  (sandbox)
// ─────────────────────────────────────────────────────────────────────────────

/** Terima format lama (".../hl/v1") maupun host polos, lalu normalisasi ke host. */
function mayarHost(): string {
  const raw = Deno.env.get('MAYAR_BASE_URL') ?? 'https://api.mayar.id';
  return raw.replace(/\/hl\/v\d+\/?$/, '').replace(/\/+$/, '');
}

export const MAYAR_V1 = () => `${mayarHost()}/hl/v1`;
export const MAYAR_V2 = () => `${mayarHost()}/hl/v2`;

export function mayarApiKey(): string {
  const key = Deno.env.get('MAYAR_API_KEY') ?? '';
  if (!key) throw new Error('MAYAR_API_KEY belum diisi di environment.');
  return key;
}

export type MayarInvoiceItem = {
  quantity: number;
  rate: number;         // harga satuan dalam Rupiah penuh (bukan sen)
  description: string;
};

export type CreateInvoiceInput = {
  name: string;
  email: string;
  mobile: string;
  description: string;
  items: MayarInvoiceItem[];
  redirectUrl: string;
  expiredAt: string;    // ISO string
  extraData: Record<string, string>;
};

export type CreatedMayarInvoice = {
  id: string;
  transactionId: string;
  link: string;         // URL halaman pembayaran Mayar
  expiredAt: number;    // epoch millis
};

/** POST /hl/v1/invoice/create */
export async function createMayarInvoice(input: CreateInvoiceInput): Promise<CreatedMayarInvoice> {
  const res = await fetch(`${MAYAR_V1()}/invoice/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mayarApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json?.statusCode !== 200 || !json?.data?.id || !json?.data?.link) {
    console.error('Mayar invoice/create gagal:', res.status, JSON.stringify(json));
    throw new Error('Gagal membuat tagihan pembayaran di Mayar.');
  }

  return {
    id: json.data.id,
    transactionId: json.data.transactionId ?? '',
    link: json.data.link,
    expiredAt: json.data.expiredAt ?? Date.now() + 24 * 60 * 60 * 1000,
  };
}

export type MayarInvoiceDetail = {
  id: string;
  amount: number;
  status: string;       // 'paid' | 'unpaid' | 'closed'
  paymentUrl?: string;
};

/**
 * GET /hl/v2/invoices/{id}
 *
 * Ini SUMBER KEBENARAN status pembayaran. Webhook hanya dipakai sebagai
 * pemicu; status tetap dikonfirmasi ulang lewat endpoint ini supaya payload
 * webhook palsu tidak bisa menghasilkan enrollment gratis.
 */
export async function getMayarInvoice(mayarInvoiceId: string): Promise<MayarInvoiceDetail | null> {
  const res = await fetch(`${MAYAR_V2()}/invoices/${mayarInvoiceId}`, {
    headers: { Authorization: `Bearer ${mayarApiKey()}` },
  });

  if (res.status === 404) return null;

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.statusCode !== 200 || !json?.data) {
    console.error('Mayar invoices/{id} gagal:', res.status, JSON.stringify(json));
    throw new Error('Gagal mengambil status tagihan dari Mayar.');
  }

  return {
    id: json.data.id,
    amount: Number(json.data.amount ?? 0),
    status: String(json.data.status ?? '').toLowerCase(),
    paymentUrl: json.data.paymentUrl,
  };
}

/**
 * GET /hl/v1/invoice/close/{id}
 *
 * Menutup invoice di sisi MAYAR supaya link pembayaran lama TIDAK BISA
 * dibayar lagi. Ini penting: waktu checkout mengganti invoice basi dengan
 * invoice baru, link Mayar lama masih berkeliaran (tab/jendela popup yang
 * belum ditutup, email invoice dari Mayar). Tanpa ditutup, user bisa
 * membayar link lama → dapat isi invoice LAMA (kelas yang salah).
 *
 * Best-effort: kegagalan hanya dicatat di log, tidak menggagalkan checkout —
 * invoice basi tetap sudah dimatikan di database lokal.
 */
export async function closeMayarInvoice(mayarInvoiceId: string): Promise<boolean> {
  try {
    const res = await fetch(`${MAYAR_V1()}/invoice/close/${mayarInvoiceId}`, {
      headers: { Authorization: `Bearer ${mayarApiKey()}` },
    });
    const json = await res.json().catch(() => ({}));
    const ok = res.ok && json?.messages === 'success';
    if (!ok) {
      console.warn('Mayar invoice/close gagal:', mayarInvoiceId, res.status, JSON.stringify(json));
    }
    return ok;
  } catch (e) {
    console.warn('Mayar invoice/close error:', mayarInvoiceId, e);
    return false;
  }
}

/** True kalau status dari Mayar berarti "sudah dibayar". */
export function isPaidStatus(status: string | undefined): boolean {
  return status === 'paid' || status === 'settled' || status === 'success';
}
