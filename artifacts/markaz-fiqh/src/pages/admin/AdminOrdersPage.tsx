import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MOCK_ORDERS, formatOrderDate, type MockOrder, type OrderStatus } from '@/data/mockOrders';
import { formatPrice } from '@/data/mockClasses';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const TABS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'pending', label: 'Tertunda' },
  { value: 'success', label: 'Berhasil' },
  { value: 'failed', label: 'Gagal' },
  { value: 'all', label: 'Semua' },
];

const STATUS_BADGE: Record<OrderStatus, { label: string; variant: 'neutral' | 'success' | 'destructive' }> = {
  pending: { label: 'Tertunda', variant: 'neutral' },
  success: { label: 'Berhasil', variant: 'success' },
  failed: { label: 'Gagal', variant: 'destructive' },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<MockOrder[]>(MOCK_ORDERS);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('pending');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = orders.filter((o) => (activeTab === 'all' ? true : o.status === activeTab));
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  function handleResync(order: MockOrder) {
    setSyncingId(order.id);
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: success ? 'success' : 'failed' } : o))
      );
      setSyncingId(null);
      toast({
        title: success ? 'Sinkronisasi berhasil' : 'Sinkronisasi gagal',
        description: success
          ? `Pesanan ${order.id} kini berstatus Berhasil. Enrollment otomatis dibuat. (data tiruan)`
          : `Pesanan ${order.id} masih gagal diproses oleh Mayar. (data tiruan)`,
        variant: success ? 'default' : 'destructive',
      });
    }, 1200);
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Daftar Pesanan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau pesanan dan sinkronkan ulang pembayaran yang tertunda ke Mayar.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderStatus | 'all')}>
                <TabsList>
                  {TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} data-testid={`tab-orders-${tab.value}`}>
                      {tab.label}
                      {tab.value === 'pending' && pendingCount > 0 && (
                        <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-[10px]">
                          {pendingCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pesanan</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      Tidak ada pesanan pada kategori ini.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{order.id}</p>
                      <p className="text-xs text-muted-foreground">{formatOrderDate(order.created_at)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground">{order.user_name}</p>
                      <p className="text-xs text-muted-foreground">{order.user_email}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {order.class_title}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {formatPrice(order.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{order.payment_method}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[order.status].variant} data-testid={`badge-order-status-${order.id}`}>
                        {STATUS_BADGE[order.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status !== 'success' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={syncingId === order.id}
                          onClick={() => handleResync(order)}
                          data-testid={`button-resync-${order.id}`}
                        >
                          {syncingId === order.id ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <RefreshCw className={cn('h-4 w-4 mr-1.5')} />
                          )}
                          Sinkronkan Ulang
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Selesai</span>
                      )}
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
