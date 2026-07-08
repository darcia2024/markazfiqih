import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Loader2, StickyNote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAllDashboardMessages,
  createDashboardMessage,
  updateDashboardMessage,
  deleteDashboardMessage,
} from '@/lib/db';

type DashboardMessage = Awaited<ReturnType<typeof listAllDashboardMessages>>[0];

export default function AdminDashboardMessagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newMessage, setNewMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DashboardMessage | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['admin-dashboard-messages'],
    queryFn: listAllDashboardMessages,
  });

  const createMutation = useMutation({
    mutationFn: (message: string) => createDashboardMessage(message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-messages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-messages'] });
      setNewMessage('');
      toast({ title: 'Pesan berhasil ditambahkan.' });
    },
    onError: () => toast({ title: 'Gagal menambahkan pesan.', variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateDashboardMessage(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-messages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-messages'] });
    },
    onError: () => toast({ title: 'Gagal mengubah status pesan.', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDashboardMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-messages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-messages'] });
      setDeleteTarget(null);
      toast({ title: 'Pesan berhasil dihapus.' });
    },
    onError: () => toast({ title: 'Gagal menghapus pesan.', variant: 'destructive' }),
  });

  const handleAdd = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  };

  const activeCount = messages.filter((m) => m.isActive).length;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">

        {/* Header info */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/20">
          <StickyNote className="w-5 h-5 text-[hsl(var(--accent))] shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80">
            Pesan di sini tampil secara acak di halaman Dashboard pengguna saat mereka login.
            Hanya pesan yang <span className="font-semibold">aktif</span> yang akan ditampilkan.
            {activeCount === 0 && (
              <span className="text-destructive font-medium ml-1">
                ⚠ Tidak ada pesan aktif — Dashboard akan menampilkan teks fallback bawaan.
              </span>
            )}
          </p>
        </div>

        {/* Form tambah pesan baru */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tambah Pesan Baru</CardTitle>
            <CardDescription>Ketik kalimat motivasi atau salam yang ingin ditampilkan di Dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-message">Teks Pesan</Label>
              <Textarea
                id="new-message"
                placeholder="Contoh: Semoga ilmu hari ini membawa manfaat dunia akhirat."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={!newMessage.trim() || createMutation.isPending}
              className="gap-2"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Tambah Pesan
            </Button>
          </CardContent>
        </Card>

        {/* Daftar pesan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Pesan</CardTitle>
            <CardDescription>
              {messages.length} pesan tersimpan · {activeCount} aktif
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Belum ada pesan. Tambahkan pesan pertama di atas.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pesan</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                    <TableHead className="w-16 text-right">Hapus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell className="align-top py-3">
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </TableCell>
                      <TableCell className="text-center align-top py-3">
                        <div className="flex flex-col items-center gap-1.5">
                          <Switch
                            checked={msg.isActive}
                            onCheckedChange={(checked) =>
                              toggleMutation.mutate({ id: msg.id, isActive: checked })
                            }
                            disabled={toggleMutation.isPending}
                          />
                          <Badge
                            variant={msg.isActive ? 'default' : 'secondary'}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {msg.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right align-top py-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(msg)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Konfirmasi hapus */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pesan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.message}"
              <br /><br />
              Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
