import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { type User as SupabaseUser, type Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { checkAdminInvite } from '@/lib/db';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  nickname: string | null;
  isAdmin: boolean;
};

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (redirect?: string) => void;
  logout: () => void;
  setNickname: (nickname: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserProfile(userId: string): Promise<{ nickname: string | null; isAdmin: boolean }> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('nickname, is_admin')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return { nickname: null, isAdmin: false };
    return {
      nickname: data?.nickname ?? null,
      isAdmin: data?.is_admin ?? false,
    };
  } catch {
    return { nickname: null, isAdmin: false };
  }
}

async function buildUser(supabaseUser: SupabaseUser, _session: Session): Promise<User> {
  const { nickname, isAdmin } = await fetchUserProfile(supabaseUser.id);
  return {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email ?? 'Pengguna',
    email: supabaseUser.email ?? '',
    avatar_url: supabaseUser.user_metadata?.avatar_url ?? '',
    nickname,
    isAdmin,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    let mounted = true;
    // Dua sumber bisa menyelesaikan status loading: getSession() ATAU event
    // pertama dari onAuthStateChange (termasuk INITIAL_SESSION). Siapapun
    // yang selesai lebih dulu yang menentukan. Ini penting karena getSession()
    // diketahui bisa "menggantung" tanpa pernah resolve di beberapa kondisi
    // supabase-js v2 (deadlock Web Locks API), terutama di mode
    // incognito/private browsing pada kunjungan pertama — jadi kita tidak
    // boleh bergantung padanya sendirian.
    let settled = false;

    const settleLoading = () => {
      if (mounted && !settled) {
        settled = true;
        setIsLoading(false);
      }
    };

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user) {
          const appUser = await buildUser(session.user, session);
          if (mounted) setUser(appUser);
        }
        settleLoading();
      })
      .catch((error) => {
        console.error('AuthContext: getSession() gagal:', error);
        settleLoading();
      });

    // Fallback terakhir: kalau setelah beberapa detik status loading belum
    // juga selesai (getSession() menggantung DAN onAuthStateChange belum
    // sempat memberi event apapun), jangan biarkan spinner nyangkut selamanya.
    // Anggap belum login — ProtectedRoute akan menampilkan halaman login.
    const timeoutId = setTimeout(() => {
      if (!settled) {
        console.warn('AuthContext: sesi tidak selesai dimuat dalam 8 detik, menganggap belum login.');
      }
      settleLoading();
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (session?.user) {
          let appUser = await buildUser(session.user, session);
          if (mounted) setUser(appUser);
          settleLoading();

          // Hanya saat SIGNED_IN (login pertama sesi ini), bukan setiap kali
          // auth state berubah, supaya tidak dipanggil berulang-ulang untuk
          // user yang sudah lama login.
          if (event === 'SIGNED_IN') {
            try {
              const { promoted } = await checkAdminInvite();
              if (promoted && mounted) {
                appUser = await buildUser(session.user, session);
                if (mounted) setUser(appUser);
              }
            } catch (error) {
              console.error('Gagal memeriksa undangan admin:', error);
            }
          }
        } else {
          if (mounted) setUser(null);
          settleLoading();
        }
      },
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const login = (redirect?: string) => {
    const destination = redirect && redirect !== '/' ? redirect : '/dashboard';
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login?redirect=${encodeURIComponent(destination)}`,
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLocation('/');
  };

  const setNickname = (nickname: string) => {
    setUser((prev) => (prev ? { ...prev, nickname } : prev));
    if (user?.id) {
      supabase
        .from('user_profiles')
        .upsert(
          { user_id: user.id, nickname, updated_at: new Date().toISOString() },
          { onConflict: 'user_id', ignoreDuplicates: false },
        )
        .then(({ error }) => {
          if (error) console.error('Gagal simpan nickname:', error);
        });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setNickname }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
