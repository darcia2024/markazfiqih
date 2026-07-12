import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAllVouchersForAdmin,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  listClasses,
  type AdminVoucher,
} from '@/lib/db';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

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

function voucherToForm(v: AdminVoucher): VoucherFormState {
  return {
    classId: v.classId,
    code: v.code,
    discountPrice: String(v.discountPrice),
    maxUses: v.maxUses !== null ? String(v.maxUses) : '',
  };
}

export default function AdminVouchersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<AdminVoucher | null>(null);
  const [form, setForm] = useState<VoucherFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AdminVoucher | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['vouchers', 'admin'] });

  const vouchersQuery = useQuery({
    queryKey: ['vouchers', 'admin'],
    queryFn: listAllVouchersForAdmin,
  });
  const vouchers = vouchersQuery.data ?? [];

  const classesQuery = useQuery({
    queryKey: ['classes-all-admin'],
    queryFn: () => listClasses({ includeAll: true }),
  });
  const classes = classesQuery.data ?? [];

  const selectedClass = classes.find((c) => c.id === form.classId) ?? null;
  const discountNum = parseInt(form.discountPrice, 10);
  const showPriceWarning =
    selectedClass && !isNaN(discountNum) && discountNum >= selectedClass.basePrice;

  const createMutation = useMutation({
    mutationFn: createVoucher,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      toast({ title: 'Voucher berhasil ditambahkan' });
    },
    onError: (e) =>
      toast({
        title: 'Gagal menambahkan voucher',
        description: String((e as Error)?.message ?? e),
        variant: 'destructive',
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateVoucher>[1];
    }) => updateVoucher(id, payload),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      toast({ title: 'Voucher berhasil diperbarui' });
    },
    onError: (e) =>
      toast({
        title: 'Gagal memperbarui voucher',
        description: String((e as Error)?.message ?? e),
        variant: 'destructive',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVoucher,
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast({ title: 'Voucher berhasil dihapus' });
    },
    onError: (e) =>
      toast({
        title: 'Gagal menghapus voucher',
        description: String((e as Error)?.message ?? e),
        variant: 'destructive',
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateVoucher(id, { isActive }),
    onSuccess: () => invalidate(),
    onError: (e) =>
      toast({
        title: 'Gagal mengubah status voucher',
        description: String((e as Error)?.message ?? e),
        variant: 'destructive',
      }),
  });

  function openCreateDialog() {
    setEditingVoucher(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(v: AdminVoucher) {
    setEditingVoucher(v);
    setForm(voucherToForm(v));
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.classId || !form.code.trim() || !form.discountPrice) {
      toast({
        title: 'Kelas, kode, dan harga diskon wajib diisi',
        variant: 'destructive',
      });
      return;
    }
    const payload = {
      classId: form.classId,
      code: form.code.toUpperCase(),
      discountPrice: parseInt(form.discountPrice, 10),
      maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
    };
    if (editingVoucher) {
      updateMutation.mutate({ id: editingVoucher.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Kelola Voucher</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Buat dan kelola kode voucher diskon untuk kelas-kelas.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Voucher
          </Button>
        </div>

        {/* Tabel */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Harga Coret (opsional)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pemakaian</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchersQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : vouchersQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-destructive">
                      Gagal memuat voucher dari server.
                    </TableCell>
                  </TableRow>
                ) : vouchers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Belum ada voucher.
                    </TableCell>
                  </TableRow>
                ) : (
                  vouchers.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {v.className}
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                          {v.code}
                        </code>
                      </TableCell>
                      <TableCell>{formatRupiah(v.discountPrice)}</TableCell>
                      <TableCell>
                        <Badge variant={v.isActive ? 'default' : 'secondary'}>
                          {v.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {v.usedCount} / {v.maxUses !== null ? v.maxUses : '∞'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={v.isActive}
                            onCheckedChange={(checked) =>
                              toggleMutation.mutate({ id: v.id, isActive: checked })
                            }
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(v)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(v)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Tambah / Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVoucher ? 'Edit Voucher' : 'Tambah Voucher Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Kelas</Label>
              <Select
                value={form.classId}
                onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas..." />
                </SelectTrigger>
                <SelectContent className="max-h-72 overflow-y-auto">
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Kode Voucher</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                placeholder="Contoh: RAMADAN50"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Harga Coret (opsional)</Label>
              <Input
                type="number"
                min={0}
                value={form.discountPrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discountPrice: e.target.value }))
                }
                placeholder="Contoh: 75000"
              />
              {showPriceWarning && (
                <p className="text-xs text-amber-600">
                  Harga diskon ini lebih tinggi/sama dengan harga normal kelas, voucher
                  jadi tidak masuk akal sebagai diskon.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Batas Pemakaian{' '}
                <span className="text-muted-foreground font-normal">
                  (kosongkan = tidak dibatasi)
                </span>
              </Label>
              <Input
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxUses: e.target.value }))
                }
                placeholder="Contoh: 100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingVoucher ? 'Simpan Perubahan' : 'Tambah Voucher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Hapus */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus Voucher "{deleteTarget?.code}"?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {deleteTarget && deleteTarget.usedCount > 0 && (
                  <p className="mb-2 text-amber-600 font-medium">
                    Voucher ini sudah pernah dipakai {deleteTarget.usedCount} kali.
                    Menghapusnya tidak akan membatalkan transaksi yang sudah terjadi,
                    hanya mencegah pemakaian baru.
                  </p>
                )}
                <p>Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
