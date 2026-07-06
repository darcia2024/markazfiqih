import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  nickname: string | null;
};

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (redirect?: string) => void;
  logout: () => void;
  setNickname: (nickname: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('markaz_mock_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // ignore parse error
      }
    }
    setIsLoading(false);
  }, []);

  const login = (redirect?: string) => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      // Pertahankan nickname yang sudah ada kalau user login ulang
      let existingNickname: string | null = null;
      const storedUser = localStorage.getItem('markaz_mock_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as User;
          existingNickname = parsed.nickname ?? null;
        } catch (e) {
          // ignore parse error
        }
      }

      const mockUser: User = {
        id: "mock-1",
        name: "Ahmad Fauzi",
        email: "ahmad@example.com",
        avatar_url: "https://ui-avatars.com/api/?name=Ahmad+Fauzi&background=064e3b&color=fff",
        nickname: existingNickname,
      };
      setUser(mockUser);
      localStorage.setItem('markaz_mock_user', JSON.stringify(mockUser));
      setIsLoading(false);

      // Jika tidak ada redirect spesifik (default '/'), arahkan ke /dashboard
      const destination = redirect && redirect !== '/' ? redirect : '/dashboard';

      if (mockUser.nickname) {
        setLocation(destination);
      } else {
        setLocation(`/onboarding-nama?redirect=${encodeURIComponent(destination)}`);
      }
    }, 500);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('markaz_mock_user');
    setLocation('/');
  };

  const setNickname = (nickname: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: User = { ...prev, nickname };
      localStorage.setItem('markaz_mock_user', JSON.stringify(updated));
      return updated;
    });
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
