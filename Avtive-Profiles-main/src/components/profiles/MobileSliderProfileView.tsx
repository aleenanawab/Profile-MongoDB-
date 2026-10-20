'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Loader2,
  Menu,
  X,
  Sun,
  Moon,
  Eye,
  EyeOff
} from 'lucide-react';
import { useProfileEditor } from '@/context/ProfileEditorContext';
import { usePortfolioTheme } from '@/context/ThemeContext';
import { AvtiveDigitalCard } from '@/components/AvtiveDigitalCard';
import { DESKTOP_SIDEBAR_SECTIONS } from './DesktopProfileSidebar';
import { ProfileSectionTabBar } from './ProfileSectionTabBar';
import { downloadVCard } from '@/lib/vcard';

export interface MobileSliderProfileViewProps {
  onSave?: () => Promise<void>;
  onNext?: () => void;
  className?: string;
}

export function MobileSliderProfileView({ onSave, onNext: _onNext, className = '' }: MobileSliderProfileViewProps) {
  const {
    liveProfile,
    isSaving,
    saveProfile,
    activeSection,
    setActiveSection,
    sectionVisibility,
    handleToggleSectionVisibility
  } = useProfileEditor();

  const { isDark, toggleDarkMode } = usePortfolioTheme();

  // Mobile sections dropdown state (tap to toggle)
  const [isSectionsDropdownOpen, setIsSectionsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click/tap outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSectionsDropdownOpen(false);
      }
    };
    if (isSectionsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isSectionsDropdownOpen]);

  // Unified save handler
  const handleSave = async () => {
    if (onSave) {
      await onSave();
    } else {
      await saveProfile();
    }
  };

  // Automatically scroll mobile preview to matching section whenever activeSection changes
  useEffect(() => {
    if (!activeSection) return;
    if (activeSection === 'profile') {
      previewScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const targetEl =
      previewScrollRef.current?.querySelector(`[data-section="${activeSection}"]`) ||
      previewScrollRef.current?.querySelector(`#section-${activeSection}`) ||
      (activeSection === 'personalDetails' ? previewScrollRef.current?.querySelector(`[data-section="about"]`) : null) ||
      (activeSection === 'contactInfo' ? previewScrollRef.current?.querySelector(`[data-section="contact"]`) : null) ||
      (activeSection === 'socialLinks' ? previewScrollRef.current?.querySelector(`[data-section="socials"]`) : null) ||
      (activeSection === 'enhanceProfile' ? previewScrollRef.current?.querySelector(`[data-section="virtual-card"]`) : null);

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSection]);

  // Section selection
  const handleSelectSection = (sectionKey: string) => {
    const map: Record<string, string> = {
      hero: 'profile',
      basicInfo: 'profile',
      about: 'personalDetails',
      personal: 'personalDetails',
      personalDetails: 'personalDetails',
      skills: 'skills',
      services: 'skills',
      projects: 'projects',
      education: 'education',
      contact: 'contactInfo',
      contactInfo: 'contactInfo',
      socials: 'socialLinks',
      socialLinks: 'socialLinks',
      experience: 'experience',
      customFields: 'enhanceProfile',
      'custom-fields': 'enhanceProfile'
    };
    const target = map[sectionKey] || sectionKey;
    setActiveSection(target);
    setIsSectionsDropdownOpen(false);

    // Synchronize desktop editor position
    const desktopEl =
      document.getElementById(`section-card-${target}`) ||
      document.getElementById(`section-card-${sectionKey}`) ||
      (target === 'profile' ? document.getElementById('top-profile-header') : null);
    if (desktopEl) {
      desktopEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Scroll mobile preview if matching element exists
    if (target === 'profile') {
      previewScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const mobileEl =
        previewScrollRef.current?.querySelector(`[data-section="${target}"]`) ||
        previewScrollRef.current?.querySelector(`#section-${target}`) ||
        (target === 'personalDetails' ? previewScrollRef.current?.querySelector(`[data-section="about"]`) : null) ||
        (target === 'contactInfo' ? previewScrollRef.current?.querySelector(`[data-section="contact"]`) : null) ||
        (target === 'socialLinks' ? previewScrollRef.current?.querySelector(`[data-section="socials"]`) : null) ||
        (target === 'enhanceProfile' ? previewScrollRef.current?.querySelector(`[data-section="virtual-card"]`) : null);
      if (mobileEl) {
        mobileEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className={`w-full h-full flex flex-col bg-white dark:bg-[#070D18] relative overflow-hidden select-none ${className}`}>
      
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TOP HEADER: Clean & Compact Mobile Bar with Top-Left Section Control       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="w-full bg-slate-50/95 dark:bg-[#0A101E]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-3 py-2 flex items-center justify-between shrink-0 z-30 transition-colors">
        
        {/* Top-Left: Sections Control Button (Opens Dropdown Directly Beneath) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsSectionsDropdownOpen((prev) => !prev)}
            aria-expanded={isSectionsDropdownOpen}
            aria-haspopup="true"
            aria-label="Sections Menu"
            title="Sections Menu"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 border shrink-0 ${
              isSectionsDropdownOpen
                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 shadow-2xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 border-slate-200 dark:border-white/10'
            }`}
          >
            {isSectionsDropdownOpen ? (
              <X className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            ) : (
              <Menu className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            )}
            <span className="text-[11px] font-medium">Sections</span>
          </button>

          {/* ──────────────────────────────────────────────────────────────────────── */}
          {/* MOBILE SECTIONS DROPDOWN MENU (Tap/Click Triggered from Top-Left)        */}
          {/* ──────────────────────────────────────────────────────────────────────── */}
          <AnimatePresence>
            {isSectionsDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute top-10 left-0 w-64 max-h-[380px] bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl p-2 z-50 flex flex-col overflow-hidden backdrop-blur-md"
              >
                <div className="px-2 py-1.5 border-b border-slate-100 dark:border-white/10 mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sections</span>
                  <span className="text-[10px] font-mono font-medium text-cyan-600 dark:text-cyan-400">Tap to jump</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
                  {DESKTOP_SIDEBAR_SECTIONS.map((sec) => {
                    const Icon = sec.icon;
                    const isActive = activeSection === sec.key;
                    const isVisible = sectionVisibility[sec.key] !== false;

                    return (
                      <div
                        key={sec.key}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all group ${
                          isActive
                            ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 border border-cyan-400/40 font-bold shadow-2xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectSection(sec.key)}
                          className="flex-1 flex items-center gap-2 min-w-0 text-left cursor-pointer"
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'
                          }`} />
                          <span className={`truncate text-xs ${!isVisible ? 'line-through text-slate-400 dark:text-slate-600' : ''}`}>
                            {sec.label}
                          </span>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 shrink-0" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSectionVisibility(sec.key);
                              if (sec.key === 'personalDetails') handleToggleSectionVisibility('about');
                              if (sec.key === 'contactInfo') handleToggleSectionVisibility('contact');
                            }}
                            title={isVisible ? `Hide ${sec.label}` : `Show ${sec.label}`}
                            aria-label={isVisible ? `Hide ${sec.label}` : `Show ${sec.label}`}
                            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            {isVisible ? (
                              <Eye className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right: Theme Toggle & Save Controls */}
        <div className="flex items-center gap-1.5">
          {/* Mobile Save Icon Button — Uses same save logic as desktop */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            aria-label="Save Profile"
            title="Save Profile"
            className="p-1.5 px-2.5 rounded-lg text-white bg-cyan-600 hover:bg-cyan-500 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs shrink-0 flex items-center gap-1 text-xs font-semibold"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save</span>
          </button>

          {/* Theme Toggle Icon Button */}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer shrink-0"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* Pinned Visible Section Navigation Tab Bar (Stitch Design) */}
      <div className="shrink-0 z-20 w-full">
        <ProfileSectionTabBar
          profile={liveProfile}
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
        />
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* LIVE PROFILE PREVIEW ONLY — NO SECOND EDITOR, NO DUPLICATE FORMS          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div 
        ref={previewScrollRef} 
        className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden p-2 sm:p-2.5 space-y-3"
      >
        <AvtiveDigitalCard
          profile={liveProfile}
          isDark={isDark}
          canEdit={true}
          isEditing={false}
          isConnected={false}
          viewMode="standard"
          onSelectSection={(secKey) => handleSelectSection(secKey)}
          onSaveContact={() => downloadVCard(liveProfile)}
          onOpenShare={() => {}}
          onOpenConnect={() => {}}
          onOpenQRModal={() => {}}
          onOpenResumeModal={() => {}}
          onSelectProject={() => {}}
        />
      </div>

    </div>
  );
}
