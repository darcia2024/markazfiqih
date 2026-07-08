import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

// ── YouTube IFrame API global type ────────────────────────────────────────────
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: any }) => void;
            onStateChange?: (event: { target: any; data: number }) => void;
            onError?: (event: { target: any; data: number }) => void;
          };
        },
      ) => {
        getCurrentTime: () => number;
        getPlaylist: () => string[] | undefined;
        cueVideoById: (videoId: string, startSeconds?: number) => void;
        seekTo: (seconds: number, allowSeekAhead: boolean) => void;
        playVideo: () => void;
        destroy: () => void;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
import { toast } from 'sonner';
import { useParams, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
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

import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FacilitasCard } from '@/components/FacilitasCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/data/mockClasses';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getClassById,
  listProgress,
  listEnrollments,
  listClasses,
  updateProgress as updateProgressFn,
  completeEnrollment as completeEnrollmentFn,
  getVideoWatchProgress,
  saveVideoWatchProgress,
} from '@/lib/db';

// ── Local types (sesuai return getClassById dari db.ts) ───────────────────────
type DarsItem = { id: string; title: string; durationMinutes: number | null; orderIndex: number };
type ClassDarsModule = { id: string; title: string; orderIndex: number; durationMinutes: number; dars: DarsItem[] };

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(min: number | null) {
  if (!min) return '-';
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

// ── Playlist Mode: helper label untuk toast resume ─────────────────────────────
function getResumeLabel(positionSeconds: number) {
  const menit = Math.floor(positionSeconds / 60);
  return menit > 0 ? `Melanjutkan dari menit ke-${menit}` : `Melanjutkan dari detik ke-${positionSeconds}`;
}

// ── Playlist Mode ─────────────────────────────────────────────────────────────
function PlaylistMode({
  classId,
  classTitle,
  classDescription,
  classCategory,
  instructorName,
  instructorBio,
  instructorPhotoUrl,
  instructorClassCount,
  playlistId,
  enrollmentId,
  initialIsCompleted,
  userId,
  gdriveMateriUrl,
  waGroupUrl,
}: {
  classId: string;
  classTitle: string;
  classDescription: string;
  classCategory: string | null;
  instructorName: string;
  instructorBio: string;
  instructorPhotoUrl: string;
  instructorClassCount: number;
  playlistId: string;
  enrollmentId: string | null;
  initialIsCompleted: boolean;
  userId: string;
  gdriveMateriUrl?: string | null;
  waGroupUrl?: string | null;
}) {
  const queryClient = useQueryClient();

  // ── YouTube IFrame API state ──
  const [ytApiReady, setYtApiReady] = useState(false);
  const playerRef = useRef<any>(null);
  const metaPlayerRef = useRef<any>(null);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndexRef = useRef(0);
  const skipNextNavRef = useRef(false);

  // ── Daftar video individual dalam playlist — didapat sekali lewat getPlaylist() ──
  const [videoIds, setVideoIds] = useState<string[] | null>(null);
  const [metaError, setMetaError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  // ── Load saved progress ──
  const { data: savedProgress, isLoading: isProgressLoading } = useQuery({
    queryKey: ['videoWatchProgress', userId, classId],
    queryFn: () => getVideoWatchProgress(userId, classId),
    enabled: !!userId && !!classId,
    staleTime: Infinity,
  });

  // ── Load YouTube IFrame API script (once, globally) ──
  useEffect(() => {
    if (window.YT?.Player) {
      setYtApiReady(true);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      setYtApiReady(true);
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  }, []);

  // ── STEP 1: baca daftar video ID individual dalam playlist (sekali saja) ──
  // CATATAN PRIVASI: untuk mendapat daftar video ID tanpa API key tambahan, kita
  // sempat memuat player dalam mode `listType: playlist` (autoplay MATI, muted)
  // hanya untuk membaca metadata lewat getPlaylist(), lalu langsung di-destroy.
  // Ini artinya ada eksposur sesaat ke metadata playlist saat player itu dimuat —
  // keterbatasan teknis yang dijelaskan lebih lanjut di laporan pengerjaan.
  useEffect(() => {
    if (!playlistId || !ytApiReady || videoIds !== null) return;

    // Reset status error tiap kali memulai siklus pengambilan metadata baru,
    // supaya tidak "nyangkut" di tampilan error kalau efek ini pernah dijalankan
    // ulang untuk playlist yang sama.
    setMetaError(false);

    let cancelled = false;
    let retried = false;
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    // Teardown idempoten: aman dipanggil berkali-kali dari onReady/onError/cleanup
    // tanpa risiko double-destroy.
    const teardown = (target: any) => {
      if (destroyed) return;
      destroyed = true;
      try {
        target?.destroy();
      } catch (_) { /* noop */ }
    };

    const readPlaylist = (event: any) => {
      if (cancelled) return;
      try {
        const ids: string[] = event.target.getPlaylist() ?? [];
        if (ids.length > 0) {
          setVideoIds(ids);
          teardown(event.target);
          return;
        }
      } catch (_) { /* fall through to retry/error below */ }

      // getPlaylist() kadang belum terisi tepat saat onReady — beri satu kali
      // kesempatan retry singkat sebelum benar-benar dianggap gagal.
      if (!retried) {
        retried = true;
        retryTimeoutId = setTimeout(() => {
          retryTimeoutId = null;
          if (cancelled) return;
          try {
            const ids: string[] = event.target.getPlaylist() ?? [];
            if (ids.length > 0) {
              setVideoIds(ids);
            } else {
              setMetaError(true);
            }
          } catch (_) {
            setMetaError(true);
          } finally {
            teardown(event.target);
          }
        }, 800);
        return;
      }

      setMetaError(true);
      teardown(event.target);
    };

    const metaPlayer = new window.YT.Player('yt-meta-container', {
      playerVars: {
        listType: 'playlist',
        list: playlistId,
        autoplay: 0,
        mute: 1,
      } as any,
      events: {
        onReady: readPlaylist,
        onError: (event: any) => {
          if (cancelled) return;
          setMetaError(true);
          teardown(event.target);
        },
      },
    });
    metaPlayerRef.current = metaPlayer;

    return () => {
      cancelled = true;
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      teardown(metaPlayerRef.current);
      metaPlayerRef.current = null;
    };
  }, [playlistId, ytApiReady, videoIds]);

  // ── Helper: flush current position to DB ──
  const flushProgress = useCallback(() => {
    const p = playerRef.current;
    if (!p || !userId || !classId) return;
    try {
      const seconds = Math.floor(p.getCurrentTime());
      if (seconds > 0) {
        saveVideoWatchProgress({
          userId,
          classId,
          videoIndex: currentIndexRef.current,
          positionSeconds: seconds,
        });
      }
    } catch (_) { /* player may already be destroyed */ }
  }, [userId, classId]);

  // ── STEP 2: buat player video TUNGGAL sekali videoIds & saved progress siap ──
  // Autoplay MATI secara eksplisit (autoplay: 0) dan tidak ada pemanggilan
  // playVideo() otomatis di manapun — video hanya mulai saat user klik tombol
  // play sendiri di player YouTube.
  useEffect(() => {
    if (!videoIds || videoIds.length === 0 || !ytApiReady || isProgressLoading || playerRef.current) {
      return;
    }

    let initialIndex = 0;
    let resumeSeconds = 0;
    if (savedProgress && savedProgress.videoIndex >= 0 && savedProgress.videoIndex < videoIds.length) {
      initialIndex = savedProgress.videoIndex;
      resumeSeconds = savedProgress.positionSeconds;
    }

    currentIndexRef.current = initialIndex;
    skipNextNavRef.current = true; // hindari efek navigasi ganda saat state ini di-set
    setCurrentIndex(initialIndex);

    const videoId = videoIds[initialIndex];
    const player = new window.YT.Player('yt-video-container', {
      videoId,
      playerVars: {
        autoplay: 0,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        fs: 1,
        playsinline: 1,
        ...(resumeSeconds > 0 ? { start: resumeSeconds } : {}),
      },
      events: {
        onReady: () => {
          if (resumeSeconds > 0) {
            toast.info(getResumeLabel(resumeSeconds), { duration: 4000 });
          }
        },
      },
    });

    playerRef.current = player;
    saveIntervalRef.current = setInterval(flushProgress, 15_000);

    return () => {
      flushProgress(); // save on unmount / re-init
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
      try {
        player.destroy();
      } catch (_) { /* noop */ }
      playerRef.current = null;
    };
  }, [videoIds, ytApiReady, isProgressLoading, savedProgress, flushProgress]);

  // ── STEP 3: pindah video saat user klik Sebelumnya/Selanjutnya/Daftar Materi ──
  // cueVideoById() memuat video BARU tanpa langsung memutar (bukan playVideo()),
  // jadi navigasi antar video juga tidak memicu autoplay.
  useEffect(() => {
    if (currentIndex === null) return;
    if (skipNextNavRef.current) {
      skipNextNavRef.current = false;
      currentIndexRef.current = currentIndex;
      return;
    }
    if (!playerRef.current || !videoIds) return;
    const videoId = videoIds[currentIndex];
    if (!videoId) return;

    flushProgress(); // simpan posisi video sebelumnya sebelum berpindah
    try {
      playerRef.current.cueVideoById(videoId, 0);
    } catch (_) { /* noop */ }
    currentIndexRef.current = currentIndex;
  }, [currentIndex, videoIds, flushProgress]);

  const goToIndex = useCallback(
    (i: number) => {
      if (!videoIds || i < 0 || i >= videoIds.length) return;
      setCurrentIndex(i);
    },
    [videoIds],
  );

  // ── Status "Kelas Selesai" — sumber kebenaran dari data enrollment server ──
  // (bukan dari mutation.isSuccess semata, supaya tidak reset ke "belum selesai"
  // saat halaman di-remount / keluar-masuk halaman)
  const [optimisticDone, setOptimisticDone] = useState(false);
  const isCompleted = initialIsCompleted || optimisticDone;

  const { mutate: completeEnrollmentMutate, isPending: isCompleting } = useMutation({
    mutationFn: (params: { enrollmentId: string }) => completeEnrollmentFn(params.enrollmentId),
    onSuccess: () => {
      setOptimisticDone(true);
      queryClient.invalidateQueries({ queryKey: ['enrollments', userId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan, coba lagi.');
    },
  });

  const { data: categoryClasses = [] } = useQuery({
    queryKey: ['classes', { category: classCategory }],
    queryFn: () => listClasses(classCategory ? { category: classCategory } : undefined),
    enabled: !!classCategory,
  });
  const relatedClasses = categoryClasses.filter((c) => c.id !== classId).slice(0, 3);

  return (
    <AppShell>
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 gap-4">
        {/* Back */}
        <Link
          href="/my-classes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kelas Saya
        </Link>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── Left: video + info ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* CATATAN: YouTube tidak mengizinkan menyembunyikan sepenuhnya opsi "Watch on
                YouTube" atau logo YouTube karena kebijakan mereka — parameter di bawah hanya
                meminimalisir distraksi/rekomendasi video lain, bukan blokir total.
                YT IFrame API dipakai supaya bisa baca/tulis posisi playback.
                Video dimuat SATU per satu (bukan mode playlist penuh) — lihat komentar
                di komponen PlaylistMode untuk detail privasi & alasan pendekatannya. */}
            <div className="w-full aspect-video rounded-[14px] overflow-hidden bg-black relative">
              {metaError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-400 px-6 text-center">
                  <Video className="w-12 h-12 opacity-30" />
                  <p className="text-sm font-medium opacity-60">
                    Gagal memuat video. Silakan reload halaman.
                  </p>
                </div>
              ) : (
                <div id="yt-video-container" className="w-full h-full" />
              )}
            </div>
            {/* Player tersembunyi, hanya dipakai sekali untuk membaca daftar video
                dalam playlist lewat getPlaylist() — tidak pernah diputar/ditampilkan. */}
            <div id="yt-meta-container" className="sr-only" aria-hidden="true" />

            {/* Navigasi antar video */}
            {videoIds && videoIds.length > 0 && currentIndex !== null && (
              <div className="bg-card rounded-2xl border p-6 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs font-medium text-primary uppercase tracking-wide">
                      Pertemuan ke-{currentIndex + 1} dari {videoIds.length}
                    </p>
                    <h2 className="font-serif text-lg font-bold text-foreground mt-0.5">
                      Pertemuan ke-{currentIndex + 1}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentIndex <= 0}
                      onClick={() => goToIndex(currentIndex - 1)}
                      className="gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentIndex >= videoIds.length - 1}
                      onClick={() => goToIndex(currentIndex + 1)}
                      className="gap-1"
                    >
                      Selanjutnya
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Daftar Materi */}
                <div className="pt-3 border-t">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Daftar Materi
                  </p>
                  <ul className="space-y-1 max-h-72 overflow-y-auto">
                    {videoIds.map((_, i) => {
                      const isActive = i === currentIndex;
                      return (
                        <li key={i}>
                          <button
                            onClick={() => goToIndex(i)}
                            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              isActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'hover:bg-muted/50 text-foreground/70'
                            }`}
                          >
                            {isActive ? (
                              <PlayCircle className="w-3.5 h-3.5 shrink-0" fill="currentColor" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
                            )}
                            <span className="flex-1">Pertemuan ke-{i + 1}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
            {!videoIds && !metaError && (
              <div className="bg-card rounded-2xl border p-6 flex items-center gap-3 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat daftar video...
              </div>
            )}

            {/* Info panel */}
            <div className="bg-card rounded-2xl border p-6 space-y-4">
              <div className="space-y-1">
                <h1 className="font-serif text-2xl font-bold text-foreground leading-snug">
                  {classTitle}
                </h1>
                <p className="text-sm text-muted-foreground">{instructorName}</p>
                {classDescription && (
                  <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                    {classDescription}
                  </p>
                )}
              </div>

              {isCompleted ? (
                <div className="inline-flex items-center gap-2 rounded-lg bg-success-pale border border-success-pale px-4 py-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  </motion.div>
                  <span className="font-semibold text-success">Kelas telah ditandai selesai</span>
                </div>
              ) : (
                <motion.div
                  className="inline-block"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    size="lg"
                    onClick={() => enrollmentId && completeEnrollmentMutate({ enrollmentId })}
                    disabled={isCompleting || !enrollmentId}
                    className="gap-2"
                  >
                    {isCompleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Tandai Kelas Selesai
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Mobile: kartu pengajar + fasilitas + kelas lain (di desktop tampil di sidebar kanan) */}
            <div className="flex flex-col gap-4 lg:hidden">
              {/* Tentang Pengajar */}
              <div className="bg-card rounded-2xl border p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground">Tentang Pengajar</p>
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={instructorPhotoUrl} alt={instructorName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {instructorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{instructorName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {instructorClassCount} kelas
                    </p>
                    {instructorBio && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {instructorBio}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fasilitas Kelas */}
              {(gdriveMateriUrl || waGroupUrl) && (
                <div className="bg-card rounded-2xl border overflow-hidden">
                  <FacilitasCard gdriveMateriUrl={gdriveMateriUrl} waGroupUrl={waGroupUrl} />
                </div>
              )}

              {/* Kelas Lainnya */}
              {classCategory && relatedClasses.length > 0 && (
                <div className="bg-card rounded-2xl border p-5 space-y-4">
                  <p className="text-sm font-semibold text-foreground">
                    Kelas Lainnya{classCategory ? `: ${classCategory}` : ''}
                  </p>
                  <div className="space-y-3">
                    {relatedClasses.map((cls) => (
                      <Link
                        key={cls.id}
                        href={`/class/${cls.id}`}
                        className="flex items-start gap-3 group"
                      >
                        <img
                          src={cls.coverImage}
                          alt={cls.title}
                          className="w-16 h-11 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                            {cls.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatPrice(cls.discountPrice ?? cls.basePrice)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar (desktop only) ── */}
          <aside className="hidden lg:flex flex-col gap-4 w-[320px] shrink-0">
            {/* Card: Tentang Pengajar */}
            <div className="bg-card rounded-2xl border p-5 space-y-3">
              <p className="text-sm font-semibold text-foreground">Tentang Pengajar</p>
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarImage src={instructorPhotoUrl} alt={instructorName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {instructorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{instructorName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {instructorClassCount} kelas
                  </p>
                  {instructorBio && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {instructorBio}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card: Fasilitas Kelas */}
            {(gdriveMateriUrl || waGroupUrl) && (
              <div className="bg-card rounded-2xl border overflow-hidden">
                <FacilitasCard gdriveMateriUrl={gdriveMateriUrl} waGroupUrl={waGroupUrl} />
              </div>
            )}

            {/* Card: Kelas Lainnya dari Kategori Sama — hanya tampil jika kelas punya kategori */}
            {classCategory && relatedClasses.length > 0 && (
              <div className="bg-card rounded-2xl border p-5 space-y-4">
                <p className="text-sm font-semibold text-foreground">
                  Kelas Lainnya{classCategory ? `: ${classCategory}` : ''}
                </p>
                <div className="space-y-3">
                  {relatedClasses.map((cls) => (
                    <Link
                      key={cls.id}
                      href={`/class/${cls.id}`}
                      className="flex items-start gap-3 group"
                    >
                      <img
                        src={cls.coverImage}
                        alt={cls.title}
                        className="w-16 h-11 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {cls.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatPrice(cls.discountPrice ?? cls.basePrice)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
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
                className="w-full flex items-start gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors duration-150 group"
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
                          className={`w-full flex items-start gap-3 px-5 py-2.5 text-left text-sm transition-colors duration-150 ${
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
                              {dars.durationMinutes ?? '-'} menit
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

  const { data: classDetail, isLoading: isLoadingClass } = useQuery({
    queryKey: ['class', classId],
    queryFn: () => getClassById(classId!),
    enabled: !!classId,
  });

  // modules langsung dari classDetail — tidak perlu query terpisah
  const modules = classDetail?.modules ?? [];

  const { data: progressItems = [], isLoading: isLoadingProgress } = useQuery({
    queryKey: ['progress', user?.id, classId],
    queryFn: () => listProgress(user!.id, classId!),
    enabled: !!user?.id && !!classId,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => listEnrollments(user!.id),
    enabled: !!user?.id,
  });

  const { mutate: updateProgressMutate, isPending: isUpdating } = useMutation({
    mutationFn: updateProgressFn,
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan, coba lagi.');
    },
  });

  const isLoading = isLoadingClass || isLoadingProgress;

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
      queryKey: ['progress', user?.id, classId],
    });
  }, [queryClient, user?.id, classId]);

  const handleMarkDone = useCallback(() => {
    if (!user?.id || !resolvedActiveDarsId) return;
    updateProgressMutate(
      { userId: user.id, darsId: resolvedActiveDarsId, isCompleted: true },
      {
        onSuccess: () => {
          invalidateProgress();
          if (nextEntry) setTimeout(() => setActiveDarsId(nextEntry.dars.id), 400);
        },
      },
    );
  }, [user?.id, resolvedActiveDarsId, updateProgressMutate, invalidateProgress, nextEntry]);

  const handleUnmarkDone = useCallback(() => {
    if (!user?.id || !resolvedActiveDarsId) return;
    updateProgressMutate(
      { userId: user.id, darsId: resolvedActiveDarsId, isCompleted: false },
      { onSuccess: invalidateProgress },
    );
  }, [user?.id, resolvedActiveDarsId, updateProgressMutate, invalidateProgress]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!classDetail) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-bold">Kelas tidak ditemukan</h1>
          <motion.div
            className="inline-block"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Button asChild>
              <Link href="/my-classes">Kembali ke Kelas Saya</Link>
            </Button>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  // ── Playlist mode: class has a YouTube playlist but no module/dars data ──────
  const isPlaylistMode = !!(classDetail.youtubePlaylistId && classDetail.modules.length === 0);

  if (isPlaylistMode) {
    const enrollment = enrollments.find((e) => e.class.id === classId) ?? null;
    return (
      <PlaylistMode
        key={classId}
        classId={classId!}
        classTitle={classDetail.title}
        classDescription={classDetail.description}
        classCategory={classDetail.category}
        instructorName={classDetail.instructor.name}
        instructorBio={classDetail.instructor.bio}
        instructorPhotoUrl={classDetail.instructor.photoUrl}
        instructorClassCount={classDetail.instructor.classCount}
        playlistId={classDetail.youtubePlaylistId!}
        enrollmentId={enrollment?.id ?? null}
        initialIsCompleted={enrollment?.isCompleted ?? false}
        userId={user?.id ?? ''}
        gdriveMateriUrl={classDetail.gdriveMateriUrl}
        waGroupUrl={classDetail.waGroupUrl}
      />
    );
  }

  // ── No content: kelas sudah published tapi belum ada modul/dars maupun playlist ──
  const hasNoContent = !classDetail.youtubePlaylistId && classDetail.modules.length === 0;

  if (hasNoContent) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center px-4 py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground" />
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Materi Belum Tersedia
            </h1>
            <p className="text-muted-foreground mt-2 max-w-md">
              Kelas &ldquo;{classDetail.title}&rdquo; sudah bisa kamu akses, tapi materinya
              sedang disiapkan oleh pengajar. Kami akan kabari begitu materi
              sudah bisa ditonton.
            </p>
          </div>
          <motion.div
            className="inline-block"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Button asChild variant="outline">
              <Link href="/my-classes">Kembali ke Kelas Saya</Link>
            </Button>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  // ── Normal mode: existing modul/dars breakdown ────────────────────────────────
  return (
    <AppShell>
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar — di desktop tampil di kiri, di mobile tampil di bawah konten */}
        <div className="order-2 lg:order-1 w-full lg:w-auto">
          <Sidebar
            modules={modules}
            classTitle={classDetail.title}
            activeDarsId={resolvedActiveDarsId}
            completedIds={completedIds}
            progressPct={progressPct}
            onSelectDars={setActiveDarsId}
          />
        </div>

        {/* Main: Player + Info */}
        <main className="order-1 lg:order-2 flex-1 min-w-0 flex flex-col">
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
                  {activeEntry.dars.durationMinutes ?? '-'} menit
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
                  <AnimatePresence>
                    <motion.div
                      key="done-badge"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      className="flex items-center gap-2 rounded-lg bg-success-pale border border-success-pale px-4 py-2.5"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10, delay: 0.05 }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      </motion.div>
                      <span className="text-sm font-semibold text-success">Sudah Selesai</span>
                    </motion.div>
                  </AnimatePresence>
                  <motion.div
                    className="inline-block"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
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
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  className="inline-block"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button onClick={handleMarkDone} disabled={isUpdating} className="gap-2">
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Tandai Selesai
                  </Button>
                </motion.div>
              )}

              {/* Prev / Next */}
              <div className="flex items-center gap-2 sm:ml-auto">
                <motion.div
                  className="inline-block"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
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
                </motion.div>
                <motion.div
                  className="inline-block"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
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
                </motion.div>
              </div>
            </div>

            {/* Fasilitas Kelas */}
            {(classDetail.gdriveMateriUrl || classDetail.waGroupUrl) && (
              <div className="pt-4 border-t">
                <FacilitasCard
                  gdriveMateriUrl={classDetail.gdriveMateriUrl}
                  waGroupUrl={classDetail.waGroupUrl}
                />
              </div>
            )}

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
                            {d.durationMinutes ?? '-'} mnt
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
    </AppShell>
  );
}

export default function LearnPage() {
  return (
    <ProtectedRoute>
      <LearnContent />
    </ProtectedRoute>
  );
}
