import { FileText, MessageCircle } from 'lucide-react';

interface FacilitasCardProps {
  gdriveMateriUrl?: string | null;
  waGroupUrl?: string | null;
}

/** Render hanya jika minimal satu dari dua link terisi. */
export function FacilitasCard({ gdriveMateriUrl, waGroupUrl }: FacilitasCardProps) {
  if (!gdriveMateriUrl && !waGroupUrl) return null;

  return (
    <div className="p-6 space-y-3">
      <p className="text-sm font-semibold text-foreground mb-3">Fasilitas Kelas</p>
      <div className="space-y-2">
        {gdriveMateriUrl && (
          <a
            href={gdriveMateriUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-[hsl(var(--brand-red-tint))] transition-colors w-full text-sm text-foreground"
          >
            <FileText className="w-4 h-4 text-primary shrink-0" />
            Materi &amp; Slide (PDF)
          </a>
        )}
        {waGroupUrl && (
          <a
            href={waGroupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-[hsl(var(--brand-red-tint))] transition-colors w-full text-sm text-foreground"
          >
            <MessageCircle className="w-4 h-4 text-primary shrink-0" />
            Gabung Grup WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
