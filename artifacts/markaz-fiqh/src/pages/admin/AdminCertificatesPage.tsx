import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Award, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listAllCertificatesForAdmin } from '@/lib/db';

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminCertificatesPage() {
  const [search, setSearch] = useState('');

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: listAllCertificatesForAdmin,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return certs;
    return certs.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.certificateNumber.toLowerCase().includes(q) ||
        c.classTitle.toLowerCase().includes(q),
    );
  }, [certs, search]);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">

        {/* Header info */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/20">
          <Award className="w-5 h-5 text-[hsl(var(--accent))] shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80">
            Daftar sertifikat yang telah diterbitkan otomatis. Klik baris untuk melihat sertifikat.
            Jumlah total:{' '}
            <span className="font-semibold">{certs.length}</span> sertifikat.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Semua Sertifikat</CardTitle>
            <CardDescription>{filtered.length} dari {certs.length} sertifikat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, email, nomor sertifikat, atau kelas…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                {search ? 'Tidak ada sertifikat yang cocok.' : 'Belum ada sertifikat diterbitkan.'}
              </p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">No. Sertifikat</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nama</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Kelas</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">Nilai</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden sm:table-cell">Terbit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((cert) => (
                      <tr
                        key={cert.id}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => window.open(`/sertifikat/${cert.id}`, '_blank')}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{cert.certificateNumber}</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{cert.fullName}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{cert.email}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell max-w-[200px]">
                          <span className="line-clamp-1">{cert.classTitle}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {cert.score ? (
                            <Badge variant="secondary" className="text-xs">{cert.score}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground text-xs hidden sm:table-cell whitespace-nowrap">
                          {formatTanggal(cert.issuedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
