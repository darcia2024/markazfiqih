import { useState } from 'react';
import { Link } from 'wouter';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Users, Search, ShieldPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listAllUsersForAdmin, type AdminUserRow } from '@/lib/db';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');

  const usersQuery = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: listAllUsersForAdmin,
  });

  const allUsers: AdminUserRow[] = [...(usersQuery.data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const filtered = allUsers.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.nickname ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Kelola Pengguna</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Daftar semua pengguna terdaftar — nama, email, tanggal daftar, dan jumlah kelas
              yang dimiliki.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/manage-admins">
              <ShieldPlus className="h-4 w-4 mr-2" />
              Kelola Admin
            </Link>
          </Button>
        </div>

        {/* Search + Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Cari nama atau email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                data-testid="input-search-users"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {usersQuery.isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Memuat data pengguna…
              </div>
            ) : usersQuery.isError ? (
              <div className="text-center text-sm text-destructive py-8">
                Gagal memuat daftar pengguna dari server.
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Users className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="font-semibold text-foreground mb-1">
                  {search ? 'Tidak ada pengguna ditemukan' : 'Belum ada pengguna terdaftar'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? 'Coba kata kunci lain.'
                    : 'Pengguna yang mendaftar akan muncul di sini.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tanggal Daftar</TableHead>
                    <TableHead className="text-center">Kelas Dimiliki</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.userId} data-testid={`row-user-${u.userId}`}>
                      <TableCell className="font-medium text-foreground">
                        {u.nickname ?? (
                          <span className="text-muted-foreground italic">Belum diisi</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        {u.enrollmentCount}
                      </TableCell>
                      <TableCell>
                        {u.isAdmin ? (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pelajar</Badge>
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
    </AdminLayout>
  );
}
