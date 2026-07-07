import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';

export function RequireAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    // Belum login sama sekali → ke halaman login
    window.location.replace(`/login?redirect=${encodeURIComponent(location)}`);
    return null;
  }

  if (!user.isAdmin) {
    // Sudah login tapi bukan admin → ke beranda
    window.location.replace('/');
    return null;
  }

  return <>{children}</>;
}
