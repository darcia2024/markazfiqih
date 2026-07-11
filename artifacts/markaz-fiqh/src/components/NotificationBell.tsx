import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/context/AuthContext';
import { listNotifications, markAllNotificationsRead } from '@/lib/db';

const TYPE_LABEL: Record<string, string> = {
  info: 'Info',
  promo: 'Promo',
  kelas_baru: 'Kelas Baru',
};

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => listNotifications(user!.id),
    enabled: !!user?.id,
    refetchInterval: 60_000, // polling ringan tiap 1 menit
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id, notifications.filter((n) => !n.isRead).map((n) => n.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && unreadCount > 0) markAllMutation.mutate();
  }

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Notifikasi">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-96 overflow-y-auto">
        <div className="p-3 border-b">
          <p className="text-sm font-semibold">Notifikasi</p>
        </div>
        {notifications.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">Belum ada notifikasi.</p>
        ) : (
          <div className="divide-y">
            {notifications.map((n) => (
              <div key={n.id} className={`p-3 ${!n.isRead ? 'bg-[hsl(var(--brand-red-tint))]' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {TYPE_LABEL[n.type] ?? n.type}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
