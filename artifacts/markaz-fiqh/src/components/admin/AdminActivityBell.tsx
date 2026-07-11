import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, CreditCard, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { listAdminActivity } from '@/lib/db';

const TYPE_ICON: Record<string, React.ElementType> = {
  payment: CreditCard,
  review: Star,
};

const TYPE_LABEL: Record<string, string> = {
  payment: 'Pembayaran',
  review: 'Review',
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function AdminActivityBell() {
  const [open, setOpen] = useState(false);

  const { data: activities = [] } = useQuery({
    queryKey: ['admin-activity-log'],
    queryFn: listAdminActivity,
    refetchInterval: 60_000, // polling tiap 1 menit
  });

  // Badge: jumlah aktivitas dalam 24 jam terakhir
  const recentCount = activities.filter((a) => {
    const ageMs = Date.now() - new Date(a.createdAt).getTime();
    return ageMs < 24 * 60 * 60 * 1000;
  }).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full relative"
          aria-label="Aktivitas terbaru"
        >
          <Activity className="h-5 w-5 text-muted-foreground" />
          {recentCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center">
              {recentCount > 9 ? '9+' : recentCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-96 overflow-y-auto">
        <div className="p-3 border-b">
          <p className="text-sm font-semibold">Aktivitas Terbaru</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pembayaran & review yang masuk otomatis
          </p>
        </div>
        {activities.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">
            Belum ada aktivitas tercatat.
          </p>
        ) : (
          <div className="divide-y">
            {activities.map((a) => {
              const Icon = TYPE_ICON[a.type] ?? Activity;
              return (
                <div key={a.id} className="p-3 flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0 rounded-full bg-muted p-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {TYPE_LABEL[a.type] ?? a.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatRelativeTime(a.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-snug">{a.title}</p>
                    {a.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
