import { useState } from 'react';
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
import { Send, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAllNotificationsForAdmin,
  createNotification,
  deleteNotification,
  type AppNotification,
} from '@/lib/db';

const TYPE_LABEL: Record<string, string> = {
  info: 'Info',
  promo: 'Promo',
  kelas_baru: 'Kelas Baru',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'promo' | 'kelas_baru'>('info');
  const [deleteTarget, setDeleteTarget] = useState<AppNotification | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['notifications', 'admin'] });

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'admin'],
    queryFn: listAllNotificationsForAdmin,
  });
  const notifications = notificationsQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      invalidate();
      // Notifikasi baru untuk semua pelajar juga diambil ulang lewat query
      // ['notifications', userId] karena tabelnya sama — cukup invalidate broad.
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setTitle('');
      setMessage('');
      setType('info');
      toast({ title: 'Notifikasi berhasil dikirim ke semua pelajar' });
    },
    onError: (e) =>
      toast({
        title: 'Gagal mengirim notifikasi',
        description: String((e as Error)?.message ?? e),
        variant: 'destructive',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setDeleteTarget(null);
      toast({ title: 'Notifikasi berhasil dihapus' });
    },
    onError: (e) =>
      toast({
        title: 'Gagal menghapus notifikasi',
        description: String((e as Error)?.message ?? e),
        variant: 'destructive',
      }),
  });

  function handleSubmit() {
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Judul dan pesan wajib diisi', variant: 'destructive' });
      return;
    }
    createMutation.mutate({ title: title.trim(), message: message.trim(), type });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Notifikasi</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kirim pengumuman ke semua pelajar. Notifikasi langsung tampil di icon
            lonceng begitu dikirim — tidak ada draft atau jadwal.
          </p>
        </div>

        {/* Form compose */}
        <Card>
          <CardContent className="p-4 md:p-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Judul</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kelas baru tersedia hari ini!"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pesan</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Contoh: Kelas Fiqih Zakat sudah bisa diakses di Katalog."
                rows={3}
              />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <Label>Tipe</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="promo">Promo</SelectItem>
                  <SelectItem value="kelas_baru">Kelas Baru</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Kirim Notifikasi
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Riwayat */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Tanggal Kirim</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificationsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : notificationsQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-destructive">
                      Gagal memuat riwayat notifikasi.
                    </TableCell>
                  </TableRow>
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Belum ada notifikasi yang dikirim.
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium max-w-[280px] truncate">
                        {n.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{TYPE_LABEL[n.type] ?? n.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(n.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(n)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus notifikasi "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Notifikasi ini akan hilang dari daftar semua pelajar. Tindakan ini tidak
              dapat dibatalkan.
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
