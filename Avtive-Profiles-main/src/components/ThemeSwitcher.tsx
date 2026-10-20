'use client';

import React from 'react';
import { usePortfolioTheme, PortfolioTheme } from '@/context/ThemeContext';
import { BookOpen, Terminal, Sparkles } from 'lucide-react';

interface ThemeOption {
  id: PortfolioTheme;
  name: string;
  tag: string;
  icon: React.ElementType;
  description: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'editorial',
    name: 'Editorial',
    tag: 'Light',
    icon: BookOpen,
    description: 'High-end magazine aesthetic, serif typography, terracotta accents'
  },
  {
    id: 'cyber',
    name: 'Cyber',
    tag: 'Dark',
    icon: Terminal,
    description: 'Developer terminal workspace, monospace code, emerald neon'
  },
  {
    id: 'luxe',
    name: 'Luxe',
    tag: 'Plum',
    icon: Sparkles,
    description: 'Artistic velvet luxury, rich plum burgundy, rose gold aura'
  }
];

interface ThemeSwitcherProps {
  variant?: 'floating' | 'inline';
  className?: string;
}

export function ThemeSwitcher({ variant = 'floating', className = '' }: ThemeSwitcherProps) {
  const { theme, setTheme } = usePortfolioTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme selection"
      className={`relative inline-flex items-center p-1 rounded-full backdrop-blur-xl transition-all duration-300 shadow-lg ${
        variant === 'floating'
          ? 'fixed bottom-6 right-6 z-50 bg-[var(--bg-card)]/90 border border-[var(--border-color)] shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
          : 'bg-[var(--bg-elevated)] border border-[var(--border-color)]'
      } ${className}`}
    >
      {THEME_OPTIONS.map((opt) => {
        const isActive = theme === opt.id;
        const Icon = opt.icon;

        return (
          <button
            key={opt.id}
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(opt.id)}
            title={`${opt.name} — ${opt.description}`}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 select-none ${
              isActive
                ? 'bg-[var(--accent)] text-white shadow-md scale-[1.02]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? 'scale-110' : 'opacity-70'}`} />
            <span className="font-medium tracking-tight">{opt.name}</span>
            {isActive && (
              <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider font-mono opacity-90 pl-0.5">
                ●
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
