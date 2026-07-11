import { useEffect, useState } from 'react';

function extractPlaylistId(input: string): string {
  const trimmed = input.trim();
  // Kalau bukan URL (tidak ada "youtube.com" atau "youtu.be"),
  // anggap sudah ID mentah, kembalikan apa adanya
  if (!trimmed.includes('youtube.com') && !trimmed.includes('youtu.be')) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    const listParam = url.searchParams.get('list');
    return listParam ?? trimmed;
  } catch {
    // URL tidak valid/gagal di-parse, kembalikan input asli supaya
    // tidak silently menghilangkan data yang diketik admin
    return trimmed;
  }
}
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, Loader2, Wand2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadField } from '@/components/ImageUploadField';
import { formatPrice } from '@/pages/CatalogPage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listClasses,
  listAllInstructorsForAdmin,
  listAllEbooksForAdmin,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassMeetingTitles,
  upsertClassMeetingTitle,
  bulkUpdateDarsVideos,
} from '@/lib/db';

type ClassSummary = Awaited<ReturnType<typeof listClasses>>[0];
type ClassDetail = Awaited<ReturnType<typeof getClassById>>;

// ─── Auto-Match Playlist Dialog ───────────────────────────────────────────────
type DarsForMatch = { id: string; title: string; moduleTitle: string };
type MatchRow = { videoId: string; videoTitle: string; assignedDarsId: string };

async function ensureYtApi(): Promise<void> {
  if ((window as any).YT?.Player) return;
  return new Promise<void>((resolve) => {
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(); };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  });
}

async function fetchOEmbedTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${videoId}&format=json`,
    );
    if (!res.ok) return videoId;
    const data = await res.json();
    return (data.title as string | undefined) ?? videoId;
  } catch {
    return videoId;
  }
}

function AutoMatchPlaylistDialog({
  open,
  onClose,
  darsList,
  onApplied,
}: {
  open: boolean;
  onClose: () => void;
  darsList: DarsForMatch[];
  onApplied: () => void;
}) {
  const [playlistInput, setPlaylistInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchRows, setMatchRows] = useState<MatchRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setPlaylistInput('');
      setError(null);
      setMatchRows([]);
      setIsLoading(false);
      setIsSaving(false);
    }
  }, [open]);

  function matchDars(videoTitle: string): string {
    const norm = (s: string) => s.trim().toLowerCase();
    const vt = norm(videoTitle);
    const exact = darsList.find((d) => norm(d.title) === vt);
    if (exact) return exact.id;
    const partial = darsList.find(
      (d) => vt.includes(norm(d.title)) || norm(d.title).includes(vt),
    );
    return partial?.id ?? '';
  }

  async function fetchAndMatch() {
    const playlistId = extractPlaylistId(playlistInput.trim());
    if (!playlistId) {
      setError('Masukkan link atau ID playlist YouTube yang valid.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setMatchRows([]);

    try {
      // Step 1: load YT API if not already loaded
      await ensureYtApi();

      // Step 2: baca daftar video ID dari playlist lewat hidden YT player
      const videoIds = await new Promise<string[]>((resolve, reject) => {
        const container = document.getElementById('admin-yt-meta-container');
        if (!container) { reject(new Error('Container player tidak ditemukan.')); return; }

        let done = false;
        let retried = false;

        const tryRead = (target: any): boolean => {
          try {
            const ids: string[] = target.getPlaylist() ?? [];
            if (ids.length > 0) {
              done = true;
              try { target.destroy(); } catch (_) {}
              resolve(ids);
              return true;
            }
          } catch (_) {}
          return false;
        };

        (window as any).YT.Player('admin-yt-meta-container', {
          playerVars: { listType: 'playlist', list: playlistId, autoplay: 0, mute: 1 },
          events: {
            onReady: (event: any) => {
              if (tryRead(event.target)) return;
              if (!retried) {
                retried = true;
                setTimeout(() => {
                  if (done) return;
                  if (!tryRead(event.target)) {
                    done = true;
                    try { event.target.destroy(); } catch (_) {}
                    reject(new Error('Tidak bisa membaca daftar video. Pastikan playlist bersifat publik.'));
                  }
                }, 1200);
              }
            },
            onError: (event: any) => {
              if (!done) {
                done = true;
                try { event.target.destroy(); } catch (_) {}
                reject(new Error('Gagal memuat playlist. Pastikan playlist bersifat publik dan ID-nya benar.'));
              }
            },
          },
        });
      });

      // Step 3: ambil judul tiap video via oEmbed (batch 5 paralel)
      const BATCH = 5;
      const titled: { id: string; title: string }[] = [];
      for (let i = 0; i < videoIds.length; i += BATCH) {
        const batch = videoIds.slice(i, i + BATCH);
        const results = await Promise.all(
          batch.map(async (id) => ({ id, title: await fetchOEmbedTitle(id) })),
        );
        titled.push(...results);
      }

      // Step 4: auto-match ke dars
      const rows: MatchRow[] = titled.map(({ id, title }) => ({
        videoId: id,
        videoTitle: title,
        assignedDarsId: matchDars(title),
      }));

      setMatchRows(rows);
      if (rows.length === 0) setError('Playlist tidak mengandung video.');
    } catch (err: any) {
      setError(err?.message ?? 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }

  async function applyMatches() {
    const updates = matchRows
      .filter((r) => r.assignedDarsId)
      .map((r) => ({ darsId: r.assignedDarsId, youtubeVideoId: r.videoId }));

    if (updates.length === 0) {
      toast({ title: 'Tidak ada pasangan yang dipilih', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      await bulkUpdateDarsVideos(updates);
      toast({ title: `${updates.length} dars berhasil di-assign video` });
      onApplied();
      onClose();
    } catch (err: any) {
      toast({ title: 'Gagal menyimpan', description: err?.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  const matchedCount = matchRows.filter((r) => r.assignedDarsId).length;

  return (
    <>
      {/* Hidden container untuk YT player — selalu ada di DOM saat komponen ini mounted */}
      <div
        id="admin-yt-meta-container"
        style={{ position: 'fixed', left: -9999, top: -9999, width: 1, height: 1, overflow: 'hidden' }}
        aria-hidden="true"
      />
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Auto-Match Video dari Playlist YouTube</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Masukkan link playlist YouTube. Sistem akan mengambil semua video beserta judulnya,
              lalu mencocokkannya otomatis ke dars yang sudah ada berdasarkan kemiripan judul.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="https://youtube.com/playlist?list=PL... atau ID playlist"
                value={playlistInput}
                onChange={(e) => setPlaylistInput(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="button" onClick={fetchAndMatch} disabled={isLoading || !playlistInput.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                {isLoading ? 'Memuat...' : 'Ambil & Cocokkan'}
              </Button>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
            )}

            {matchRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Hasil: {matchedCount} dari {matchRows.length} video berhasil dicocokkan
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sesuaikan via dropdown jika ada yang salah, atau kosongkan untuk melewati video tersebut.
                  </p>
                </div>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[45%]">Judul Video (dari YouTube)</TableHead>
                        <TableHead>Dars yang Cocok</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matchRows.map((row, i) => (
                        <TableRow key={row.videoId}>
                          <TableCell className="text-sm py-2 align-top">
                            <a
                              href={`https://youtube.com/watch?v=${row.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline line-clamp-2 text-xs"
                            >
                              {row.videoTitle}
                            </a>
                          </TableCell>
                          <TableCell className="py-2">
                            <Select
                              value={row.assignedDarsId || '__none__'}
                              onValueChange={(v) =>
                                setMatchRows((prev) =>
                                  prev.map((r, j) =>
                                    j === i ? { ...r, assignedDarsId: v === '__none__' ? '' : v } : r,
                                  ),
                                )
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Pilih dars..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">
                                  <span className="text-muted-foreground">— Lewati video ini —</span>
                                </SelectItem>
                                {darsList.map((d) => (
                                  <SelectItem key={d.id} value={d.id}>
                                    {d.moduleTitle} › {d.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            {matchRows.length > 0 && (
              <Button type="button" onClick={applyMatches} disabled={isSaving || matchedCount === 0}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Terapkan ({matchedCount} dars)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type MeetingTitleRow = { videoIndex: number; title: string; description: string };

type ClassFormState = {
  title: string;
  description: string;
  coverImage: string;
  basePrice: string;
  discountPrice: string;
  status: 'draft' | 'published';
  level: 'pemula' | 'menengah' | 'lanjutan' | '';
  category: string;
  instructorId: string;
  youtubePlaylistId: string;
  gdriveMateriUrl: string;
  waGroupUrl: string;
  soalLatihanUrl: string;
  ebookUrl: string;
  relatedEbookId: string | null;
  testimoniFormUrl: string;
  meetingCount: string;
  displayOrder: string;
  reverseVideoOrder: boolean;
};

const EMPTY_FORM: ClassFormState = {
  title: '',
  description: '',
  coverImage: '',
  basePrice: '',
  discountPrice: '',
  status: 'draft',
  level: '',
  category: '',
  instructorId: '',
  youtubePlaylistId: '',
  gdriveMateriUrl: '',
  waGroupUrl: '',
  soalLatihanUrl: '',
  ebookUrl: '',
  relatedEbookId: null,
  testimoniFormUrl: '',
  meetingCount: '',
  displayOrder: '0',
  reverseVideoOrder: false,
};

function classToForm(cls: ClassDetail): ClassFormState {
  return {
    title: cls.title,
    description: cls.description,
    coverImage: cls.coverImage,
    basePrice: String(cls.basePrice),
    discountPrice: cls.discountPrice != null ? String(cls.discountPrice) : '',
    status: cls.status,
    level: (cls.level ?? '') as ClassFormState['level'],
    category: cls.category ?? '',
    instructorId: cls.instructor.id,
    youtubePlaylistId: cls.youtubePlaylistId ?? '',
    gdriveMateriUrl: cls.gdriveMateriUrl ?? '',
    waGroupUrl: cls.waGroupUrl ?? '',
    soalLatihanUrl: cls.soalLatihanUrl ?? '',
    ebookUrl: cls.ebookUrl ?? '',
    relatedEbookId: cls.relatedEbook?.id ?? null,
    testimoniFormUrl: cls.testimoniFormUrl ?? '',
    meetingCount: cls.meetingCount != null ? String(cls.meetingCount) : '',
    displayOrder: String(cls.displayOrder ?? 0),
    reverseVideoOrder: cls.reverseVideoOrder ?? false,
  };
}

export default function AdminClassesPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSummary | null>(null);
  const [form, setForm] = useState<ClassFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ClassSummary | null>(null);
  const [meetingTitleRows, setMeetingTitleRows] = useState<MeetingTitleRow[]>([]);
  const [autoMatchOpen, setAutoMatchOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const classesQuery = useQuery({
    queryKey: ['classes', 'admin'],
    queryFn: () => listClasses({ includeAll: true }),
  });
  const instructorsQuery = useQuery({
    queryKey: ['instructors', 'admin'],
    queryFn: listAllInstructorsForAdmin,
  });
  const ebooksQuery = useQuery({
    queryKey: ['ebooks', 'admin'],
    queryFn: listAllEbooksForAdmin,
  });
  const classes = classesQuery.data ?? [];
  const instructors = instructorsQuery.data ?? [];

  const editingId = editingClass?.id ?? '';
  const { data: editingClassDetail } = useQuery({
    queryKey: ['class', editingId],
    queryFn: () => getClassById(editingId),
    enabled: !!editingClass && dialogOpen,
  });

  const { data: existingMeetingTitles } = useQuery({
    queryKey: ['class-meeting-titles', 'admin', editingId],
    queryFn: () => getClassMeetingTitles(editingId),
    enabled: !!editingClass && dialogOpen,
  });

  const invalidateClasses = () =>
    queryClient.invalidateQueries({ queryKey: ['classes', 'admin'] });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createClass>[0]) => createClass(payload),
    onSuccess: async (created: any) => {
      invalidateClasses();
      if (created?.id && meetingTitleRows.length > 0) {
        await saveMeetingTitles(created.id);
      }
      toast({ title: 'Kelas berhasil ditambahkan' });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Gagal menambahkan kelas', description: String((error as Error)?.message ?? error), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateClass>[1] }) =>
      updateClass(id, data),
    onSuccess: async (_result, variables) => {
      invalidateClasses();
      if (meetingTitleRows.length > 0) {
        await saveMeetingTitles(variables.id);
      }
      toast({ title: 'Kelas berhasil diperbarui' });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Gagal memperbarui kelas', description: String((error as Error)?.message ?? error), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClass(id),
    onSuccess: () => {
      invalidateClasses();
      toast({ title: 'Kelas berhasil dihapus' });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({ title: 'Gagal menghapus kelas', description: String((error as Error)?.message ?? error), variant: 'destructive' });
      setDeleteTarget(null);
    },
  });

  useEffect(() => {
    if (!editingClass && instructors.length > 0 && !form.instructorId) {
      setForm((prev) => ({ ...prev, instructorId: instructors[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructors]);

  useEffect(() => {
    if (editingClassDetail && editingClass) {
      setForm(classToForm(editingClassDetail));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingClassDetail]);

  // ── Sinkronkan baris "Judul per Pertemuan" saat data tersimpan berhasil dimuat (Prompt 127) ──
  useEffect(() => {
    if (existingMeetingTitles && editingClass) {
      const maxIndex = existingMeetingTitles.size > 0 ? Math.max(...existingMeetingTitles.keys()) : -1;
      const rows: MeetingTitleRow[] = [];
      for (let i = 0; i <= maxIndex; i++) {
        const saved = existingMeetingTitles.get(i);
        rows.push({ videoIndex: i, title: saved?.title ?? '', description: saved?.description ?? '' });
      }
      setMeetingTitleRows(rows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingMeetingTitles]);

  function addMeetingTitleRow() {
    setMeetingTitleRows((rows) => [
      ...rows,
      { videoIndex: rows.length, title: '', description: '' },
    ]);
  }

  function removeMeetingTitleRow(videoIndex: number) {
    setMeetingTitleRows((rows) =>
      rows.filter((r) => r.videoIndex !== videoIndex).map((r, i) => ({ ...r, videoIndex: i })),
    );
  }

  function updateMeetingTitleRow(videoIndex: number, patch: Partial<Pick<MeetingTitleRow, 'title' | 'description'>>) {
    setMeetingTitleRows((rows) =>
      rows.map((r) => (r.videoIndex === videoIndex ? { ...r, ...patch } : r)),
    );
  }

  async function saveMeetingTitles(classId: string) {
    await Promise.all(
      meetingTitleRows.map((row) =>
        upsertClassMeetingTitle({
          classId,
          videoIndex: row.videoIndex,
          title: row.title,
          description: row.description,
        }),
      ),
    );
    queryClient.invalidateQueries({ queryKey: ['class-meeting-titles', classId] });
    queryClient.invalidateQueries({ queryKey: ['class-meeting-titles', 'admin', classId] });
  }

  const filtered = classes
    .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  function openCreateDialog() {
    setEditingClass(null);
    setForm({ ...EMPTY_FORM, instructorId: instructors[0]?.id ?? '' });
    setMeetingTitleRows([]);
    setDialogOpen(true);
  }

  function openEditDialog(cls: ClassSummary) {
    setEditingClass(cls);
    setMeetingTitleRows([]);
    setForm({
      title: cls.title,
      description: cls.description,
      coverImage: cls.coverImage,
      basePrice: String(cls.basePrice),
      discountPrice: cls.discountPrice != null ? String(cls.discountPrice) : '',
      status: cls.status,
      level: cls.level ?? '',
      category: cls.category ?? '',
      instructorId: cls.instructor.id,
      youtubePlaylistId: cls.youtubePlaylistId ?? '',
      gdriveMateriUrl: '',
      waGroupUrl: '',
      soalLatihanUrl: '',
      ebookUrl: '',
      relatedEbookId: null,
      testimoniFormUrl: '',
      meetingCount: '',
      displayOrder: String(cls.displayOrder ?? 0),
      reverseVideoOrder: false,
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim() || !form.instructorId) {
      toast({ title: 'Judul kelas dan pengajar wajib diisi', variant: 'destructive' });
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description,
      coverImage: form.coverImage,
      basePrice: Number(form.basePrice) || 0,
      discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
      status: form.status,
      level: form.level || null,
      category: form.category || null,
      instructorId: form.instructorId,
      youtubePlaylistId: form.youtubePlaylistId.trim()
        ? extractPlaylistId(form.youtubePlaylistId)
        : null,
      relatedEbookId: form.relatedEbookId,
      gdriveMateriUrl: form.gdriveMateriUrl.trim() || null,
      waGroupUrl: form.waGroupUrl.trim() || null,
      soalLatihanUrl: form.soalLatihanUrl.trim() || null,
      ebookUrl: form.ebookUrl.trim() || null,
      testimoniFormUrl: form.testimoniFormUrl.trim() || null,
      meetingCount: form.meetingCount ? parseInt(form.meetingCount, 10) : null,
      displayOrder: form.displayOrder ? parseInt(form.displayOrder, 10) : 0,
      reverseVideoOrder: form.reverseVideoOrder,
    };

    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleTogglePublish(cls: ClassSummary) {
    updateMutation.mutate({
      id: cls.id,
      data: { status: cls.status === 'published' ? 'draft' : 'published' },
    });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDetailLoading = !!editingClass && !editingClassDetail;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Manajemen Kelas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola daftar kelas fiqih, harga, dan status publikasinya.
            </p>
          </div>
          <Button data-testid="button-add-class" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kelas
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kelas..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-class"
              />
            </div>
          </CardHeader>
          <CardContent>
            {classesQuery.isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Memuat data kelas...
              </div>
            ) : classesQuery.isError ? (
              <div className="text-center text-sm text-destructive py-8">
                Gagal memuat data kelas dari server.
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Urutan</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Modul</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        Tidak ada kelas yang cocok dengan pencarian.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((cls) => (
                    <TableRow key={cls.id} data-testid={`row-class-${cls.id}`}>
                      <TableCell className="text-sm text-muted-foreground" data-testid={`text-display-order-${cls.id}`}>
                        {cls.displayOrder ?? 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={cls.coverImage}
                            alt={cls.title}
                            className="h-10 w-14 rounded object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate max-w-[220px]">
                              {cls.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                              {cls.instructor.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {cls.discountPrice ? (
                            <>
                              <span className="font-medium text-foreground">{formatPrice(cls.discountPrice)}</span>
                              <span className="block text-xs text-muted-foreground line-through">
                                {formatPrice(cls.basePrice)}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium text-foreground">{formatPrice(cls.basePrice)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cls.moduleCount} modul
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={cls.status === 'published' ? 'success' : 'neutral'}
                          data-testid={`badge-status-${cls.id}`}
                        >
                          {cls.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePublish(cls)}
                            disabled={updateMutation.isPending}
                            data-testid={`button-toggle-status-${cls.id}`}
                          >
                            {cls.status === 'published' ? 'Jadikan Draft' : 'Terbitkan'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(cls)}
                            data-testid={`button-edit-class-${cls.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(cls)}
                            data-testid={`button-delete-class-${cls.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setAutoMatchOpen(false); }}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="class-title">Judul Kelas</Label>
                <Input
                  id="class-title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  data-testid="input-class-title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-description">Deskripsi</Label>
                <Textarea
                  id="class-description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  data-testid="input-class-description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Gambar Sampul</Label>
                <ImageUploadField
                  value={form.coverImage}
                  onChange={(url) => setForm((p) => ({ ...p, coverImage: url }))}
                  previewClassName="w-16 h-20 rounded object-cover border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class-base-price">Harga Normal (Rp)</Label>
                  <Input
                    id="class-base-price"
                    type="number"
                    value={form.basePrice}
                    onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))}
                    data-testid="input-class-base-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-discount-price">Harga Coret (opsional)</Label>
                  <Input
                    id="class-discount-price"
                    type="number"
                    value={form.discountPrice}
                    onChange={(e) => setForm((p) => ({ ...p, discountPrice: e.target.value }))}
                    data-testid="input-class-discount-price"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pengajar</Label>
                  <Select
                    value={form.instructorId}
                    onValueChange={(v) => setForm((p) => ({ ...p, instructorId: v }))}
                  >
                    <SelectTrigger data-testid="select-class-instructor">
                      <SelectValue placeholder="Pilih pengajar" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select
                    value={form.level || 'none'}
                    onValueChange={(v) => setForm((p) => ({ ...p, level: v === 'none' ? '' : (v as ClassFormState['level']) }))}
                  >
                    <SelectTrigger data-testid="select-class-level">
                      <SelectValue placeholder="Pilih level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada</SelectItem>
                      <SelectItem value="pemula">Pemula</SelectItem>
                      <SelectItem value="menengah">Menengah</SelectItem>
                      <SelectItem value="lanjutan">Lanjutan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class-category">Kategori</Label>
                  <Input
                    id="class-category"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    data-testid="input-class-category"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((p) => ({ ...p, status: v as ClassFormState['status'] }))}
                  >
                    <SelectTrigger data-testid="select-class-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-display-order">Urutan Tampil</Label>
                <Input
                  id="class-display-order"
                  type="number"
                  placeholder="0"
                  value={form.displayOrder}
                  onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))}
                  data-testid="input-class-display-order"
                />
                <p className="text-xs text-muted-foreground">
                  Menentukan posisi kelas dalam daftar (angka lebih kecil tampil lebih dulu). Kelas dengan kategori sama diurutkan berdasarkan angka ini.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-youtube-playlist">Link Playlist YouTube</Label>
                <Input
                  id="class-youtube-playlist"
                  type="text"
                  placeholder="https://www.youtube.com/playlist?list=..."
                  value={form.youtubePlaylistId}
                  onChange={(e) => setForm((p) => ({ ...p, youtubePlaylistId: e.target.value }))}
                  data-testid="input-class-youtube-playlist"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Bisa paste link lengkap dari YouTube (contoh: https://youtube.com/playlist?list=PLxxxxx)
                  atau ID playlist saja — sistem otomatis mengambil ID-nya.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Switch
                  id="class-reverse-video-order"
                  checked={form.reverseVideoOrder}
                  onCheckedChange={(checked) => setForm((p) => ({ ...p, reverseVideoOrder: checked }))}
                  data-testid="switch-class-reverse-video-order"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="class-reverse-video-order" className="cursor-pointer font-medium">
                    Balik Urutan Video
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Aktifkan kalau urutan video di playlist YouTube kelas ini kebalik dari urutan pertemuan aslinya.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-meeting-count">Jumlah Pertemuan</Label>
                <Input
                  id="class-meeting-count"
                  type="number"
                  placeholder="Contoh: 2"
                  value={form.meetingCount}
                  onChange={(e) => setForm((p) => ({ ...p, meetingCount: e.target.value }))}
                  data-testid="input-class-meeting-count"
                />
                <p className="text-xs text-muted-foreground">
                  Khusus kelas berbasis playlist video (tanpa breakdown modul manual). Ditampilkan sebagai "X Pertemuan" di halaman kelas.
                </p>
              </div>
              {form.youtubePlaylistId.trim() && (
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Judul per Pertemuan</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Khusus kelas video playlist. Kosongkan judul kalau ingin tetap pakai default "Pertemuan ke-N".
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMeetingTitleRow}
                      data-testid="button-add-meeting-title"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah Pertemuan
                    </Button>
                  </div>
                  {meetingTitleRows.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Belum ada baris. Klik "Tambah Pertemuan" untuk mulai mengisi.
                    </p>
                  )}
                  <div className="space-y-3">
                    {meetingTitleRows.map((row) => (
                      <div key={row.videoIndex} className="flex gap-2 items-start rounded-md border p-3">
                        <div className="flex-1 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Pertemuan ke-{row.videoIndex + 1}
                          </p>
                          <Input
                            placeholder={`Judul (contoh: Pembahasan Hukum Wudhu)`}
                            value={row.title}
                            onChange={(e) => updateMeetingTitleRow(row.videoIndex, { title: e.target.value })}
                            data-testid={`input-meeting-title-${row.videoIndex}`}
                          />
                          <Textarea
                            placeholder="Deskripsi singkat (opsional)"
                            rows={2}
                            value={row.description}
                            onChange={(e) => updateMeetingTitleRow(row.videoIndex, { description: e.target.value })}
                            data-testid={`input-meeting-description-${row.videoIndex}`}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMeetingTitleRow(row.videoIndex)}
                          data-testid={`button-remove-meeting-title-${row.videoIndex}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="class-gdrive-materi">Link Google Drive Materi (PDF)</Label>
                <Input
                  id="class-gdrive-materi"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={form.gdriveMateriUrl}
                  onChange={(e) => setForm((p) => ({ ...p, gdriveMateriUrl: e.target.value }))}
                  data-testid="input-class-gdrive-materi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-wa-group">Link Grup WhatsApp</Label>
                <Input
                  id="class-wa-group"
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={form.waGroupUrl}
                  onChange={(e) => setForm((p) => ({ ...p, waGroupUrl: e.target.value }))}
                  data-testid="input-class-wa-group"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-soal-latihan">Link Soal Latihan</Label>
                <Input
                  id="class-soal-latihan"
                  type="url"
                  placeholder="https://forms.gle/... atau link lainnya"
                  value={form.soalLatihanUrl}
                  onChange={(e) => setForm((p) => ({ ...p, soalLatihanUrl: e.target.value }))}
                  data-testid="input-class-soal-latihan"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="class-related-ebook">Ebook Terkait (opsional)</Label>
                <Select
                  value={form.relatedEbookId ?? 'none'}
                  onValueChange={(v) => setForm((p) => ({ ...p, relatedEbookId: v === 'none' ? null : v }))}
                >
                  <SelectTrigger id="class-related-ebook" data-testid="select-class-related-ebook">
                    <SelectValue placeholder="Pilih ebook dari katalog" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada</SelectItem>
                    {ebooksQuery.data?.map((eb) => (
                      <SelectItem key={eb.id} value={eb.id}>{eb.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pelajar akan diarahkan ke halaman ebook ini di Katalog Ebook, bukan
                  link eksternal langsung.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-testimoni">Link Testimoni (Google Form)</Label>
                <Input
                  id="class-testimoni"
                  type="url"
                  placeholder="https://forms.gle/..."
                  value={form.testimoniFormUrl}
                  onChange={(e) => setForm((p) => ({ ...p, testimoniFormUrl: e.target.value }))}
                  data-testid="input-class-testimoni"
                />
              </div>

              {/* Tool Auto-Match — khusus kelas yang punya modul/dars */}
              {editingClass && editingClassDetail && editingClassDetail.modules.length > 0 && (
                <div className="rounded-lg border border-dashed p-4 space-y-2">
                  <Label>Auto-Match Video dari Playlist YouTube</Label>
                  <p className="text-xs text-muted-foreground">
                    Cocokkan video di sebuah playlist YouTube ke dars yang sudah ada secara otomatis berdasarkan kemiripan judul.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoMatchOpen(true)}
                    data-testid="button-open-auto-match"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Buka Tool Auto-Match
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving || isDetailLoading} data-testid="button-submit-class">
                {(isSaving || isDetailLoading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingClass ? 'Simpan Perubahan' : 'Tambah Kelas'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kelas?</AlertDialogTitle>
            <AlertDialogDescription>
              Kelas "{deleteTarget?.title}" akan dihapus secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-class"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Auto-Match Dialog — hanya di-render kalau kelas yang sedang diedit punya modul */}
      {editingClass && editingClassDetail && editingClassDetail.modules.length > 0 && (
        <AutoMatchPlaylistDialog
          open={autoMatchOpen}
          onClose={() => setAutoMatchOpen(false)}
          darsList={editingClassDetail.modules.flatMap((m) =>
            m.dars.map((d: { id: string; title: string }) => ({ id: d.id, title: d.title, moduleTitle: m.title })),
          )}
          onApplied={() => {
            queryClient.invalidateQueries({ queryKey: ['class', editingClass.id] });
          }}
        />
      )}
    </AdminLayout>
  );
}
