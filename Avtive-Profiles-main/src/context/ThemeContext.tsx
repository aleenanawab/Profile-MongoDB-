'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type PortfolioTheme = 'editorial' | 'cyber' | 'luxe';

interface ThemeContextType {
  theme: PortfolioTheme;
  setTheme: (theme: PortfolioTheme) => void;
  cycleTheme: () => void;
  isDark: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (val: boolean) => void;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<PortfolioTheme>('editorial');
  const [isDark, setIsDarkState] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const syncTheme = () => {
      try {
        const saved = localStorage.getItem('portfolio_theme') as PortfolioTheme;
        if (saved && (saved === 'editorial' || saved === 'cyber' || saved === 'luxe')) {
          setThemeState(saved);
          document.documentElement.setAttribute('data-theme', saved);
        } else {
          document.documentElement.setAttribute('data-theme', 'editorial');
        }

        const savedPref = localStorage.getItem('avtive_theme_pref');
        const hasDark = savedPref === 'dark' || (!savedPref && (document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches));
        setIsDarkState(hasDark);
        if (hasDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch {
        document.documentElement.setAttribute('data-theme', 'editorial');
      }
    };

    syncTheme();
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const setTheme = (newTheme: PortfolioTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('portfolio_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    } catch (e) {
      console.error('Failed to save theme in localStorage', e);
    }
  };

  const cycleTheme = () => {
    const order: PortfolioTheme[] = ['editorial', 'cyber', 'luxe'];
    const nextIndex = (order.indexOf(theme) + 1) % order.length;
    setTheme(order[nextIndex]);
  };

  const setDarkMode = (dark: boolean) => {
    setIsDarkState(dark);
    try {
      if (dark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('avtive_theme_pref', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('avtive_theme_pref', 'light');
      }
    } catch (e) {
      console.error('Failed to update dark mode in localStorage', e);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, isDark, toggleDarkMode, setDarkMode, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function usePortfolioTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('usePortfolioTheme must be used within a ThemeProvider');
  }
  return context;
}
