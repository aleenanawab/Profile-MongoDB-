'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileData } from '@/types/profile';
import { ProfileEditorProvider, useProfileEditor } from '@/context/ProfileEditorContext';
import { usePortfolioTheme } from '@/context/ThemeContext';
import { DesktopProfileSidebar } from '@/components/profiles/DesktopProfileSidebar';
import { ProfileSectionTabBar } from '@/components/profiles/ProfileSectionTabBar';
import { DesktopProfileContent } from '@/components/profiles/DesktopProfileContent';
import { ProfileSwitcher } from '@/components/profiles/ProfileSwitcher';
import { 
  ArrowLeft, 
  ExternalLink, 
  Save, 
  Loader2, 
  Signal, 
  Wifi, 
  Battery,
  LogOut,
  Menu,
  X,
  ArrowRight,
  Sun,
  Moon,
  Smartphone
} from 'lucide-react';

export interface EditProfileClientProps {
  initialProfile: ProfileData;
  userProfiles?: ProfileData[];
  onReturnToView?: (updatedProfile?: ProfileData) => void;
  onCancel?: () => void;
  onSaveProfile?: (savedProfile?: ProfileData) => void;
}

export function EditProfileClient({ 
  initialProfile, 
  userProfiles, 
  onReturnToView,
  onCancel,
  onSaveProfile
}: EditProfileClientProps) {
  const router = useRouter();

  const handleSavedProfileUpdate = (saved?: ProfileData) => {
    const fresh = saved || initialProfile;
    onSaveProfile?.(fresh);
    if (onReturnToView) {
      onReturnToView(fresh);
    } else {
      const slug = fresh.slug || fresh.id || initialProfile.slug || initialProfile.id;
      if (slug) {
        router.push(`/profile/${encodeURIComponent(slug)}`);
      }
    }
  };

  return (
    <ProfileEditorProvider
      initialProfile={initialProfile}
      userProfiles={userProfiles}
      onSaveSuccess={handleSavedProfileUpdate}
    >
      <EditProfileClientInner
        initialProfile={initialProfile}
        userProfiles={userProfiles}
        onReturnToView={onReturnToView}
        onCancel={onCancel}
        onSaveProfile={onSaveProfile}
      />
    </ProfileEditorProvider>
  );
}

function EditProfileClientInner({ 
  initialProfile, 
  userProfiles, 
  onReturnToView,
  onCancel,
  onSaveProfile 
}: EditProfileClientProps) {
  const router = useRouter();
  const { isDark, toggleDarkMode } = usePortfolioTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isTouchRef = React.useRef(false);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  const { 
    profile, 
    activeSection,
    setActiveSection,
    isSaving, 
    saveProfile, 
    handleSaveChanges, 
    toastMessage, 
    currentIdentifier,
    handleSwitchToProfile
  } = useProfileEditor();

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const startCloseTimer = () => {
    if (isSidebarPinned) return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsSidebarOpen(false);
    }, 280);
  };

  const handleTriggerMouseEnter = () => {
    if (isTouchRef.current) return;
    clearCloseTimer();
    setIsSidebarOpen(true);
  };

  const handleTriggerMouseLeave = () => {
    if (isTouchRef.current) return;
    startCloseTimer();
  };

  const handlePanelMouseEnter = () => {
    if (isTouchRef.current) return;
    clearCloseTimer();
    setIsSidebarOpen(true);
  };

  const handlePanelMouseLeave = () => {
    if (isTouchRef.current) return;
    startCloseTimer();
  };

  const handleTriggerClick = () => {
    clearCloseTimer();
    if (isSidebarOpen && isSidebarPinned) {
      setIsSidebarOpen(false);
      setIsSidebarPinned(false);
    } else {
      setIsSidebarOpen(true);
      setIsSidebarPinned(true);
    }
  };

  const handleCloseSidebar = () => {
    clearCloseTimer();
    setIsSidebarOpen(false);
    setIsSidebarPinned(false);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTriggerClick();
    } else if (e.key === 'Escape') {
      handleCloseSidebar();
    }
  };

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  // Session guard
  useEffect(() => {
    const verifyActiveSession = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json();
        if (!data.user) window.location.replace('/login');
      } catch {
        // Continue in dev or offline
      }
    };
    verifyActiveSession();
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') verifyActiveSession();
    };
    const handlePageShow = (e: PageTransitionEvent) => { if (e.persisted) verifyActiveSession(); };
    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  const identifier = profile.slug || profile.id || initialProfile.slug || initialProfile.id || currentIdentifier;

  // Back button MUST ONLY perform navigation and NEVER save profile data
  const handleBackNavigation = () => {
    if (onCancel) {
      onCancel();
    } else if (onReturnToView) {
      onReturnToView(undefined); // Explicitly undefined so no unsaved changes are applied
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/profile/${encodeURIComponent(identifier)}`);
    }
  };

  // Explicit Save action saves data but preserves mobile preview and stays in editor
  const onGlobalSave = async () => {
    try {
      await saveProfile();
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  // Next button is navigation only — advances to next section without auto-saving or exiting
  const handleTopBarNext = () => {
    const sectionKeys = [
      'profile',
      'personalDetails',
      'skills',
      'projects',
      'education',
      'contactInfo',
      'socialLinks',
      'experience',
      'enhanceProfile',
      'limitations',
      'accountInfo',
      'archive',
      'security',
      'settings'
    ];
    const currentIndex = sectionKeys.indexOf(activeSection);
    if (currentIndex >= 0 && currentIndex < sectionKeys.length - 1) {
      setActiveSection(sectionKeys[currentIndex + 1]);
    } else {
      setActiveSection(sectionKeys[0]);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      try {
        sessionStorage.removeItem('avtive_active_session');
      } catch {}
      window.location.replace('/login');
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-start bg-slate-100 dark:bg-[#070D18] text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden transition-colors">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 text-white text-xs font-semibold shadow-2xl border border-cyan-500/30 backdrop-blur-md animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* PERMANENT TWIN-SCREEN WORKING WORKSPACE (Clean Minimalist Window)          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 h-full min-h-0 w-full p-0 sm:p-3.5 lg:p-4 2xl:p-6 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-0 sm:gap-4 lg:gap-5 2xl:gap-6 max-w-[1920px] mx-auto min-w-0 box-border overflow-hidden">
        
        {/* ======================================================================= */}
        {/* WORKING SCREEN 1: DESKTOP PROFILE STUDIO EDITOR                        */}
        {/* ======================================================================= */}
        <section 
          aria-label="Desktop Working Screen"
          className={`${
            mobileView === 'preview' ? 'hidden xl:flex' : 'flex'
          } flex-1 h-full min-h-0 w-full min-w-0 max-w-[1240px] flex-col rounded-none sm:rounded-2xl lg:rounded-3xl border-0 sm:border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A101E] shadow-none sm:shadow-xl dark:shadow-2xl dark:shadow-black/60 overflow-hidden transition-colors`}
        >
          {/* Desktop Frame Window Bar */}
          <div className="w-full bg-slate-50 dark:bg-[#0E1528] border-b border-slate-200 dark:border-white/10 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 transition-colors overflow-x-auto sm:overflow-visible">
            
            {/* macOS Window Controls + Hamburger Toggle Button */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block border border-rose-600/40" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block border border-amber-600/40" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block border border-emerald-600/40" />
              </div>

              {/* Sections Trigger Button: Hover to Open + Click/Tap + Keyboard */}
              <button
                type="button"
                onClick={handleTriggerClick}
                onMouseEnter={handleTriggerMouseEnter}
                onMouseLeave={handleTriggerMouseLeave}
                onTouchStart={() => { isTouchRef.current = true; }}
                onKeyDown={handleTriggerKeyDown}
                aria-expanded={isSidebarOpen}
                aria-haspopup="true"
                aria-label={isSidebarOpen ? "Close section sidebar" : "Open section sidebar"}
                title={isSidebarOpen ? "Close Sections Menu" : "Open Sections Menu (Hover to open)"}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  isSidebarOpen
                    ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-200 dark:border-white/10'
                }`}
              >
                {isSidebarOpen ? (
                  <X className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                ) : (
                  <Menu className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                )}
                <span className="text-[11px] font-medium">Sections</span>
              </button>
            </div>

            {/* Navigation Back Button - Navigation ONLY, Never Saves */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleBackNavigation}
                aria-label="Back"
                title="Back to previous screen"
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inside Action Buttons: Functional Buttons Moved Inside Screen (Save, Theme, Logout) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={onGlobalSave}
                disabled={isSaving}
                aria-label="Save Changes"
                title="Save Changes"
                className="h-8 px-3 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 dark:hover:from-cyan-400 dark:hover:to-blue-500 text-white shadow-2xs dark:shadow-md dark:shadow-cyan-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95 shrink-0"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>

              {/* Mobile Editor/Preview Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileView(prev => prev === 'editor' ? 'preview' : 'editor')}
                aria-label={mobileView === 'editor' ? "View Mobile Preview" : "View Editor"}
                title={mobileView === 'editor' ? "Switch to Phone Preview" : "Switch to Editor"}
                className="xl:hidden w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer shrink-0 active:scale-95"
              >
                {mobileView === 'editor' ? (
                  <Smartphone className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                ) : (
                  <Menu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                )}
              </button>

              {/* Minimal Light/Dark Theme Toggle: icon only, no text */}
              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label="Toggle Theme"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer shrink-0 active:scale-95"
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign Out"
                title="Logout"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/15 border border-rose-200 dark:border-rose-500/20 transition-colors cursor-pointer shrink-0 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Desktop Editor Canvas (Relative container for slide-in drawer) */}
          <div className="flex-1 w-full min-h-0 overflow-hidden flex flex-row relative">
            
            {/* Animated Slide-In Sidebar Drawer on the Same Desktop Screen */}
            <AnimatePresence>
              {isSidebarOpen && (
                <>
                  {/* Backdrop inside Desktop Screen Canvas */}
                  <motion.div
                    key="desktop-sidebar-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleCloseSidebar}
                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-30 cursor-pointer"
                  />

                  {/* Slide-In Drawer Panel with Hover Buffer */}
                  <motion.div
                    key="desktop-sidebar-drawer"
                    initial={{ x: -340, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -340, opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                    onMouseEnter={handlePanelMouseEnter}
                    onMouseLeave={handlePanelMouseLeave}
                    className="absolute top-0 bottom-0 left-0 z-40 h-full shadow-2xl max-w-full"
                  >
                    <DesktopProfileSidebar 
                      onClose={handleCloseSidebar} 
                      onSelectSection={() => {
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          setIsSidebarOpen(false);
                        }
                      }}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Left Edge Hover Trigger Strip (Like Chrome vertical tabs / Instagram Web) */}
            {!isSidebarOpen && (
              <div
                onMouseEnter={handleTriggerMouseEnter}
                onMouseLeave={handleTriggerMouseLeave}
                onClick={handleTriggerClick}
                onTouchStart={() => { isTouchRef.current = true; }}
                title="Hover or click to open Sections"
                className="flex flex-col items-center justify-start pt-3 w-3 sm:w-2.5 hover:w-6 hover:bg-cyan-500/10 border-r border-transparent hover:border-cyan-500/20 transition-all duration-200 cursor-pointer z-20 group shrink-0"
              >
                <div className="w-1 h-6 rounded-full bg-slate-300 dark:bg-white/20 group-hover:bg-cyan-500 transition-colors" />
              </div>
            )}

            {/* Main Desktop Profile Editor Content */}
            <div className="flex-1 w-full h-full min-h-0 min-w-0 overflow-hidden">
              <DesktopProfileContent hideRightPreview={true} instanceId="desktop" />
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* WORKING SCREEN 2: MOBILE SMARTPHONE WORKING EDITOR (Standard 375×667)   */}
        {/* ======================================================================= */}
        <aside 
          aria-label="Mobile Working Screen"
          className={`${
            mobileView === 'preview' ? 'flex' : 'hidden xl:flex'
          } w-full max-w-[340px] sm:max-w-[360px] 2xl:max-w-[375px] min-w-0 shrink-0 flex-col items-center justify-start sticky top-2 sm:top-3 lg:top-4 self-center xl:self-start box-border transition-colors`}
        >
          {/* Smartphone Chassis Frame (Responsive, fits viewport height at 100% zoom) */}
          <div className="w-full max-w-[340px] sm:max-w-[360px] 2xl:max-w-[375px] h-[min(667px,calc(100dvh-2rem))] sm:h-[min(667px,calc(100dvh-2.5rem))] rounded-[32px] sm:rounded-[38px] 2xl:rounded-[40px] border-[5px] sm:border-[6px] border-slate-300 dark:border-slate-800 bg-white dark:bg-[#090E1B] shadow-2xl shadow-slate-400/20 dark:shadow-black/80 flex flex-col overflow-hidden relative ring-1 ring-slate-200 dark:ring-white/10 transition-colors min-h-0 box-border">
            
            {/* Phone Status Bar (9:41, Wifi, Battery) */}
            <div className="w-full bg-slate-100 dark:bg-[#090E1B] pt-2 px-4 pb-1 flex items-center justify-between text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 shrink-0 border-b border-slate-200 dark:border-white/5 select-none transition-colors">
              <div className="flex items-center gap-2">
                <span>9:41</span>
                {mobileView === 'preview' && (
                  <button
                    type="button"
                    onClick={() => setMobileView('editor')}
                    aria-label="Back to Editor"
                    className="xl:hidden px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
                  >
                    ← Editor
                  </button>
                )}
              </div>
              <div className="w-20 h-4 rounded-full bg-slate-900 dark:bg-black border border-slate-700 dark:border-white/10 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-900 border border-slate-600 dark:border-white/20" />
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Mobile Editor Canvas: Renders the SAME Profile Editor in 375px viewport */}
            <div className="flex-1 w-full min-h-0 overflow-hidden flex flex-col bg-slate-50 dark:bg-[#050811] transition-colors">
              <DesktopProfileContent hideRightPreview={true} instanceId="mobile" />
            </div>

            {/* Phone Bottom Home Bar */}
            <div className="w-full py-1.5 bg-slate-100 dark:bg-[#090E1B] flex items-center justify-center shrink-0 border-t border-slate-200 dark:border-white/5 transition-colors">
              <div className="w-28 h-1 rounded-full bg-slate-400 dark:bg-white/30" />
            </div>

          </div>
        </aside>

      </main>

    </div>
  );
}
