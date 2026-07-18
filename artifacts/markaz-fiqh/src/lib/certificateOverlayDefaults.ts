export type OverlayFieldConfig = {
  left: number;
  top: number;
  fontSize: number;
};

export type CertificateOverlayConfig = {
  nama?: Partial<OverlayFieldConfig>;
  kelas?: Partial<OverlayFieldConfig>;
  tanggal?: Partial<OverlayFieldConfig>;
};

export const DEFAULT_OVERLAY_CONFIG: Record<string, OverlayFieldConfig> & {
  nama: OverlayFieldConfig;
  kelas: OverlayFieldConfig;
  tanggal: OverlayFieldConfig;
} = {
  nama:    { left: 50.8, top: 40.1, fontSize: 3.5 },
  kelas:   { left: 50,   top: 56,   fontSize: 2.1 },
  tanggal: { left: 14,   top: 93.7, fontSize: 1.575 },
};

export type MergedOverlayConfig = {
  nama: OverlayFieldConfig;
  kelas: OverlayFieldConfig;
  tanggal: OverlayFieldConfig;
};

/** Merge saved config (per-field) on top of defaults. */
export function mergeOverlayConfig(saved: CertificateOverlayConfig | null | undefined): MergedOverlayConfig {
  return {
    nama:    { ...DEFAULT_OVERLAY_CONFIG.nama,    ...(saved?.nama    ?? {}) },
    kelas:   { ...DEFAULT_OVERLAY_CONFIG.kelas,   ...(saved?.kelas   ?? {}) },
    tanggal: { ...DEFAULT_OVERLAY_CONFIG.tanggal, ...(saved?.tanggal ?? {}) },
  };
}
