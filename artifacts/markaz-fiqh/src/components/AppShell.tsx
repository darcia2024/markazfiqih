import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutGrid,
  BookOpen,
  BookMarked,
  Settings,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useListEnrollments, type EnrollmentItem } from '@workspace/api-client-react';

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/katalog', label: 'Katalog Kelas', icon: LayoutGrid },
  { href: '/my-classes', label: 'Kelas Saya', icon: BookMarked },
];

// ── Progress Widget ───────────────────────────────────────────────────────
function ProgressWidget({ enrollments }: { enrollments: EnrollmentItem[] }) {
  const totalOwned = enrollments.length;
  if (totalOwned === 0) return null;

  const totalDarsAcross = enrollments.reduce((s, e) => s + e.class.totalDarsCount, 0);
  const totalDoneDars = enrollments.reduce((s, e) => s + e.class.completedDarsCount, 0);
  const overallProgress =
    totalDarsAcross > 0 ? Math.round((totalDoneDars / totalDarsAcross) * 100) : 0;

  return (
    <Link href="/dashboard">
      <div className="mx-3 rounded-[18px] bg-white/10 backdrop-blur-sm border border-white/10 p-4 space-y-3 cursor-pointer hover:bg-white/15 transition-friendly">
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">
          Progress Kamu
        </p>
        <div>
          <p className="font-serif text-2xl font-bold text-white">{overallProgress}%</p>
          <p className="text-xs text-white/60">{totalOwned} kelas dimiliki</p>
        </div>
        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────
export function AppSidebar({ isAdmin }: { isAdmin: boolean }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const initial =
    user?.nickname?.[0]?.toUpperCase() ?? user?.name?.[0]?.toUpperCase() ?? 'U';
  const displayName = user?.nickname ?? user?.name ?? 'Pengguna';

  const { data: enrollments = [] } = useListEnrollments(user?.id ?? '', {
    query: { enabled: !!user?.id },
  });

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[240px] h-full flex-col bg-gradient-to-b from-primary to-[hsl(var(--brand-red-hover))] border-r border-white/10 z-40">
      <div className="h-20 flex items-center px-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-white text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-white">
            Markaz Fiqih
          </span>
        </Link>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">
          Menu Utama
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = location === href;
          return (
            <Link
              key={href}
              href={href}
              className={
                isActive
                  ? 'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-primary bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                  : 'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 hover:scale-[1.02] transition-friendly'
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-friendly"
          >
            <Settings className="h-4 w-4" />
            Panel Admin
          </Link>
        )}
      </nav>

      <div className="pb-3">
        <ProgressWidget enrollments={enrollments} />
      </div>

      <div className="flex-1" />

      <div className="border-t border-white/20 p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white text-primary flex items-center justify-center text-sm font-semibold shrink-0 ring-2 ring-white/20">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-white/60 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="shrink-0 p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-friendly"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
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
