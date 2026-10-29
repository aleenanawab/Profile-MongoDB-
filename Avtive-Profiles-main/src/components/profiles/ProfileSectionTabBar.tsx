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
  ChevronRight,
  ChevronDown,
  HeartHandshake,
  Quote,
  Trophy,
  BookOpen,
  Lightbulb,
  BookMarked,
  FileSpreadsheet,
  Network,
  Compass,
  Star
} from 'lucide-react';
import { ProfileData, normalizeProfileType } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { getCanonicalSectionOrder, normalizeSectionKey, isCanonicalSectionVisible } from '@/lib/sections';

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

  // Build the list of sections based on profile type and content availability, ordered canonically
  const sections = useMemo<SectionTabItem[]>(() => {
    const sharing = profile.sharingSettings || {};
    const visibility = profile.sectionVisibility || {};

    const isVisible = (key: string): boolean => {
      if (isEditing || canEdit) return true;
      return isCanonicalSectionVisible(visibility, sharing, key);
    };

    let baseTabs: SectionTabItem[] = [];

    if (isCompany) {
      baseTabs = [
        { key: 'profile', label: 'Overview', icon: Building2 },
        { key: 'teamMembers', label: 'Team', icon: Users },
        { key: 'skills', label: 'Services', icon: Code },
        { key: 'projects', label: 'Projects', icon: FolderGit2 },
        { key: 'contactInfo', label: 'Contact', icon: Phone },
        { key: 'socialLinks', label: 'Socials', icon: Link2 },
      ];
      if ((profile.customFields && profile.customFields.length > 0) || isEditing) {
        baseTabs.push({ key: 'customFields', label: 'Highlights', icon: Tag });
      }
      baseTabs.push({ key: 'virtualCard', label: 'Virtual Card', icon: Sparkles });
    } else {
      baseTabs = [
        { key: 'profile', label: 'Profile', icon: User },
        { key: 'personalDetails', label: 'About', icon: FileText },
        { key: 'featured', label: 'Featured', icon: Star },
        { key: 'skills', label: 'Skills', icon: Code },
        { key: 'experience', label: 'Experience', icon: Briefcase },
        { key: 'projects', label: 'Projects', icon: FolderGit2 },
        { key: 'education', label: 'Education', icon: GraduationCap },
        { key: 'certifications', label: 'Certificates', icon: Award },
        { key: 'volunteer', label: 'Volunteer', icon: HeartHandshake },
        { key: 'honorsAwards', label: 'Honors', icon: Trophy },
        { key: 'publications', label: 'Publications', icon: BookOpen },
        { key: 'patents', label: 'Patents', icon: Lightbulb },
        { key: 'courses', label: 'Courses', icon: BookMarked },
        { key: 'testScores', label: 'Test Scores', icon: FileSpreadsheet },
        { key: 'organizations', label: 'Organizations', icon: Network },
        { key: 'interests', label: 'Interests', icon: Compass },
        { key: 'languages', label: 'Languages', icon: Globe },
        { key: 'recommendations', label: 'Recommendations', icon: Quote },
        { key: 'contactInfo', label: 'Contact', icon: Phone },
        { key: 'socialLinks', label: 'Socials', icon: Link2 },
      ];
      if ((profile.customFields && profile.customFields.length > 0) || isEditing) {
        baseTabs.push({ key: 'customFields', label: 'Custom', icon: Tag });
      }
      baseTabs.push({ key: 'virtualCard', label: 'Virtual Card', icon: Sparkles });
    }

    const availableTabs = baseTabs.filter(t => isVisible(t.key));
    const canonicalOrder = getCanonicalSectionOrder(profile.sectionOrder, profile.type);

    return [...availableTabs].sort((a, b) => {
      if (a.key === 'profile') return -1;
      if (b.key === 'profile') return 1;
      const idxA = canonicalOrder.indexOf(normalizeSectionKey(a.key));
      const idxB = canonicalOrder.indexOf(normalizeSectionKey(b.key));
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
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

  // Keep active tab in view inside the scroll container without scrolling the window
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tab = activeTabRef.current;
      const tabLeft = tab.offsetLeft;
      const tabWidth = tab.offsetWidth;
      const containerWidth = container.offsetWidth;
      const targetScroll = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth'
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
    if (normalizeSectionKey(activeSection) === normalizeSectionKey(key)) return true;
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
      className={`relative w-full max-w-full overflow-hidden box-border ${theme.headerBg} border-b ${theme.divider} transition-colors select-none ${className}`}
    >
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 relative flex items-center min-w-0 box-border">
        {/* Left Scroll Arrow */}
        {showLeftArrow && (
          <button
            type="button"
            onClick={handleScrollLeft}
            aria-label="Scroll sections left"
            className="flex absolute left-1 z-20 w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] rounded-full bg-white/95 dark:bg-black/95 shadow-md border border-slate-200 dark:border-white/10 items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Horizontal Scrollable Tabs Container */}
        <div
          ref={scrollContainerRef}
          className="w-full min-w-0 flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-2 px-1 sm:px-2 scroll-smooth box-border"
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
                className={`shrink-0 h-10 min-h-[40px] sm:h-11 sm:min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 box-border ${
                  active
                    ? `${theme.btnPrimary} shadow-xs font-bold scale-[1.02]`
                    : `${theme.textSecondary} hover:${theme.textPrimary} hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent`
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${active ? 'opacity-100' : 'opacity-70'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Arrow */}
        {showRightArrow && (
          <button
            type="button"
            onClick={handleScrollRight}
            aria-label="Scroll sections right"
            className="flex absolute right-1 z-20 w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] rounded-full bg-white/95 dark:bg-black/95 shadow-md border border-slate-200 dark:border-white/10 items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  );
}
