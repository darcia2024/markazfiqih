import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const [location, setLocation] = useLocation();

  // Extract redirect url if available
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (!isLoading && user) {
      setLocation(redirectUrl);
    }
  }, [user, isLoading, setLocation, redirectUrl]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:flex-1 bg-primary flex-col justify-between p-12 text-primary-foreground relative overflow-hidden">
        {/* Abstract pattern / decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="islamic-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
                <circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#islamic-pattern)"/>
          </svg>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary-foreground text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight">Markaz Fiqh</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <h1 className="font-serif text-5xl font-medium leading-tight">
            Ilmu Fiqih,<br />Tersusun Rapi.
          </h1>
          <p className="text-lg text-primary-foreground/80 font-medium">
            Mempelajari tuntunan agama dari sumber terpercaya dengan pendekatan kurikulum modern dan terstruktur.
          </p>
        </div>
        
        <div className="relative z-10">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} Markaz Fiqh. Semua Hak Dilindungi.
          </p>
        </div>
      </div>

      {/* Login Side */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-primary">Markaz Fiqh</span>
            </div>
            
            <h2 className="font-serif text-3xl font-bold text-foreground">Selamat Datang</h2>
            <p className="text-muted-foreground">
              Masuk ke akun Anda untuk melanjutkan pembelajaran.
            </p>
          </div>

          <div className="space-y-6 pt-4">
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full h-12 text-base font-medium flex items-center justify-center gap-3"
              onClick={() => login(redirectUrl)}
            >
              <FcGoogle className="h-6 w-6" />
              Masuk dengan Google
            </Button>

            <p className="text-center text-sm text-muted-foreground px-4">
              Dengan masuk, kamu setuju dengan{' '}
              <a href="#" className="underline underline-offset-4 hover:text-primary">
                syarat layanan
              </a>{' '}
              kami.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
