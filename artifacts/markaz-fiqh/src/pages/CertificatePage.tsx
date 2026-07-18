import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { getCertificateById, getSettings } from '@/lib/db';
import { Loader2, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: cert, isLoading, isError } = useQuery({
    queryKey: ['certificate', id],
    queryFn: () => getCertificateById(id!),
    enabled: !!id,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const handleDownloadPdf = async () => {
    if (!certificateRef.current || !cert) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Fit gambar ke halaman penuh sambil menjaga rasio, ditengahkan
      const canvasRatio = canvas.width / canvas.height;
      const pageRatio = pageWidth / pageHeight;
      let renderWidth = pageWidth, renderHeight = pageHeight, offsetX = 0, offsetY = 0;
      if (canvasRatio > pageRatio) {
        renderHeight = pageWidth / canvasRatio;
        offsetY = (pageHeight - renderHeight) / 2;
      } else {
        renderWidth = pageHeight * canvasRatio;
        offsetX = (pageWidth - renderWidth) / 2;
      }
      pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight);
      const safeName = (cert.fullName || 'peserta').replace(/[^a-zA-Z0-9]+/g, '-');
      const safeClass = (cert.classTitle || 'kelas').replace(/[^a-zA-Z0-9]+/g, '-');
      pdf.save(`Sertifikat-${safeClass}-${safeName}.pdf`);
    } catch {
      toast.error('Gagal membuat file PDF, coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  };

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

  // Prioritas template: per-kelas → default situs → HTML bawaan
  const activeTemplate =
    cert.certificateTemplateUrl?.trim() ||
    settings?.certificateDefaultTemplateUrl?.trim() ||
    null;

  const hasTemplate = !!activeTemplate;

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

      {/* Tombol aksi — disembunyikan saat print */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <Button onClick={() => window.print()} variant="outline" className="gap-2 shadow-lg">
          <Printer className="w-4 h-4" />
          Print
        </Button>
        <Button onClick={handleDownloadPdf} disabled={isDownloading} className="gap-2 shadow-lg">
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Mengunduh...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {hasTemplate ? (
        /* ── Mode Template ───────────────────────────────────────────── */
        <div className="cert-root min-h-screen bg-white flex items-center justify-center p-4">
          <div ref={certificateRef} className="relative w-full max-w-5xl">
            {/* Gambar template full-width, mempertahankan rasio asli */}
            <img
              src={activeTemplate!}
              alt="Template Sertifikat"
              crossOrigin="anonymous"
              className="w-full h-auto block"
              style={{ display: 'block' }}
            />

            {/* ── Overlay: Nama ── */}
            <p
              className="absolute font-serif font-bold text-foreground text-center"
              style={{
                left: '50.8%',
                top: '40.1%',
                transform: 'translate(-50%, -50%)',
                fontSize: '3.5vw',
                maxWidth: '60%',
                wordWrap: 'break-word',
                lineHeight: 1.2,
              }}
            >
              {cert.fullName}
            </p>

            {/* ── Overlay: Kelas ── */}
            <p
              className="absolute font-serif text-foreground text-center"
              style={{
                left: '50%',
                top: '56%',
                transform: 'translate(-50%, -50%)',
                fontSize: '2.1vw',
                maxWidth: '55%',
                wordWrap: 'break-word',
                lineHeight: 1.3,
              }}
            >
              {cert.classTitle}
            </p>

            {/* ── Overlay: Tanggal ── */}
            <p
              className="absolute text-foreground text-center"
              style={{
                left: '14%',
                top: '93.7%',
                transform: 'translate(-50%, -50%)',
                fontSize: '1.575vw',
                whiteSpace: 'nowrap',
              }}
            >
              {formatTanggal(cert.issuedAt)}
            </p>
          </div>
        </div>
      ) : (
      /* ── Mode Bawaan ─────────────────────────────────────────────── */
      <div
        ref={certificateRef}
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
