// src/lib/db.ts
// Semua fungsi query langsung ke Supabase — bypass backend Express.
import { supabase } from './supabase';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type EnrollmentItem = {
  id: string;
  enrolledAt: string;
  lastWatchedAt: string | null;
  isCompleted: boolean;
  class: {
    id: string;
    title: string;
    coverImage: string;
    basePrice: number;
    discountPrice: number | null;
    level: string | null;
    category: string | null;
    instructor: { id: string; name: string; photoUrl: string };
    moduleCount: number;
    totalDarsCount: number;
    completedDarsCount: number;
    totalDurationMinutes: number;
  };
};

export type BundleItem = {
  id: string;
  title: string;
  description: string;
  normalPrice: number;
  bundlePrice: number;
  coverImage: string;
  classes: { id: string; title: string; coverImage: string }[];
};

export type CartClassItem = {
  id: string;
  type: 'class';
  classId: string;
  addedAt: string;
  class: {
    id: string;
    title: string;
    coverImage: string;
    basePrice: number;
    discountPrice: number | null;
    instructor: { id: string; name: string; photoUrl: string };
    moduleCount: number;
    totalDurationMinutes: number;
  };
};

export type CartBundleItem = {
  id: string;
  type: 'bundle';
  bundleId: string;
  addedAt: string;
  bundle: BundleItem;
};

export type CartItem = CartClassItem | CartBundleItem;

// ─── CLASSES ─────────────────────────────────────────────────────────────────

export async function listClasses(params?: {
  search?: string;
  category?: string;
  level?: string;
  instructorId?: string;
  /** Kalau true, tampilkan semua kelas termasuk draft — khusus Admin Panel */
  includeAll?: boolean;
}) {
  let query = supabase
    .from('classes')
    .select(`
      id, title, description, cover_image, base_price, discount_price,
      status, level, category, youtube_playlist_id, meeting_count, display_order,
      instructors ( id, name, photo_url ),
      modules ( id, dars ( id, duration_minutes ) )
    `)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (!params?.includeAll) query = query.eq('status', 'published');

  if (params?.search) query = query.ilike('title', `%${params.search}%`);
  if (params?.category) query = query.eq('category', params.category);
  if (params?.level) query = query.eq('level', params.level);
  if (params?.instructorId) query = query.eq('instructor_id', params.instructorId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((c: any) => {
    const modules = c.modules ?? [];
    const dars = modules.flatMap((m: any) => m.dars ?? []);
    return {
      id: c.id as string,
      title: c.title as string,
      description: c.description as string,
      coverImage: c.cover_image as string,
      basePrice: c.base_price as number,
      discountPrice: c.discount_price as number | null,
      status: c.status as 'draft' | 'published',
      level: c.level as 'pemula' | 'menengah' | 'lanjutan' | null,
      category: c.category as string | null,
      youtubePlaylistId: c.youtube_playlist_id as string | null,
      moduleCount: modules.length as number,
      meetingCount: (c.meeting_count ?? null) as number | null,
      displayOrder: (c.display_order ?? 0) as number,
      totalDurationMinutes: dars.reduce(
        (acc: number, d: any) => acc + (d.duration_minutes ?? 0),
        0,
      ) as number,
      instructor: c.instructors
        ? { id: c.instructors.id, name: c.instructors.name, photoUrl: c.instructors.photo_url }
        : { id: '', name: 'Pengajar', photoUrl: '' },
    };
  });
}

export async function getClassById(id: string) {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      id, title, description, cover_image, base_price, discount_price,
      status, level, category, youtube_playlist_id, gdrive_materi_url, wa_group_url, soal_latihan_url, ebook_url, meeting_count, display_order,
      instructors ( id, name, photo_url, bio ),
      modules (
        id, title, order_index,
        dars ( id, title, duration_minutes, order_index )
      )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;

  const inst = data.instructors as any;
  const rawModules = (data.modules ?? []) as any[];

  // Hitung jumlah kelas published milik instruktur ini
  let instructorClassCount = 0;
  if (inst?.id) {
    const { count } = await supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('instructor_id', inst.id)
      .eq('status', 'published');
    instructorClassCount = count ?? 0;
  }

  const modules = rawModules
    .sort((a, b) => a.order_index - b.order_index)
    .map((m) => {
      const darsSorted = (m.dars ?? []).sort(
        (a: any, b: any) => a.order_index - b.order_index,
      );
      const moduleDuration = darsSorted.reduce(
        (acc: number, d: any) => acc + (d.duration_minutes ?? 0),
        0,
      );
      return {
        id: m.id as string,
        title: m.title as string,
        orderIndex: m.order_index as number,
        durationMinutes: moduleDuration as number,
        dars: darsSorted.map((d: any) => ({
          id: d.id as string,
          title: d.title as string,
          durationMinutes: d.duration_minutes as number | null,
          orderIndex: d.order_index as number,
        })),
      };
    });

  return {
    id: data.id as string,
    title: data.title as string,
    description: data.description as string,
    coverImage: data.cover_image as string,
    basePrice: data.base_price as number,
    discountPrice: data.discount_price as number | null,
    status: data.status as 'draft' | 'published',
    level: data.level as string | null,
    category: data.category as string | null,
    youtubePlaylistId: data.youtube_playlist_id as string | null,
    gdriveMateriUrl: data.gdrive_materi_url as string | null,
    waGroupUrl: data.wa_group_url as string | null,
    soalLatihanUrl: data.soal_latihan_url as string | null,
    ebookUrl: data.ebook_url as string | null,
    displayOrder: (data.display_order ?? 0) as number,
    instructor: inst
      ? { id: inst.id, name: inst.name, photoUrl: inst.photo_url, bio: inst.bio ?? '', classCount: instructorClassCount }
      : { id: '', name: 'Pengajar', photoUrl: '', bio: '', classCount: 0 },
    modules,
    moduleCount: modules.length,
    meetingCount: (data.meeting_count ?? null) as number | null,
    totalDurationMinutes: modules
      .flatMap((m) => m.dars)
      .reduce((acc, d) => acc + (d.durationMinutes ?? 0), 0),
  };
}

// ─── INSTRUCTORS ──────────────────────────────────────────────────────────────

/** Hanya instruktur aktif — untuk tampilan publik (Katalog, Landing Page). */
export async function listInstructors() {
  const { data, error } = await supabase
    .from('instructors')
    .select('id, name, bio, photo_url')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []).map((i: any) => ({
    id: i.id as string,
    name: i.name as string,
    bio: i.bio as string | null,
    photoUrl: i.photo_url as string,
  }));
}

/** Semua instruktur termasuk nonaktif — khusus Admin Panel. */
export async function listAllInstructorsForAdmin() {
  const { data, error } = await supabase
    .from('instructors')
    .select('id, name, bio, photo_url, is_active, classes(id, status)')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((i: any) => ({
    id: i.id as string,
    name: i.name as string,
    bio: i.bio as string | null,
    photoUrl: i.photo_url as string,
    isActive: i.is_active as boolean,
    classCount: (i.classes ?? []).filter((c: any) => c.status === 'published').length as number,
  }));
}

// ─── ADMIN INSTRUCTORS CRUD ───────────────────────────────────────────────────

export async function createInstructor(data: {
  name: string;
  bio?: string;
  photoUrl?: string;
}) {
  const { data: created, error } = await supabase
    .from('instructors')
    .insert({ name: data.name, bio: data.bio ?? null, photo_url: data.photoUrl ?? '', is_active: true })
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function updateInstructor(
  id: string,
  data: Partial<{ name: string; bio: string | null; photoUrl: string; isActive: boolean }>,
) {
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if ('bio' in data) patch.bio = data.bio;
  if (data.photoUrl !== undefined) patch.photo_url = data.photoUrl;
  if (data.isActive !== undefined) patch.is_active = data.isActive;
  const { error } = await supabase.from('instructors').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteInstructor(id: string) {
  const { error } = await supabase.from('instructors').delete().eq('id', id);
  if (error) throw error;
}

// ─── ADMIN INVITES ────────────────────────────────────────────────────────────

export async function listAdminInvites() {
  const { data, error } = await supabase
    .from('admin_invites')
    .select('id, email, created_at, redeemed_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((i: any) => ({
    id: i.id as string,
    email: i.email as string,
    createdAt: i.created_at as string,
    redeemedAt: i.redeemed_at as string | null,
  }));
}

export async function createAdminInvite(email: string, invitedBy: string) {
  const { error } = await supabase
    .from('admin_invites')
    .insert({ email: email.toLowerCase().trim(), invited_by: invitedBy });
  if (error) throw error;
}

export async function deleteAdminInvite(id: string) {
  const { error } = await supabase.from('admin_invites').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Panggil edge function check-admin-invite setelah login berhasil.
 * Mem-promote user jadi admin secara otomatis kalau emailnya ada di daftar
 * admin_invites yang belum di-redeem. Aman dipanggil berkali-kali (no-op
 * kalau tidak ada invite yang cocok).
 */
export async function checkAdminInvite(): Promise<{ promoted: boolean }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { promoted: false };
  const { data, error } = await supabase.functions.invoke('check-admin-invite');
  if (error) {
    console.error('Gagal memeriksa undangan admin:', error);
    return { promoted: false };
  }
  return { promoted: Boolean(data?.promoted) };
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────

export async function listTestimonials() {
  const { data, error } = await supabase
    .from('testimonials')
    .select('id, name, role, content, photo_url, is_published, order_index')
    .eq('is_published', true)
    .order('order_index');
  if (error) throw error;
  return (data ?? []).map((t: any) => ({
    id: t.id as string,
    name: t.name as string,
    role: t.role as string | null,
    content: t.content as string,
    photoUrl: t.photo_url as string | null,
    isPublished: t.is_published as boolean,
    orderIndex: t.order_index as number,
  }));
}

// ─── SITE SETTINGS ────────────────────────────────────────────────────────────

export async function getSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return {
    siteName: data.site_name as string,
    tagline: data.tagline as string | null,
    logoUrl: data.logo_url as string | null,
    contactEmail: data.contact_email as string | null,
    contactPhone: data.contact_phone as string | null,
    address: data.address as string | null,
    founderName: data.founder_name as string | null,
    founderBio: data.founder_bio as string | null,
    founderPhotoUrl: data.founder_photo_url as string | null,
    socialInstagram: data.social_instagram as string,
    socialYoutube: data.social_youtube as string,
    socialFacebook: data.social_facebook as string,
    socialTiktok: data.social_tiktok as string,
    studentCountLabel: data.student_count_label as string | null,
    aboutUsContent: data.about_us_content as string | null,
  };
}

// ─── BUNDLES ──────────────────────────────────────────────────────────────────

export async function listBundles(): Promise<BundleItem[]> {
  const { data, error } = await supabase
    .from('bundles')
    .select(`
      id, title, description, normal_price, bundle_price, cover_image,
      bundle_classes (
        class_id,
        classes ( id, title, cover_image )
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((b: any) => ({
    id: b.id as string,
    title: b.title as string,
    description: b.description as string,
    normalPrice: b.normal_price as number,
    bundlePrice: b.bundle_price as number,
    coverImage: b.cover_image as string,
    classes: (b.bundle_classes ?? [])
      .map((bc: any) => bc.classes)
      .filter(Boolean)
      .map((cls: any) => ({
        id: cls.id as string,
        title: cls.title as string,
        coverImage: cls.cover_image as string,
      })),
  }));
}

export async function getBundleById(id: string): Promise<BundleItem> {
  const { data, error } = await supabase
    .from('bundles')
    .select(`
      id, title, description, normal_price, bundle_price, cover_image,
      bundle_classes (
        class_id,
        classes ( id, title, cover_image )
      )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;

  return {
    id: data.id as string,
    title: data.title as string,
    description: data.description as string,
    normalPrice: data.normal_price as number,
    bundlePrice: data.bundle_price as number,
    coverImage: data.cover_image as string,
    classes: ((data.bundle_classes as any[]) ?? [])
      .map((bc: any) => bc.classes)
      .filter(Boolean)
      .map((cls: any) => ({
        id: cls.id as string,
        title: cls.title as string,
        coverImage: cls.cover_image as string,
      })),
  };
}

// ─── CART ─────────────────────────────────────────────────────────────────────

export async function listCartItems(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id, class_id, bundle_id, added_at,
      classes (
        id, title, cover_image, base_price, discount_price,
        instructors ( id, name, photo_url ),
        modules ( id, dars ( id, duration_minutes ) )
      ),
      bundles (
        id, title, description, normal_price, bundle_price, cover_image,
        bundle_classes (
          class_id,
          classes ( id, title, cover_image )
        )
      )
    `)
    .eq('user_id', userId);
  if (error) throw error;

  return (data ?? [])
    .map((item: any): CartItem | null => {
      // Item bundle
      if (item.bundle_id && item.bundles) {
        const b = item.bundles;
        return {
          id: item.id as string,
          type: 'bundle',
          bundleId: item.bundle_id as string,
          addedAt: item.added_at as string,
          bundle: {
            id: b.id as string,
            title: b.title as string,
            description: b.description as string,
            normalPrice: b.normal_price as number,
            bundlePrice: b.bundle_price as number,
            coverImage: b.cover_image as string,
            classes: (b.bundle_classes ?? [])
              .map((bc: any) => bc.classes)
              .filter(Boolean)
              .map((cls: any) => ({
                id: cls.id as string,
                title: cls.title as string,
                coverImage: cls.cover_image as string,
              })),
          },
        };
      }

      // Item kelas biasa
      if (item.class_id && item.classes) {
        const cls = item.classes;
        const modules = cls.modules ?? [];
        const dars = modules.flatMap((m: any) => m.dars ?? []);
        return {
          id: item.id as string,
          type: 'class',
          classId: item.class_id as string,
          addedAt: item.added_at as string,
          class: {
            id: cls.id as string,
            title: cls.title as string,
            coverImage: cls.cover_image as string,
            basePrice: cls.base_price as number,
            discountPrice: cls.discount_price as number | null,
            instructor: cls.instructors
              ? { id: cls.instructors.id as string, name: cls.instructors.name as string, photoUrl: cls.instructors.photo_url as string }
              : { id: '', name: 'Pengajar', photoUrl: '' },
            moduleCount: modules.length as number,
            totalDurationMinutes: dars.reduce(
              (acc: number, d: any) => acc + (d.duration_minutes ?? 0),
              0,
            ) as number,
          },
        };
      }

      return null;
    })
    .filter((item): item is CartItem => item !== null);
}

export async function addCartItem(
  userId: string,
  item: { classId: string } | { bundleId: string },
) {
  if ('bundleId' in item) {
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: userId, bundle_id: item.bundleId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: userId, class_id: item.classId });
    if (error) throw error;
  }
}

export async function removeCartItem(itemId: string) {
  const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
  if (error) throw error;
}

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────

export async function listEnrollments(userId: string): Promise<EnrollmentItem[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      id, enrolled_at, is_completed,
      classes (
        id, title, cover_image, base_price, discount_price, level, category,
        instructors ( id, name, photo_url ),
        modules ( id, dars ( id, duration_minutes ) )
      )
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false }); // fallback: terbaru dibeli dulu
  if (error) throw error;

  // Satu query untuk semua progress user — hindari N+1
  const { data: progressRows, error: progressError } = await supabase
    .from('progress')
    .select('dars_id')
    .eq('user_id', userId);
  if (progressError) throw progressError;
  const completedDarsIds = new Set((progressRows ?? []).map((p: any) => p.dars_id as string));

  // Ambil kapan terakhir nonton per kelas (dipakai untuk sorting dashboard)
  const { data: watchRows, error: watchError } = await supabase
    .from('video_watch_progress')
    .select('class_id, updated_at')
    .eq('user_id', userId);
  if (watchError) throw watchError;
  const lastWatchedMap = new Map(
    (watchRows ?? []).map((w: any) => [w.class_id as string, w.updated_at as string]),
  );

  const items = (data ?? [])
    .filter((e: any) => e.classes != null)
    .map((e: any) => {
      const cls = e.classes;
      const modules = cls.modules ?? [];
      const dars = modules.flatMap((m: any) => m.dars ?? []);
      const completedDarsCount = dars.filter((d: any) => completedDarsIds.has(d.id)).length;
      const lastWatchedAt = lastWatchedMap.get(cls.id as string) ?? null;
      return {
        id: e.id as string,
        enrolledAt: e.enrolled_at as string,
        lastWatchedAt,
        isCompleted: e.is_completed as boolean,
        class: {
          id: cls.id as string,
          title: cls.title as string,
          coverImage: cls.cover_image as string,
          basePrice: cls.base_price as number,
          discountPrice: cls.discount_price as number | null,
          level: cls.level as string | null,
          category: cls.category as string | null,
          instructor: cls.instructors
            ? {
                id: cls.instructors.id as string,
                name: cls.instructors.name as string,
                photoUrl: cls.instructors.photo_url as string,
              }
            : { id: '', name: 'Pengajar', photoUrl: '' },
          moduleCount: modules.length as number,
          totalDarsCount: dars.length as number,
          completedDarsCount,
          totalDurationMinutes: dars.reduce(
            (acc: number, d: any) => acc + (d.duration_minutes ?? 0),
            0,
          ) as number,
        },
      };
    });

  // Urutkan: yang punya lastWatchedAt paling baru dulu, baru fallback ke enrolledAt
  return items.sort((a, b) => {
    const aTime = a.lastWatchedAt
      ? new Date(a.lastWatchedAt).getTime()
      : new Date(a.enrolledAt).getTime();
    const bTime = b.lastWatchedAt
      ? new Date(b.lastWatchedAt).getTime()
      : new Date(b.enrolledAt).getTime();
    return bTime - aTime;
  });
}

export async function checkEnrollment(userId: string, classId: string): Promise<boolean> {
  const { data } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('class_id', classId)
    .maybeSingle();
  return !!data;
}

// ─── CHECKOUT (via Supabase Edge Functions) ───────────────────────────────────

export type LocalInvoiceItem = {
  id: string;
  classId: string;
  bundleId?: string;
  bundleName?: string;
  title: string;
  price: number;
  coverImage: string;
};

export type LocalInvoice = {
  id: string;
  totalAmount: number;
  status: string;
  paymentUrl: string | null;
  items: LocalInvoiceItem[];
};

// ─── VOUCHERS ────────────────────────────────────────────────────────────────

export type VoucherResult =
  | { valid: true; discountPrice: number }
  | { valid: false; message: string };

export async function validateVoucher(classId: string, code: string): Promise<VoucherResult> {
  const normalizedCode = code.trim().toUpperCase();
  const { data, error } = await supabase
    .from('class_vouchers')
    .select('id, discount_price, max_uses, used_count')
    .eq('class_id', classId)
    .eq('code', normalizedCode)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return { valid: false, message: 'Kode voucher tidak valid atau sudah tidak berlaku.' };
  }

  if (data.max_uses !== null && (data.used_count ?? 0) >= data.max_uses) {
    return { valid: false, message: 'Kode voucher tidak valid atau sudah tidak berlaku.' };
  }

  return { valid: true, discountPrice: data.discount_price as number };
}

export async function createCheckout(voucherCode?: string): Promise<LocalInvoice> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Tidak ada sesi login');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const res = await fetch(`${supabaseUrl}/functions/v1/checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(voucherCode ? { voucherCode } : {}),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Checkout gagal');
  }
  return res.json();
}

export async function simulateSuccess(invoiceId: string): Promise<{ success: boolean; invoiceId: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Tidak ada sesi login');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const res = await fetch(`${supabaseUrl}/functions/v1/simulate-success`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ invoiceId }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Simulasi gagal');
  }
  return res.json();
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────────
// Catatan skema: tabel `progress` tidak punya kolom `is_completed`.
// Keberadaan sebuah row berarti dars tersebut sudah selesai (ditandai completed_at).
// updateProgress melakukan upsert (isCompleted=true) atau delete (isCompleted=false).

export async function listProgress(userId: string, classId: string) {
  const { data, error } = await supabase
    .from('progress')
    .select('id, dars_id, dars!inner(module_id, modules!inner(class_id))')
    .eq('user_id', userId)
    .eq('dars.modules.class_id', classId);
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    id: p.id as string,
    darsId: p.dars_id as string,
    isCompleted: true, // row ada = selesai; tidak ada row = belum selesai
  }));
}

export async function updateProgress(params: {
  userId: string;
  darsId: string;
  isCompleted: boolean;
}) {
  // Hapus row yang ada dulu (idempotent) — tidak butuh unique constraint di DB
  const { error: delError } = await supabase
    .from('progress')
    .delete()
    .eq('user_id', params.userId)
    .eq('dars_id', params.darsId);
  if (delError) throw delError;

  // Kalau ditandai selesai, insert row baru
  if (params.isCompleted) {
    const { error } = await supabase
      .from('progress')
      .insert({ user_id: params.userId, dars_id: params.darsId });
    if (error) throw error;
  }
}

// ─── COMPLETE ENROLLMENT ────────────────────────────────────────────────────

export async function completeEnrollment(enrollmentId: string) {
  const { error } = await supabase
    .from('enrollments')
    .update({ is_completed: true })
    .eq('id', enrollmentId);
  if (error) throw error;
}

// ─── ADMIN TESTIMONIALS CRUD ─────────────────────────────────────────────────

/** Semua testimoni termasuk belum tayang — khusus Admin Panel. */
export async function listAllTestimonialsForAdmin() {
  const { data, error } = await supabase
    .from('testimonials')
    .select('id, name, role, content, photo_url, is_published, order_index')
    .order('order_index');
  if (error) throw error;
  return (data ?? []).map((t: any) => ({
    id: t.id as string,
    name: t.name as string,
    role: t.role as string | null,
    content: t.content as string,
    photoUrl: t.photo_url as string | null,
    isPublished: t.is_published as boolean,
    orderIndex: t.order_index as number,
  }));
}

export async function createTestimonial(data: {
  name: string; role?: string | null; content: string;
  photoUrl?: string; isPublished?: boolean; orderIndex?: number;
}) {
  const { data: created, error } = await supabase
    .from('testimonials')
    .insert({
      name: data.name, role: data.role ?? null, content: data.content,
      photo_url: data.photoUrl ?? '', is_published: data.isPublished ?? true,
      order_index: data.orderIndex ?? 0,
    })
    .select().single();
  if (error) throw error;
  return created;
}

export async function updateTestimonial(
  id: string,
  data: Partial<{ name: string; role: string | null; content: string; photoUrl: string; isPublished: boolean; orderIndex: number }>,
) {
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if ('role' in data) patch.role = data.role;
  if (data.content !== undefined) patch.content = data.content;
  if (data.photoUrl !== undefined) patch.photo_url = data.photoUrl;
  if (data.isPublished !== undefined) patch.is_published = data.isPublished;
  if (data.orderIndex !== undefined) patch.order_index = data.orderIndex;
  const { error } = await supabase.from('testimonials').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteTestimonial(id: string) {
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) throw error;
}

// ─── ADMIN SETTINGS CRUD ─────────────────────────────────────────────────────

export async function updateSettings(data: {
  siteName?: string; tagline?: string; logoUrl?: string;
  contactEmail?: string; contactPhone?: string; address?: string;
  founderName?: string; founderBio?: string; founderPhotoUrl?: string;
  socialInstagram?: string; socialYoutube?: string; socialFacebook?: string;
  socialTiktok?: string; studentCountLabel?: string; aboutUsContent?: string;
}) {
  const patch: Record<string, unknown> = {};
  if (data.siteName !== undefined) patch.site_name = data.siteName;
  if (data.tagline !== undefined) patch.tagline = data.tagline;
  if (data.logoUrl !== undefined) patch.logo_url = data.logoUrl;
  if (data.contactEmail !== undefined) patch.contact_email = data.contactEmail;
  if (data.contactPhone !== undefined) patch.contact_phone = data.contactPhone;
  if (data.address !== undefined) patch.address = data.address;
  if (data.founderName !== undefined) patch.founder_name = data.founderName;
  if (data.founderBio !== undefined) patch.founder_bio = data.founderBio;
  if (data.founderPhotoUrl !== undefined) patch.founder_photo_url = data.founderPhotoUrl;
  if (data.socialInstagram !== undefined) patch.social_instagram = data.socialInstagram;
  if (data.socialYoutube !== undefined) patch.social_youtube = data.socialYoutube;
  if (data.socialFacebook !== undefined) patch.social_facebook = data.socialFacebook;
  if (data.socialTiktok !== undefined) patch.social_tiktok = data.socialTiktok;
  if (data.studentCountLabel !== undefined) patch.student_count_label = data.studentCountLabel;
  if (data.aboutUsContent !== undefined) patch.about_us_content = data.aboutUsContent;
  const { error } = await supabase.from('site_settings').update(patch).eq('id', 1);
  if (error) {
    // Kolom about_us_content mungkin belum ada jika migrasi SQL belum dijalankan.
    // Coba lagi tanpa field ini supaya field lain tetap bisa disimpan.
    const isMissingColumn = 'about_us_content' in patch && /about_us_content/i.test(error.message ?? '');
    if (isMissingColumn) {
      const { about_us_content, ...fallbackPatch } = patch;
      const { error: retryError } = await supabase.from('site_settings').update(fallbackPatch).eq('id', 1);
      if (retryError) throw retryError;
      throw new Error(
        'Pengaturan lain berhasil disimpan, tapi kolom "Konten Tentang Kami" belum tersedia di database. Jalankan migrasi SQL terlebih dahulu.'
      );
    }
    throw error;
  }
}

// ─── ADMIN CLASSES CRUD ───────────────────────────────────────────────────────

export async function createClass(data: {
  title: string; description?: string; coverImage?: string;
  basePrice: number; discountPrice?: number | null;
  status: 'draft' | 'published'; level?: string | null;
  category?: string | null; instructorId: string;
  youtubePlaylistId?: string | null; gdriveMateriUrl?: string | null;
  waGroupUrl?: string | null; soalLatihanUrl?: string | null;
  ebookUrl?: string | null; meetingCount?: number | null;
  displayOrder?: number | null;
}) {
  const { data: created, error } = await supabase
    .from('classes')
    .insert({
      title: data.title, description: data.description ?? '',
      cover_image: data.coverImage ?? '', base_price: data.basePrice,
      discount_price: data.discountPrice ?? null, status: data.status,
      level: data.level ?? null, category: data.category ?? null,
      instructor_id: data.instructorId,
      youtube_playlist_id: data.youtubePlaylistId ?? null,
      gdrive_materi_url: data.gdriveMateriUrl ?? null,
      wa_group_url: data.waGroupUrl ?? null,
      soal_latihan_url: data.soalLatihanUrl ?? null,
      ebook_url: data.ebookUrl ?? null,
      meeting_count: data.meetingCount ?? null,
      display_order: data.displayOrder ?? 0,
    })
    .select().single();
  if (error) throw error;
  return created;
}

export async function updateClass(
  id: string,
  data: Partial<{
    title: string; description: string; coverImage: string;
    basePrice: number; discountPrice: number | null;
    status: 'draft' | 'published'; level: string | null;
    category: string | null; instructorId: string;
    youtubePlaylistId: string | null; gdriveMateriUrl: string | null;
    waGroupUrl: string | null; soalLatihanUrl: string | null;
    ebookUrl: string | null; meetingCount: number | null;
    displayOrder: number;
  }>,
) {
  const patch: Record<string, unknown> = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.coverImage !== undefined) patch.cover_image = data.coverImage;
  if (data.basePrice !== undefined) patch.base_price = data.basePrice;
  if ('discountPrice' in data) patch.discount_price = data.discountPrice;
  if (data.status !== undefined) patch.status = data.status;
  if ('level' in data) patch.level = data.level;
  if ('category' in data) patch.category = data.category;
  if (data.instructorId !== undefined) patch.instructor_id = data.instructorId;
  if ('youtubePlaylistId' in data) patch.youtube_playlist_id = data.youtubePlaylistId;
  if ('gdriveMateriUrl' in data) patch.gdrive_materi_url = data.gdriveMateriUrl;
  if ('waGroupUrl' in data) patch.wa_group_url = data.waGroupUrl;
  if ('soalLatihanUrl' in data) patch.soal_latihan_url = data.soalLatihanUrl;
  if ('ebookUrl' in data) patch.ebook_url = data.ebookUrl;
  if ('meetingCount' in data) patch.meeting_count = data.meetingCount;
  if (data.displayOrder !== undefined) patch.display_order = data.displayOrder;
  const { error } = await supabase.from('classes').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteClass(id: string) {
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) throw error;
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────

/** Ringkasan statistik untuk Admin Dashboard. */
export async function getAdminDashboardSummary() {
  const [classesRes, publishedRes, pendingInvoicesRes, paidInvoicesRes, usersRes] = await Promise.all([
    supabase.from('classes').select('id', { count: 'exact', head: true }),
    supabase.from('classes').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase.from('user_profiles').select('user_id', { count: 'exact', head: true }),
  ]);
  return {
    totalClasses: classesRes.count ?? 0,
    publishedClasses: publishedRes.count ?? 0,
    draftClasses: (classesRes.count ?? 0) - (publishedRes.count ?? 0),
    pendingOrders: pendingInvoicesRes.count ?? 0,
    totalPaidOrders: paidInvoicesRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
  };
}

// ─── ADMIN INVOICES ───────────────────────────────────────────────────────────

/**
 * Semua invoice — khusus Admin Panel.
 * PERLU: RLS policy admin pada tabel invoices agar bisa membaca semua invoice
 * (bukan hanya milik sendiri). Lihat ringkasan akhir Prompt 55 untuk detailnya.
 */
export async function listAllInvoicesForAdmin() {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id, user_id, total_amount, status, mayar_invoice_id, created_at, paid_at,
      invoice_items ( id, class_id, bundle_id, price, classes ( title ), bundles ( title ) )
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((inv: any) => ({
    id: inv.id as string,
    userId: inv.user_id as string,
    totalAmount: inv.total_amount as number,
    status: inv.status as 'pending' | 'paid' | 'failed',
    mayarInvoiceId: inv.mayar_invoice_id as string | null,
    createdAt: inv.created_at as string,
    paidAt: inv.paid_at as string | null,
    items: (inv.invoice_items ?? []).map((item: any) => ({
      id: item.id as string,
      title: item.classes?.title ?? item.bundles?.title ?? '(tidak diketahui)',
      price: item.price as number,
    })),
  }));
}

// ── Video Watch Progress ──────────────────────────────────────────────────────
export async function getVideoWatchProgress(userId: string, classId: string) {
  const { data, error } = await supabase
    .from('video_watch_progress')
    .select('video_index, last_position_seconds')
    .eq('user_id', userId)
    .eq('class_id', classId)
    .maybeSingle();
  if (error) throw error;
  return data
    ? { videoIndex: data.video_index as number, positionSeconds: data.last_position_seconds as number }
    : null;
}

export async function saveVideoWatchProgress(params: {
  userId: string;
  classId: string;
  videoIndex: number;
  positionSeconds: number;
}) {
  const { error } = await supabase
    .from('video_watch_progress')
    .upsert(
      {
        user_id: params.userId,
        class_id: params.classId,
        video_index: params.videoIndex,
        last_position_seconds: params.positionSeconds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,class_id' },
    );
  if (error) throw error;
}

export async function getInvoice(invoiceId: string): Promise<LocalInvoice> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id, total_amount, status, mayar_invoice_id, paid_at,
      invoice_items ( id, class_id, bundle_id, price, classes ( id, title, cover_image ), bundles ( title ) )
    `)
    .eq('id', invoiceId)
    .single();
  if (error) throw error;
  return {
    id: data.id as string,
    totalAmount: data.total_amount as number,
    status: data.status as string,
    paymentUrl: null,
    items: ((data.invoice_items as any[]) ?? []).map((item: any) => ({
      id: item.id as string,
      classId: item.class_id as string,
      bundleId: item.bundle_id as string | undefined,
      bundleName: item.bundles?.title as string | undefined,
      title: item.classes?.title ?? '',
      price: item.price as number,
      coverImage: item.classes?.cover_image ?? '',
    })),
  };
}

// ── Dashboard Messages ────────────────────────────────────────────────────────

export async function listActiveDashboardMessages() {
  const { data, error } = await supabase
    .from('dashboard_messages')
    .select('id, message')
    .eq('is_active', true);
  if (error) throw error;
  return (data ?? []).map((m: any) => ({ id: m.id as string, message: m.message as string }));
}

export async function listAllDashboardMessages() {
  const { data, error } = await supabase
    .from('dashboard_messages')
    .select('id, message, is_active, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((m: any) => ({
    id: m.id as string,
    message: m.message as string,
    isActive: m.is_active as boolean,
    createdAt: m.created_at as string,
  }));
}

export async function createDashboardMessage(message: string) {
  const { error } = await supabase.from('dashboard_messages').insert({ message });
  if (error) throw error;
}

export async function updateDashboardMessage(
  id: string,
  updates: { message?: string; isActive?: boolean },
) {
  const payload: any = {};
  if (updates.message !== undefined) payload.message = updates.message;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;
  const { error } = await supabase.from('dashboard_messages').update(payload).eq('id', id);
  if (error) throw error;
}

// ── Admin Voucher CRUD ────────────────────────────────────────────────────────

export type AdminVoucher = {
  id: string;
  classId: string;
  className: string;
  code: string;
  discountPrice: number;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
};

export async function listAllVouchersForAdmin(): Promise<AdminVoucher[]> {
  const { data, error } = await supabase
    .from('class_vouchers')
    .select('id, class_id, code, discount_price, is_active, max_uses, used_count, classes(title)')
    .order('code');
  if (error) throw error;
  return (data ?? []).map((v: any) => ({
    id: v.id as string,
    classId: v.class_id as string,
    className: (v.classes?.title ?? 'Kelas tidak ditemukan') as string,
    code: v.code as string,
    discountPrice: v.discount_price as number,
    isActive: v.is_active as boolean,
    maxUses: v.max_uses as number | null,
    usedCount: (v.used_count ?? 0) as number,
  }));
}

export async function createVoucher(payload: {
  classId: string;
  code: string;
  discountPrice: number;
  maxUses: number | null;
}): Promise<void> {
  const { error } = await supabase.from('class_vouchers').insert({
    class_id: payload.classId,
    code: payload.code.toUpperCase(),
    discount_price: payload.discountPrice,
    max_uses: payload.maxUses,
    is_active: true,
    used_count: 0,
  });
  if (error) throw error;
}

export async function updateVoucher(
  id: string,
  payload: Partial<{ code: string; discountPrice: number; isActive: boolean; maxUses: number | null }>
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if ('code' in payload && payload.code !== undefined) patch.code = payload.code.toUpperCase();
  if ('discountPrice' in payload && payload.discountPrice !== undefined) patch.discount_price = payload.discountPrice;
  if ('isActive' in payload && payload.isActive !== undefined) patch.is_active = payload.isActive;
  if ('maxUses' in payload) patch.max_uses = payload.maxUses;
  const { error } = await supabase.from('class_vouchers').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteVoucher(id: string): Promise<void> {
  const { error } = await supabase.from('class_vouchers').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteDashboardMessage(id: string) {
  const { error } = await supabase.from('dashboard_messages').delete().eq('id', id);
  if (error) throw error;
}

// ── Public: Instructors ───────────────────────────────────────────────────────

export type PublicInstructor = {
  id: string;
  name: string;
  bio: string;
  photoUrl: string;
};

export type InstructorWithClasses = PublicInstructor & {
  classes: {
    id: string;
    title: string;
    coverImage: string;
    category: string | null;
  }[];
};

export async function listActiveInstructors(): Promise<PublicInstructor[]> {
  const { data, error } = await supabase
    .from('instructors')
    .select('id, name, bio, photo_url')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []).map((i: any) => ({
    id: i.id,
    name: i.name,
    bio: i.bio ?? '',
    photoUrl: i.photo_url ?? '',
  }));
}

export async function getInstructorWithClasses(id: string): Promise<InstructorWithClasses | null> {
  const { data: instructor, error } = await supabase
    .from('instructors')
    .select('id, name, bio, photo_url')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  if (!instructor) return null;

  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, title, cover_image, category')
    .eq('instructor_id', id)
    .eq('status', 'published')
    .order('display_order');
  if (classesError) throw classesError;

  return {
    id: instructor.id,
    name: instructor.name,
    bio: instructor.bio ?? '',
    photoUrl: instructor.photo_url ?? '',
    classes: (classes ?? []).map((c: any) => ({
      id: c.id,
      title: c.title,
      coverImage: c.cover_image ?? '',
      category: c.category,
    })),
  };
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export type ClassReview = {
  id: string;
  userId: string;
  userNickname: string | null;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ClassReviewSummary = {
  averageRating: number;
  totalReviews: number;
  reviews: ClassReview[];
};

export async function listClassReviews(classId: string): Promise<ClassReviewSummary> {
  const { data, error } = await supabase
    .from('class_reviews')
    .select('id, user_id, rating, comment, created_at, user_profiles(nickname)')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const reviews = (data ?? []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    userNickname: r.user_profiles?.nickname ?? null,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  }));

  const averageRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  return { averageRating, totalReviews: reviews.length, reviews };
}

export async function submitClassReview(params: {
  classId: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Harus login untuk memberi review.');
  const { error } = await supabase
    .from('class_reviews')
    .upsert(
      { class_id: params.classId, user_id: user.id, rating: params.rating, comment: params.comment },
      { onConflict: 'class_id,user_id' },
    );
  if (error) throw error;
}

/** Bulk rating summary untuk Katalog — 1 query untuk semua kelas */
export async function listClassRatings(): Promise<Record<string, { averageRating: number; totalReviews: number }>> {
  const { data, error } = await supabase
    .from('class_reviews')
    .select('class_id, rating');
  if (error) throw error;

  const grouped: Record<string, number[]> = {};
  for (const r of (data ?? []) as { class_id: string; rating: number }[]) {
    if (!grouped[r.class_id]) grouped[r.class_id] = [];
    grouped[r.class_id].push(r.rating);
  }

  const result: Record<string, { averageRating: number; totalReviews: number }> = {};
  for (const [classId, ratings] of Object.entries(grouped)) {
    result[classId] = {
      averageRating: Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10,
      totalReviews: ratings.length,
    };
  }
  return result;
}

// ── Admin: List All Users ─────────────────────────────────────────────────────

export type AdminUserRow = {
  userId: string;
  email: string;
  nickname: string | null;
  isAdmin: boolean;
  createdAt: string;
  enrollmentCount: number;
};

export async function listAllUsersForAdmin(): Promise<AdminUserRow[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke('list-users', {
    headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) throw error;
  if (!data?.users || !Array.isArray(data.users)) {
    throw new Error('Respons tidak valid dari server');
  }
  return data.users as AdminUserRow[];
}

export async function getVideoCompletions(userId: string, classId: string): Promise<Set<number>> {
  const { data, error } = await supabase
    .from('video_completions')
    .select('video_index')
    .eq('user_id', userId)
    .eq('class_id', classId);
  if (error) throw error;
  return new Set((data ?? []).map((r: any) => r.video_index as number));
}

export async function markVideoCompleted(params: {
  userId: string;
  classId: string;
  videoIndex: number;
}): Promise<void> {
  const { error } = await supabase
    .from('video_completions')
    .upsert(
      { user_id: params.userId, class_id: params.classId, video_index: params.videoIndex },
      { onConflict: 'user_id,class_id,video_index' },
    );
  if (error) throw error;
}
