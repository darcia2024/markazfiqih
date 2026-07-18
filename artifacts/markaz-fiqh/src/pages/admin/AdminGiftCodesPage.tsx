import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Gift, Loader2, Pencil, Trash2, Plus, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listAllVouchersForAdmin,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  bulkDeleteVouchers,
  listClasses,
  type AdminVoucher,
} from '@/lib/db';
import { formatPrice } from '@/pages/CatalogPage';

// ── Helpers ───────────────────────────────────────────────────────────────────
const ALL_CLASSES_VALUE = '__ALL__';

function toPercent(discountPrice: number, basePrice: number): number {
  if (!basePrice) return 0;
  return Math.round((1 - discountPrice / basePrice) * 100);
}

function computeFinalPrice(basePrice: number, percent: number): number {
  return Math.floor(basePrice * (1 - percent / 100));
}

// ── Form state ────────────────────────────────────────────────────────────────
type FormState = {
  code: string;
  classId: string;
  discountPercent: string;
  maxUses: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  code: '',
  classId: '',
  discountPercent: '',
  maxUses: '',
  isActive: true,
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminGiftCodesPage() {
  const queryClient = useQueryClient();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['admin-vouchers'],
    queryFn: listAllVouchersForAdmin,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', 'all-admin'],
    queryFn: () => listClasses({ includeAll: true }),
  });

  // ── Selection state ───────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const allSelected = vouchers.length > 0 && selectedIds.size === vouchers.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vouchers.map((v) => v.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<AdminVoucher | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // ── Delete confirm state ──────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<AdminVoucher | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });

  const createMutation = useMutation({
    mutationFn: createVoucher,
    onSuccess: () => {},
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Gagal membuat Kode Hadiah.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateVoucher>[1] }) =>
      updateVoucher(id, payload),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      toast.success('Kode Hadiah berhasil diperbarui.');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Gagal memperbarui Kode Hadiah.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVoucher,
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success('Kode Hadiah berhasil dihapus.');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Gagal menghapus Kode Hadiah.'),
  });

  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    setIsBulkDeleting(true);
    try {
      const count = await bulkDeleteVouchers(ids);
      invalidate();
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      toast.success(`${count} Kode Hadiah berhasil dihapus.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus Kode Hadiah.');
    } finally {
      setIsBulkDeleting(false);
    }
  }

  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const isSaving = createMutation.isPending || updateMutation.isPending || isBatchSaving;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function openCreate() {
    setEditingVoucher(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(v: AdminVoucher) {
    setEditingVoucher(v);
    setForm({
      code: v.code,
      classId: v.classId,
      discountPercent: String(toPercent(v.discountPrice, v.basePrice)),
      maxUses: v.maxUses != null ? String(v.maxUses) : '',
      isActive: v.isActive,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const percent = parseFloat(form.discountPercent);
    const maxUses = form.maxUses.trim() ? parseInt(form.maxUses, 10) : null;

    if (!code || isNaN(percent) || percent < 0 || percent > 100) {
      toast.error('Lengkapi semua kolom wajib dengan benar (potongan 0–100%).');
      return;
    }

    if (editingVoucher) {
      const finalPrice = computeFinalPrice(editingVoucher.basePrice, percent);
      updateMutation.mutate({
        id: editingVoucher.id,
        payload: { code, discountPrice: finalPrice, isActive: form.isActive, maxUses },
      });
      return;
    }

    if (!form.classId) {
      toast.error('Pilih kelas terlebih dahulu.');
      return;
    }

    if (form.classId === ALL_CLASSES_VALUE) {
      if (classes.length === 0) {
        toast.error('Tidak ada kelas yang tersedia.');
        return;
      }
      setIsBatchSaving(true);
      try {
        await Promise.all(
          classes.map((cls) =>
            createVoucher({
              classId: cls.id,
              code,
              discountPrice: computeFinalPrice(cls.basePrice, percent),
              maxUses,
            })
          )
        );
        invalidate();
        setDialogOpen(false);
        toast.success(`Kode Hadiah berhasil dibuat untuk ${classes.length} kelas.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Gagal membuat Kode Hadiah.');
      } finally {
        setIsBatchSaving(false);
      }
    } else {
      const cls = classes.find((c) => c.id === form.classId);
      if (!cls) {
        toast.error('Kelas tidak ditemukan.');
        return;
      }
      const finalPrice = computeFinalPrice(cls.basePrice, percent);
      createMutation.mutate(
        { classId: form.classId, code, discountPrice: finalPrice, maxUses },
        {
          onSuccess: () => {
            invalidate();
            setDialogOpen(false);
            toast.success('Kode Hadiah berhasil dibuat.');
          },
        }
      );
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">

        {/* Header info */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/20">
          <Gift className="w-5 h-5 text-[hsl(var(--accent))] shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80">
            Kode Hadiah dipakai pelajar di halaman checkout untuk mendapatkan harga khusus per kelas.
            Masukkan persentase potongan (mis. 100% = gratis). Bisa diterapkan ke satu kelas atau semua kelas sekaligus.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Semua Kode Hadiah</CardTitle>
              <CardDescription>{vouchers.length} kode terdaftar</CardDescription>
            </div>
            <Button size="sm" onClick={openCreate} className="shrink-0 gap-1.5">
              <Plus className="w-4 h-4" />
              Tambah Kode
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : vouchers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Belum ada Kode Hadiah. Buat yang pertama dengan tombol di atas.
              </p>
            ) : (
              <div className="space-y-2">
                {/* Bulk action bar */}
                {selectedIds.size > 0 && (
                  <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {selectedIds.size} item dipilih
                      </span>
                      <button
                        onClick={clearSelection}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5 h-7 text-xs"
                      onClick={() => setBulkDeleteOpen(true)}
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus {selectedIds.size} Kode
                    </Button>
                  </div>
                )}

                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-3 w-8">
                          <Checkbox
                            checked={allSelected}
                            ref={(el) => {
                              if (el) (el as any).indeterminate = someSelected;
                            }}
                            onCheckedChange={toggleAll}
                            aria-label="Pilih semua"
                          />
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kode</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Kelas</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Potongan</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden lg:table-cell">Harga Akhir</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Pemakaian</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {vouchers.map((v) => {
                        const pct = toPercent(v.discountPrice, v.basePrice);
                        const isSelected = selectedIds.has(v.id);
                        return (
                          <tr
                            key={v.id}
                            className={`transition-colors ${isSelected ? 'bg-muted/40' : 'hover:bg-muted/20'}`}
                          >
                            <td className="px-3 py-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleOne(v.id)}
                                aria-label={`Pilih ${v.code}`}
                              />
                            </td>
                            <td className="px-4 py-3 font-mono font-semibold text-foreground">{v.code}</td>
                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[200px]">
                              <span className="line-clamp-1">{v.className}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">
                              {pct === 100 ? (
                                <span className="text-success font-bold">100%</span>
                              ) : (
                                <span>{pct}%</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">
                              {v.discountPrice === 0 ? (
                                <span className="text-success font-bold">Gratis</span>
                              ) : (
                                formatPrice(v.discountPrice)
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground">
                              {v.usedCount}/{v.maxUses != null ? v.maxUses : '∞'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {v.isActive ? (
                                <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10">Aktif</Badge>
                              ) : (
                                <Badge variant="secondary">Nonaktif</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEdit(v)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteTarget(v)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Form Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!isSaving) setDialogOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVoucher ? 'Edit Kode Hadiah' : 'Tambah Kode Hadiah'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Kode */}
            <div className="space-y-1.5">
              <Label htmlFor="gc-code">Kode <span className="text-destructive">*</span></Label>
              <Input
                id="gc-code"
                placeholder="CONTOHKODE"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                className="font-mono"
                required
                disabled={isSaving}
              />
            </div>

            {/* Kelas */}
            <div className="space-y-1.5">
              <Label htmlFor="gc-class">Kelas <span className="text-destructive">*</span></Label>
              {editingVoucher ? (
                <p className="text-sm text-muted-foreground rounded-md border bg-muted/50 px-3 py-2">
                  {editingVoucher.className}
                  <span className="ml-2 text-xs text-muted-foreground/60">(tidak dapat diubah)</span>
                </p>
              ) : (
                <Select
                  value={form.classId}
                  onValueChange={(v) => setForm((p) => ({ ...p, classId: v }))}
                  disabled={isSaving}
                  required
                >
                  <SelectTrigger id="gc-class">
                    <SelectValue placeholder="Pilih kelas…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value={ALL_CLASSES_VALUE}>
                      <span className="font-medium">— Semua Kelas —</span>
                    </SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {form.classId === ALL_CLASSES_VALUE && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Kode ini akan dibuat untuk semua {classes.length} kelas sekaligus, dengan harga akhir dihitung per kelas.
                </p>
              )}
            </div>

            {/* Persentase Potongan */}
            <div className="space-y-1.5">
              <Label htmlFor="gc-percent">
                Persentase Potongan (%) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="gc-percent"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="Mis. 20"
                  value={form.discountPercent}
                  onChange={(e) => setForm((p) => ({ ...p, discountPercent: e.target.value }))}
                  required
                  disabled={isSaving}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  %
                </span>
              </div>
              {(() => {
                const pct = parseFloat(form.discountPercent);
                if (isNaN(pct) || pct < 0 || pct > 100) return null;

                if (editingVoucher) {
                  const final = computeFinalPrice(editingVoucher.basePrice, pct);
                  return (
                    <p className="text-xs text-muted-foreground">
                      Harga akhir: <span className="font-semibold">{pct === 100 ? 'Gratis' : formatPrice(final)}</span>
                      {' '}(dari {formatPrice(editingVoucher.basePrice)})
                    </p>
                  );
                }

                const selectedCls = classes.find((c) => c.id === form.classId);
                if (selectedCls) {
                  const final = computeFinalPrice(selectedCls.basePrice, pct);
                  return (
                    <p className="text-xs text-muted-foreground">
                      Harga akhir: <span className="font-semibold">{pct === 100 ? 'Gratis' : formatPrice(final)}</span>
                      {' '}(dari {formatPrice(selectedCls.basePrice)})
                    </p>
                  );
                }

                if (form.classId === ALL_CLASSES_VALUE) {
                  return (
                    <p className="text-xs text-muted-foreground">
                      Potongan {pct}% akan dihitung dari harga masing-masing kelas.
                    </p>
                  );
                }

                return null;
              })()}
            </div>

            {/* Batas Pemakaian */}
            <div className="space-y-1.5">
              <Label htmlFor="gc-max">Batas Pemakaian <span className="text-muted-foreground font-normal">(opsional)</span></Label>
              <Input
                id="gc-max"
                type="number"
                min={1}
                placeholder="Kosongkan = tanpa batas"
                value={form.maxUses}
                onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                disabled={isSaving}
              />
            </div>

            {/* Aktif toggle — hanya saat edit */}
            {editingVoucher && (
              <div className="flex items-center gap-2.5 pt-1">
                <Checkbox
                  id="gc-active"
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: Boolean(v) }))}
                  disabled={isSaving}
                />
                <Label htmlFor="gc-active" className="cursor-pointer font-normal">
                  Kode aktif (dapat dipakai di checkout)
                </Label>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingVoucher ? 'Simpan Perubahan' : 'Buat Kode'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Single Delete Confirm ────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kode Hadiah?</AlertDialogTitle>
            <AlertDialogDescription>
              Kode <span className="font-mono font-semibold">{deleteTarget?.code}</span> akan
              dihapus permanen dan tidak bisa dipakai lagi. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Delete Confirm ──────────────────────────────────────────── */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => { if (!isBulkDeleting) setBulkDeleteOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.size} Kode Hadiah?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua kode yang dipilih akan dihapus permanen dan tidak bisa dipakai lagi.
              Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={isBulkDeleting}
              onClick={handleBulkDelete}
            >
              {isBulkDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hapus {selectedIds.size} Kode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
