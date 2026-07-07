import React from 'react';
import { Link } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookOpen, ShoppingCart } from 'lucide-react';

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary to-[hsl(var(--brand-red-hover))]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-white text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-white">Markaz Fiqh</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/katalog" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                Katalog
              </Link>
              <Link href="/my-classes" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                Kelas Saya
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {!isLoading && user && (
              <Link
                href="/keranjang"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-friendly"
                aria-label="Keranjang"
              >
                <ShoppingCart className="h-5 w-5" />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[hsl(var(--brand-gold))] px-1 text-[10px] font-bold leading-none text-white"
                    >
                      {count > 9 ? '9+' : count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}
            {!isLoading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
                      <Avatar className="h-9 w-9 border border-white/20">
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                        <AvatarFallback className="bg-white text-primary">
                          {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/my-classes" className="cursor-pointer">Kelas Saya</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => logout()}>
                      Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild className="font-medium bg-white text-primary hover:bg-white/90">
                  <Link href="/login">Masuk</Link>
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
