import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MOCK_CLASSES, formatPrice, countTotalDars, type MockClass } from '@/data/mockClasses';
import { Plus, Search, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<MockClass[]>(MOCK_CLASSES);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const filtered = classes.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  function handleTogglePublish(id: string) {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'published' ? 'draft' : 'published' }
          : c
      )
    );

    const target = classes.find((c) => c.id === id);
    const nextStatus = target?.status === 'published' ? 'Draft' : 'Published';
    toast({
      title: 'Status publikasi diubah',
      description: `"${target?.title}" sekarang berstatus ${nextStatus}. (data tiruan, belum tersimpan)`,
    });
  }

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
          <Button data-testid="button-add-class" disabled title="Fitur tambah kelas belum tersedia (data tiruan)">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Modul / Dars</TableHead>
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
                          src={cls.cover_image}
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
                        {cls.discount_price ? (
                          <>
                            <span className="font-medium text-foreground">{formatPrice(cls.discount_price)}</span>
                            <span className="block text-xs text-muted-foreground line-through">
                              {formatPrice(cls.base_price)}
                            </span>
                          </>
                        ) : (
                          <span className="font-medium text-foreground">{formatPrice(cls.base_price)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cls.modules.length} modul &middot; {countTotalDars(cls)} dars
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={cls.status === 'published' ? 'default' : 'secondary'}
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
                          onClick={() => handleTogglePublish(cls.id)}
                          data-testid={`button-toggle-status-${cls.id}`}
                        >
                          {cls.status === 'published' ? 'Jadikan Draft' : 'Terbitkan'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled
                          title="Fitur edit kelas belum tersedia (data tiruan)"
                          data-testid={`button-edit-class-${cls.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
