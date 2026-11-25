'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wifi,
  Battery,
  Signal,
  Lock,
  LogOut,
  Sun,
  Moon,
  LayoutGrid,
  Smartphone,
  Tv
} from 'lucide-react';
import { usePortfolioTheme } from '@/context/ThemeContext';

export interface DualScreenWorkspaceProps {
  workflowTitle?: string;
  workflowSubtitle?: string;
  currentUrlPath?: string;
  desktopContent: React.ReactNode;
  mobileContent: React.ReactNode;
  desktopToolbarRight?: React.ReactNode;
  mobileToolbarRight?: React.ReactNode;
  headerCenterPill?: React.ReactNode;
  badgeText?: string;
  className?: string;
  isSaving?: boolean;
  showWindowHeader?: boolean;
  stageBackgroundStyle?: React.CSSProperties;
}

export function DualScreenWorkspace({
  currentUrlPath = '/app',
  desktopContent,
  mobileContent,
  desktopToolbarRight,
  className = '',
  showWindowHeader = true,
  stageBackgroundStyle
}: DualScreenWorkspaceProps) {
  const { isDark, toggleDarkMode } = usePortfolioTheme();
  const [mobileActiveView, setMobileActiveView] = useState<'editor' | 'preview'>('editor');

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      try {
        sessionStorage.removeItem('avtive_active_session');
      } catch { }
      window.location.replace('/login');
    }
  };

  return (
    <div
      style={stageBackgroundStyle}
      className={`w-full min-h-[100vh] min-h-[100dvh] h-[100vh] h-[100dvh] max-h-[100dvh] flex flex-col justify-start ${stageBackgroundStyle ? 'bg-transparent' : 'bg-white dark:bg-black'} text-zinc-950 dark:text-zinc-100 font-sans selection:bg-zinc-900/20 dark:selection:bg-white/25 transition-colors duration-200 overflow-hidden box-border pt-[max(0rem,env(safe-area-inset-top))] pb-[max(0rem,env(safe-area-inset-bottom))] pl-[max(0rem,env(safe-area-inset-left))] pr-[max(0rem,env(safe-area-inset-right))] ${className}`}
    >

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* PERMANENT TWIN-SCREEN STAGE CONTAINER                                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 h-full min-h-0 w-full p-0 sm:p-3.5 lg:p-4 2xl:p-6 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-0 sm:gap-4 lg:gap-5 2xl:gap-6 max-w-[1920px] mx-auto box-border min-w-0 overflow-y-auto overflow-x-hidden">

        {/* ======================================================================= */}
        {/* SCREEN 1: DESKTOP WORKING SCREEN (Clean Minimalist Window)              */}
        {/* ======================================================================= */}
        <section
          aria-label="Desktop Working Screen"
          className={`${mobileActiveView === 'preview' ? 'hidden xl:flex' : 'flex'
            } flex-1 h-full min-h-0 w-full min-w-0 max-w-[1240px] flex-col rounded-none sm:rounded-2xl lg:rounded-3xl border-0 sm:border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0A0A0A] shadow-none sm:shadow-xl shadow-black/5 dark:shadow-2xl dark:shadow-black/60 overflow-hidden transition-colors box-border relative`}
        >
          {/* Desktop Browser Window Header Frame */}
          {showWindowHeader && (
            <div className="w-full bg-zinc-50/90 dark:bg-[#0A0A0A] border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 shrink-0 transition-colors box-border">

              {/* Left: Window Controls + Mobile View Toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80 inline-block border border-rose-600/40" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80 inline-block border border-amber-600/40" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80 inline-block border border-emerald-600/40" />

                {/* Mobile (< xl) Toggle Icon Button: Switch between Editor and Phone Chassis */}
                <button
                  type="button"
                  onClick={() => setMobileActiveView('preview')}
                  title="Switch to Mobile Phone Preview"
                  aria-label="View Mobile Preview"
                  className="xl:hidden ml-1 min-h-[44px] px-2.5 py-1.5 rounded-lg text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  <Smartphone className="w-4 h-4 text-zinc-900 dark:text-white" />
                  <span className="hidden xs:inline">Preview</span>
                </button>
              </div>

              {/* Desktop URL Address Bar */}
              <div className="flex-1 max-w-sm mx-auto hidden sm:flex items-center justify-center gap-2 px-3 py-1 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 transition-colors truncate">
                <Lock className="w-3 h-3 text-zinc-700 dark:text-zinc-300 shrink-0" />
                <span className="text-zinc-400">https://</span>
                <span className="text-zinc-950 dark:text-white font-semibold truncate">avtive.platform{currentUrlPath}</span>
              </div>

              {/* Desktop Inside Functional Actions Toolbar */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {desktopToolbarRight}

                <Link
                  href="/dashboard"
                  title="Workspaces Dashboard"
                  aria-label="Dashboard"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={toggleDarkMode}
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  aria-label="Toggle Theme"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  aria-label="Logout"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/15 border border-rose-500/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Desktop Screen Canvas Workspace */}
          <div className="flex-1 h-full min-h-0 w-full overflow-hidden flex flex-col bg-zinc-50 dark:bg-black transition-colors box-border">
            {desktopContent}
          </div>
        </section>

        {/* ======================================================================= */}
        {/* SCREEN 2: MOBILE WORKING SCREEN (Exact 375×667 Smartphone Chassis)      */}
        {/* Shown alongside working screen on desktop (>= xl); toggled on mobile    */}
        {/* ======================================================================= */}
        <aside
          aria-label="Mobile Working Screen"
          className={`${mobileActiveView === 'preview' ? 'flex' : 'hidden xl:flex'
            } w-full max-w-[340px] sm:max-w-[360px] 2xl:max-w-[375px] min-w-0 shrink-0 flex-col items-center justify-start sticky top-2 sm:top-3 lg:top-4 self-center xl:self-start box-border transition-colors my-auto`}
        >
          {/* Mobile Floating Back-to-Editor Banner (< xl only) */}
          <div className="xl:hidden flex items-center justify-between w-full px-2 py-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
              <span>Mobile Phone Preview</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileActiveView('editor')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              aria-label="Back to Editor"
            >
              <Tv className="w-4 h-4 text-zinc-900 dark:text-white shrink-0" />
              <span>Back to Editor</span>
            </button>
          </div>

          {/* Smartphone Chassis Frame (Responsive, fits viewport height at 100% zoom) */}
          <div className="w-full max-w-[340px] sm:max-w-[360px] 2xl:max-w-[375px] h-[min(667px,calc(100dvh-2rem))] sm:h-[min(667px,calc(100dvh-2.5rem))] rounded-[32px] sm:rounded-[38px] 2xl:rounded-[40px] border-[5px] sm:border-[6px] border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black shadow-xl shadow-black/10 dark:shadow-2xl dark:shadow-black/80 flex flex-col overflow-hidden relative ring-1 ring-black/5 dark:ring-white/10 transition-colors box-border">

            {/* Phone Top Notch / Dynamic Island + 9:41 Status Bar */}
            <div className="w-full bg-zinc-100 dark:bg-black pt-2 px-4 pb-1 flex items-center justify-between text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 shrink-0 border-b border-zinc-200 dark:border-zinc-800 select-none transition-colors">
              <span>9:41</span>
              {/* Dynamic Island Pill */}
              <div className="w-20 h-4 rounded-full bg-slate-900 dark:bg-black border border-slate-700 dark:border-white/10 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-900 border border-slate-600 dark:border-white/20" />
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Mobile Screen Content Canvas: Fixed 375px internal website design viewport */}
            <div className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden flex flex-col items-center bg-white dark:bg-[#050913] transition-colors box-border">
              <div className="w-full max-w-full flex-1 min-h-0 flex flex-col overflow-x-hidden box-border">
                {mobileContent}
              </div>
            </div>

            {/* Phone Bottom Home Indicator Bar */}
            <div className="w-full py-1.5 bg-slate-100/90 dark:bg-[#090E1B] flex items-center justify-center shrink-0 border-t border-slate-200 dark:border-white/5 transition-colors">
              <div className="w-28 h-1 rounded-full bg-slate-400 dark:bg-white/30 transition-colors" />
            </div>

          </div>
        </aside>

      </div>

    </div>
  );
}
