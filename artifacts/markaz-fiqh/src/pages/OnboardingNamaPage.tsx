import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OnboardingNamaPage() {
  const { user, setNickname } = useAuth();
  const [, setLocation] = useLocation();
  const [inputValue, setInputValue] = useState('');

  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get('redirect') ?? '/';

  useEffect(() => {
    if (user?.nickname) {
      setLocation(redirectUrl);
    }
  }, [user, redirectUrl, setLocation]);

  if (user?.nickname) {
    return null;
  }

  const handleContinue = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setNickname(trimmed);
    setLocation(redirectUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-primary">Markaz Fiqh</span>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Siapa nama panggilan kamu?
          </h2>
          <p className="text-muted-foreground">
            Supaya kami bisa menyapamu dengan lebih akrab.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <Input
            type="text"
            placeholder="Contoh: Ahmad"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleContinue();
            }}
            className="h-12 text-base text-center"
            autoFocus
          />
          <Button
            size="lg"
            className="w-full h-12 text-base font-medium"
            disabled={!inputValue.trim()}
            onClick={handleContinue}
          >
            Lanjutkan
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
