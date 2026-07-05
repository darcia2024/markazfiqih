import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-foreground">Akses Terbatas</h2>
              <p className="text-muted-foreground">
                Halaman ini memerlukan login untuk melanjutkan.
              </p>
            </div>
            <Button asChild className="w-full" size="lg">
              <Link href={`/login?redirect=${encodeURIComponent(location)}`}>
                Masuk untuk Melanjutkan
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
