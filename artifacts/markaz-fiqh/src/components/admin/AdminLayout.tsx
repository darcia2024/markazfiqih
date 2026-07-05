import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, LayoutDashboard, GraduationCap, Receipt, Users, ExternalLink } from 'lucide-react';

const NAV_ITEMS = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Manajemen Kelas', url: '/admin/classes', icon: GraduationCap },
  { title: 'Pesanan', url: '/admin/orders', icon: Receipt },
  { title: 'Pengguna & Akses', url: '/admin/users', icon: Users },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="font-serif text-base font-bold leading-tight tracking-tight text-primary truncate">
                Markaz Fiqh
              </span>
              <span className="text-xs text-muted-foreground truncate">Panel Admin</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    item.url === '/admin' ? location === '/admin' : location.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.url} data-testid={`link-admin-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Lihat situs">
                <Link href="/" data-testid="link-admin-back-to-site">
                  <ExternalLink />
                  <span>Kembali ke Situs</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <Separator className="my-1" />
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Avatar className="h-7 w-7 border border-border">
              <AvatarImage src={user?.avatar_url} alt={user?.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {(user?.name ?? 'Admin').split(' ').map((n) => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium leading-tight truncate">{user?.name ?? 'Admin'}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email ?? 'admin@markazfiqh.id'}</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <Separator orientation="vertical" className="h-5" />
          <h1 className="font-serif text-lg font-semibold text-foreground">
            {NAV_ITEMS.find((item) =>
              item.url === '/admin' ? location === '/admin' : location.startsWith(item.url)
            )?.title ?? 'Panel Admin'}
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6 bg-muted/30 min-h-[calc(100vh-3.5rem)]">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
