import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { BookLock, LogIn } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--brand-red-tint))] p-4">
        <div className="bg-white rounded-[24px] shadow-xl p-10 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[hsl(var(--brand-red-tint))] opacity-50 pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-[hsl(var(--brand-gold-pale))] opacity-40 pointer-events-none" />

          <div className="relative z-10 mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--brand-red-hover))] flex items-center justify-center mb-6 shadow-lg">
            <BookLock className="h-9 w-9 text-white" />
          </div>

          <h2 className="font-serif text-2xl font-bold text-foreground relative z-10">
            Yuk, Masuk Dulu
          </h2>
          <p className="text-muted-foreground mt-2 mb-8 relative z-10">
            Masuk sebentar untuk lanjut menjelajahi kelas-kelas fiqih pilihanmu.
          </p>

          <Button asChild className="w-full relative z-10" size="lg">
            <Link href={`/login?redirect=${encodeURIComponent(location)}`}>
              <LogIn className="h-4 w-4 mr-2" />
              Masuk dengan Google
            </Link>
          </Button>

          <p className="text-xs text-muted-foreground/70 mt-4 relative z-10">
            Belum pernah ke sini? Akun baru otomatis dibuat saat pertama kali masuk.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
