import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, Receipt, Users, AlertCircle } from 'lucide-react';
import { getAdminDashboardSummary } from '@/lib/db';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'summary'],
    queryFn: getAdminDashboardSummary,
  });

  const cards = [
    {
      title: 'Total Kelas',
      value: data?.totalClasses ?? 0,
      icon: GraduationCap,
      hint: data
        ? `${data.publishedClasses} Published, ${data.draftClasses} Draft`
        : '-',
    },
    {
      title: 'Pesanan Tertunda',
      value: data?.pendingOrders ?? 0,
      icon: AlertCircle,
      hint: data?.pendingOrders ? 'Perlu ditindaklanjuti' : 'Tidak ada pesanan tertunda',
    },
    {
      title: 'Total Pesanan Lunas',
      value: data?.totalPaidOrders ?? 0,
      icon: Receipt,
      hint: 'Akumulasi sejak awal',
    },
    {
      title: 'Pengguna Terdaftar',
      value: data?.totalUsers ?? 0,
      icon: Users,
      hint: 'Total akun aktif',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Selamat Datang, Admin</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan operasional Markaz Fiqh. Gunakan menu di samping untuk mengelola kelas dan pesanan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Card
              key={card.title}
              data-testid={`card-summary-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-28" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-foreground">
                      {card.value.toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{card.hint}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-serif">Mulai Cepat</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Gunakan menu di samping untuk mengelola konten platform:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Manajemen Kelas: kelola daftar kelas dan status publikasinya</li>
              <li>Pesanan: pantau pesanan dari database</li>
              <li>Pengajar: tambah dan kelola data instruktur</li>
              <li>Testimoni: kelola testimoni pelajar di halaman utama</li>
              <li>Pengaturan: konfigurasi informasi situs</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
