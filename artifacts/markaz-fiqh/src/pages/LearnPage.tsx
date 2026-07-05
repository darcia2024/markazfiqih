import React from 'react';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useParams, Link } from 'wouter';
import { ArrowLeft, PlayCircle, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LearnPage() {
  const { classId } = useParams();

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-1 flex flex-col lg:flex-row">
          {/* Sidebar Modules */}
          <div className="w-full lg:w-80 border-r bg-muted/30 lg:h-[calc(100vh-4rem)] flex flex-col">
            <div className="p-4 border-b">
              <Link href="/my-classes" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Link>
              <h2 className="font-serif text-lg font-bold">Daftar Modul</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {[1, 2, 3, 4, 5].map((mod) => (
                <button 
                  key={mod}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                    mod === 1 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                  }`}
                >
                  {mod === 1 ? (
                    <PlayCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className={`h-5 w-5 shrink-0 mt-0.5 ${mod < 3 ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  )}
                  <div>
                    <p className={`font-medium text-sm ${mod === 1 ? 'text-primary-foreground' : ''}`}>
                      Modul {mod}: Pengantar Materi
                    </p>
                    <p className={`text-xs mt-1 ${mod === 1 ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      15:00 menit
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Video / Content Area */}
          <div className="flex-1 flex flex-col">
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <div className="text-center text-white/50 space-y-4">
                <PlayCircle className="h-16 w-16 mx-auto opacity-50" />
                <p>Video Player Placeholder</p>
              </div>
            </div>
            
            <div className="flex-1 p-6 lg:p-10 max-w-4xl">
              <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                <FileText className="h-4 w-4" />
                <span>Modul 1</span>
              </div>
              <h1 className="font-serif text-3xl font-bold mb-6">Pengantar Materi {classId}</h1>
              
              <div className="prose prose-slate max-w-none text-muted-foreground">
                <p>
                  Bismillah. Pada modul pertama ini, kita akan membahas definisi secara bahasa dan istilah, 
                  serta kedudukan materi ini dalam syariat Islam.
                </p>
                <p>
                  Pastikan Anda mencatat poin-poin penting. Keberkahan ilmu ada pada mengikatnya dengan tulisan.
                </p>
              </div>

              <div className="mt-12 flex justify-end">
                <Button>Tandai Selesai & Lanjut</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
