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
import { Gift, Loader2, Pencil, Trash2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listAllVouchersForAdmin,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  listClasses,
  type AdminVoucher,
} from '@/lib/db';
import { formatPrice } from '@/pages/CatalogPage';

// ── Form state ────────────────────────────────────────────────────────────────
type FormState = {
  code: string;
  classId: string;
  discountPrice: string;
  maxUses: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  code: '',
  classId: '',
  discountPrice: '',
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

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<AdminVoucher | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // ── Delete confirm state ──────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<AdminVoucher | null>(null);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });

  const createMutation = useMutation({
    mutationFn: createVoucher,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      toast.success('Kode Hadiah berhasil dibuat.');
    },
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

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
      discountPrice: String(v.discountPrice),
      maxUses: v.maxUses != null ? String(v.maxUses) : '',
      isActive: v.isActive,
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const classId = form.classId;
    const discountPrice = parseInt(form.discountPrice, 10);
    const maxUses = form.maxUses.trim() ? parseInt(form.maxUses, 10) : null;

    if (!code || !classId || isNaN(discountPrice) || discountPrice < 0) {
      toast.error('Lengkapi semua kolom wajib dengan benar.');
      return;
    }

    if (editingVoucher) {
      updateMutation.mutate({
        id: editingVoucher.id,
        payload: { code, discountPrice, isActive: form.isActive, maxUses },
      });
    } else {
      createMutation.mutate({ classId, code, discountPrice, maxUses });
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
            Isi 'Harga Setelah Kode' dengan 0 untuk menggratiskan kelas — pembayaran Rp 0 aktif
            otomatis tanpa lewat Mayar.
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
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Kode</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Kelas</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Harga Setelah Kode</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Pemakaian</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {vouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-foreground">{v.code}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[200px]">
                          <span className="line-clamp-1">{v.className}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
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
                    ))}
                  </tbody>
                </table>
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

            {/* Kelas — hanya dapat diubah saat create */}
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
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Harga Setelah Kode */}
            <div className="space-y-1.5">
              <Label htmlFor="gc-price">
                Harga Setelah Kode (Rp) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="gc-price"
                type="number"
                min={0}
                placeholder="0"
                value={form.discountPrice}
                onChange={(e) => setForm((p) => ({ ...p, discountPrice: e.target.value }))}
                required
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Ini <span className="font-semibold">HARGA AKHIR</span> kelas setelah kode dipakai, bukan besar potongan.
              </p>
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

      {/* ── Delete Confirm ──────────────────────────────────────────────── */}
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
    </AdminLayout>
  );
}
