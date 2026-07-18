import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '@/lib/db';
import { toast } from 'sonner';
import {
  DEFAULT_OVERLAY_CONFIG,
  mergeOverlayConfig,
  type OverlayFieldConfig,
  type CertificateOverlayConfig,
} from '@/lib/certificateOverlayDefaults';

type FullOverlayConfig = {
  nama: OverlayFieldConfig;
  kelas: OverlayFieldConfig;
  tanggal: OverlayFieldConfig;
};

function formatTanggalPreview(): string {
  return new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface FieldControlsProps {
  label: string;
  field: keyof FullOverlayConfig;
  config: FullOverlayConfig;
  onChange: (field: keyof FullOverlayConfig, key: keyof OverlayFieldConfig, value: number) => void;
}

function FieldControls({ label, field, config, onChange }: FieldControlsProps) {
  const val = config[field];
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm">{label}</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Posisi Horizontal (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={val.left}
            onChange={(e) => onChange(field, 'left', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Posisi Vertikal (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={val.top}
            onChange={(e) => onChange(field, 'top', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ukuran Teks (cqw)</Label>
          <Input
            type="number"
            min={0.5}
            max={8}
            step={0.1}
            value={val.fontSize}
            onChange={(e) => onChange(field, 'fontSize', parseFloat(e.target.value) || 1)}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminCertificateDesignPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const [config, setConfig] = useState<FullOverlayConfig>(() =>
    mergeOverlayConfig(null)
  );

  // Inisialisasi dari settings saat data tersedia
  useEffect(() => {
    if (settings) {
      setConfig(mergeOverlayConfig(settings.certificateOverlayConfig as CertificateOverlayConfig | null));
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (cfg: FullOverlayConfig) =>
      updateSettings({ certificateOverlayConfig: cfg }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Pengaturan tampilan sertifikat berhasil disimpan.');
    },
    onError: () => {
      toast.error('Gagal menyimpan pengaturan, coba lagi.');
    },
  });

  function handleChange(
    field: keyof FullOverlayConfig,
    key: keyof OverlayFieldConfig,
    value: number
  ) {
    setConfig((prev) => ({
      ...prev,
      [field]: { ...prev[field], [key]: value },
    }));
  }

  function handleReset() {
    setConfig(mergeOverlayConfig(null)); // kembali ke DEFAULT_OVERLAY_CONFIG penuh
  }

  const templateUrl = settings?.certificateDefaultTemplateUrl?.trim() || null;
  const todayStr = formatTanggalPreview();

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h2 className="text-xl font-serif font-semibold">Pengaturan Tampilan Sertifikat</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Atur posisi dan ukuran teks Nama, Kelas, dan Tanggal pada template sertifikat. Preview berubah langsung saat kamu mengubah nilai.
          </p>
        </div>

        {/* Preview live */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview Langsung</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : templateUrl ? (
              <div
                className="relative w-full"
                style={{ containerType: 'inline-size' }}
              >
                <img
                  src={templateUrl}
                  alt="Template Sertifikat"
                  crossOrigin="anonymous"
                  className="w-full h-auto block"
                />

                {/* Overlay: Nama */}
                <p
                  className="absolute font-serif font-bold text-foreground text-center pointer-events-none"
                  style={{
                    left: `${config.nama.left}%`,
                    top: `${config.nama.top}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${config.nama.fontSize}cqw`,
                    maxWidth: '60%',
                    wordWrap: 'break-word',
                    lineHeight: 1.2,
                  }}
                >
                  Nama Peserta Contoh
                </p>

                {/* Overlay: Kelas */}
                <p
                  className="absolute font-serif text-foreground text-center pointer-events-none"
                  style={{
                    left: `${config.kelas.left}%`,
                    top: `${config.kelas.top}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${config.kelas.fontSize}cqw`,
                    maxWidth: '55%',
                    wordWrap: 'break-word',
                    lineHeight: 1.3,
                  }}
                >
                  Nama Kelas Contoh
                </p>

                {/* Overlay: Tanggal */}
                <p
                  className="absolute text-foreground text-center pointer-events-none"
                  style={{
                    left: `${config.tanggal.left}%`,
                    top: `${config.tanggal.top}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${config.tanggal.fontSize}cqw`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {todayStr}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Upload template default dulu di halaman{' '}
                  <a href="/admin/settings" className="underline">Pengaturan</a>.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kontrol per-field */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pengaturan Posisi & Ukuran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 divide-y divide-border">
            <div className="pt-0">
              <FieldControls label="Nama" field="nama" config={config} onChange={handleChange} />
            </div>
            <div className="pt-6">
              <FieldControls label="Kelas" field="kelas" config={config} onChange={handleChange} />
            </div>
            <div className="pt-6">
              <FieldControls label="Tanggal" field="tanggal" config={config} onChange={handleChange} />
            </div>
          </CardContent>
        </Card>

        {/* Tombol aksi */}
        <div className="flex gap-3">
          <Button
            onClick={() => mutation.mutate(config)}
            disabled={mutation.isPending}
            className="gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Pengaturan
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={mutation.isPending}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset ke Default
          </Button>
        </div>

        {/* Info nilai default */}
        <Card className="bg-muted/40">
          <CardContent className="pt-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Nilai default:</p>
            {Object.entries(DEFAULT_OVERLAY_CONFIG).map(([field, val]) => (
              <p key={field}>
                <span className="font-mono capitalize">{field}</span>:{' '}
                left={val.left}%, top={val.top}%, fontSize={val.fontSize}cqw
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
