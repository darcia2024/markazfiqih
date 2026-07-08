import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/data/mockClasses';
import { listAllInvoicesForAdmin } from '@/lib/db';

type InvoiceStatus = 'pending' | 'paid' | 'failed';
type DisplayStatus = 'pending' | 'success' | 'failed';

const TABS: { value: DisplayStatus | 'all'; label: string }[] = [
  { value: 'pending', label: 'Tertunda' },
  { value: 'success', label: 'Berhasil' },
  { value: 'failed', label: 'Gagal' },
  { value: 'all', label: 'Semua' },
];

const STATUS_BADGE: Record<DisplayStatus, { label: string; variant: 'neutral' | 'success' | 'destructive' }> = {
  pending: { label: 'Tertunda', variant: 'neutral' },
  success: { label: 'Berhasil', variant: 'success' },
  failed: { label: 'Gagal', variant: 'destructive' },
};

function toDisplayStatus(status: InvoiceStatus): DisplayStatus {
  return status === 'paid' ? 'success' : status;
}

function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<DisplayStatus | 'all'>('pending');

  const { data: invoices = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'invoices'],
    queryFn: listAllInvoicesForAdmin,
  });

  const filtered = invoices.filter((inv) =>
    activeTab === 'all' ? true : toDisplayStatus(inv.status) === activeTab,
  );
  const pendingCount = invoices.filter((inv) => inv.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Daftar Pesanan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau semua pesanan masuk dari database.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DisplayStatus | 'all')}>
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
            {isError && (
              <p className="text-center text-sm text-destructive py-8">
                Gagal memuat pesanan. Pastikan RLS admin pada tabel <code>invoices</code> sudah diaktifkan
                (lihat catatan di ringkasan Prompt 55).
              </p>
            )}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            ) : !isError && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                          Tidak ada pesanan pada kategori ini.
                        </TableCell>
                      </TableRow>
                    )}
                    {filtered.map((inv) => {
                      const displayStatus = toDisplayStatus(inv.status);
                      const itemLabel =
                        inv.items.length === 0
                          ? '-'
                          : inv.items.length === 1
                          ? inv.items[0].title
                          : `${inv.items[0].title} +${inv.items.length - 1} lainnya`;
                      return (
                        <TableRow key={inv.id} data-testid={`row-order-${inv.id}`}>
                          <TableCell>
                            <p className="text-sm font-mono text-foreground">{inv.id.slice(0, 8)}…</p>
                            <p className="text-xs text-muted-foreground">{formatOrderDate(inv.createdAt)}</p>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {inv.userId.slice(0, 8)}…
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[220px] truncate">
                            {itemLabel}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-foreground">
                            {formatPrice(inv.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={STATUS_BADGE[displayStatus].variant}
                              data-testid={`badge-order-status-${inv.id}`}
                            >
                              {STATUS_BADGE[displayStatus].label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
