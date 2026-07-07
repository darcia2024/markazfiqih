import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { type User as SupabaseUser, type Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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

async function fetchNickname(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('nickname')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return null;
    return data?.nickname ?? null;
  } catch {
    return null;
  }
}

async function buildUser(supabaseUser: SupabaseUser, _session: Session): Promise<User> {
  const nickname = await fetchNickname(supabaseUser.id);
  return {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email ?? 'Pengguna',
    email: supabaseUser.email ?? '',
    avatar_url: supabaseUser.user_metadata?.avatar_url ?? '',
    nickname,
    isAdmin: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const appUser = await buildUser(session.user, session);
        if (mounted) setUser(appUser);
      }
      if (mounted) setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          const appUser = await buildUser(session.user, session);
          if (mounted) setUser(appUser);
        } else {
          if (mounted) setUser(null);
        }
      },
    );

    return () => {
      mounted = false;
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
    // Tangkap userId sekarang agar tidak stale saat async selesai
    const currentUserId = user?.id;
    const previousNickname = user?.nickname ?? null;
    setUser((prev) => (prev ? { ...prev, nickname } : prev));
    if (currentUserId) {
      supabase
        .from('user_profiles')
        .upsert({ user_id: currentUserId, nickname, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) {
            console.error('Gagal simpan nickname:', error);
            // Rollback ke nickname sebelumnya jika upsert gagal
            setUser((prev) =>
              prev && prev.id === currentUserId
                ? { ...prev, nickname: previousNickname }
                : prev,
            );
          }
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
