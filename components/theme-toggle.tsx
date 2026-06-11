"use client";

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const current = theme === 'system' ? resolvedTheme : theme;

  return (
    <button
      type="button"
      className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-text hover:bg-codebg"
      onClick={() => setTheme(current === 'dark' ? 'light' : 'dark')}
      aria-label="Cambiar tema"
    >
      {current === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
