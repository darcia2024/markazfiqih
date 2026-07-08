import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAllTestimonialsForAdmin,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '@/lib/db';

type Testimonial = Awaited<ReturnType<typeof listAllTestimonialsForAdmin>>[0];

type TestimonialFormState = {
  name: string;
  role: string;
  content: string;
  photoUrl: string;
  isPublished: boolean;
  orderIndex: string;
};

const EMPTY_FORM: TestimonialFormState = {
  name: '',
  role: '',
  content: '',
  photoUrl: '',
  isPublished: true,
  orderIndex: '0',
};

function testimonialToForm(t: Testimonial): TestimonialFormState {
  return {
    name: t.name,
    role: t.role ?? '',
    content: t.content,
    photoUrl: t.photoUrl ?? '',
    isPublished: t.isPublished,
    orderIndex: String(t.orderIndex),
  };
}

export default function AdminTestimonialsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<TestimonialFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const testimonialsQuery = useQuery({
    queryKey: ['testimonials', 'admin'],
    queryFn: listAllTestimonialsForAdmin,
  });
  const testimonials = testimonialsQuery.data ?? [];

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['testimonials', 'admin'] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createTestimonial>[0]) => createTestimonial(payload),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Testimoni berhasil ditambahkan' });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Gagal menambahkan testimoni', description: String((error as Error)?.message ?? error), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTestimonial>[1] }) =>
      updateTestimonial(id, data),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Testimoni berhasil diperbarui' });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Gagal memperbarui testimoni', description: String((error as Error)?.message ?? error), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTestimonial(id),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Testimoni berhasil dihapus' });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({ title: 'Gagal menghapus testimoni', description: String((error as Error)?.message ?? error), variant: 'destructive' });
      setDeleteTarget(null);
    },
  });

  function openCreateDialog() {
    setEditingTestimonial(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(t: Testimonial) {
    setEditingTestimonial(t);
    setForm(testimonialToForm(t));
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim() || !form.content.trim()) {
      toast({ title: 'Nama dan isi testimoni wajib diisi', variant: 'destructive' });
      return;
    }

    const payload = {
      name: form.name.trim(),
      role: form.role || null,
      content: form.content,
      photoUrl: form.photoUrl,
      isPublished: form.isPublished,
      orderIndex: Number(form.orderIndex) || 0,
    };

    if (editingTestimonial) {
      updateMutation.mutate({ id: editingTestimonial.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleTogglePublish(t: Testimonial) {
    updateMutation.mutate({ id: t.id, data: { isPublished: !t.isPublished } });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Manajemen Testimoni</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola testimoni santri yang ditampilkan di halaman utama.
            </p>
          </div>
          <Button onClick={openCreateDialog} data-testid="button-add-testimonial">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Testimoni
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3" />
          <CardContent>
            {testimonialsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Memuat testimoni...
              </div>
            ) : testimonialsQuery.isError ? (
              <div className="text-center text-sm text-destructive py-8">
                Gagal memuat testimoni dari server.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Santri</TableHead>
                    <TableHead>Testimoni</TableHead>
                    <TableHead>Urutan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonials.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        Belum ada testimoni.
                      </TableCell>
                    </TableRow>
                  )}
                  {testimonials.map((t) => (
                    <TableRow key={t.id} data-testid={`row-testimonial-${t.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={t.photoUrl ?? undefined} alt={t.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {t.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate max-w-[160px]">{t.name}</p>
                            {t.role && (
                              <p className="text-xs text-muted-foreground truncate max-w-[160px]">{t.role}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-[320px]">{t.content}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.orderIndex}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={t.isPublished}
                            onCheckedChange={() => handleTogglePublish(t)}
                            disabled={updateMutation.isPending}
                            data-testid={`switch-published-${t.id}`}
                          />
                          <Badge variant={t.isPublished ? 'success' : 'neutral'}>
                            {t.isPublished ? 'Tayang' : 'Disembunyikan'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(t)}
                            data-testid={`button-edit-testimonial-${t.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(t)}
                            data-testid={`button-delete-testimonial-${t.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingTestimonial ? 'Edit Testimoni' : 'Tambah Testimoni Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testimonial-name">Nama</Label>
                  <Input
                    id="testimonial-name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    data-testid="input-testimonial-name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testimonial-role">Peran / Keterangan</Label>
                  <Input
                    id="testimonial-role"
                    placeholder="cth: Santri Kelas Muamalah"
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    data-testid="input-testimonial-role"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="testimonial-content">Isi Testimoni</Label>
                <Textarea
                  id="testimonial-content"
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  rows={4}
                  data-testid="input-testimonial-content"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testimonial-photo">URL Foto</Label>
                <Input
                  id="testimonial-photo"
                  value={form.photoUrl}
                  onChange={(e) => setForm((p) => ({ ...p, photoUrl: e.target.value }))}
                  data-testid="input-testimonial-photo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="testimonial-order">Urutan Tampil</Label>
                  <Input
                    id="testimonial-order"
                    type="number"
                    value={form.orderIndex}
                    onChange={(e) => setForm((p) => ({ ...p, orderIndex: e.target.value }))}
                    data-testid="input-testimonial-order"
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch
                    id="testimonial-published"
                    checked={form.isPublished}
                    onCheckedChange={(checked) => setForm((p) => ({ ...p, isPublished: checked }))}
                    data-testid="switch-testimonial-published"
                  />
                  <Label htmlFor="testimonial-published">Tayangkan</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} data-testid="button-submit-testimonial">
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingTestimonial ? 'Simpan Perubahan' : 'Tambah Testimoni'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Testimoni?</AlertDialogTitle>
            <AlertDialogDescription>
              Testimoni dari "{deleteTarget?.name}" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-testimonial"
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
