import React from 'react';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl py-16">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-8 text-center space-y-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CreditCard className="h-10 w-10 text-primary" />
            </div>
            
            <div className="space-y-3">
              <h1 className="font-serif text-3xl font-bold">Checkout Kelas</h1>
              <p className="text-muted-foreground text-lg">
                Halaman ini adalah placeholder untuk proses pembayaran kelas.
              </p>
            </div>

            <div className="rounded-lg bg-muted p-6 text-left space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="font-medium text-foreground">Fiqih Shalat Kontemporer</h3>
                  <p className="text-sm text-muted-foreground">Akses Selamanya</p>
                </div>
                <span className="font-semibold">Rp 200.000</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg pt-2">
                <span>Total</span>
                <span className="text-primary">Rp 200.000</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline">
                <Link href="/">Kembali</Link>
              </Button>
              <Button asChild size="lg" className="gap-2">
                <Link href="/my-classes">
                  <CheckCircle2 className="h-5 w-5" /> Simulasi Bayar
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
