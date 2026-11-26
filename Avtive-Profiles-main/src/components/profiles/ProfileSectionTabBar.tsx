'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  User,
  Info,
  Code,
  Folder,
  GraduationCap,
  Phone,
  Link2,
  Briefcase,
  Wrench,
  CreditCard,
  Award,
  Globe,
  Tag,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  Quote,
  Trophy,
  BookOpen,
  Lightbulb,
  BookMarked,
  FileSpreadsheet,
  Network,
  Compass,
  Star,
  Palette
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
        { key: 'skills', label: 'Skills', icon: Code },
        { key: 'services', label: 'Services', icon: Wrench },
        { key: 'projects', label: 'Projects', icon: Folder },
        { key: 'contactInfo', label: 'Contact', icon: Phone },
        { key: 'socialLinks', label: 'Social Links', icon: Link2 },
      ];
      if ((profile.customFields && profile.customFields.length > 0) || isEditing) {
        baseTabs.push({ key: 'customFields', label: 'Highlights', icon: Tag });
      }
      baseTabs.push({ key: 'virtualCard', label: 'Virtual Card', icon: CreditCard });
      if (isEditing || canEdit) {
        baseTabs.push({ key: 'backgrounds', label: 'Themes', icon: Palette });
      }
    } else {
      baseTabs = [
        { key: 'profile', label: 'Profile', icon: User },
        { key: 'personalDetails', label: 'About', icon: Info },
        { key: 'featured', label: 'Featured', icon: Star },
        { key: 'skills', label: 'Skills', icon: Code },
        { key: 'services', label: 'Services', icon: Wrench },
        { key: 'experience', label: 'Experience', icon: Briefcase },
        { key: 'projects', label: 'Projects', icon: Folder },
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
        { key: 'socialLinks', label: 'Social Links', icon: Link2 },
      ];
      if ((profile.customFields && profile.customFields.length > 0) || isEditing) {
        baseTabs.push({ key: 'customFields', label: 'Custom Fields', icon: Tag });
      }
      baseTabs.push({ key: 'virtualCard', label: 'Virtual Card', icon: CreditCard });
      if (isEditing || canEdit) {
        baseTabs.push({ key: 'backgrounds', label: 'Themes', icon: Palette });
      }
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
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => checkScrollOverflow());
      ro.observe(el);
    }
    return () => {
      el.removeEventListener('scroll', checkScrollOverflow);
      window.removeEventListener('resize', checkScrollOverflow);
      ro?.disconnect();
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
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
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
      data-testid="profile-section-tabbar"
      className={`relative w-full max-w-full overflow-hidden box-border ${theme.cardBg} border-t ${theme.divider} transition-colors select-none ${className}`}
    >
      <div className="w-full relative flex items-center min-w-0 box-border px-2 @md:px-4 @2xl:px-6">
        {/* Left Scroll Arrow */}
        {showLeftArrow && (
          <button
            type="button"
            onClick={handleScrollLeft}
            aria-label="Scroll sections left"
            title="Scroll sections left"
            className={`flex absolute left-1.5 z-20 w-9 h-9 min-w-[36px] min-h-[36px] rounded-full ${theme.subCardBg} backdrop-blur-md shadow-sm border ${theme.cardBorder} items-center justify-center ${theme.textPrimary} hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white transition-all cursor-pointer`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Horizontal Scrollable Icon Navigation Container */}
        <div
          ref={scrollContainerRef}
          className="w-full min-w-0 flex-1 overflow-x-auto scrollbar-none py-2.5 px-1 scroll-smooth box-border"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="w-max min-w-full flex items-center justify-center gap-1.5 @md:gap-2">
            {sections.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item.key);

              return (
                <button
                  key={item.key}
                  ref={active ? activeTabRef : null}
                  type="button"
                  onClick={() => onSelectSection(item.key)}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  title={item.label}
                  data-section-tab={item.key}
                  className={`group shrink-0 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer active:scale-95 box-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white focus-visible:ring-offset-1 ${active
                    ? `${theme.btnPrimary} shadow-xs`
                    : `${theme.textSecondary} hover:opacity-100 border border-transparent ${theme.hoverBorder}`
                    }`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-105 ${active ? 'opacity-100' : 'opacity-75 group-hover:opacity-100'
                      }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Scroll Arrow */}
        {showRightArrow && (
          <button
            type="button"
            onClick={handleScrollRight}
            aria-label="Scroll sections right"
            title="Scroll sections right"
            className={`flex absolute right-1.5 z-20 w-9 h-9 min-w-[36px] min-h-[36px] rounded-full ${theme.subCardBg} backdrop-blur-md shadow-sm border ${theme.cardBorder} items-center justify-center ${theme.textPrimary} hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white transition-all cursor-pointer`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  );
}
