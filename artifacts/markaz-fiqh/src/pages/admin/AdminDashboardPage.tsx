import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Receipt, Users, AlertCircle } from 'lucide-react';

const SUMMARY_CARDS = [
  { title: 'Total Kelas', value: '6', icon: GraduationCap, hint: '5 Published, 1 Draft' },
  { title: 'Pesanan Tertunda', value: '3', icon: AlertCircle, hint: 'Perlu sinkronisasi ulang' },
  { title: 'Total Pesanan', value: '128', icon: Receipt, hint: 'Bulan ini' },
  { title: 'Pengguna Terdaftar', value: '412', icon: Users, hint: 'Total akun aktif' },
];

export default function AdminDashboardPage() {
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
          {SUMMARY_CARDS.map((card) => (
            <Card key={card.title} data-testid={`card-summary-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-serif">Mulai Cepat</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Panel admin ini masih dalam tahap tampilan dasar (data tiruan). Halaman berikut sudah tersedia melalui menu di samping:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Manajemen Kelas — kelola daftar kelas dan status publikasinya</li>
              <li>Pesanan — pantau pesanan yang berstatus tertunda</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
