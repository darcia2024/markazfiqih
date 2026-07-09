import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2 } from 'lucide-react';
import { uploadAdminImage } from '@/lib/db';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  /** Styling preview — bulat untuk foto pengajar, persegi untuk cover kelas. */
  previewClassName?: string;
}

export function ImageUploadField({ value, onChange, previewClassName }: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    console.log('[ImageUpload] File dipilih:', file?.name, file?.size, file?.type);
    if (!file) return;

    setErrorMsg(null);

    if (file.size > 5 * 1024 * 1024) {
      console.error('[ImageUpload] File terlalu besar:', file.size);
      setErrorMsg('Ukuran file maksimal 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      console.log('[ImageUpload] Mulai upload ke Supabase Storage...');
      const url = await uploadAdminImage(file);
      console.log('[ImageUpload] Upload SUKSES, URL:', url);
      onChange(url);
    } catch (error) {
      console.error('[ImageUpload] Upload GAGAL:', error);
      setErrorMsg(
        error instanceof Error ? error.message : 'Upload gagal, tidak diketahui penyebabnya.',
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt=""
            className={previewClassName ?? 'w-16 h-16 rounded-full object-cover border'}
            onError={() => console.error('[ImageUpload] Preview gagal load URL:', value)}
          />
        ) : (
          <div
            className={
              previewClassName ??
              'w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs'
            }
          >
            No image
          </div>
        )}
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? 'Mengupload...' : 'Upload dari Device'}
          </Button>
          {errorMsg && (
            <p className="text-xs text-destructive font-medium">⚠ {errorMsg}</p>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">atau tempel URL manual</p>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/foto.jpg"
        />
      </div>
    </div>
  );
}
