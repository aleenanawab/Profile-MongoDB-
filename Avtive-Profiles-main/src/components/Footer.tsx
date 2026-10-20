'use client';

import React from 'react';
import Link from 'next/link';
import { usePortfolioTheme } from '@/context/ThemeContext';
import { ArrowUp, Heart, Terminal, Sparkles, BookOpen } from 'lucide-react';

export function Footer() {
  const { theme } = usePortfolioTheme();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-surface)] py-12 px-4 sm:px-6 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Left: Brand & Copyright */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div 
            style={{
              borderRadius: theme === 'luxe' ? '9999px' : 'var(--radius-sm)'
            }}
            className="w-8 h-8 bg-[var(--accent)] text-white flex items-center justify-center font-bold text-xs font-mono"
          >
            AN
          </div>
          <div>
            <p className="text-xs font-bold font-heading text-[var(--text-primary)]">
              Aleena Nawab • Portfolio & Systems Architecture
            </p>
            <p className="text-[11px] text-[var(--text-muted)] font-body">
              © {new Date().getFullYear()} All rights reserved. Powered by Next.js & Turbopack.
            </p>
          </div>
        </div>

        {/* Center: Theme Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]">
          {theme === 'cyber' && <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />}
          {theme === 'luxe' && <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />}
          {theme === 'editorial' && <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />}
          <span className="capitalize">Theme: {theme}</span>
        </div>

        {/* Right: Workspaces Link & Scroll to top */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            Workspaces Dashboard
          </Link>
          <span className="text-[var(--text-muted)]">•</span>
          <button
            onClick={scrollToTop}
            style={{
              borderRadius: theme === 'luxe' ? '9999px' : 'var(--radius-btn)'
            }}
            className="p-2 bg-[var(--bg-elevated)] hover:bg-[var(--accent)] hover:text-white text-[var(--text-secondary)] border border-[var(--border-color)] transition-all"
            title="Scroll to top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
