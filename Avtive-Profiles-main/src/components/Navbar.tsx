'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePortfolioTheme } from '@/context/ThemeContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LayoutGrid, Menu, X, ArrowUpRight } from 'lucide-react';

export function Navbar() {
  const { theme } = usePortfolioTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '#hero' },
    { name: 'Projects', href: '#projects' },
    { name: 'Skills', href: '#skills' },
    { name: 'Experience', href: '#experience' },
    { name: 'Contact', href: '#contact' }
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'py-3 bg-[var(--bg-card)]/90 backdrop-blur-xl border-b border-[var(--border-color)] shadow-xs'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        
        {/* Brand Logo / Initials */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div 
            style={{
              borderRadius: theme === 'luxe' ? '9999px' : 'var(--radius-sm)'
            }}
            className="w-9 h-9 bg-[var(--accent)] text-white flex items-center justify-center font-bold text-sm font-mono shadow-xs transition-transform group-hover:scale-105"
          >
            AN
          </div>
          <div>
            <span className="font-bold text-sm sm:text-base font-heading text-[var(--text-primary)] tracking-tight">
              Aleena Nawab
            </span>
            <span className="hidden sm:inline-block text-[10px] text-[var(--accent)] font-mono ml-2 uppercase tracking-wider font-semibold">
              ● {theme}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[var(--text-secondary)]">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="hover:text-[var(--accent)] transition-colors py-1 relative group"
            >
              <span>{link.name}</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--accent)] transition-all group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Right Action Controls: Theme Switcher & Dashboard link */}
        <div className="flex items-center gap-2.5">
          {/* Theme Switcher Widget in Header */}
          <div className="hidden lg:block">
            <ThemeSwitcher variant="inline" />
          </div>

          {/* Workspaces / Dashboard Link */}
          <Link
            href="/dashboard"
            style={{
              borderRadius: theme === 'luxe' ? '9999px' : 'var(--radius-btn)'
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[var(--bg-elevated)] hover:bg-[var(--accent)] hover:text-white text-[var(--text-primary)] border border-[var(--border-color)] transition-all duration-300 shadow-2xs"
            title="Avtive Multi-Profile Workspaces Dashboard"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Workspaces</span>
            <ArrowUpRight className="w-3 h-3 opacity-70" />
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg md:hidden text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3 pb-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] py-1.5 px-2 rounded-md hover:bg-[var(--bg-elevated)] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Mobile Theme Switcher Bar */}
          <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
            <span className="text-xs font-mono text-[var(--text-muted)]">Theme Mode:</span>
            <ThemeSwitcher variant="inline" />
          </div>
        </div>
      )}
    </header>
  );
}
