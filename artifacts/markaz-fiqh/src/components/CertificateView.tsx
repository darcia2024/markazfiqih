import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSettings, type CertificateRequest } from '@/lib/db';
import { Loader2, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { mergeOverlayConfig } from '@/lib/certificateOverlayDefaults';

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface CertificateViewProps {
  cert: CertificateRequest;
  showPrintButton?: boolean;
}

export function CertificateView({ cert, showPrintButton = true }: CertificateViewProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  // Prioritas template: per-kelas → default situs → HTML bawaan
  const activeTemplate =
    cert.certificateTemplateUrl?.trim() ||
    settings?.certificateDefaultTemplateUrl?.trim() ||
    null;

  const hasTemplate = !!activeTemplate;

  // Merge overlay config dari settings dengan default
  const overlayConfig = mergeOverlayConfig(settings?.certificateOverlayConfig ?? null);
  const fontUrl = overlayConfig.fontUrl ?? null;
  const customFontFamily = fontUrl ? "'sertifikat-custom-font', serif" : undefined;

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

  return (
    <div className="flex flex-col gap-3">
      {/* Tombol aksi */}
      <div className="flex gap-2 justify-end">
        {showPrintButton && (
          <Button onClick={() => window.print()} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
        )}
        <Button onClick={handleDownloadPdf} disabled={isDownloading} className="gap-2">
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
        <>
          <div className="bg-white flex items-center justify-center">
            {/* certificateRef hanya membungkus gambar + overlay — tidak termasuk badge verifikasi */}
            <div
              ref={certificateRef}
              className="relative w-full max-w-5xl"
              style={{ containerType: 'inline-size' }}
            >
              {/* Inject @font-face sekali per instance, hanya jika fontUrl terisi */}
              {fontUrl && (
                <style>{`@font-face { font-family: 'sertifikat-custom-font'; src: url('${fontUrl}'); font-display: swap; }`}</style>
              )}

              <img
                src={activeTemplate!}
                alt="Template Sertifikat"
                crossOrigin="anonymous"
                className="w-full h-auto block"
                style={{ display: 'block' }}
              />

              {/* ── Overlay: Nama ── */}
              <p
                className="absolute font-serif font-bold text-center"
                style={{
                  left: `${overlayConfig.nama.left}%`,
                  top: `${overlayConfig.nama.top}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${overlayConfig.nama.fontSize}cqw`,
                  color: overlayConfig.nama.color,
                  maxWidth: '60%',
                  wordWrap: 'break-word',
                  lineHeight: 1.2,
                  ...(customFontFamily ? { fontFamily: customFontFamily } : {}),
                }}
              >
                {cert.fullName}
              </p>

              {/* ── Overlay: Kelas ── */}
              <p
                className="absolute font-serif text-center"
                style={{
                  left: `${overlayConfig.kelas.left}%`,
                  top: `${overlayConfig.kelas.top}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${overlayConfig.kelas.fontSize}cqw`,
                  color: overlayConfig.kelas.color,
                  maxWidth: '55%',
                  wordWrap: 'break-word',
                  lineHeight: 1.3,
                  ...(customFontFamily ? { fontFamily: customFontFamily } : {}),
                }}
              >
                {cert.classTitle}
              </p>

              {/* ── Overlay: Tanggal ── */}
              <p
                className="absolute text-center"
                style={{
                  left: `${overlayConfig.tanggal.left}%`,
                  top: `${overlayConfig.tanggal.top}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${overlayConfig.tanggal.fontSize}cqw`,
                  color: overlayConfig.tanggal.color,
                  whiteSpace: 'nowrap',
                  ...(customFontFamily ? { fontFamily: customFontFamily } : {}),
                }}
              >
                {formatTanggal(cert.issuedAt)}
              </p>
            </div>
          </div>

          {/* Badge verifikasi — DI LUAR certificateRef, tidak ikut ter-capture html2canvas */}
          <div className="flex justify-center mt-3">
            <span className="rounded-full bg-muted text-muted-foreground text-xs px-3 py-1.5 inline-block">
              Verifikasi: markaz-fiqih.com/sertifikat/{cert.id}
            </span>
          </div>
        </>
      ) : (
        /* ── Mode Bawaan ─────────────────────────────────────────────── */
        <div
          ref={certificateRef}
          className="bg-white flex items-center justify-center p-8 relative"
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
    </div>
  );
}
