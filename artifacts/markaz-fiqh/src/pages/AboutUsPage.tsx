import { motion } from 'framer-motion';
import { Loader2, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getSettings } from '@/lib/db';

const FALLBACK_CONTENT = `Markaz Fiqih adalah lembaga keilmuan independen yang berfokus pada edukasi, publikasi, kaderisasi dan pengembangan kajian fiqih. Dirintis oleh pelajar Indonesia yang menempuh studi langsung di Al-Azhar, Kairo, kami hadir agar siapa pun bisa mempelajari fiqih dengan metode yang tepat dan terstruktur.

Markaz Fiqih berpijak pada fiqih madzhab Syafi'i yang solutif, dengan tetap terbuka terhadap pendapat madzhab lain selama termasuk pendapat yang mu'tabar, diakui validitasnya dalam tradisi keilmuan Islam.

Urutan rujukan yang kami pegang:
1. Pendapat mu'tamad dalam madzhab Syafi'i
2. Pendapat dha'if dalam madzhab Syafi'i
3. Ikhtiyar para ulama madzhab Syafi'i
4. Pendapat mu'tabar dari madzhab-madzhab fiqih lainnya (khususnya empat madzhab)`;

function AboutUsContent() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const content = settings?.aboutUsContent?.trim() || FALLBACK_CONTENT;

  return (
    <AppShell>
      {/* Page header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-2 shrink-0">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--accent))] mb-2">
            Tentang Kami
          </p>
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-foreground">
            Tentang Markaz Fiqih
          </h1>
        </motion.div>
      </div>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl py-8 lg:py-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border bg-card shadow-sm p-6 sm:p-8"
          >
            <div className="flex items-center gap-2 mb-6 text-[hsl(var(--accent))]">
              <BookOpen className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Profil Lembaga
              </span>
            </div>
            <div className="text-foreground/90 text-base leading-relaxed whitespace-pre-line space-y-4">
              {content}
            </div>
          </motion.div>
        )}
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 Markaz Fiqh. Semua Hak Dilindungi.
      </footer>
    </AppShell>
  );
}

export default function AboutUsPage() {
  return (
    <ProtectedRoute>
      <AboutUsContent />
    </ProtectedRoute>
  );
}
