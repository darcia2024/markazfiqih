import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { StarRating } from '@/components/StarRating';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAllReviewsForAdmin,
  adminUpdateReview,
  adminDeleteReview,
  type AdminReviewRow,
} from '@/lib/db';

type ReviewFormState = {
  reviewerName: string;
  rating: number;
  comment: string;
};

function reviewToForm(r: AdminReviewRow): ReviewFormState {
  return {
    reviewerName: r.reviewerName ?? '',
    rating: r.rating,
    comment: r.comment,
  };
}

export default function AdminReviewsPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<AdminReviewRow | null>(null);
  const [form, setForm] = useState<ReviewFormState>({ reviewerName: '', rating: 5, comment: '' });
  const [deleteTarget, setDeleteTarget] = useState<AdminReviewRow | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ['reviews', 'admin'],
    queryFn: listAllReviewsForAdmin,
  });
  const reviews = reviewsQuery.data ?? [];

  const filteredReviews = search.trim()
    ? reviews.filter((r) => {
        const q = search.trim().toLowerCase();
        return (
          r.classTitle.toLowerCase().includes(q) ||
          (r.reviewerName ?? '').toLowerCase().includes(q)
        );
      })
    : reviews;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['reviews', 'admin'] });
    queryClient.invalidateQueries({ queryKey: ['class-reviews'] }); // ClassDetailPage: tampilan review sisi pelajar
    queryClient.invalidateQueries({ queryKey: ['class'] }); // ikut jaga-jaga kalau ada halaman lain yang embed data ini
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminUpdateReview>[1] }) =>
      adminUpdateReview(id, data),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Review berhasil diperbarui' });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Gagal memperbarui review',
        description: String((error as Error)?.message ?? error),
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteReview(id),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Review berhasil dihapus' });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({
        title: 'Gagal menghapus review',
        description: String((error as Error)?.message ?? error),
        variant: 'destructive',
      });
      setDeleteTarget(null);
    },
  });

  function openEditDialog(r: AdminReviewRow) {
    setEditingReview(r);
    setForm(reviewToForm(r));
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingReview) return;

    if (!form.comment.trim()) {
      toast({ title: 'Isi ulasan wajib diisi', variant: 'destructive' });
      return;
    }

    updateMutation.mutate({
      id: editingReview.id,
      data: {
        rating: form.rating,
        comment: form.comment,
        reviewerName: form.reviewerName,
      },
    });
  }

  const isSaving = updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Kelola Review</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Moderasi review & rating dari semua kelas — edit atau hapus ulasan yang tidak pantas.
            </p>
          </div>
          <Input
            placeholder="Cari nama kelas atau pereview..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-64"
            data-testid="input-search-review"
          />
        </div>

        <Card>
          <CardHeader className="pb-3" />
          <CardContent>
            {reviewsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Memuat review...
              </div>
            ) : reviewsQuery.isError ? (
              <div className="text-center text-sm text-destructive py-8">
                Gagal memuat review dari server.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Pereview</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Ulasan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        {search.trim() ? 'Tidak ada review yang cocok.' : 'Belum ada review.'}
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredReviews.map((r) => (
                    <TableRow key={r.id} data-testid={`row-review-${r.id}`}>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                          {r.classTitle}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground truncate max-w-[140px]">
                          {r.reviewerName || 'Pelajar'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StarRating rating={r.rating} size="sm" />
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-[320px]">
                          {r.comment}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(r)}
                            data-testid={`button-edit-review-${r.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(r)}
                            data-testid={`button-delete-review-${r.id}`}
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
              <DialogTitle>Edit Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <StarRating
                  rating={form.rating}
                  size="lg"
                  interactive
                  onChange={(rating) => setForm((p) => ({ ...p, rating }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-name">Nama Pereview</Label>
                <Input
                  id="review-name"
                  value={form.reviewerName}
                  onChange={(e) => setForm((p) => ({ ...p, reviewerName: e.target.value }))}
                  data-testid="input-review-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-comment">Isi Ulasan</Label>
                <Textarea
                  id="review-comment"
                  value={form.comment}
                  onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                  rows={4}
                  data-testid="input-review-comment"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} data-testid="button-submit-review">
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Review?</AlertDialogTitle>
            <AlertDialogDescription>
              Review dari "{deleteTarget?.reviewerName || 'Pelajar'}" untuk kelas "
              {deleteTarget?.classTitle}" akan dihapus secara permanen. Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-review"
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
