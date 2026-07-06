import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { LayoutGrid, BookOpen, BookMarked, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ── Sidebar ──────────────────────────────────────────────────────────────
export function AppSidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[240px] flex-col bg-card border-r border-border z-40">
      <div className="h-20 flex items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-primary">
            Markaz Fiqih
          </span>
        </Link>
        {/* Logo tetap mengarah ke landing page ("/") */}
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-l-[3px] border-transparent -ml-3 pl-[9px]"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/katalog"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-primary bg-primary/5 border-l-[3px] border-primary -ml-3 pl-[9px]"
        >
          <LayoutGrid className="h-4 w-4" />
          Katalog Kelas
        </Link>
        <Link
          href="/my-classes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-l-[3px] border-transparent -ml-3 pl-[9px]"
        >
          <BookMarked className="h-4 w-4" />
          Kelas Saya
        </Link>
      </nav>

      {isAdmin && (
        <div className="px-3 py-4 border-t border-border">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-l-[3px] border-transparent -ml-3 pl-[9px]"
          >
            <Settings className="h-4 w-4" />
            Panel Admin
          </Link>
        </div>
      )}
    </aside>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────
export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isAdmin = Boolean(user && (user as { role?: string }).role === 'admin');

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar isAdmin={isAdmin} />
      <div className="lg:pl-[240px] min-h-screen flex flex-col">{children}</div>
    </div>
  );
}
