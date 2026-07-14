// ─────────────────────────────────────────────────────────────────────────────
// Daftar "Metode pembayaran" versi logo, menggantikan pill/badge teks polos.
// Setiap baris: nama metode di kiri, logo-logo penyedia terkait di kanan.
// Mengikuti referensi desain yang dilampirkan user (card list, logo brand asli).
// Aset logo disimpan di /public/payment-logos (lihat komentar tiap <img>).
// ─────────────────────────────────────────────────────────────────────────────

type Method = {
  name: string;
  logos: { src: string; alt: string; className?: string }[];
};

const METHODS: Method[] = [
  {
    name: 'QRIS',
    logos: [{ src: '/payment-logos/qris.png', alt: 'QRIS', className: 'h-6' }],
  },
  {
    name: 'Transfer Bank (VA)',
    logos: [
      { src: '/payment-logos/atm-bersama.png', alt: 'ATM Bersama', className: 'h-7' },
      // Prima & ALTO: tidak ada aset PNG resmi berkualitas baik yang isolated,
      // ditampilkan sebagai badge teks bergaya logo agar tetap konsisten secara visual.
    ],
    // badge teks untuk jaringan tanpa aset gambar
  },
  {
    name: 'E-Wallet',
    logos: [
      { src: '/payment-logos/dana.png', alt: 'DANA', className: 'h-7' },
      { src: '/payment-logos/linkaja.webp', alt: 'LinkAja', className: 'h-7' },
      { src: '/payment-logos/ovo.png', alt: 'OVO', className: 'h-7' },
      { src: '/payment-logos/shopeepay.png', alt: 'ShopeePay', className: 'h-7' },
      { src: '/payment-logos/gopay.png', alt: 'GoPay', className: 'h-7' },
    ],
  },
  {
    name: 'Mini Market',
    logos: [{ src: '/payment-logos/alfamart.png', alt: 'Alfamart', className: 'h-6' }],
  },
];

function TextBadge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={[
        'inline-flex h-7 items-center justify-center rounded-full px-2.5 text-[11px] font-bold tracking-wide text-white shrink-0',
        className,
      ].join(' ')}
    >
      {label}
    </span>
  );
}

export function PaymentMethodLogos() {
  return (
    <div className="divide-y rounded-lg border overflow-hidden">
      {METHODS.map((method) => (
        <div key={method.name} className="flex items-center justify-between gap-4 px-4 py-3.5 bg-card">
          <span className="text-sm font-medium text-foreground">{method.name}</span>
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {method.logos.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                title={logo.alt}
                className={['object-contain', logo.className ?? 'h-7'].join(' ')}
              />
            ))}
            {method.name === 'Transfer Bank (VA)' && (
              <>
                <TextBadge label="PRIMA" className="bg-[hsl(var(--primary))]" />
                <TextBadge label="ALTO" className="bg-[hsl(var(--brand-red-hover))]" />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
