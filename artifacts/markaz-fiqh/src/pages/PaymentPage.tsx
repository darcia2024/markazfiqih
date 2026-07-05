import { useState, useMemo } from 'react';
import { Link, useSearch, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Copy, Smartphone, Building2, CreditCard, Wallet } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getClassById, formatPrice } from '@/data/mockClasses';

const FALLBACK_CLASS_ID = 'fiqih-thaharah';

type PaymentMethod = 'qris' | 'va-bca' | 'va-bni' | 'va-mandiri' | 'ewallet' | 'card';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'qris',      label: 'QRIS',              icon: <Smartphone className="w-5 h-5" />,  desc: 'Bayar dengan semua dompet digital via QR Code' },
  { id: 'va-bca',    label: 'VA BCA',             icon: <Building2 className="w-5 h-5" />,   desc: 'Transfer ke Virtual Account BCA' },
  { id: 'va-bni',    label: 'VA BNI',             icon: <Building2 className="w-5 h-5" />,   desc: 'Transfer ke Virtual Account BNI' },
  { id: 'va-mandiri',label: 'VA Mandiri',         icon: <Building2 className="w-5 h-5" />,   desc: 'Transfer ke Virtual Account Mandiri' },
  { id: 'ewallet',   label: 'GoPay / OVO / DANA', icon: <Wallet className="w-5 h-5" />,      desc: 'Bayar langsung dari dompet digital kamu' },
  { id: 'card',      label: 'Kartu Kredit / Debit',icon: <CreditCard className="w-5 h-5" />, desc: 'Visa, Mastercard, atau JCB' },
];

// ── Mock instruksi tiap metode ────────────────────────────────────────────────
function QrisPanel({ amount }: { amount: string }) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">
        Scan QR Code di bawah menggunakan aplikasi dompet digital apapun.
      </p>
      {/* Mock QR Code — SVG simple pattern */}
      <div className="mx-auto w-48 h-48 rounded-xl border-4 border-primary bg-white flex items-center justify-center shadow-inner">
        <div className="grid grid-cols-7 gap-0.5 p-2 w-full h-full">
          {Array.from({ length: 49 }).map((_, i) => {
            const pattern = [0,1,2,3,4,5,6,7,14,21,28,35,42,43,44,45,46,47,48,6,13,20,27,34,41,10,11,12,15,16,23,24,25,32,33,36,37,38].includes(i);
            return (
              <div
                key={i}
                className={`rounded-sm ${pattern ? 'bg-primary' : 'bg-transparent'}`}
              />
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Kode kedaluwarsa dalam <span className="font-semibold text-foreground">14:37</span>
      </p>
      <div className="rounded-lg bg-muted/60 p-3">
        <p className="text-xs text-muted-foreground">Total Pembayaran</p>
        <p className="text-2xl font-bold text-primary">{amount}</p>
      </div>
    </div>
  );
}

function VaPanel({ bank, vaNumber, amount }: { bank: string; vaNumber: string; amount: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(vaNumber.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Transfer ke nomor Virtual Account <strong>{bank}</strong> berikut sebelum batas waktu.
      </p>
      <div className="rounded-xl border bg-muted/40 p-5 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Bank Tujuan</p>
          <p className="font-bold text-foreground text-lg">{bank}</p>
        </div>
        <Separator />
        <div>
          <p className="text-xs text-muted-foreground mb-1">Nomor Virtual Account</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-xl font-bold tracking-widest text-foreground flex-1">
              {vaNumber}
            </p>
            <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-1">
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Disalin!' : 'Salin'}
            </Button>
          </div>
        </div>
        <Separator />
        <div>
          <p className="text-xs text-muted-foreground mb-1">Jumlah Transfer (harus tepat)</p>
          <p className="text-2xl font-bold text-primary">{amount}</p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-700">
            Batas waktu pembayaran: <strong>24 jam</strong> sejak pesanan dibuat.
            Pastikan jumlah transfer <strong>tepat sama</strong> agar sistem dapat mendeteksi otomatis.
          </p>
        </div>
      </div>
    </div>
  );
}

function EwalletPanel({ amount }: { amount: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Pilih dompet digital untuk melanjutkan pembayaran.
      </p>
      {[
        { name: 'GoPay',  color: 'bg-green-500',  code: '0812-3456-7890' },
        { name: 'OVO',    color: 'bg-purple-600', code: '0812-3456-7890' },
        { name: 'DANA',   color: 'bg-blue-500',   code: '0812-3456-7890' },
      ].map((w) => (
        <button
          key={w.name}
          className="w-full flex items-center gap-3 rounded-xl border bg-card hover:bg-muted/50 p-4 transition-colors text-left"
        >
          <div className={`w-10 h-10 rounded-full ${w.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {w.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">{w.name}</p>
            <p className="text-xs text-muted-foreground truncate">ke {w.code}</p>
          </div>
          <p className="font-bold text-sm text-primary shrink-0">{amount}</p>
        </button>
      ))}
    </div>
  );
}

function CardPanel() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Masukkan detail kartu kredit atau debit kamu. (Formulir tiruan — tidak ada data yang dikirim)
      </p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nomor Kartu</label>
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            readOnly
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Kadaluwarsa</label>
            <input
              type="text"
              placeholder="MM / YY"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              readOnly
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">CVV</label>
            <input
              type="text"
              placeholder="123"
              maxLength={3}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              readOnly
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nama di Kartu</label>
          <input
            type="text"
            placeholder="NAMA LENGKAP"
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm uppercase placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            readOnly
          />
        </div>
      </div>
    </div>
  );
}

// ── Konten Utama ───────────────────────────────────────────────────────────────
function PaymentContent() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const classId = params.get('classId') || FALLBACK_CLASS_ID;
  const cls = getClassById(classId) ?? getClassById(FALLBACK_CLASS_ID)!;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const finalPrice = cls.discount_price ?? cls.base_price;
  const formattedPrice = useMemo(() => formatPrice(finalPrice), [finalPrice]);

  const MOCK_VA: Record<string, { bank: string; vaNumber: string }> = {
    'va-bca':     { bank: 'BCA',     vaNumber: '8277 4521 3456 7890' },
    'va-bni':     { bank: 'BNI',     vaNumber: '8827 4521 3456 7890' },
    'va-mandiri': { bank: 'Mandiri', vaNumber: '8901 4521 3456 7890' },
  };

  const handleSimulatePay = () => {
    if (!selectedMethod) return;
    setIsProcessing(true);
    // Simulasi delay "memproses" lalu redirect ke halaman status
    setTimeout(() => {
      setLocation(`/payment-status?orderId=mock-order-${Date.now()}&classId=${cls.id}`);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-3">
          <Link
            href={`/checkout?classId=${cls.id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Kembali ke Keranjang
          </Link>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-10 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-1"
        >
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
            Langkah 2 dari 2
          </p>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Pembayaran
          </h1>
          <p className="text-muted-foreground">
            Pilih metode pembayaran dan selesaikan transaksi.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── Kiri: Panel Pembayaran ── */}
          <div className="lg:col-span-3 space-y-5">
            {/* Header panel - gaya Mayar embed */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="bg-primary px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/80" />
                  <span className="text-white text-sm font-semibold tracking-wide">
                    Panel Pembayaran Mayar
                  </span>
                </div>
                <Badge className="bg-white/20 hover:bg-white/20 text-white text-xs border-0">
                  Aman & Terenkripsi
                </Badge>
              </div>

              <div className="p-5 space-y-4">
                {/* Daftar metode */}
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pilih Metode Pembayaran
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex items-center gap-3 rounded-lg border p-3.5 text-left transition-all ${
                        selectedMethod === method.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/50 hover:bg-muted/40'
                      }`}
                    >
                      <div className={`shrink-0 ${selectedMethod === method.id ? 'text-primary' : 'text-muted-foreground'}`}>
                        {method.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${selectedMethod === method.id ? 'text-primary' : 'text-foreground'}`}>
                          {method.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{method.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        selectedMethod === method.id ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                      }`}>
                        {selectedMethod === method.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel instruksi metode terpilih */}
              <AnimatePresence mode="wait">
                {selectedMethod && (
                  <motion.div
                    key={selectedMethod}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t p-5 bg-muted/20">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                        Instruksi Pembayaran
                      </p>
                      {selectedMethod === 'qris' && <QrisPanel amount={formattedPrice} />}
                      {selectedMethod === 'va-bca' && (
                        <VaPanel {...MOCK_VA['va-bca']} amount={formattedPrice} />
                      )}
                      {selectedMethod === 'va-bni' && (
                        <VaPanel {...MOCK_VA['va-bni']} amount={formattedPrice} />
                      )}
                      {selectedMethod === 'va-mandiri' && (
                        <VaPanel {...MOCK_VA['va-mandiri']} amount={formattedPrice} />
                      )}
                      {selectedMethod === 'ewallet' && <EwalletPanel amount={formattedPrice} />}
                      {selectedMethod === 'card' && <CardPanel />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tombol bayar */}
              <div className="border-t p-5">
                <Button
                  size="lg"
                  className="w-full text-base font-semibold"
                  disabled={!selectedMethod || isProcessing}
                  onClick={handleSimulatePay}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Memproses…
                    </span>
                  ) : selectedMethod ? (
                    `Konfirmasi Bayar ${formattedPrice}`
                  ) : (
                    'Pilih Metode Pembayaran Terlebih Dahulu'
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Ini adalah simulasi UI. Tidak ada transaksi nyata yang terjadi.
                </p>
              </div>
            </div>
          </div>

          {/* ── Kanan: Ringkasan Pesanan ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="p-5 space-y-4">
                <h3 className="font-semibold text-foreground text-sm">Pesanan Kamu</h3>
                <div className="flex gap-3">
                  <div className="w-16 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                    <img src={cls.cover_image} alt={cls.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                      {cls.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cls.instructor.name}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  {cls.discount_price !== null && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Harga asli</span>
                      <span className="line-through">{formatPrice(cls.base_price)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-primary">{formattedPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 Markaz Fiqh. Semua Hak Dilindungi.
      </footer>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <ProtectedRoute>
      <PaymentContent />
    </ProtectedRoute>
  );
}
