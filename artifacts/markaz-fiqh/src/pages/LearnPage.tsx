import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  Video,
} from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import {
  useGetClassById,
  useGetClassDars,
  useListProgress,
  useUpdateProgress,
  type ClassDarsModule,
  type DarsItem,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListProgressQueryKey } from '@workspace/api-client-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(min: number | null) {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} jam ${m > 0 ? m + ' mnt' : ''}` : `${m} menit`;
}

// ── Flatten all dars for prev/next navigation ─────────────────────────────────
function flattenDars(modules: ClassDarsModule[]): { dars: DarsItem; module: ClassDarsModule }[] {
  return modules.flatMap((m) => m.dars.map((d) => ({ dars: d, module: m })));
}

// ── Video Placeholder ─────────────────────────────────────────────────────────
function VideoPlaceholder({ title }: { title: string }) {
  return (
    <div className="w-full bg-black">
      <div
        className="relative w-full flex items-center justify-center bg-zinc-900"
        style={{ paddingBottom: '56.25%' }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Video className="w-12 h-12 opacity-30" />
          <p className="text-sm font-medium opacity-60">{title}</p>
          <p className="text-xs opacity-40">Video akan segera tersedia</p>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({
  modules,
  classTitle,
  activeDarsId,
  completedIds,
  progressPct,
  onSelectDars,
}: {
  modules: ClassDarsModule[];
  classTitle: string;
  activeDarsId: string;
  completedIds: Set<string>;
  progressPct: number;
  onSelectDars: (id: string) => void;
}) {
  const activeModuleId = useMemo(() => {
    for (const m of modules) {
      if (m.dars.some((d) => d.id === activeDarsId)) return m.id;
    }
    return modules[0]?.id ?? '';
  }, [activeDarsId, modules]);

  const [openModules, setOpenModules] = useState<Set<string>>(
    () => new Set([activeModuleId])
  );

  const toggleModule = (id: string) =>
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const totalDars = modules.reduce((s, m) => s + m.dars.length, 0);

  return (
    <aside className="w-full lg:w-80 xl:w-96 shrink-0 border-r bg-card flex flex-col lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b space-y-3 bg-card">
        <Link
          href="/my-classes"
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Kelas Saya
        </Link>
        <div>
          <h2 className="font-serif text-sm font-bold text-foreground line-clamp-2 leading-snug">
            {classTitle}
          </h2>
        </div>
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress belajar</span>
            <span className="font-bold text-primary">{progressPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {completedIds.size} dari {totalDars} pelajaran selesai
          </p>
        </div>
      </div>

      {/* Module list (scrollable) */}
      <nav className="flex-1 overflow-y-auto py-2">
        {modules.map((mod) => {
          const isOpen = openModules.has(mod.id);
          const modCompleted = mod.dars.filter((d) => completedIds.has(d.id)).length;

          return (
            <div key={mod.id}>
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-start gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors group"
              >
                <div className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                  {mod.orderIndex}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {mod.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {modCompleted}/{mod.dars.length} selesai
                  </p>
                </div>
                <div className="shrink-0 text-muted-foreground mt-0.5">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <ul className="pb-1">
                  {mod.dars.map((dars) => {
                    const isActive = dars.id === activeDarsId;
                    const isDone = completedIds.has(dars.id);
                    return (
                      <li key={dars.id}>
                        <button
                          onClick={() => onSelectDars(dars.id)}
                          className={`w-full flex items-start gap-3 px-5 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? 'bg-primary/10 border-l-2 border-primary'
                              : 'hover:bg-muted/40 border-l-2 border-transparent'
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {isActive ? (
                              <PlayCircle className="w-4 h-4 text-primary" fill="currentColor" />
                            ) : isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`leading-snug line-clamp-2 ${
                                isActive
                                  ? 'font-semibold text-primary'
                                  : isDone
                                  ? 'text-foreground/80'
                                  : 'text-foreground/70'
                              }`}
                            >
                              {dars.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {dars.durationMinutes ?? '—'} menit
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

// ── Main Content Area ─────────────────────────────────────────────────────────
function LearnContent() {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: classDetail, isLoading: isLoadingClass } = useGetClassById(classId ?? '');
  const { data: modules = [], isLoading: isLoadingDars } = useGetClassDars(classId ?? '');
  const { data: progressItems = [], isLoading: isLoadingProgress } = useListProgress(
    user?.id ?? '',
    classId ?? '',
    { query: { enabled: !!user?.id && !!classId } },
  );
  const { mutate: updateProgress, isPending: isUpdating } = useUpdateProgress();

  const isLoading = isLoadingClass || isLoadingDars || isLoadingProgress;

  // Build Set<darsId> from progress API response
  const completedIds = useMemo(
    () => new Set(progressItems.filter((p) => p.isCompleted).map((p) => p.darsId)),
    [progressItems],
  );

  const allDars = useMemo(() => flattenDars(modules), [modules]);
  const totalDars = allDars.length;
  const progressPct = totalDars > 0 ? Math.round((completedIds.size / totalDars) * 100) : 0;

  // Default: first incomplete dars
  const [activeDarsId, setActiveDarsId] = useState<string>(() => {
    return allDars.find((e) => !completedIds.has(e.dars.id))?.dars.id ?? allDars[0]?.dars.id ?? '';
  });

  // When modules load, set activeDarsId if still empty
  const resolvedActiveDarsId =
    activeDarsId || allDars.find((e) => !completedIds.has(e.dars.id))?.dars.id || allDars[0]?.dars.id || '';

  const activeEntry = useMemo(
    () => allDars.find((e) => e.dars.id === resolvedActiveDarsId),
    [allDars, resolvedActiveDarsId],
  );
  const activeIndex = useMemo(
    () => allDars.findIndex((e) => e.dars.id === resolvedActiveDarsId),
    [allDars, resolvedActiveDarsId],
  );
  const prevEntry = activeIndex > 0 ? allDars[activeIndex - 1] : null;
  const nextEntry = activeIndex < allDars.length - 1 ? allDars[activeIndex + 1] : null;
  const isDone = completedIds.has(resolvedActiveDarsId);

  const invalidateProgress = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: getListProgressQueryKey(user?.id ?? '', classId ?? ''),
    });
  }, [queryClient, user?.id, classId]);

  const handleMarkDone = useCallback(() => {
    if (!user?.id || !resolvedActiveDarsId) return;
    updateProgress(
      { data: { userId: user.id, darsId: resolvedActiveDarsId, isCompleted: true } },
      {
        onSuccess: () => {
          invalidateProgress();
          if (nextEntry) setTimeout(() => setActiveDarsId(nextEntry.dars.id), 400);
        },
      },
    );
  }, [user?.id, resolvedActiveDarsId, updateProgress, invalidateProgress, nextEntry]);

  const handleUnmarkDone = useCallback(() => {
    if (!user?.id || !resolvedActiveDarsId) return;
    updateProgress(
      { data: { userId: user.id, darsId: resolvedActiveDarsId, isCompleted: false } },
      { onSuccess: invalidateProgress },
    );
  }, [user?.id, resolvedActiveDarsId, updateProgress, invalidateProgress]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!classDetail) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-bold">Kelas tidak ditemukan</h1>
          <Button asChild>
            <Link href="/my-classes">Kembali ke Kelas Saya</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <Sidebar
          modules={modules}
          classTitle={classDetail.title}
          activeDarsId={resolvedActiveDarsId}
          completedIds={completedIds}
          progressPct={progressPct}
          onSelectDars={setActiveDarsId}
        />

        {/* Main: Player + Info */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Video Placeholder */}
          {activeEntry && <VideoPlaceholder title={activeEntry.dars.title} />}

          {/* Info & Controls */}
          <div className="flex-1 p-6 lg:p-8 max-w-3xl space-y-5">
            {/* Breadcrumb */}
            {activeEntry && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs font-medium">
                  Modul {activeEntry.module.orderIndex}
                </Badge>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  Pelajaran {activeEntry.dars.orderIndex}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {activeEntry.dars.durationMinutes ?? '—'} menit
                </span>
              </div>
            )}

            {/* Title */}
            <motion.h1
              key={resolvedActiveDarsId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="font-serif text-2xl lg:text-3xl font-bold text-foreground leading-snug"
            >
              {activeEntry?.dars.title ?? ''}
            </motion.h1>

            <p className="text-muted-foreground leading-relaxed text-sm lg:text-base">
              Bismillah. Pada pelajaran ini Ustadz akan membahas{' '}
              <span className="lowercase">{activeEntry?.dars.title}</span> secara mendalam
              disertai dalil-dalil yang shahih dan contoh praktis.
            </p>

            {/* Mark Done + Nav */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
              {isDone ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg bg-success-pale border border-success-pale px-4 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm font-semibold text-success">Sudah Selesai</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnmarkDone}
                    disabled={isUpdating}
                    className="text-muted-foreground hover:text-foreground gap-1.5 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tandai Belum
                  </Button>
                </div>
              ) : (
                <Button onClick={handleMarkDone} disabled={isUpdating} className="gap-2">
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Tandai Selesai
                </Button>
              )}

              {/* Prev / Next */}
              <div className="flex items-center gap-2 sm:ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!prevEntry}
                  onClick={() => prevEntry && setActiveDarsId(prevEntry.dars.id)}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!nextEntry}
                  onClick={() => nextEntry && setActiveDarsId(nextEntry.dars.id)}
                  className="gap-1"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Mini nav — dars in current module */}
            {activeEntry && (
              <div className="pt-4 border-t">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Pelajaran dalam {activeEntry.module.title}
                </p>
                <ul className="space-y-1">
                  {activeEntry.module.dars.map((d) => {
                    const isThis = d.id === resolvedActiveDarsId;
                    const done = completedIds.has(d.id);
                    return (
                      <li key={d.id}>
                        <button
                          onClick={() => setActiveDarsId(d.id)}
                          className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isThis
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'hover:bg-muted/50 text-foreground/70'
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                          ) : isThis ? (
                            <PlayCircle className="w-3.5 h-3.5 shrink-0" fill="currentColor" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
                          )}
                          <span className="flex-1 line-clamp-1">{d.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {d.durationMinutes ?? '—'} mnt
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <ProtectedRoute>
      <LearnContent />
    </ProtectedRoute>
  );
}
