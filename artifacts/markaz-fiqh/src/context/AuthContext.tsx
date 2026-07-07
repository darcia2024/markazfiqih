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
    const res = await fetch(`/api/user-profile?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const data = await res.json() as { nickname: string | null };
    return data.nickname ?? null;
  } catch {
    return null;
  }
}

async function fetchIsAdmin(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return false;
    const data = await res.json() as { isAdmin: boolean };
    return data.isAdmin ?? false;
  } catch {
    return false;
  }
}

async function buildUser(supabaseUser: SupabaseUser, session: Session): Promise<User> {
  const [nickname, isAdmin] = await Promise.all([
    fetchNickname(supabaseUser.id),
    fetchIsAdmin(session.access_token),
  ]);
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
    setUser((prev) => (prev ? { ...prev, nickname } : prev));
    fetch('/api/user-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, nickname }),
    }).catch((err) => console.error('Gagal simpan nickname:', err));
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
