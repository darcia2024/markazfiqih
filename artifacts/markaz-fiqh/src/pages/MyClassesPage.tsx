import React from 'react';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { PlayCircle } from 'lucide-react';

export default function MyClassesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-12">
          <div className="space-y-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">Kelas Saya</h1>
              <p className="text-muted-foreground mt-2">Lanjutkan perjalanan menuntut ilmu Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Fiqih Thaharah Dasar</CardTitle>
                  <CardDescription>Progress Pembelajaran</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">3 dari 12 Modul diselesaikan</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" variant="default">
                    <Link href="/learn/f-101" className="flex items-center justify-center gap-2">
                      <PlayCircle className="h-4 w-4" /> Lanjutkan Belajar
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-dashed border-2 bg-muted/30 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <PlayCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Tambah Kelas Baru</h3>
                  <p className="text-sm text-muted-foreground mt-1">Eksplorasi katalog untuk menemukan kelas lainnya.</p>
                </div>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/">Lihat Katalog</Link>
                </Button>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
