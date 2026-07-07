// src/lib/db.ts
// Semua fungsi query langsung ke Supabase — bypass backend Express.
import { supabase } from './supabase';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type EnrollmentItem = {
  id: string;
  enrolledAt: string;
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

// ─── CLASSES ─────────────────────────────────────────────────────────────────

export async function listClasses(params?: {
  search?: string;
  category?: string;
  level?: string;
  instructorId?: string;
}) {
  let query = supabase
    .from('classes')
    .select(`
      id, title, description, cover_image, base_price, discount_price,
      status, level, category, youtube_playlist_id,
      instructors ( id, name, photo_url ),
      modules ( id, dars ( id, duration_minutes ) )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

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
      status, level, category, youtube_playlist_id, gdrive_materi_url, wa_group_url,
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
    instructor: inst
      ? { id: inst.id, name: inst.name, photoUrl: inst.photo_url, bio: inst.bio ?? '' }
      : { id: '', name: 'Pengajar', photoUrl: '', bio: '' },
    modules,
    moduleCount: modules.length,
    totalDurationMinutes: modules
      .flatMap((m) => m.dars)
      .reduce((acc, d) => acc + (d.durationMinutes ?? 0), 0),
  };
}

// ─── INSTRUCTORS ──────────────────────────────────────────────────────────────

export async function listInstructors() {
  const { data, error } = await supabase
    .from('instructors')
    .select('id, name, bio, photo_url')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((i: any) => ({
    id: i.id as string,
    name: i.name as string,
    bio: i.bio as string | null,
    photoUrl: i.photo_url as string,
  }));
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
  };
}

// ─── CART ─────────────────────────────────────────────────────────────────────

export async function listCartItems(userId: string) {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id, class_id, added_at,
      classes (
        id, title, cover_image, base_price, discount_price,
        instructors ( id, name, photo_url ),
        modules ( id, dars ( id, duration_minutes ) )
      )
    `)
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? [])
    .filter((item: any) => item.classes != null)
    .map((item: any) => {
      const cls = item.classes;
      const modules = cls.modules ?? [];
      const dars = modules.flatMap((m: any) => m.dars ?? []);
      return {
        id: item.id as string,
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
    });
}

export async function addCartItem(userId: string, classId: string) {
  const { error } = await supabase
    .from('cart_items')
    .insert({ user_id: userId, class_id: classId });
  if (error) throw error;
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
    .eq('user_id', userId);
  if (error) throw error;

  return (data ?? [])
    .filter((e: any) => e.classes != null)
    .map((e: any) => {
      const cls = e.classes;
      const modules = cls.modules ?? [];
      const dars = modules.flatMap((m: any) => m.dars ?? []);
      return {
        id: e.id as string,
        enrolledAt: e.enrolled_at as string,
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
          completedDarsCount: 0, // Progress tracking akan diimplementasi terpisah
          totalDurationMinutes: dars.reduce(
            (acc: number, d: any) => acc + (d.duration_minutes ?? 0),
            0,
          ) as number,
        },
      };
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
