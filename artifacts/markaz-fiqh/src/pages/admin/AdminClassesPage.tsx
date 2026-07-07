import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/pages/CatalogPage';
import {
  useListClasses,
  useListInstructors,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useGetClassById,
  getGetClassByIdQueryKey,
  getListClassesQueryKey,
  type ClassSummary,
  type ClassDetail,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

type ClassFormState = {
  title: string;
  description: string;
  coverImage: string;
  basePrice: string;
  discountPrice: string;
  status: 'draft' | 'published';
  level: 'pemula' | 'menengah' | 'lanjutan' | '';
  category: string;
  instructorId: string;
  youtubePlaylistId: string;
  gdriveMateriUrl: string;
  waGroupUrl: string;
  meetingCount: string;
};

const EMPTY_FORM: ClassFormState = {
  title: '',
  description: '',
  coverImage: '',
  basePrice: '',
  discountPrice: '',
  status: 'draft',
  level: '',
  category: '',
  instructorId: '',
  youtubePlaylistId: '',
  gdriveMateriUrl: '',
  waGroupUrl: '',
  meetingCount: '',
};

function classToForm(cls: ClassDetail): ClassFormState {
  return {
    title: cls.title,
    description: cls.description,
    coverImage: cls.coverImage,
    basePrice: String(cls.basePrice),
    discountPrice: cls.discountPrice != null ? String(cls.discountPrice) : '',
    status: cls.status,
    level: cls.level ?? '',
    category: cls.category ?? '',
    instructorId: cls.instructor.id,
    youtubePlaylistId: cls.youtubePlaylistId ?? '',
    gdriveMateriUrl: cls.gdriveMateriUrl ?? '',
    waGroupUrl: cls.waGroupUrl ?? '',
    meetingCount: cls.meetingCount != null ? String(cls.meetingCount) : '',
  };
}

export default function AdminClassesPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSummary | null>(null);
  const [form, setForm] = useState<ClassFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ClassSummary | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const classesQuery = useListClasses({ includeAll: true });
  const instructorsQuery = useListInstructors();
  const classes = classesQuery.data ?? [];
  const instructors = instructorsQuery.data ?? [];

  const editingId = editingClass?.id ?? '';
  const { data: editingClassDetail } = useGetClassById(editingId, {
    query: {
      queryKey: getGetClassByIdQueryKey(editingId),
      enabled: !!editingClass && dialogOpen,
    },
  });

  const createMutation = useCreateClass({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey({ includeAll: true }) });
        toast({ title: 'Kelas berhasil ditambahkan' });
        setDialogOpen(false);
      },
      onError: (error) => {
        toast({ title: 'Gagal menambahkan kelas', description: String((error as Error)?.message ?? error), variant: 'destructive' });
      },
    },
  });

  const updateMutation = useUpdateClass({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey({ includeAll: true }) });
        toast({ title: 'Kelas berhasil diperbarui' });
        setDialogOpen(false);
      },
      onError: (error) => {
        toast({ title: 'Gagal memperbarui kelas', description: String((error as Error)?.message ?? error), variant: 'destructive' });
      },
    },
  });

  const deleteMutation = useDeleteClass({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey({ includeAll: true }) });
        toast({ title: 'Kelas berhasil dihapus' });
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast({ title: 'Gagal menghapus kelas', description: String((error as Error)?.message ?? error), variant: 'destructive' });
        setDeleteTarget(null);
      },
    },
  });

  useEffect(() => {
    if (!editingClass && instructors.length > 0 && !form.instructorId) {
      setForm((prev) => ({ ...prev, instructorId: instructors[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructors]);

  useEffect(() => {
    if (editingClassDetail && editingClass) {
      setForm(classToForm(editingClassDetail));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingClassDetail]);

  const filtered = classes.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  function openCreateDialog() {
    setEditingClass(null);
    setForm({ ...EMPTY_FORM, instructorId: instructors[0]?.id ?? '' });
    setDialogOpen(true);
  }

  function openEditDialog(cls: ClassSummary) {
    setEditingClass(cls);
    setForm({
      title: cls.title,
      description: cls.description,
      coverImage: cls.coverImage,
      basePrice: String(cls.basePrice),
      discountPrice: cls.discountPrice != null ? String(cls.discountPrice) : '',
      status: cls.status,
      level: cls.level ?? '',
      category: cls.category ?? '',
      instructorId: cls.instructor.id,
      youtubePlaylistId: cls.youtubePlaylistId ?? '',
      gdriveMateriUrl: '',
      waGroupUrl: '',
      meetingCount: '',
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim() || !form.instructorId) {
      toast({ title: 'Judul kelas dan pengajar wajib diisi', variant: 'destructive' });
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description,
      coverImage: form.coverImage,
      basePrice: Number(form.basePrice) || 0,
      discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
      status: form.status,
      level: form.level || null,
      category: form.category || null,
      instructorId: form.instructorId,
      youtubePlaylistId: form.youtubePlaylistId.trim() || null,
      gdriveMateriUrl: form.gdriveMateriUrl.trim() || null,
      waGroupUrl: form.waGroupUrl.trim() || null,
      meetingCount: form.meetingCount ? parseInt(form.meetingCount, 10) : null,
    };

    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  }

  function handleTogglePublish(cls: ClassSummary) {
    updateMutation.mutate({
      id: cls.id,
      data: { status: cls.status === 'published' ? 'draft' : 'published' },
    });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Manajemen Kelas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola daftar kelas fiqih, harga, dan status publikasinya.
            </p>
          </div>
          <Button data-testid="button-add-class" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kelas
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kelas..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-class"
              />
            </div>
          </CardHeader>
          <CardContent>
            {classesQuery.isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Memuat data kelas...
              </div>
            ) : classesQuery.isError ? (
              <div className="text-center text-sm text-destructive py-8">
                Gagal memuat data kelas dari server.
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Modul</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        Tidak ada kelas yang cocok dengan pencarian.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((cls) => (
                    <TableRow key={cls.id} data-testid={`row-class-${cls.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={cls.coverImage}
                            alt={cls.title}
                            className="h-10 w-14 rounded object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate max-w-[220px]">
                              {cls.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                              {cls.instructor.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {cls.discountPrice ? (
                            <>
                              <span className="font-medium text-foreground">{formatPrice(cls.discountPrice)}</span>
                              <span className="block text-xs text-muted-foreground line-through">
                                {formatPrice(cls.basePrice)}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium text-foreground">{formatPrice(cls.basePrice)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cls.moduleCount} modul
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={cls.status === 'published' ? 'success' : 'neutral'}
                          data-testid={`badge-status-${cls.id}`}
                        >
                          {cls.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePublish(cls)}
                            disabled={updateMutation.isPending}
                            data-testid={`button-toggle-status-${cls.id}`}
                          >
                            {cls.status === 'published' ? 'Jadikan Draft' : 'Terbitkan'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(cls)}
                            data-testid={`button-edit-class-${cls.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(cls)}
                            data-testid={`button-delete-class-${cls.id}`}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="class-title">Judul Kelas</Label>
                <Input
                  id="class-title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  data-testid="input-class-title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-description">Deskripsi</Label>
                <Textarea
                  id="class-description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  data-testid="input-class-description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-cover">URL Gambar Sampul</Label>
                <Input
                  id="class-cover"
                  value={form.coverImage}
                  onChange={(e) => setForm((p) => ({ ...p, coverImage: e.target.value }))}
                  data-testid="input-class-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class-base-price">Harga Normal (Rp)</Label>
                  <Input
                    id="class-base-price"
                    type="number"
                    value={form.basePrice}
                    onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))}
                    data-testid="input-class-base-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-discount-price">Harga Diskon (Rp)</Label>
                  <Input
                    id="class-discount-price"
                    type="number"
                    value={form.discountPrice}
                    onChange={(e) => setForm((p) => ({ ...p, discountPrice: e.target.value }))}
                    data-testid="input-class-discount-price"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pengajar</Label>
                  <Select
                    value={form.instructorId}
                    onValueChange={(v) => setForm((p) => ({ ...p, instructorId: v }))}
                  >
                    <SelectTrigger data-testid="select-class-instructor">
                      <SelectValue placeholder="Pilih pengajar" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select
                    value={form.level || 'none'}
                    onValueChange={(v) => setForm((p) => ({ ...p, level: v === 'none' ? '' : (v as ClassFormState['level']) }))}
                  >
                    <SelectTrigger data-testid="select-class-level">
                      <SelectValue placeholder="Pilih level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada</SelectItem>
                      <SelectItem value="pemula">Pemula</SelectItem>
                      <SelectItem value="menengah">Menengah</SelectItem>
                      <SelectItem value="lanjutan">Lanjutan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class-category">Kategori</Label>
                  <Input
                    id="class-category"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    data-testid="input-class-category"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((p) => ({ ...p, status: v as ClassFormState['status'] }))}
                  >
                    <SelectTrigger data-testid="select-class-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-youtube-playlist">Link Playlist YouTube</Label>
                <Input
                  id="class-youtube-playlist"
                  type="url"
                  placeholder="https://www.youtube.com/playlist?list=..."
                  value={form.youtubePlaylistId}
                  onChange={(e) => setForm((p) => ({ ...p, youtubePlaylistId: e.target.value }))}
                  data-testid="input-class-youtube-playlist"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-meeting-count">Jumlah Pertemuan</Label>
                <Input
                  id="class-meeting-count"
                  type="number"
                  placeholder="Contoh: 2"
                  value={form.meetingCount}
                  onChange={(e) => setForm((p) => ({ ...p, meetingCount: e.target.value }))}
                  data-testid="input-class-meeting-count"
                />
                <p className="text-xs text-muted-foreground">
                  Khusus kelas berbasis playlist video (tanpa breakdown modul manual). Ditampilkan sebagai "X Pertemuan" di halaman kelas.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-gdrive-materi">Link Google Drive Materi (PDF)</Label>
                <Input
                  id="class-gdrive-materi"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={form.gdriveMateriUrl}
                  onChange={(e) => setForm((p) => ({ ...p, gdriveMateriUrl: e.target.value }))}
                  data-testid="input-class-gdrive-materi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-wa-group">Link Grup WhatsApp</Label>
                <Input
                  id="class-wa-group"
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={form.waGroupUrl}
                  onChange={(e) => setForm((p) => ({ ...p, waGroupUrl: e.target.value }))}
                  data-testid="input-class-wa-group"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} data-testid="button-submit-class">
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingClass ? 'Simpan Perubahan' : 'Tambah Kelas'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kelas?</AlertDialogTitle>
            <AlertDialogDescription>
              Kelas "{deleteTarget?.title}" akan dihapus secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-class"
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
