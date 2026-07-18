import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getCertificateById } from '@/lib/db';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>();

  const { data: cert, isLoading, isError } = useQuery({
    queryKey: ['certificate', id],
    queryFn: () => getCertificateById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !cert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-xl font-serif font-bold text-foreground">Sertifikat Tidak Ditemukan</p>
        <p className="text-sm text-muted-foreground">
          Nomor sertifikat tidak valid atau sudah dihapus.
        </p>
      </div>
    );
  }

  const hasTemplate = !!(cert.certificateTemplateUrl?.trim());

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .cert-root { min-height: 100vh; }
        }
        @page {
          size: A4 landscape;
          margin: 0;
        }
      `}</style>

      {/* Tombol print — disembunyikan saat print */}
      <div className="no-print fixed top-4 right-4 z-50">
        <Button onClick={() => window.print()} className="gap-2 shadow-lg">
          <Printer className="w-4 h-4" />
          Download / Print
        </Button>
      </div>

      {hasTemplate ? (
        /* ── Mode Template ───────────────────────────────────────────── */
        <div className="cert-root min-h-screen bg-white flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            {/* Gambar template full-width */}
            <img
              src={cert.certificateTemplateUrl!}
              alt="Template Sertifikat"
              className="w-full h-auto block"
              style={{ display: 'block' }}
            />
            {/* Overlay tengah — posisi persen supaya proporsional */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
              style={{ top: '38%', bottom: '20%', left: '10%', right: '10%' }}
            >
              <p
                className="font-serif font-bold text-foreground leading-tight"
                style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.4rem)' }}
              >
                {cert.fullName}
              </p>
              <p
                className="font-serif text-muted-foreground mt-2 leading-snug"
                style={{ fontSize: 'clamp(0.8rem, 2vw, 1.15rem)' }}
              >
                {cert.classTitle}
              </p>
              {cert.score && (
                <p
                  className="mt-2 text-foreground"
                  style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.9rem)' }}
                >
                  Nilai: <span className="font-bold">{cert.score}</span>
                </p>
              )}
              <p
                className="mt-3 text-muted-foreground"
                style={{ fontSize: 'clamp(0.55rem, 1.2vw, 0.75rem)' }}
              >
                No. {cert.certificateNumber} &nbsp;·&nbsp; {formatTanggal(cert.issuedAt)}
              </p>
            </div>
          </div>
        </div>
      ) : (
      /* ── Mode Bawaan ─────────────────────────────────────────────── */
      <div
        className="cert-root min-h-screen bg-white flex items-center justify-center p-8"
        style={{
          backgroundImage: 'url(/hero-pattern.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: '320px',
        }}
      >
        {/* Overlay putih supaya pattern tipis */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(255,255,255,0.90)' }}
        />

        {/* Card sertifikat */}
        <div
          className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden"
          style={{
            boxShadow: '0 4px 40px rgba(0,0,0,0.13)',
            border: '1.5px solid #c8a96e',
          }}
        >
          {/* Border dekoratif dalam */}
          <div
            className="absolute inset-3 rounded-xl pointer-events-none"
            style={{ border: '1px solid #e8d5a3' }}
          />

          {/* Konten */}
          <div className="relative px-16 py-12 flex flex-col items-center text-center gap-6">

            {/* Logo */}
            <img
              src="/logo.png"
              alt="Markaz Fiqih"
              className="h-16 w-auto"
              style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(60%) saturate(400%) hue-rotate(5deg)' }}
            />

            {/* Judul */}
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#c8a96e]">
                Markaz Fiqih
              </p>
              <h1
                className="font-serif font-bold text-foreground"
                style={{ fontSize: '2.8rem', letterSpacing: '0.12em', lineHeight: 1 }}
              >
                SERTIFIKAT
              </h1>
              <p className="text-sm text-muted-foreground tracking-widest uppercase">
                Keikutsertaan Kelas
              </p>
            </div>

            {/* Divider ornamental */}
            <div className="flex items-center gap-3 w-full max-w-sm">
              <div className="flex-1 h-px bg-[#c8a96e]/50" />
              <span className="text-[#c8a96e] text-lg">✦</span>
              <div className="flex-1 h-px bg-[#c8a96e]/50" />
            </div>

            {/* Penerima */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Diberikan kepada</p>
              <p
                className="font-serif font-bold text-foreground"
                style={{ fontSize: '2.2rem', lineHeight: 1.15 }}
              >
                {cert.fullName}
              </p>
            </div>

            {/* Kelas */}
            <div className="space-y-1 max-w-lg">
              <p className="text-sm text-muted-foreground">atas keikutsertaan dalam kelas</p>
              <p className="font-serif text-xl font-semibold text-foreground leading-snug">
                {cert.classTitle}
              </p>
            </div>

            {/* Nilai (kalau ada) */}
            {cert.score && (
              <div className="px-5 py-2 rounded-full border border-[#c8a96e]/40 bg-[#fdf8ee]">
                <p className="text-sm text-foreground">
                  Nilai Soal Latihan:{' '}
                  <span className="font-bold text-[#b8860b]">{cert.score}</span>
                </p>
              </div>
            )}

            {/* Divider ornamental bawah */}
            <div className="flex items-center gap-3 w-full max-w-sm">
              <div className="flex-1 h-px bg-[#c8a96e]/50" />
              <span className="text-[#c8a96e] text-lg">✦</span>
              <div className="flex-1 h-px bg-[#c8a96e]/50" />
            </div>

            {/* Footer: nomor & tanggal */}
            <div className="w-full flex items-end justify-between text-xs text-muted-foreground mt-2">
              <div className="text-left space-y-0.5">
                <p className="uppercase tracking-wide font-semibold text-[10px]">
                  Nomor Sertifikat
                </p>
                <p className="font-mono text-sm font-medium text-foreground">
                  {cert.certificateNumber}
                </p>
              </div>
              <div className="text-center space-y-4">
                <p className="text-xs text-muted-foreground">
                  Diterbitkan melalui platform Markaz Fiqih
                </p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="uppercase tracking-wide font-semibold text-[10px]">
                  Tanggal Terbit
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatTanggal(cert.issuedAt)}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
      )}
    </>
  );
}
