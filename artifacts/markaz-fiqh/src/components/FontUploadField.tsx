import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileType, X } from 'lucide-react';
import { uploadAdminImage } from '@/lib/db';

interface FontUploadFieldProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

/** Ekstrak nama file dari URL (bagian setelah / terakhir). */
function extractFilename(url: string): string {
  return url.split('/').pop() ?? url;
}

export function FontUploadField({ value, onChange }: FontUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file font maksimal 5 MB.');
      return;
    }

    setIsUploading(true);
    try {
      // Gunakan fungsi upload yang sama dengan ImageUploadField
      // (bucket: admin-uploads, path: UUID.ext, public URL)
      const url = await uploadAdminImage(file);
      onChange(url);
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'Upload gagal, tidak diketahui penyebabnya.',
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/40">
          <FileType className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm truncate flex-1 font-mono">{extractFilename(value)}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(null)}
            title="Hapus font"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isUploading ? 'Mengupload...' : 'Upload File Font'}
        </Button>
      )}

      {errorMsg && (
        <p className="text-xs text-destructive font-medium">⚠ {errorMsg}</p>
      )}
    </div>
  );
}
