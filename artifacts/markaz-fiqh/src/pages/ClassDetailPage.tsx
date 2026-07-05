import React from 'react';
import { Navbar } from '@/components/Navbar';
import { useParams, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, Users } from 'lucide-react';

export default function ClassDetailPage() {
  const { id } = useParams();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Katalog
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                Detail Kelas: {id?.toUpperCase()}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Ini adalah halaman detail untuk kelas fiqih yang dipilih. Kelas ini dirancang khusus untuk memberikan pemahaman yang komprehensif dari kitab-kitab muktamad dengan penjelasan yang relevan untuk masa kini.
              </p>
            </div>

            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img 
                src="https://images.unsplash.com/photo-1577900232427-18219b9166a0?auto=format&fit=crop&q=80&w=1200&h=800" 
                alt="Class Preview" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-bold">Apa yang akan dipelajari?</h2>
              <ul className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <li key={item} className="flex gap-3 text-muted-foreground">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary/40 shrink-0" />
                    <span>Materi pelajaran terstruktur bagian {item} dengan rujukan yang jelas dan dapat dipertanggungjawabkan.</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-sm space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Investasi Ilmu</p>
                <p className="text-3xl font-bold text-primary">Rp 200.000</p>
              </div>

              <div className="space-y-4 py-4 border-y">
                <div className="flex items-center gap-3 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>12 Modul Pembelajaran</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Akses Selamanya</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Grup Diskusi Santri</span>
                </div>
              </div>

              <Button asChild className="w-full" size="lg">
                <Link href="/checkout">Daftar Sekarang</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
