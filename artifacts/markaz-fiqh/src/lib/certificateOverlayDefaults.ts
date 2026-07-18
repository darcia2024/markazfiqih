export type OverlayFieldConfig = {
  left: number;
  top: number;
  fontSize: number;
  color: string;
};

export type CertificateOverlayConfig = {
  nama?: Partial<OverlayFieldConfig>;
  kelas?: Partial<OverlayFieldConfig>;
  tanggal?: Partial<OverlayFieldConfig>;
  fontUrl?: string | null;
};

// Warna default diambil dari --foreground light-mode: hsl(7, 14%, 12%) = #241c1b
// (sama persis dengan className="text-foreground" yang dipakai di CertificateView)
export const DEFAULT_OVERLAY_CONFIG: Record<string, OverlayFieldConfig> & {
  nama: OverlayFieldConfig;
  kelas: OverlayFieldConfig;
  tanggal: OverlayFieldConfig;
} = {
  nama:    { left: 50.8, top: 40.1, fontSize: 3.5,   color: '#241c1b' },
  kelas:   { left: 50,   top: 56,   fontSize: 2.1,   color: '#241c1b' },
  tanggal: { left: 14,   top: 93.7, fontSize: 1.575, color: '#241c1b' },
};

export type MergedOverlayConfig = {
  nama: OverlayFieldConfig;
  kelas: OverlayFieldConfig;
  tanggal: OverlayFieldConfig;
  fontUrl: string | null;
};

/** Merge saved config (per-field) di atas default. fontUrl default null. */
export function mergeOverlayConfig(saved: CertificateOverlayConfig | null | undefined): MergedOverlayConfig {
  return {
    nama:    { ...DEFAULT_OVERLAY_CONFIG.nama,    ...(saved?.nama    ?? {}) },
    kelas:   { ...DEFAULT_OVERLAY_CONFIG.kelas,   ...(saved?.kelas   ?? {}) },
    tanggal: { ...DEFAULT_OVERLAY_CONFIG.tanggal, ...(saved?.tanggal ?? {}) },
    fontUrl: saved?.fontUrl ?? null,
  };
}
