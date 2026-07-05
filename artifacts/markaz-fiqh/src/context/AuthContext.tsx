import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
};

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (redirect?: string) => void;
  logout: () => void;
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
      const mockUser: User = {
        id: "mock-1",
        name: "Ahmad Fauzi",
        email: "ahmad@example.com",
        avatar_url: "https://ui-avatars.com/api/?name=Ahmad+Fauzi&background=064e3b&color=fff"
      };
      setUser(mockUser);
      localStorage.setItem('markaz_mock_user', JSON.stringify(mockUser));
      setIsLoading(false);
      setLocation(redirect || '/');
    }, 500);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('markaz_mock_user');
    setLocation('/');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
