import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Plus, Pencil, Trash2, Loader2, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAllInstructorsForAdmin,
  createInstructor,
  updateInstructor,
  deleteInstructor,
} from '@/lib/db';

type InstructorSummary = Awaited<ReturnType<typeof listAllInstructorsForAdmin>>[0];

type InstructorFormState = {
  name: string;
  bio: string;
  detailedBio: string;
  photoUrl: string;
  isActive: boolean;
};

const EMPTY_FORM: InstructorFormState = {
  name: '',
  bio: '',
  detailedBio: '',
  photoUrl: '',
  isActive: true,
};

function instructorToForm(ins: InstructorSummary): InstructorFormState {
  return {
    name: ins.name,
    bio: ins.bio ?? '',
    detailedBio: ins.detailedBio ?? '',
    photoUrl: ins.photoUrl ?? '',
    isActive: ins.isActive ?? true,
  };
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export default function AdminInstructorsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<InstructorSummary | null>(null);
  const [form, setForm] = useState<InstructorFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<InstructorSummary | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const instructorsQuery = useQuery({
    queryKey: ['instructors', 'admin'],
    queryFn: listAllInstructorsForAdmin,
  });
  const instructors = instructorsQuery.data ?? [];

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ['instructors', 'admin'] });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; bio?: string; detailedBio?: string; photoUrl?: string }) =>
      createInstructor(payload),
    onSuccess: () => {
      invalidateList();
      toast({ title: 'Pengajar berhasil ditambahkan' });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Gagal menambahkan pengajar',
        description: String((error as Error)?.message ?? error),
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateInstructor>[1] }) =>
      updateInstructor(id, data),
    onSuccess: () => {
      invalidateList();
      toast({ title: 'Data pengajar berhasil diperbarui' });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Gagal memperbarui pengajar',
        description: String((error as Error)?.message ?? error),
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInstructor(id),
    onSuccess: () => {
      invalidateList();
      toast({ title: 'Pengajar berhasil dihapus' });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({
        title: 'Gagal menghapus pengajar',
        description: String((error as Error)?.message ?? error),
        variant: 'destructive',
      });
      setDeleteTarget(null);
    },
  });

  function openCreateDialog() {
    setEditingInstructor(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(ins: InstructorSummary) {
    setEditingInstructor(ins);
    setForm(instructorToForm(ins));
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast({ title: 'Nama pengajar wajib diisi', variant: 'destructive' });
      return;
    }

    const payload = {
      name: form.name.trim(),
      bio: form.bio.trim() || undefined,
      detailedBio: form.detailedBio.trim(),
      photoUrl: form.photoUrl.trim() || undefined,
      isActive: form.isActive,
    };

    if (editingInstructor) {
      updateMutation.mutate({ id: editingInstructor.id, data: payload });
    } else {
      createMutation.mutate({
        name: payload.name,
        bio: payload.bio,
        detailedBio: payload.detailedBio,
        photoUrl: payload.photoUrl,
      });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Kelola Pengajar</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tambah, edit, dan hapus instruktur kelas fiqih.
            </p>
          </div>
          <Button data-testid="button-add-instructor" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pengajar Baru
          </Button>
        </div>

        {/* Instructor Grid */}
        {instructorsQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Memuat data pengajar...
          </div>
        ) : instructorsQuery.isError ? (
          <div className="text-center text-sm text-destructive py-8">
            Gagal memuat data pengajar dari server.
          </div>
        ) : instructors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UserCog className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground mb-1">Belum ada pengajar</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan pengajar pertama untuk mulai membuat kelas.
            </p>
            <Button onClick={openCreateDialog} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pengajar
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {instructors.map((ins) => (
              <Card
                key={ins.id}
                data-testid={`card-instructor-${ins.id}`}
                className={`overflow-hidden ${!ins.isActive ? 'opacity-60 border-dashed' : ''}`}
              >
                <CardContent className="p-5 flex flex-col gap-4">
                  {/* Avatar + Name + Badge */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 shrink-0 border border-border">
                      <AvatarImage src={ins.photoUrl} alt={ins.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {getInitials(ins.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm leading-tight truncate">
                        {ins.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs font-normal">
                          {ins.classCount} kelas published
                        </Badge>
                        {!ins.isActive && (
                          <Badge variant="destructive" className="text-xs font-normal">
                            Nonaktif
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {ins.bio ? (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {ins.bio}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic">Belum ada bio.</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t mt-auto">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => openEditDialog(ins)}
                      data-testid={`button-edit-instructor-${ins.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(ins)}
                      data-testid={`button-delete-instructor-${ins.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingInstructor ? 'Edit Pengajar' : 'Tambah Pengajar Baru'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Nama */}
              <div className="space-y-2">
                <Label htmlFor="instructor-name">Nama Pengajar</Label>
                <Input
                  id="instructor-name"
                  value={form.name}
                  placeholder="Cth: Faqih Ubaidillah Rozan, Lc."
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  data-testid="input-instructor-name"
                  required
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="instructor-bio">Bio Singkat (opsional)</Label>
                <Textarea
                  id="instructor-bio"
                  value={form.bio}
                  placeholder="Pendek saja: latar belakang, spesialisasi, atau lembaga tempat mengajar."
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  data-testid="input-instructor-bio"
                  rows={3}
                />
              </div>

              {/* Biografi Detail */}
              <div className="space-y-2">
                <Label htmlFor="instructor-detailed-bio">Biografi Detail (opsional)</Label>
                <Textarea
                  id="instructor-detailed-bio"
                  value={form.detailedBio}
                  placeholder="Tuliskan riwayat pendidikan, pengalaman mengajar, karya, dan hal-hal lain yang ingin ditampilkan di halaman profil pengajar."
                  onChange={(e) => setForm((p) => ({ ...p, detailedBio: e.target.value }))}
                  data-testid="input-instructor-detailed-bio"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Ditampilkan di halaman detail pengajar, di antara profil dan daftar kelas.
                </p>
              </div>

              {/* Photo URL + Preview */}
              <div className="space-y-2">
                <Label htmlFor="instructor-photo">URL Foto (opsional)</Label>
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 shrink-0 border border-border">
                    <AvatarImage src={form.photoUrl || undefined} alt={form.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {form.name ? getInitials(form.name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    id="instructor-photo"
                    type="url"
                    value={form.photoUrl}
                    placeholder="https://example.com/foto.jpg"
                    onChange={(e) => setForm((p) => ({ ...p, photoUrl: e.target.value }))}
                    data-testid="input-instructor-photo"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Preview foto di sebelah kiri akan otomatis berubah saat URL diisi.
                </p>
              </div>

              {/* Toggle Aktif — hanya tampil saat edit, bukan tambah baru */}
              {editingInstructor && (
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">Status Pengajar</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {form.isActive
                        ? 'Aktif: tampil di katalog dan landing page'
                        : 'Nonaktif: tersembunyi dari tampilan publik'}
                    </p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: checked }))}
                    data-testid="switch-instructor-active"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} data-testid="button-submit-instructor">
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingInstructor ? 'Simpan Perubahan' : 'Tambah Pengajar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengajar?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengajar "{deleteTarget?.name}" akan dihapus secara permanen dari database. Tindakan
              ini tidak dapat dibatalkan.
            </AlertDialogDescription>
            {deleteTarget && deleteTarget.classCount > 0 && (
              <p className="text-sm font-semibold text-destructive mt-2">
                ⚠️ Pengajar ini masih mengajar {deleteTarget.classCount} kelas. Menghapusnya akan
                ikut menghapus SEMUA kelas tersebut secara permanen (karena ada relasi cascade di
                database). Yakin ingin lanjut?
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-instructor"
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
