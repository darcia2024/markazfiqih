import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { UserPlus, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { listAdminInvites, createAdminInvite, deleteAdminInvite } from '@/lib/db';

type AdminInvite = Awaited<ReturnType<typeof listAdminInvites>>[0];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminManageAdminsPage() {
  const [email, setEmail] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminInvite | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invitesQuery = useQuery({
    queryKey: ['admin-invites'],
    queryFn: listAdminInvites,
  });
  const invites = invitesQuery.data ?? [];

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-invites'] });

  const createMutation = useMutation({
    mutationFn: (payload: { email: string; invitedBy: string }) =>
      createAdminInvite(payload.email, payload.invitedBy),
    onSuccess: () => {
      invalidateList();
      toast({ title: 'Undangan admin berhasil dibuat' });
      setEmail('');
    },
    onError: (error) => {
      const message = String((error as Error)?.message ?? error);
      toast({
        title: 'Gagal membuat undangan admin',
        description: message.includes('duplicate') || message.includes('unique')
          ? 'Email ini sudah pernah diundang sebelumnya.'
          : message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminInvite(id),
    onSuccess: () => {
      invalidateList();
      toast({ title: 'Undangan berhasil dibatalkan' });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({
        title: 'Gagal membatalkan undangan',
        description: String((error as Error)?.message ?? error),
        variant: 'destructive',
      });
      setDeleteTarget(null);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      toast({ title: 'Masukkan alamat email yang valid', variant: 'destructive' });
      return;
    }
    createMutation.mutate({ email: trimmed, invitedBy: user?.id ?? '' });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Kelola Admin</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Undang admin baru lewat email. Begitu orang dengan email tersebut login
            pertama kali via Google, akunnya otomatis menjadi admin.
          </p>
        </div>

        {/* Form Undang */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold text-foreground text-sm">Undang Admin Baru</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="invite-email">Email Calon Admin</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  placeholder="nama@contoh.com"
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-admin-invite-email"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-invite-admin"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Undang jadi Admin
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-3">
              Pastikan email sesuai dengan akun Google yang akan digunakan calon admin untuk login.
            </p>
          </CardContent>
        </Card>

        {/* Daftar Undangan */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold text-foreground text-sm">Daftar Undangan</h3>
          </CardHeader>
          <CardContent className="p-0">
            {invitesQuery.isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Memuat data undangan...
              </div>
            ) : invitesQuery.isError ? (
              <div className="text-center text-sm text-destructive py-8">
                Gagal memuat daftar undangan dari server.
              </div>
            ) : invites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                  <ShieldCheck className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="font-semibold text-foreground mb-1">Belum ada undangan</p>
                <p className="text-sm text-muted-foreground">
                  Undang admin baru menggunakan form di atas.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Tanggal Diundang</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id} data-testid={`row-admin-invite-${invite.id}`}>
                      <TableCell className="font-medium text-foreground">{invite.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invite.createdAt)}
                      </TableCell>
                      <TableCell>
                        {invite.redeemedAt ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Sudah aktif sebagai admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Menunggu login pertama</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!invite.redeemedAt && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(invite)}
                            data-testid={`button-delete-invite-${invite.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Batalkan
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Undangan?</AlertDialogTitle>
            <AlertDialogDescription>
              Undangan untuk "{deleteTarget?.email}" akan dihapus. Orang ini tidak akan
              otomatis menjadi admin saat login, kecuali diundang ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-invite"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Batalkan Undangan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
