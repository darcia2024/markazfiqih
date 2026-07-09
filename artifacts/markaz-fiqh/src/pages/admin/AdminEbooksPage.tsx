import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Loader2, BookOpen, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/pages/CatalogPage';
import {
  listAllEbooksForAdmin,
  createEbook,
  updateEbook,
  deleteEbook,
  getEbookPurchaseCount,
  type AdminEbook,
} from '@/lib/db';

// ─── Tipe lokal ───────────────────────────────────────────────────────────────
type EbookFormState = {
  title: string;
  description: string;
  author: string;
  coverImage: string;
  price: string;
  discountPrice: string;
  gdriveUrl: string;
  status: 'draft' | 'published';
};

const EMPTY_FORM: EbookFormState = {
  title: '',
  description: '',
  author: '',
  coverImage: '',
  price: '',
  discountPrice: '',
  gdriveUrl: '',
  status: 'draft',
};

function ebookToForm(e: AdminEbook): EbookFormState {
  return {
    title: e.title,
    description: e.description,
    author: e.author ?? '',
    coverImage: e.coverImage,
    price: String(e.price),
    discountPrice: e.discountPrice != null ? String(e.discountPrice) : '',
    gdriveUrl: e.gdriveUrl,
    status: e.status,
  };
}

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function AdminEbooksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEbook, setEditingEbook] = useState<AdminEbook | null>(null);
  const [form, setForm] = useState<EbookFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AdminEbook | null>(null);

  // ─── Queries ───────────────────────────────────────────────────────────────
  const ebooksQuery = useQuery({
    queryKey: ['ebooks', 'admin'],
    queryFn: listAllEbooksForAdmin,
  });

  const { data: purchaseCount = 0 } = useQuery({
    queryKey: ['ebook-purchase-count', deleteTarget?.id],
    queryFn: () => getEbookPurchaseCount(deleteTarget!.id),
    enabled: !!deleteTarget,
  });

  const ebooks = ebooksQuery.data ?? [];

  const invalidateEbooks = () => {
    queryClient.invalidateQueries({ queryKey: ['ebooks', 'admin'] });
    // Refresh halaman publik katalog ebook & "Ebook Saya" juga
    queryClient.invalidateQueries({ queryKey: ['ebooks'] });
    queryClient.invalidateQueries({ queryKey: ['my-ebooks'] });
  };

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createEbook>[0]) => createEbook(payload),
    onSuccess: () => {
      invalidateEbooks();
      toast({ title: 'Ebook berhasil ditambahkan' });
      setDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: 'Gagal menambahkan ebook', description: String((err as Error)?.message ?? err), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateEbook>[1] }) =>
      updateEbook(id, payload),
    onSuccess: () => {
      invalidateEbooks();
      toast({ title: 'Ebook berhasil diperbarui' });
      setDialogOpen(false);
    },
    onError: (err) => {
      toast({ title: 'Gagal memperbarui ebook', description: String((err as Error)?.message ?? err), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEbook(id),
    onSuccess: () => {
      invalidateEbooks();
      toast({ title: 'Ebook berhasil dihapus' });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast({ title: 'Gagal menghapus ebook', description: String((err as Error)?.message ?? err), variant: 'destructive' });
      setDeleteTarget(null);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateEbook>[1] }) =>
      updateEbook(id, payload),
    onSuccess: () => invalidateEbooks(),
    onError: (err) => {
      toast({ title: 'Gagal mengubah status', description: String((err as Error)?.message ?? err), variant: 'destructive' });
    },
  });

  // ─── Form helpers ──────────────────────────────────────────────────────────
  function openCreateDialog() {
    setEditingEbook(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(ebook: AdminEbook) {
    setEditingEbook(ebook);
    setForm(ebookToForm(ebook));
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: 'Judul ebook wajib diisi', variant: 'destructive' });
      return;
    }
    if (!form.gdriveUrl.trim()) {
      toast({ title: 'Link Google Drive wajib diisi', variant: 'destructive' });
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description,
      author: form.author.trim(),
      coverImage: form.coverImage.trim(),
      price: Number(form.price) || 0,
      discountPrice: form.discountPrice.trim() ? Number(form.discountPrice) : null,
      gdriveUrl: form.gdriveUrl.trim(),
      status: form.status,
    };

    if (editingEbook) {
      updateMutation.mutate({ id: editingEbook.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleTogglePublish(ebook: AdminEbook) {
    const newStatus = ebook.status === 'published' ? 'draft' : 'published';
    togglePublishMutation.mutate({
      id: ebook.id,
      payload: {
        title: ebook.title,
        description: ebook.description,
        author: ebook.author ?? '',
        coverImage: ebook.coverImage,
        price: ebook.price,
        discountPrice: ebook.discountPrice,
        gdriveUrl: ebook.gdriveUrl,
        status: newStatus,
      },
    });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Kelola Ebook</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Buat dan kelola ebook — link Google Drive hanya bisa diakses oleh yang sudah membeli.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Ebook
          </Button>
        </div>

        {/* Tabel */}
        <Card>
          <CardContent className="pt-6">
            {ebooksQuery.isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Memuat data ebook...
              </div>
            ) : ebooksQuery.isError ? (
              <div className="text-center text-sm text-destructive py-8">
                Gagal memuat data ebook dari server.
              </div>
            ) : ebooks.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Belum ada ebook. Klik "Tambah Ebook" untuk membuat yang pertama.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ebook</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ebooks.map((ebook) => (
                      <TableRow key={ebook.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {ebook.coverImage ? (
                              <img
                                src={ebook.coverImage}
                                alt={ebook.title}
                                className="h-10 w-8 rounded object-cover shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-8 rounded bg-muted shrink-0 flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                {ebook.title}
                              </p>
                              {ebook.author && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {ebook.author}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium text-foreground">
                              {formatPrice(ebook.discountPrice ?? ebook.price)}
                            </span>
                            {ebook.discountPrice != null && ebook.discountPrice < ebook.price && (
                              <span className="block text-xs text-muted-foreground line-through">
                                {formatPrice(ebook.price)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ebook.status === 'published' ? 'success' : 'neutral'}>
                            {ebook.status === 'published' ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTogglePublish(ebook)}
                              disabled={togglePublishMutation.isPending}
                            >
                              {ebook.status === 'published' ? 'Jadikan Draft' : 'Terbitkan'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(ebook)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteTarget(ebook)}
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
              <DialogTitle>{editingEbook ? 'Edit Ebook' : 'Tambah Ebook Baru'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Judul */}
              <div className="space-y-2">
                <Label htmlFor="ebook-title">Judul Ebook</Label>
                <Input
                  id="ebook-title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              {/* Penulis */}
              <div className="space-y-2">
                <Label htmlFor="ebook-author">Penulis</Label>
                <Input
                  id="ebook-author"
                  value={form.author}
                  onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))}
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-2">
                <Label htmlFor="ebook-description">Deskripsi</Label>
                <Textarea
                  id="ebook-description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* URL Cover */}
              <div className="space-y-2">
                <Label htmlFor="ebook-cover">URL Gambar Cover</Label>
                <Input
                  id="ebook-cover"
                  type="url"
                  placeholder="https://... atau /covers/nama-file.png"
                  value={form.coverImage}
                  onChange={(e) => setForm((p) => ({ ...p, coverImage: e.target.value }))}
                />
              </div>

              {/* Link Google Drive */}
              <div className="space-y-2">
                <Label htmlFor="ebook-gdrive">Link Google Drive File Ebook</Label>
                <Input
                  id="ebook-gdrive"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={form.gdriveUrl}
                  onChange={(e) => setForm((p) => ({ ...p, gdriveUrl: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Link ini hanya bisa dibuka oleh pelajar yang sudah membeli ebook ini.
                </p>
              </div>

              {/* Harga */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ebook-price">Harga Normal (Rp)</Label>
                  <Input
                    id="ebook-price"
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ebook-discount-price">Harga Diskon (Rp, opsional)</Label>
                  <Input
                    id="ebook-discount-price"
                    type="number"
                    min={0}
                    value={form.discountPrice}
                    onChange={(e) => setForm((p) => ({ ...p, discountPrice: e.target.value }))}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((p) => ({ ...p, status: v as EbookFormState['status'] }))}
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
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingEbook ? 'Simpan Perubahan' : 'Tambah Ebook'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog Konfirmasi Hapus ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Ebook?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Ebook <strong>"{deleteTarget?.title}"</strong> akan dihapus secara permanen.
                  Tindakan ini tidak dapat dibatalkan.
                </p>
                {purchaseCount > 0 && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      Ebook ini pernah dibeli <strong>{purchaseCount} kali</strong>. Menghapusnya
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
