import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Loader2, Ticket, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/pages/CatalogPage';
import {
  listAllVouchersForAdmin,
  createVoucher,
  updateVoucherActive,
  deleteVoucher,
  listClasses,
  type AdminVoucher,
} from '@/lib/db';

// ─── Form state ───────────────────────────────────────────────────────────────
type VoucherFormState = {
  classId: string;
  code: string;
  discountPrice: string;
  maxUses: string;
};

const EMPTY_FORM: VoucherFormState = {
  classId: '',
  code: '',
  discountPrice: '',
  maxUses: '',
};

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function AdminVouchersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<VoucherFormState>(EMPTY_FORM);
  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminVoucher | null>(null);

  // ─── Queries ───────────────────────────────────────────────────────────────
  const vouchersQuery = useQuery({
    queryKey: ['vouchers', 'admin'],
    queryFn: listAllVouchersForAdmin,
  });

  const classesQuery = useQuery({
    queryKey: ['classes', 'admin-all'],
    queryFn: () => listClasses({ includeAll: true }),
  });

  const vouchers = vouchersQuery.data ?? [];
  const classes = classesQuery.data ?? [];

  const invalidateVouchers = () => {
    queryClient.invalidateQueries({ queryKey: ['vouchers', 'admin'] });
  };

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createVoucher>[0]) => createVoucher(payload),
    onSuccess: () => {
      invalidateVouchers();
      toast({ title: 'Kupon berhasil dibuat' });
      setDialogOpen(false);
    },
    onError: (err: Error) => {
      // Tangani pelanggaran unique constraint (kode sama + kelas sama)
      const msg = err?.message ?? '';
      if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('23505')) {
        toast({
          title: 'Kode sudah dipakai',
          description: 'Kode kupon ini sudah ada untuk kelas yang dipilih. Gunakan kode lain.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Gagal membuat kupon', description: msg, variant: 'destructive' });
      }
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateVoucherActive(id, isActive),
    onSuccess: () => invalidateVouchers(),
    onError: (err: Error) => {
      toast({ title: 'Gagal mengubah status kupon', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVoucher(id),
    onSuccess: () => {
      invalidateVouchers();
      toast({ title: 'Kupon berhasil dihapus' });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: 'Gagal menghapus kupon', description: err.message, variant: 'destructive' });
      setDeleteTarget(null);
    },
  });

  // ─── Form helpers ──────────────────────────────────────────────────────────
  function openCreateDialog() {
    setForm(EMPTY_FORM);
    setFormWarning(null);
    setDialogOpen(true);
  }

  function handleCodeChange(value: string) {
    setForm((p) => ({ ...p, code: value.toUpperCase() }));
  }

  function handleClassChange(classId: string) {
    setForm((p) => ({ ...p, classId }));
    setFormWarning(null);
  }

  function handleDiscountPriceChange(value: string) {
    setForm((p) => ({ ...p, discountPrice: value }));

    // Periksa apakah harga ≥ harga normal kelas
    const selectedClass = classes.find((c) => c.id === form.classId);
    if (selectedClass && value) {
      const disc = Number(value);
      const normal = selectedClass.discountPrice ?? selectedClass.basePrice;
      if (disc >= normal) {
        setFormWarning(
          `Harga kupon (${formatPrice(disc)}) lebih besar atau sama dengan harga normal kelas (${formatPrice(normal)}). Kupon tetap bisa dibuat, tapi pastikan ini disengaja.`,
        );
      } else {
        setFormWarning(null);
      }
    } else {
      setFormWarning(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.classId) {
      toast({ title: 'Pilih kelas dulu', variant: 'destructive' });
      return;
    }
    if (!form.code.trim()) {
      toast({ title: 'Kode kupon wajib diisi', variant: 'destructive' });
      return;
    }
    const discountPrice = Number(form.discountPrice);
    if (isNaN(discountPrice) || discountPrice < 0) {
      toast({ title: 'Harga kupon harus berupa angka ≥ 0', variant: 'destructive' });
      return;
    }
    const maxUses = form.maxUses.trim() ? Number(form.maxUses) : null;
    if (maxUses !== null && (isNaN(maxUses) || maxUses < 1)) {
      toast({ title: 'Batas pemakaian harus berupa angka ≥ 1, atau kosongkan untuk tanpa batas', variant: 'destructive' });
      return;
    }

    createMutation.mutate({ classId: form.classId, code: form.code, discountPrice, maxUses });
  }

  const isSaving = createMutation.isPending;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Kode Kupon</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola kode kupon per kelas — satu kode berlaku untuk satu kelas satuan.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Kupon
          </Button>
        </div>

        {/* Tabel */}
        <Card>
          <CardContent className="pt-6">
            {vouchersQuery.isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Memuat data kupon...
              </div>
            ) : vouchersQuery.isError ? (
              <div className="text-center text-sm text-destructive py-8">
                Gagal memuat data kupon dari server.
              </div>
            ) : vouchers.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Ticket className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Belum ada kupon. Klik "Buat Kupon" untuk membuat yang pertama.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Harga Kupon</TableHead>
                      <TableHead>Pemakaian</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vouchers.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          <span className="font-mono text-sm font-semibold tracking-wider">{v.code}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-foreground line-clamp-1 max-w-[200px]">{v.className}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{formatPrice(v.discountPrice)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {v.usedCount} / {v.maxUses ?? '∞'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={v.isActive}
                              onCheckedChange={(checked) =>
                                toggleActiveMutation.mutate({ id: v.id, isActive: checked })
                              }
                              disabled={toggleActiveMutation.isPending}
                              aria-label={v.isActive ? 'Nonaktifkan kupon' : 'Aktifkan kupon'}
                            />
                            <Badge variant={v.isActive ? 'success' : 'neutral'}>
                              {v.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {new Date(v.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(v)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Dialog Form Buat Kupon ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Buat Kupon Baru</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Pilih Kelas */}
              <div className="space-y-2">
                <Label htmlFor="voucher-class">Kelas</Label>
                {classesQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Memuat daftar kelas...
                  </div>
                ) : (
                  <Select value={form.classId} onValueChange={handleClassChange}>
                    <SelectTrigger id="voucher-class">
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                          {c.status === 'draft' && (
                            <span className="ml-1 text-xs text-muted-foreground">(Draft)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Kode Kupon */}
              <div className="space-y-2">
                <Label htmlFor="voucher-code">Kode Kupon</Label>
                <Input
                  id="voucher-code"
                  placeholder="Contoh: RAMADAN25"
                  value={form.code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="uppercase"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Kode akan otomatis disimpan dalam huruf kapital.
                </p>
              </div>

              {/* Harga Kupon */}
              <div className="space-y-2">
                <Label htmlFor="voucher-price">Harga Khusus (Rp)</Label>
                <Input
                  id="voucher-price"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.discountPrice}
                  onChange={(e) => handleDiscountPriceChange(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ini adalah harga final yang dibayar pemegang kupon — bukan persentase potongan.
                  Isi 0 untuk kelas gratis.
                </p>
                {formWarning && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-3 text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-xs">{formWarning}</p>
                  </div>
                )}
              </div>

              {/* Batas Pemakaian */}
              <div className="space-y-2">
                <Label htmlFor="voucher-max-uses">Batas Pemakaian (opsional)</Label>
                <Input
                  id="voucher-max-uses"
                  type="number"
                  min={1}
                  placeholder="Kosongkan untuk tanpa batas"
                  value={form.maxUses}
                  onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Buat Kupon
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog Konfirmasi Hapus ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kupon?</AlertDialogTitle>
            <AlertDialogDescription>
              Kupon <strong className="font-mono">{deleteTarget?.code}</strong> untuk kelas{' '}
              <strong>"{deleteTarget?.className}"</strong> akan dihapus secara permanen.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
