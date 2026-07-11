import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageUploadField } from '@/components/ImageUploadField';
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
import { Plus, Pencil, Trash2, Loader2, Package, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/pages/CatalogPage';
import {
  listAllBundlesForAdmin,
  createBundle,
  updateBundle,
  deleteBundle,
  getBundlePurchaseCount,
  listClasses,
  type AdminBundle,
} from '@/lib/db';

// ─── Tipe lokal ───────────────────────────────────────────────────────────────
type ClassRow = Awaited<ReturnType<typeof listClasses>>[number];

type BundleFormState = {
  title: string;
  description: string;
  normalPrice: string;
  bundlePrice: string;
  coverImage: string;
  status: 'draft' | 'published';
  classIds: string[];
};

const EMPTY_FORM: BundleFormState = {
  title: '',
  description: '',
  normalPrice: '',
  bundlePrice: '',
  coverImage: '',
  status: 'draft',
  classIds: [],
};

function bundleToForm(b: AdminBundle): BundleFormState {
  return {
    title: b.title,
    description: b.description,
    normalPrice: String(b.normalPrice),
    bundlePrice: String(b.bundlePrice),
    coverImage: b.coverImage,
    status: b.status,
    classIds: [...b.classIds],
  };
}

// ─── Helper: grup kelas per kategori ─────────────────────────────────────────
function groupByCategory(classes: ClassRow[]): { category: string; classes: ClassRow[] }[] {
  const map = new Map<string, ClassRow[]>();
  for (const cls of classes) {
    const cat = cls.category ?? '(Tanpa Kategori)';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(cls);
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === '(Tanpa Kategori)') return 1;
      if (b === '(Tanpa Kategori)') return -1;
      return a.localeCompare(b, 'id');
    })
    .map(([category, classes]) => ({ category, classes }));
}

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function AdminBundlesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<AdminBundle | null>(null);
  const [form, setForm] = useState<BundleFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AdminBundle | null>(null);

  // ─── Queries ───────────────────────────────────────────────────────────────
  const bundlesQuery = useQuery({
    queryKey: ['bundles', 'admin'],
    queryFn: listAllBundlesForAdmin,
  });

  const classesQuery = useQuery({
    queryKey: ['classes', 'admin'],
    queryFn: () => listClasses({ includeAll: true }),
  });

  const { data: purchaseCount = 0 } = useQuery({
    queryKey: ['bundle-purchase-count', deleteTarget?.id],
    queryFn: () => getBundlePurchaseCount(deleteTarget!.id),
    enabled: !!deleteTarget,
  });

  const bundles = bundlesQuery.data ?? [];
  const allClasses = classesQuery.data ?? [];
  const classGroups = groupByCategory(allClasses);

  const invalidateBundles = () => {
    queryClient.invalidateQueries({ queryKey: ['bundles', 'admin'] });
    // Refresh halaman publik BundlesPage juga
    queryClient.invalidateQueries({ queryKey: ['bundles'] });
  };

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createBundle>[0]) => createBundle(payload),
    onSuccess: () => {
      invalidateBundles();
      toast({ title: 'Bundle berhasil ditambahkan' });
      setDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: 'Gagal menambahkan bundle', description: String((err as Error)?.message ?? err), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateBundle>[1] }) =>
      updateBundle(id, payload),
    onSuccess: () => {
      invalidateBundles();
      toast({ title: 'Bundle berhasil diperbarui' });
      setDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: 'Gagal memperbarui bundle', description: String((err as Error)?.message ?? err), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBundle(id),
    onSuccess: () => {
      invalidateBundles();
      toast({ title: 'Bundle berhasil dihapus' });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast({ title: 'Gagal menghapus bundle', description: String((err as Error)?.message ?? err), variant: 'destructive' });
      setDeleteTarget(null);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateBundle>[1] }) =>
      updateBundle(id, payload),
    onSuccess: () => invalidateBundles(),
    onError: (err) => {
      toast({ title: 'Gagal mengubah status', description: String((err as Error)?.message ?? err), variant: 'destructive' });
    },
  });

  // ─── Form helpers ──────────────────────────────────────────────────────────
  function openCreateDialog() {
    setEditingBundle(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(bundle: AdminBundle) {
    setEditingBundle(bundle);
    setForm(bundleToForm(bundle));
    setDialogOpen(true);
  }

  function toggleClassId(classId: string) {
    setForm((prev) => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter((id) => id !== classId)
        : [...prev.classIds, classId],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: 'Judul bundle wajib diisi', variant: 'destructive' });
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description,
      normalPrice: Number(form.normalPrice) || 0,
      bundlePrice: Number(form.bundlePrice) || 0,
      coverImage: form.coverImage.trim(),
      status: form.status,
      classIds: form.classIds,
    };

    if (editingBundle) {
      updateMutation.mutate({ id: editingBundle.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleTogglePublish(bundle: AdminBundle) {
    const newStatus = bundle.status === 'published' ? 'draft' : 'published';
    togglePublishMutation.mutate({
      id: bundle.id,
      payload: {
        title: bundle.title,
        description: bundle.description,
        normalPrice: bundle.normalPrice,
        bundlePrice: bundle.bundlePrice,
        coverImage: bundle.coverImage,
        status: newStatus,
        classIds: bundle.classIds,
      },
    });
  }

  // ─── Price warning: harga bundle tidak lebih murah dari satuan ─────────────
  const selectedTotal = allClasses
    .filter((c) => form.classIds.includes(c.id))
    .reduce((sum, c) => sum + (c.discountPrice ?? c.basePrice), 0);
  const bundlePriceNum = Number(form.bundlePrice) || 0;
  const showPriceWarning =
    form.classIds.length > 0 && bundlePriceNum > 0 && bundlePriceNum >= selectedTotal;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Kelola Bundle</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Buat dan kelola paket bundle — gabungan beberapa kelas dengan harga spesial.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Bundle
          </Button>
        </div>

        {/* Tabel */}
        <Card>
          <CardContent className="pt-6">
            {bundlesQuery.isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Memuat data bundle...
              </div>
            ) : bundlesQuery.isError ? (
              <div className="text-center text-sm text-destructive py-8">
                Gagal memuat data bundle dari server.
              </div>
            ) : bundles.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Belum ada bundle. Klik "Tambah Bundle" untuk membuat yang pertama.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bundle</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Isi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bundles.map((bundle) => (
                      <TableRow key={bundle.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {bundle.coverImage ? (
                              <img
                                src={bundle.coverImage}
                                alt={bundle.title}
                                className="h-10 w-16 rounded object-cover shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-16 rounded bg-muted shrink-0 flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                {bundle.title}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium text-foreground">
                              {formatPrice(bundle.bundlePrice)}
                            </span>
                            {bundle.normalPrice > bundle.bundlePrice && (
                              <span className="block text-xs text-muted-foreground line-through">
                                {formatPrice(bundle.normalPrice)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {bundle.classIds.length} kelas
                        </TableCell>
                        <TableCell>
                          <Badge variant={bundle.status === 'published' ? 'success' : 'neutral'}>
                            {bundle.status === 'published' ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTogglePublish(bundle)}
                              disabled={togglePublishMutation.isPending}
                            >
                              {bundle.status === 'published' ? 'Jadikan Draft' : 'Terbitkan'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(bundle)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteTarget(bundle)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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

      {/* ── Dialog Form Tambah / Edit ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingBundle ? 'Edit Bundle' : 'Tambah Bundle Baru'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Judul */}
              <div className="space-y-2">
                <Label htmlFor="bundle-title">Judul Bundle</Label>
                <Input
                  id="bundle-title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-2">
                <Label htmlFor="bundle-description">Deskripsi</Label>
                <Textarea
                  id="bundle-description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Cover Bundle */}
              <div className="space-y-1.5">
                <Label>Cover Bundle</Label>
                <ImageUploadField
                  value={form.coverImage}
                  onChange={(url) => setForm((p) => ({ ...p, coverImage: url }))}
                  previewClassName="w-16 h-20 rounded object-cover border"
                />
              </div>

              {/* Harga */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bundle-normal-price">Harga Normal (Rp)</Label>
                  <Input
                    id="bundle-normal-price"
                    type="number"
                    min={0}
                    value={form.normalPrice}
                    onChange={(e) => setForm((p) => ({ ...p, normalPrice: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bundle-bundle-price">Harga Bundle (Rp)</Label>
                  <Input
                    id="bundle-bundle-price"
                    type="number"
                    min={0}
                    value={form.bundlePrice}
                    onChange={(e) => setForm((p) => ({ ...p, bundlePrice: e.target.value }))}
                  />
                </div>
              </div>

              {/* Warning harga tidak lebih murah */}
              {showPriceWarning && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-xs">
                    Harga bundle ini tidak lebih murah dari beli satuan (total kelas terpilih:{' '}
                    <strong>{formatPrice(selectedTotal)}</strong>). Kurang menarik buat pelajar.
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((p) => ({ ...p, status: v as BundleFormState['status'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checklist kelas */}
              <div className="space-y-2">
                <Label>
                  Kelas dalam Bundle
                  {form.classIds.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({form.classIds.length} dipilih)
                    </span>
                  )}
                </Label>

                {classesQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat daftar kelas...
                  </div>
                ) : (
                  <ScrollArea className="h-60 rounded-md border p-3">
                    <div className="space-y-4">
                      {classGroups.map(({ category, classes }) => (
                        <div key={category}>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            {category}
                          </p>
                          <div className="space-y-2 pl-1">
                            {classes.map((cls) => {
                              const effectivePrice = cls.discountPrice ?? cls.basePrice;
                              const isChecked = form.classIds.includes(cls.id);
                              return (
                                <label
                                  key={cls.id}
                                  className="flex items-center gap-3 cursor-pointer group"
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => toggleClassId(cls.id)}
                                    id={`cls-${cls.id}`}
                                  />
                                  <span className="flex-1 text-sm leading-tight group-hover:text-foreground transition-colors">
                                    {cls.title}
                                    {cls.status === 'draft' && (
                                      <span className="ml-1.5 text-xs text-muted-foreground">(draft)</span>
                                    )}
                                  </span>
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    {formatPrice(effectivePrice)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingBundle ? 'Simpan Perubahan' : 'Tambah Bundle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog Konfirmasi Hapus ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Bundle?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Bundle <strong>"{deleteTarget?.title}"</strong> akan dihapus secara permanen.
                  Tindakan ini tidak dapat dibatalkan.
                </p>
                {purchaseCount > 0 && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      Bundle ini pernah dibeli <strong>{purchaseCount} kali</strong>. Menghapusnya
                      tidak membatalkan transaksi yang sudah terjadi.
                    </p>
                  </div>
                )}
              </div>
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
