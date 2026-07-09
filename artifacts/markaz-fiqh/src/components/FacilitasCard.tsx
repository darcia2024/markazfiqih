import { BookOpen, ClipboardList, FileText, MessageCircle, MessageSquareQuote } from 'lucide-react';

interface FacilitasCardProps {
  gdriveMateriUrl?: string | null;
  waGroupUrl?: string | null;
  soalLatihanUrl?: string | null;
  ebookUrl?: string | null;
  testimoniFormUrl?: string | null;
}

/** Render hanya jika minimal satu dari lima link terisi. */
export function FacilitasCard({ gdriveMateriUrl, waGroupUrl, soalLatihanUrl, ebookUrl, testimoniFormUrl }: FacilitasCardProps) {
  if (!gdriveMateriUrl && !waGroupUrl && !soalLatihanUrl && !ebookUrl && !testimoniFormUrl) return null;

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
        {soalLatihanUrl && (
          <a
            href={soalLatihanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-[hsl(var(--brand-red-tint))] transition-colors w-full text-sm text-foreground"
          >
            <ClipboardList className="w-4 h-4 text-primary shrink-0" />
            Soal Latihan
          </a>
        )}
        {ebookUrl && (
          <a
            href={ebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-[hsl(var(--brand-red-tint))] transition-colors w-full text-sm text-foreground"
          >
            <BookOpen className="w-4 h-4 text-primary shrink-0" />
            Ebook
          </a>
        )}
        {testimoniFormUrl && (
          <a
            href={testimoniFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-[hsl(var(--brand-red-tint))] transition-colors w-full text-sm text-foreground"
          >
            <MessageSquareQuote className="w-4 h-4 text-primary shrink-0" />
            Isi Testimoni
          </a>
        )}
      </div>
    </div>
  );
}
