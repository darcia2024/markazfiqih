import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2 } from 'lucide-react';
import { uploadAdminImage } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  /** Styling preview — bulat untuk foto pengajar, persegi untuk cover kelas. */
  previewClassName?: string;
}

export function ImageUploadField({ value, onChange, previewClassName }: ImageUploadFieldProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Ukuran file terlalu besar',
        description: 'Maksimal 5 MB per file.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadAdminImage(file);
      onChange(url);
      toast({ title: 'Foto berhasil diupload' });
    } catch (error) {
      toast({
        title: 'Gagal upload foto',
        description: (error as Error).message,
        variant: 'destructive',
      });
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
