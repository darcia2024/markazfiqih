import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getCertificateById } from '@/lib/db';
import { Loader2 } from 'lucide-react';
import { CertificateView } from '@/components/CertificateView';

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

      <div className="cert-root min-h-screen bg-white p-4">
        <CertificateView cert={cert} />
      </div>

      {/* Catatan verifikasi publik */}
      <div className="no-print fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border shadow-sm">
        Verifikasi: markaz-fiqih.com/sertifikat/{cert.id}
      </div>
    </>
  );
}
