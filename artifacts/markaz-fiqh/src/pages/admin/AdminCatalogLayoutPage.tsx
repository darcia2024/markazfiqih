import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, LayoutGrid, Loader2, AlertCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { listClasses, bulkUpdateDisplayOrder } from '@/lib/db';

// ─── Tipe lokal (turunan dari return type listClasses) ────────────────────────
type ClassRow = Awaited<ReturnType<typeof listClasses>>[number];

type MutationVars = {
  updates: { id: string; displayOrder: number }[];
  category: string;
  /** Snapshot sebelum drag ini — untuk rollback kalau save gagal */
  snapshot: Record<string, ClassRow[]>;
};

// ─── Sortable item per kelas ──────────────────────────────────────────────────
function SortableClassItem({ cls }: { cls: ClassRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cls.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border rounded-lg select-none"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Drag untuk mengatur urutan"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {cls.coverImage ? (
        <img
          src={cls.coverImage}
          alt=""
          className="w-10 h-12 object-cover rounded flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-12 bg-muted rounded flex-shrink-0" />
      )}

      <span className="flex-1 text-sm font-medium leading-tight line-clamp-2">{cls.title}</span>

      <Badge
        variant={cls.status === 'published' ? 'default' : 'secondary'}
        className="flex-shrink-0 text-xs"
      >
        {cls.status === 'published' ? 'Published' : 'Draft'}
      </Badge>
    </div>
  );
}

// ─── Halaman utama ────────────────────────────────────────────────────────────
export default function AdminCatalogLayoutPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State drag lokal — terpisah dari server state supaya drag tidak di-reset saat refetch
  const [groupedClasses, setGroupedClasses] = useState<Record<string, ClassRow[]>>({});
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);

  /**
   * Debounce save per kategori:
   * Kalau user drag cepat-cepat, timer lama dibatalkan dan timer baru dijadwalkan.
   * Hanya satu DB write yang terjadi per "sesi drag" tiap kategori,
   * sehingga tidak ada race condition antara request lama vs baru.
   */
  const pendingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  /**
   * Snapshot state terakhir yang BERHASIL tersimpan ke DB (atau data awal dari server).
   * Dipakai untuk rollback tampilan lokal kalau save gagal.
   */
  const lastSavedRef = useRef<Record<string, ClassRow[]>>({});

  // ─── Fetch semua kelas ──────────────────────────────────────────────────────
  const classesQuery = useQuery({
    queryKey: ['admin-catalog-layout-classes'],
    queryFn: () => listClasses({ includeAll: true }),
    staleTime: 0,
  });

  // Inisialisasi state lokal saat data server pertama kali tiba.
  // Guard (categoryOrder.length > 0) mencegah re-init setelah drag dimulai.
  useEffect(() => {
    if (!classesQuery.data || categoryOrder.length > 0) return;

    const groups: Record<string, ClassRow[]> = {};
    for (const cls of classesQuery.data) {
      const cat = cls.category ?? '(Tanpa Kategori)';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(cls);
    }
    // Urutkan kelas dalam tiap kategori berdasarkan display_order awal dari server
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => a.displayOrder - b.displayOrder);
    }

    // Urutan kategori: alphabetical, '(Tanpa Kategori)' di akhir
    const cats = Object.keys(groups).sort((a, b) => {
      if (a === '(Tanpa Kategori)') return 1;
      if (b === '(Tanpa Kategori)') return -1;
      return a.localeCompare(b, 'id');
    });

    setGroupedClasses(groups);
    setCategoryOrder(cats);
    // Simpan sebagai "last saved" awal
    lastSavedRef.current = groups;
  }, [classesQuery.data, categoryOrder.length]);

  // Bersihkan semua pending timer saat unmount
  useEffect(() => {
    const timers = pendingTimersRef.current;
    return () => {
      for (const t of Object.values(timers)) clearTimeout(t);
    };
  }, []);

  // ─── Mutation simpan urutan ─────────────────────────────────────────────────
  const bulkUpdateMutation = useMutation<void, Error, MutationVars>({
    mutationFn: ({ updates }) => bulkUpdateDisplayOrder(updates),
    onSuccess: (_data, variables) => {
      // Update snapshot "last saved" supaya rollback berikutnya akurat
      lastSavedRef.current = {
        ...lastSavedRef.current,
        [variables.category]: groupedClasses[variables.category] ?? [],
      };
      toast({
        title: 'Urutan tersimpan ✓',
        description: `Urutan kelas di "${variables.category}" berhasil disimpan.`,
      });
      // Refresh katalog publik supaya perubahan langsung terlihat
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (err, variables) => {
      // Rollback tampilan lokal ke snapshot sebelum drag yang gagal
      setGroupedClasses((prev) => ({
        ...prev,
        [variables.category]: variables.snapshot[variables.category] ?? prev[variables.category],
      }));
      toast({
        title: 'Gagal menyimpan',
        description: err.message ?? 'Terjadi kesalahan saat menyimpan urutan.',
        variant: 'destructive',
      });
    },
  });

  // ─── Setup sensor dnd-kit ───────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // hindari konflik dengan klik biasa
    }),
  );

  // ─── Handler drop per kategori ──────────────────────────────────────────────
  function handleDragEnd(event: DragEndEvent, category: string) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setGroupedClasses((prev) => {
      const group = prev[category];
      if (!group) return prev;

      const oldIndex = group.findIndex((c) => c.id === active.id);
      const newIndex = group.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const reordered = arrayMove(group, oldIndex, newIndex);
      const updates = reordered.map((c, idx) => ({
        id: c.id,
        displayOrder: (idx + 1) * 10,
      }));

      // Snapshot SEBELUM perubahan ini — untuk rollback kalau save gagal
      const snapshot = lastSavedRef.current;

      // Debounce: batalkan save sebelumnya untuk kategori ini, jadwalkan yang baru.
      // Ini memastikan hanya SATU DB write per "sesi drag" — tidak ada race condition.
      if (pendingTimersRef.current[category]) {
        clearTimeout(pendingTimersRef.current[category]);
      }
      pendingTimersRef.current[category] = setTimeout(() => {
        bulkUpdateMutation.mutate({ updates, category, snapshot });
        delete pendingTimersRef.current[category];
      }, 600);

      return { ...prev, [category]: reordered };
    });
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Atur Tata Letak Katalog</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Drag &amp; drop kelas untuk mengubah urutan tampil di halaman Katalog.
              Perubahan tersimpan otomatis setelah selesai drag.
            </p>
          </div>
        </div>

        {/* Loading state */}
        {classesQuery.isLoading && (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Memuat data kelas…</span>
          </div>
        )}

        {/* Error state */}
        {classesQuery.error && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/40 bg-destructive/5 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              Gagal memuat kelas: {(classesQuery.error as Error).message}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!classesQuery.isLoading && !classesQuery.error && categoryOrder.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada kelas yang tersedia.</p>
          </div>
        )}

        {/* Grup drag-and-drop per kategori */}
        {categoryOrder.map((category) => {
          const classes = groupedClasses[category] ?? [];
          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{category}</CardTitle>
                  <CardDescription className="m-0">{classes.length} kelas</CardDescription>
                </div>
                <CardDescription>
                  Drag baris untuk mengubah urutan tampil di kategori ini.
                  Tidak bisa drag antar-kategori — pindah kategori lewat form edit kelas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {classes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Tidak ada kelas di kategori ini.
                  </p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, category)}
                  >
                    <SortableContext
                      items={classes.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {classes.map((cls) => (
                          <SortableClassItem key={cls.id} cls={cls} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Indikator sedang menyimpan (floating) */}
        {bulkUpdateMutation.isPending && (
          <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-background border rounded-lg shadow-lg px-4 py-2 text-sm z-50">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Menyimpan urutan…</span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
