'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  User, 
  FileText, 
  Code, 
  FolderGit2, 
  GraduationCap, 
  Phone, 
  Link2, 
  Briefcase, 
  Sparkles, 
  Award, 
  Globe, 
  MessageSquare, 
  Tag, 
  Building2, 
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ProfileData, normalizeProfileType } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/themeStyles';

export interface ProfileSectionTabBarProps {
  profile: ProfileData;
  activeSection?: string;
  onSelectSection: (sectionKey: string) => void;
  theme?: ThemeConfig;
  isEditing?: boolean;
  canEdit?: boolean;
  className?: string;
}

export interface SectionTabItem {
  key: string;
  label: string;
  icon: React.ElementType;
}

export function ProfileSectionTabBar({
  profile,
  activeSection = 'profile',
  onSelectSection,
  theme = getThemeConfig(profile.theme || 'editorial'),
  isEditing = false,
  canEdit = false,
  className = ''
}: ProfileSectionTabBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const isCompany = normalizeProfileType(profile.type) === 'team';

  // Build the list of sections based on profile type and content availability
  const sections = useMemo<SectionTabItem[]>(() => {
    const sharing = profile.sharingSettings || {};
    const visibility = profile.sectionVisibility || {};

    const isVisible = (key: string): boolean => {
      if (isEditing || canEdit) return true;
      if (typeof visibility[key] === 'boolean') return visibility[key];
      switch (key) {
        case 'company':
        case 'companyInfo':
        case 'teamMembers': return sharing.companySection !== false;
        case 'about':
        case 'personalDetails': return sharing.bio !== false;
        case 'skills': return sharing.skills !== false || sharing.services !== false;
        case 'experience': return sharing.experience !== false;
        case 'education': return sharing.education !== false;
        case 'projects': return sharing.projects !== false;
        case 'certifications': return sharing.certifications !== false;
        case 'languages': return sharing.languages !== false;
        case 'recommendations': return sharing.recommendations !== false;
        case 'socialLinks': return sharing.socialLinks !== false;
        case 'virtualCard': return sharing.nfcCard !== false;
        default: return true;
      }
    };

    if (isCompany) {
      const companyTabs: SectionTabItem[] = [
        { key: 'profile', label: 'Overview', icon: Building2 },
        { key: 'teamMembers', label: 'Team', icon: Users },
        { key: 'skills', label: 'Services', icon: Code },
        { key: 'projects', label: 'Projects', icon: FolderGit2 },
        { key: 'contactInfo', label: 'Contact', icon: Phone },
        { key: 'socialLinks', label: 'Socials', icon: Link2 },
      ];
      if ((profile.customFields && profile.customFields.length > 0) || isEditing) {
        companyTabs.push({ key: 'customFields', label: 'Highlights', icon: Tag });
      }
      companyTabs.push({ key: 'virtualCard', label: 'Virtual Card', icon: Sparkles });
      return companyTabs.filter(t => isVisible(t.key));
    }

    // Individual Profile Tabs
    const individualTabs: SectionTabItem[] = [
      { key: 'profile', label: 'Profile', icon: User },
      { key: 'personalDetails', label: 'About', icon: FileText },
      { key: 'skills', label: 'Skills', icon: Code },
      { key: 'experience', label: 'Experience', icon: Briefcase },
      { key: 'projects', label: 'Projects', icon: FolderGit2 },
      { key: 'education', label: 'Education', icon: GraduationCap },
      { key: 'certifications', label: 'Certificates', icon: Award },
      { key: 'languages', label: 'Languages', icon: Globe },
      { key: 'recommendations', label: 'Reviews', icon: MessageSquare },
      { key: 'contactInfo', label: 'Contact', icon: Phone },
      { key: 'socialLinks', label: 'Socials', icon: Link2 },
    ];

    if ((profile.customFields && profile.customFields.length > 0) || isEditing) {
      individualTabs.push({ key: 'customFields', label: 'Custom', icon: Tag });
    }
    individualTabs.push({ key: 'virtualCard', label: 'Virtual Card', icon: Sparkles });

    return individualTabs.filter(t => isVisible(t.key));
  }, [profile, isCompany, isEditing, canEdit]);

  // Check scroll container overflow to toggle scroll arrows
  const checkScrollOverflow = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const hasLeft = el.scrollLeft > 6;
    const hasRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 6;
    setShowLeftArrow(hasLeft);
    setShowRightArrow(hasRight);
  };

  useEffect(() => {
    checkScrollOverflow();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScrollOverflow, { passive: true });
    window.addEventListener('resize', checkScrollOverflow);
    return () => {
      el.removeEventListener('scroll', checkScrollOverflow);
      window.removeEventListener('resize', checkScrollOverflow);
    };
  }, [sections]);

  // Auto-scroll active tab into view in tab bar when activeSection changes
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [activeSection]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -180, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 180, behavior: 'smooth' });
    }
  };

  const isCurrentActive = (key: string) => {
    if (activeSection === key) return true;
    if (key === 'profile' && (activeSection === 'hero' || activeSection === '')) return true;
    if (key === 'personalDetails' && (activeSection === 'about' || activeSection === 'personal')) return true;
    if (key === 'skills' && activeSection === 'services') return true;
    if (key === 'projects' && activeSection === 'portfolio') return true;
    if (key === 'contactInfo' && (activeSection === 'contact' || activeSection === 'basicInfo')) return true;
    if (key === 'socialLinks' && activeSection === 'socials') return true;
    if (key === 'certifications' && activeSection === 'certificates') return true;
    if (key === 'customFields' && (activeSection === 'custom-fields' || activeSection === 'enhanceProfile')) return true;
    if (key === 'virtualCard' && (activeSection === 'virtual-card' || activeSection === 'nfc')) return true;
    return false;
  };

  return (
    <nav 
      aria-label="Profile Section Navigation" 
      className={`relative w-full ${theme.headerBg} border-b ${theme.divider} transition-colors select-none ${className}`}
    >
      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 relative flex items-center">
        {/* Left Scroll Arrow (Desktop/Tablet) */}
        {showLeftArrow && (
          <button
            type="button"
            onClick={handleScrollLeft}
            aria-label="Scroll sections left"
            className="hidden sm:flex absolute left-1 z-20 w-7 h-7 rounded-full bg-white/90 dark:bg-black/90 shadow-md border border-slate-200 dark:border-white/10 items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Horizontal Scrollable Tabs Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-2 px-1 sm:px-2 scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {sections.map((item) => {
            const Icon = item.icon;
            const active = isCurrentActive(item.key);

            return (
              <button
                key={item.key}
                ref={active ? activeTabRef : null}
                type="button"
                onClick={() => onSelectSection(item.key)}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 ${
                  active
                    ? `${theme.btnPrimary} shadow-xs font-bold scale-[1.02]`
                    : `${theme.textSecondary} hover:${theme.textPrimary} hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent`
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'opacity-100' : 'opacity-70'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Arrow (Desktop/Tablet) */}
        {showRightArrow && (
          <button
            type="button"
            onClick={handleScrollRight}
            aria-label="Scroll sections right"
            className="hidden sm:flex absolute right-1 z-20 w-7 h-7 rounded-full bg-white/90 dark:bg-black/90 shadow-md border border-slate-200 dark:border-white/10 items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  );
}
