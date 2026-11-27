'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ProfileData,
  ProfileTheme,
  UserSession,
  ProjectItem,
  ProfileType
} from '@/types/profile';
import { HeaderNav } from '@/components/layout/HeaderNav';
import { OwnerBottomNav } from '@/components/layout/OwnerBottomNav';
import { AvtiveDigitalCard } from '@/components/card/AvtiveDigitalCard';
import { getThemeConfig } from '@/components/ui/themeStyles';
import { UnifiedShareWorkspace } from '@/components/sharing/UnifiedShareWorkspace';
import { VisitorPublicShareView } from '@/components/sharing/VisitorPublicShareView';
import { ExchangeContactModal } from '@/components/modals/ExchangeContactModal';
import { QRFullscreenModal } from '@/components/modals/QRFullscreenModal';
import { ResumeViewerModal } from '@/components/modals/ResumeViewerModal';
import { ProjectDetailModal } from '@/components/modals/ProjectDetailModal';
import { ProfileEditorProvider, useProfileEditor } from '@/context/ProfileEditorContext';
import { downloadVCard } from '@/lib/vcard';
import { motion, AnimatePresence } from 'framer-motion';
import { DesktopProfileSidebar } from '@/components/profiles/DesktopProfileSidebar';
import { usePortfolioTheme } from '@/context/ThemeContext';
import { uploadImageToStorage } from '@/lib/imageCompression';
import { isProfileDirty, diffProfile } from '@/lib/profileDiff';
import { BackgroundTheme } from '@/data/backgroundThemes';
import { ProfileEditorView } from '@/components/editor/ProfileEditorView';
import { ProfileBackgroundLayer, resolveBackgroundMode } from '@/components/editor/BackgroundRenderer';
import {
  ProfileScreenMode,
  resolveScreenModeFromSearch,
  buildProfileUrlForMode,
} from '@/lib/profileScreenMode';
import { SharePresetKey } from '@/types/sharing';
import { sanitizeProfileForAudience, ProfileAudience } from '@/lib/privacy/audience';
import { Eye, Globe, Users } from 'lucide-react';

export interface PublicProfileClientProps {
  initialProfile: ProfileData;
  session: UserSession | null;
  isOwner: boolean;
  isConnected?: boolean;
  initialIsEditing?: boolean;
  initialIsSharing?: boolean;
  userProfiles?: ProfileData[];
}

export function PublicProfileClient({
  initialProfile,
  session,
  isOwner,
  isConnected = false,
  initialIsEditing = false,
  initialIsSharing = false,
  userProfiles = []
}: PublicProfileClientProps) {
  return (
    <ProfileEditorProvider initialProfile={initialProfile} userProfiles={userProfiles}>
      <PublicProfileClientInner
        initialProfile={initialProfile}
        session={session}
        isOwner={isOwner}
        isConnected={isConnected}
        initialIsEditing={initialIsEditing}
        initialIsSharing={initialIsSharing}
        userProfiles={userProfiles}
      />
    </ProfileEditorProvider>
  );
}

function PublicProfileClientInner({
  initialProfile,
  session,
  isOwner,
  isConnected = false,
  initialIsEditing = false,
  initialIsSharing = false,
  userProfiles = []
}: PublicProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [profileType, setProfileType] = useState<ProfileType>(initialProfile.type || 'individual');
  const [activeTheme, setActiveTheme] = useState<ProfileTheme>(
    initialProfile.theme && initialProfile.theme !== 'default' ? initialProfile.theme : 'editorial'
  );
  const { isDark, toggleDarkMode } = usePortfolioTheme();
  const [screenMode, setScreenMode] = useState<ProfileScreenMode>(() => {
    if (initialIsEditing && isOwner) return 'edit';
    if (initialIsSharing) return 'share';
    return 'preview';
  });
  const screenModeRef = useRef<ProfileScreenMode>(screenMode);
  useEffect(() => {
    screenModeRef.current = screenMode;
  }, [screenMode]);

  const currentOwnerKey = isOwner ? `${session?.id || ''}:${initialProfile.id}` : null;
  const [invalidatedOwnerKey, setInvalidatedOwnerKey] = useState<string | null>(null);
  const effectiveIsOwner = Boolean(isOwner && invalidatedOwnerKey !== currentOwnerKey);

  const isEditing = screenMode === 'edit' && effectiveIsOwner;
  const isSharing = screenMode === 'share';
  const [previewViewMode, setPreviewViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewAudience, setPreviewAudience] = useState<ProfileAudience>('owner');
  // Two independent sliders for Preview Sections Navigation:
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isTouchRef = React.useRef(false);
  const [shareTargetProfileId, setShareTargetProfileId] = useState<string>(initialProfile.id);
  const [shareDraftSelections, setShareDraftSelections] = useState<Record<string, string[]>>({});
  const [shareDraftPresets, setShareDraftPresets] = useState<Record<string, SharePresetKey | 'custom'>>({});
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(session);
  const [previewBackgroundTheme, setPreviewBackgroundTheme] = useState<BackgroundTheme | null>(null);

  const {
    liveProfile,
    savedBaseline,
    activeSection,
    setActiveSection,
    isSaving,
    saveProfile,
    handleSwitchToProfile,
    flushAutosave,
    discardUnsavedChanges,
    isUploadingAvatar,
    isUploadingCover,
    updateProfilePartial
  } = useProfileEditor();

  const [currentDraft, setCurrentDraft] = useState<ProfileData>(profile);

  // Sync profile state when savedBaseline updates after autosave or manual save
  useEffect(() => {
    if (savedBaseline && (savedBaseline.id === profile.id || savedBaseline.slug === profile.slug)) {
      setProfile(savedBaseline);
    }
  }, [savedBaseline, profile.id, profile.slug]);

  useEffect(() => {
    setCurrentDraft(profile);
  }, [profile]);

  const activeThemeConfig = getThemeConfig(activeTheme);

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

  const [activeTabSection, setActiveTabSection] = useState<string>('profile');

  // Track scroll position in the profile page or panel to update active tab highlight
  useEffect(() => {
    if (screenMode !== 'preview') return;

    const sectionIds = [
      'section-hero',
      'section-profile',
      'section-company',
      'section-companyInfo',
      'section-teamMembers',
      'section-about',
      'section-personalDetails',
      'section-skills',
      'section-services',
      'section-projects',
      'section-experience',
      'section-education',
      'section-certifications',
      'section-languages',
      'section-contact',
      'section-contactInfo',
      'section-socialLinks',
      'section-custom-fields',
      'section-customFields',
      'section-virtual-card',
      'virtual-card-section'
    ];

    const updateActiveFromRoot = (root: HTMLElement | Document, topOffset: number) => {
      let currentSection = 'profile';

      for (const id of sectionIds) {
        const el = root.querySelector<HTMLElement>(`#${id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top - topOffset <= 160) {
            const rawKey = id.replace('section-', '');
            if (rawKey === 'hero') currentSection = 'profile';
            else if (rawKey === 'about') currentSection = 'personalDetails';
            else if (rawKey === 'contact') currentSection = 'contactInfo';
            else if (rawKey === 'socials') currentSection = 'socialLinks';
            else if (rawKey === 'custom-fields') currentSection = 'customFields';
            else if (rawKey === 'virtual-card' || id === 'virtual-card-section') currentSection = 'virtualCard';
            else if (rawKey === 'team') currentSection = 'teamMembers';
            else if (rawKey === 'company') currentSection = 'companyInfo';
            else currentSection = rawKey;
          }
        }
      }
      setActiveTabSection(currentSection);
    };

    const profilePanel = document.getElementById('profile-scroll-panel');
    const handleWindowScroll = () => updateActiveFromRoot(profilePanel || document, 0);
    const handlePanelScroll = () => {
      if (!profilePanel) return;
      updateActiveFromRoot(profilePanel, profilePanel.getBoundingClientRect().top);
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    profilePanel?.addEventListener('scroll', handlePanelScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      profilePanel?.removeEventListener('scroll', handlePanelScroll);
    };
  }, [screenMode]);

  const prevWidthRef = useRef<number | null>(null);

  // Independent Mobile Sections Slider Handlers
  const handleToggleMobile = () => {
    setMobileOpen(prev => !prev);
  };

  const handleCloseMobile = () => {
    setMobileOpen(false);
  };

  const handleMobileSectionSelect = (sectionKey: string) => {
    handleSectionSelect(sectionKey, true);
    setMobileOpen(false);
  };

  // Independent Desktop Sections Slider Handlers
  const handleToggleDesktop = () => {
    setDesktopOpen(prev => !prev);
  };

  const handleCloseDesktop = () => {
    setDesktopOpen(false);
  };

  const handleDesktopSectionSelect = (sectionKey: string) => {
    handleSectionSelect(sectionKey, false);
    setDesktopOpen(false);
  };

  // Resizing the window: only close the inactive drawer when crossing the 1024px boundary
  useEffect(() => {
    if (typeof window !== 'undefined') {
      prevWidthRef.current = window.innerWidth;
    }
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      const currentWidth = window.innerWidth;
      const prevWidth = prevWidthRef.current;
      prevWidthRef.current = currentWidth;

      if (prevWidth !== null) {
        // Crossing from mobile (< 1024) to desktop (>= 1024): close mobile drawer
        if (prevWidth < 1024 && currentWidth >= 1024) {
          setMobileOpen(false);
        }
        // Crossing from desktop (>= 1024) to mobile (< 1024): close desktop drawer
        else if (prevWidth >= 1024 && currentWidth < 1024) {
          setDesktopOpen(false);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSectionSelect = (sectionKey: string, isFromMobileOrFieldKey?: string | boolean) => {
    setActiveTabSection(sectionKey);

    const isFromMobile = isFromMobileOrFieldKey === true;
    const isFromDesktop = isFromMobileOrFieldKey === false;

    // Resolve target IDs / aliases
    const targetIdMap: Record<string, string[]> = {
      profile: ['section-hero', 'section-profile'],
      hero: ['section-hero', 'section-profile'],
      about: ['section-about', 'section-personalDetails'],
      personalDetails: ['section-about', 'section-personalDetails'],
      skills: ['section-skills'],
      services: ['section-services'],
      projects: ['section-projects', 'section-portfolio'],
      portfolio: ['section-projects', 'section-portfolio'],
      experience: ['section-experience'],
      education: ['section-education'],
      certifications: ['section-certifications', 'section-certificates'],
      languages: ['section-languages'],
      contact: ['section-contact', 'section-contactInfo'],
      contactInfo: ['section-contact', 'section-contactInfo'],
      socials: ['section-socialLinks', 'section-socials'],
      socialLinks: ['section-socialLinks', 'section-socials'],
      customFields: ['section-custom-fields', 'section-customFields'],
      'custom-fields': ['section-custom-fields', 'section-customFields'],
      teamMembers: ['section-teamMembers', 'section-team'],
      team: ['section-teamMembers', 'section-team'],
      company: ['section-company', 'section-companyInfo'],
      companyInfo: ['section-company', 'section-companyInfo'],
      virtualCard: ['virtual-card-section', 'section-virtual-card', 'section-virtualCard'],
      'virtual-card': ['virtual-card-section', 'section-virtual-card', 'section-virtualCard']
    };

    const candidateIds = targetIdMap[sectionKey] || [`section-${sectionKey}`, sectionKey];
    const selectors = candidateIds.map(id => `#${id}`).concat(`[data-section="${sectionKey}"]`).join(', ');

    const isElementVisible = (el: HTMLElement | null) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const scrollPanelIfContainer = (panel: HTMLElement | null) => {
      if (!panel || !isElementVisible(panel)) return false;

      const overflowY = typeof window !== 'undefined' ? window.getComputedStyle(panel).overflowY : '';
      const isScrollableContainer =
        (overflowY === 'auto' || overflowY === 'scroll') &&
        panel.scrollHeight > panel.clientHeight + 2;

      if (!isScrollableContainer) return false;

      if (sectionKey === 'profile' || sectionKey === 'hero') {
        panel.scrollTo({ top: 0, behavior: 'smooth' });
        return true;
      }

      const targetEl = panel.querySelector<HTMLElement>(selectors);
      if (!targetEl) return false;

      const panelRect = panel.getBoundingClientRect();
      const elRect = targetEl.getBoundingClientRect();
      const offsetTop = elRect.top - panelRect.top + panel.scrollTop - 16;
      panel.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });

      if (isEditing) {
        const inputEl = targetEl.querySelector('input, textarea, select') as HTMLElement | null;
        if (inputEl) {
          setTimeout(() => inputEl.focus(), 250);
        }
      }
      return true;
    };

    const desktopPanel = document.getElementById('profile-scroll-panel');

    if (!scrollPanelIfContainer(desktopPanel)) {
      if (sectionKey === 'profile' || sectionKey === 'hero') {
        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        const searchRoot = desktopPanel || document;
        const targetEl =
          searchRoot.querySelector<HTMLElement>(selectors) ||
          document.querySelector<HTMLElement>(selectors);

        if (targetEl) {
          if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
            const headerOffset = 76;
            const targetTop = Math.max(
              0,
              targetEl.getBoundingClientRect().top + window.scrollY - headerOffset
            );
            window.scrollTo({ top: targetTop, behavior: 'smooth' });
          } else if (typeof targetEl.scrollIntoView === 'function') {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          if (isEditing) {
            const inputEl = targetEl.querySelector('input, textarea, select') as HTMLElement | null;
            if (inputEl) {
              setTimeout(() => inputEl.focus(), 250);
            }
          }
        }
      }
    }

    const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isFromMobile || isMobileScreen) {
      handleCloseSidebar();
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const navigateScreenMode = useCallback(
    (nextMode: ProfileScreenMode, slugOverride?: string) => {
      const safeMode: ProfileScreenMode =
        nextMode === 'edit' && !effectiveIsOwner ? 'preview' : nextMode;
      const slug =
        slugOverride ||
        profile.slug ||
        profile.id ||
        initialProfile.slug ||
        initialProfile.id;

      if (slug && typeof window !== 'undefined') {
        const nextUrl = buildProfileUrlForMode(slug, safeMode);
        if (window.location.pathname + window.location.search !== nextUrl) {
          window.history.pushState({ screenMode: safeMode }, '', nextUrl);
        }
      }

      if (safeMode !== 'edit') {
        setPreviewBackgroundTheme(null);
      }
      setScreenMode(safeMode);
    },
    [effectiveIsOwner, profile.slug, profile.id, initialProfile.slug, initialProfile.id]
  );

  // Synchronize mutually exclusive screen mode with browser URL & history (Back / Forward)
  const discardUnsavedChangesRef = useRef(discardUnsavedChanges);
  useEffect(() => {
    discardUnsavedChangesRef.current = discardUnsavedChanges;
  }, [discardUnsavedChanges]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const slug = profile.slug || profile.id || initialProfile.slug || initialProfile.id;

    const syncFromUrl = () => {
      const resolved = resolveScreenModeFromSearch(window.location.search, effectiveIsOwner);
      if (resolved.needsUrlNormalization && slug) {
        window.history.replaceState(
          null,
          '',
          buildProfileUrlForMode(slug, resolved.mode)
        );
      }
      if (screenModeRef.current === 'edit' && resolved.mode !== 'edit') {
        discardUnsavedChangesRef.current();
        setPreviewBackgroundTheme(null);
      }
      setScreenMode(resolved.mode);
    };

    const handleOpenEditEvent = () => {
      if (effectiveIsOwner) {
        navigateScreenMode('edit', slug);
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('avtive_open_edit_mode', handleOpenEditEvent);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('avtive_open_edit_mode', handleOpenEditEvent);
    };
  }, [effectiveIsOwner, profile.slug, profile.id, initialProfile.slug, initialProfile.id, initialIsEditing, initialIsSharing, navigateScreenMode]);

  // Hydrate updated profile from localStorage ONLY for owner when cache is strictly newer than server
  useEffect(() => {
    if (effectiveIsOwner) {
      try {
        const cached =
          localStorage.getItem(`avtive_profile_${initialProfile.slug}`) ||
          localStorage.getItem(`avtive_profile_${initialProfile.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (
            parsed &&
            (parsed.id === initialProfile.id || parsed.slug === initialProfile.slug) &&
            parsed.updatedAt &&
            initialProfile.updatedAt &&
            new Date(parsed.updatedAt).getTime() > new Date(initialProfile.updatedAt).getTime()
          ) {
            setProfile(parsed);
            if (parsed.theme) setActiveTheme(parsed.theme);
          }
        }
      } catch { }
    }

    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ProfileData>;
      if (customEvent.detail) {
        const updated = customEvent.detail;
        if (updated.id === initialProfile.id || updated.slug === initialProfile.slug) {
          setProfile(updated);
          if (updated.theme) setActiveTheme(updated.theme);
        }
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('avtive_profile_') && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (updated && (updated.id === initialProfile.id || updated.slug === initialProfile.slug)) {
            setProfile(updated);
            if (updated.theme) setActiveTheme(updated.theme);
          }
        } catch { }
      }
    };

    window.addEventListener('avtive_profile_updated', handleProfileUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('avtive_profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initialProfile.id, initialProfile.slug, initialProfile.updatedAt, effectiveIsOwner]);

  // Verify live session dynamically (catches expired sessions, multi-tab logout, and bfcache restore)
  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!active) return;
        if (res.status === 401) {
          if (currentOwnerKey) setInvalidatedOwnerKey(currentOwnerKey);
          setCurrentUser(null);
          return;
        }
        const data = await res.json().catch(() => null);
        if (!active || !data) return;
        if (data.user) {
          setCurrentUser(data.user);
          if (isOwner && currentOwnerKey) {
            const matchesOwner = Boolean(
              (profile.userId && data.user.id === profile.userId) ||
              (profile.email &&
                data.user.email &&
                profile.email.toLowerCase().trim() === data.user.email.toLowerCase().trim())
            );
            if (!matchesOwner) {
              setInvalidatedOwnerKey(currentOwnerKey);
            } else {
              setInvalidatedOwnerKey(null);
            }
          }
        } else if ('user' in data && data.user === null) {
          setCurrentUser(null);
          if (currentOwnerKey) setInvalidatedOwnerKey(currentOwnerKey);
        }
      } catch { }
    };

    checkSession();

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) checkSession();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOwner) {
        checkSession();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOwner, currentOwnerKey, profile.userId, profile.email]);

  const handleToggleTheme = () => {
    toggleDarkMode();
  };

  const handleLogout = async () => {
    try {
      const emailToRemember = currentUser?.email || profile?.email;
      if (emailToRemember) {
        localStorage.setItem('avtive_remembered_identifier', emailToRemember);
      }
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      try {
        sessionStorage.removeItem('avtive_active_session');
      } catch { }
      setCurrentUser(null);
      window.location.replace('/login');
    }
  };

  const handleSaveEdits = async (updatedData: ProfileData) => {
    try {
      // Sanitize custom fields: filter out entries that have neither a label nor a value
      const sanitizedCustomFields = Array.isArray(updatedData.customFields)
        ? updatedData.customFields.filter(f => (f.label && f.label.trim()) || (f.value && f.value.trim()))
        : updatedData.customFields;

      // Sanitize certifications: filter out entries that have neither a name nor an issuer
      const sanitizedCertifications = Array.isArray(updatedData.certifications)
        ? updatedData.certifications.filter(c => (c.name && c.name.trim()) || (c.issuer && c.issuer.trim()))
        : updatedData.certifications;

      const payload = {
        ...updatedData,
        customFields: sanitizedCustomFields,
        certifications: sanitizedCertifications
      };

      // Pre-upload raw base64 images to Cloudinary to avoid 413 Payload Too Large on /api/profile/update
      if (payload.avatar && typeof payload.avatar === 'string' && payload.avatar.startsWith('data:')) {
        try {
          payload.avatar = await uploadImageToStorage(payload.avatar, 'avatars', {
            profileId: profile.id || profile.slug,
            field: 'avatar'
          });
        } catch (uploadErr) {
          console.warn('Avatar pre-upload warning:', uploadErr);
        }
      }
      if (payload.coverImage && typeof payload.coverImage === 'string' && payload.coverImage.startsWith('data:')) {
        try {
          payload.coverImage = await uploadImageToStorage(payload.coverImage, 'profiles', {
            profileId: profile.id || profile.slug,
            field: 'coverImage'
          });
        } catch (uploadErr) {
          console.warn('Cover pre-upload warning:', uploadErr);
        }
      }

      // Never overwrite existing saved images with an empty value
      if (!payload.avatar) {
        if (currentDraft?.avatar) {
          payload.avatar = currentDraft.avatar;
        } else if (profile.avatar) {
          payload.avatar = profile.avatar;
        }
      }
      if (!payload.coverImage) {
        if (currentDraft?.coverImage) {
          payload.coverImage = currentDraft.coverImage;
        } else if (profile.coverImage) {
          payload.coverImage = profile.coverImage;
        }
      }

      // If no dirty changes exist compared to baseline profile, no-op without sending request
      if (!isProfileDirty(payload, profile)) {
        navigateScreenMode('preview', profile.slug || profile.id);
        return;
      }

      const result = await saveProfile(payload);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save changes.');
      }

      const savedProfile = result.profile || payload;
      setProfile(savedProfile);
      setCurrentDraft(savedProfile);
      navigateScreenMode('preview', savedProfile.slug || savedProfile.id || profile.slug || profile.id);
      try {
        localStorage.setItem(`avtive_profile_${savedProfile.slug || savedProfile.id}`, JSON.stringify(savedProfile));
        localStorage.setItem(`avtive_profile_${savedProfile.id}`, JSON.stringify(savedProfile));
        localStorage.setItem('avtive_last_saved_profile', JSON.stringify(savedProfile));
        window.dispatchEvent(new CustomEvent('avtive_profile_updated', { detail: savedProfile }));
      } catch { }
      showToast('Profile saved successfully!');
    } catch (err: any) {
      console.error('Update profile error:', err);
      showToast(err.message || 'Failed to save profile changes.');
      throw err;
    }
  };

  const handleSavePartial = async (partialData: Partial<ProfileData>, explicitClearFields?: string[]): Promise<ProfileData> => {
    try {
      const sanitizedPartial = { ...partialData };
      if (sanitizedPartial.avatar && typeof sanitizedPartial.avatar === 'string' && sanitizedPartial.avatar.startsWith('data:')) {
        try {
          sanitizedPartial.avatar = await uploadImageToStorage(sanitizedPartial.avatar, 'avatars', {
            profileId: profile.id || profile.slug,
            field: 'avatar'
          });
        } catch (uploadErr) {
          console.warn('Avatar upload warning in handleSavePartial:', uploadErr);
        }
      }
      if (sanitizedPartial.coverImage && typeof sanitizedPartial.coverImage === 'string' && sanitizedPartial.coverImage.startsWith('data:')) {
        try {
          sanitizedPartial.coverImage = await uploadImageToStorage(sanitizedPartial.coverImage, 'profiles', {
            profileId: profile.id || profile.slug,
            field: 'coverImage'
          });
        } catch (uploadErr) {
          console.warn('Cover upload warning in handleSavePartial:', uploadErr);
        }
      }

      // Compute clearFields for any empty array or empty string (including intentional Remove Photo/Cover)
      const autoClearFields: string[] = Array.isArray(explicitClearFields) ? [...explicitClearFields] : [];
      if ('avatar' in partialData && !sanitizedPartial.avatar) {
        sanitizedPartial.avatar = '';
        if (!autoClearFields.includes('avatar')) autoClearFields.push('avatar');
      }
      if ('coverImage' in partialData && !sanitizedPartial.coverImage) {
        sanitizedPartial.coverImage = '';
        if (!autoClearFields.includes('coverImage')) autoClearFields.push('coverImage');
      }
      for (const [key, val] of Object.entries(sanitizedPartial)) {
        if (Array.isArray(val) && val.length === 0) {
          if (!autoClearFields.includes(key)) autoClearFields.push(key);
        } else if (typeof val === 'string' && val.trim() === '') {
          if (!autoClearFields.includes(key)) autoClearFields.push(key);
        }
      }

      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          updatedData: sanitizedPartial,
          clearFields: autoClearFields
        })
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json().catch(() => ({})) : null;

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('Section update payload is too large.');
        }
        throw new Error(data?.error || `Failed to save changes (${res.status}).`);
      }

      // Check appliedKeys, skippedKeys, and rejectedKeys
      if (data?.rejectedKeys && data.rejectedKeys.length > 0) {
        throw new Error(`Failed to save: rejected keys [${data.rejectedKeys.join(', ')}]`);
      }
      if (data?.skippedKeys && data.skippedKeys.length > 0) {
        throw new Error(`Failed to save: skipped keys [${data.skippedKeys.join(', ')}]`);
      }

      const updated = data?.profile || { ...profile, ...sanitizedPartial };
      setProfile(updated);
      setCurrentDraft(updated);
      try {
        localStorage.setItem(`avtive_profile_${updated.slug || updated.id}`, JSON.stringify(updated));
        localStorage.setItem(`avtive_profile_${updated.id}`, JSON.stringify(updated));
        localStorage.setItem('avtive_last_saved_profile', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('avtive_profile_updated', { detail: updated }));
      } catch { }
      showToast('Changes saved successfully!');
      return updated;
    } catch (err: any) {
      console.error('Update section error:', err);
      showToast(err.message || 'Failed to save changes.');
      throw err;
    }
  };

  const handleSaveContact = () => {
    try {
      downloadVCard(profile);
      showToast('Contact card downloaded!');
    } catch {
      showToast('Contact information saved!');
    }
  };

  const handleDraftChange = (draft: ProfileData) => {
    setCurrentDraft(draft);
    updateProfilePartial(draft);
  };

  const handleOpenEditMode = () => {
    if (!effectiveIsOwner) return;
    setDesktopOpen(false);
    setMobileOpen(false);
    handleCloseSidebar();
    navigateScreenMode('edit');
  };

  const handleCancelEdit = () => {
    discardUnsavedChanges();
    setPreviewBackgroundTheme(null);
    const baseline = savedBaseline || profile;
    setProfile(baseline);
    setCurrentDraft(baseline);
    navigateScreenMode('preview', baseline.slug || baseline.id || initialProfile.slug || initialProfile.id);
  };

  const handleOpenShareMode = () => {
    setDesktopOpen(false);
    setMobileOpen(false);
    handleCloseSidebar();
    setShareTargetProfileId(profile.id);
    navigateScreenMode('share');
  };

  const handleCloseShareMode = () => {
    navigateScreenMode('preview');
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing]);

  // Mobile best-effort flush on page hidden or mobile app backgrounding
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isEditing) {
        flushAutosave(undefined, { keepalive: true }).catch(() => { });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
    };
  }, [isEditing, flushAutosave]);

  const handleSaveAndExit = async () => {
    try {
      if (isUploadingAvatar || isUploadingCover) {
        showToast('Please wait for image upload to complete before saving.');
        return;
      }

      // Flush autosave with NO override object
      const result = await flushAutosave();
      if (!result.ok) {
        showToast(result.error || 'Failed to save changes. Please try again.');
        return; // Stay in edit mode, keep all unsaved changes
      }

      const freshProfile = result.profile || liveProfile;
      setProfile(freshProfile);
      setCurrentDraft(freshProfile);
      navigateScreenMode('preview', freshProfile.slug || freshProfile.id || initialProfile.slug || initialProfile.id);
      showToast('Profile saved successfully!');
    } catch (err: any) {
      console.error('Update profile error:', err);
      showToast(err?.message || 'Failed to save changes.');
    }
  };

  const handleReturnToView = (updatedProfile?: ProfileData) => {
    const fresh = updatedProfile || profile;
    setProfile(fresh);
    if (fresh.theme) setActiveTheme(fresh.theme);
    navigateScreenMode('preview', fresh.slug || fresh.id || profile.slug || profile.id);
    router.refresh();
  };

  const cardProfile = useMemo(() => {
    const base = isEditing ? liveProfile : profile;
    return {
      ...base,
      sectionVisibility: liveProfile.sectionVisibility || base.sectionVisibility,
      sharingSettings: liveProfile.sharingSettings || base.sharingSettings,
      connectionSettings: liveProfile.connectionSettings ?? base.connectionSettings,
      fieldPrivacy: liveProfile.fieldPrivacy ?? base.fieldPrivacy,
      sectionOrder: liveProfile.sectionOrder || base.sectionOrder,
      savedBackgroundThemeIds: liveProfile.savedBackgroundThemeIds ?? base.savedBackgroundThemeIds,
      backgroundType: previewBackgroundTheme ? 'occasion' : (liveProfile.backgroundType ?? base.backgroundType),
      activeBackgroundThemeId: (previewBackgroundTheme ? previewBackgroundTheme.id : (liveProfile.activeBackgroundThemeId ?? base.activeBackgroundThemeId)),
      introductionMedia: liveProfile.introductionMedia !== undefined ? liveProfile.introductionMedia : base.introductionMedia,
      type: profileType,
      theme: activeTheme
    };
  }, [profile, isEditing, liveProfile, profileType, activeTheme, previewBackgroundTheme]);

  const renderedCardProfile = useMemo(() => {
    if (!effectiveIsOwner) return cardProfile;
    return sanitizeProfileForAudience(cardProfile, previewAudience);
  }, [effectiveIsOwner, cardProfile, previewAudience]);

  const isPreviewOwnerView = effectiveIsOwner && previewAudience === 'owner';

  const ownerProfiles = React.useMemo(
    () => (effectiveIsOwner ? (userProfiles && userProfiles.length > 0 ? userProfiles : [profile]) : []),
    [effectiveIsOwner, userProfiles, profile]
  );

  const isPreviewMode = screenMode === 'preview';
  const hasCustomBackground =
    isPreviewMode &&
    resolveBackgroundMode({
      ...cardProfile,
      ...(previewBackgroundTheme
        ? { backgroundType: 'occasion', activeBackgroundThemeId: previewBackgroundTheme.id }
        : {}),
    }) !== 'default';

  return (
    <div
      data-theme={activeTheme}
      className={
        isPreviewMode
          ? `min-h-[100dvh] w-full flex flex-col relative overflow-x-clip ${hasCustomBackground ? 'bg-transparent' : activeThemeConfig.pageBg
          } ${activeThemeConfig.textPrimary} transition-colors duration-300 font-sans`
          : `h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden ${activeThemeConfig.pageBg} ${activeThemeConfig.textPrimary} transition-colors duration-300 font-sans relative`
      }
    >
      {/* Decorative Background Wallpaper Layer (sits behind the profile card, never merges with profile theme) */}
      {isPreviewMode && (
        <ProfileBackgroundLayer
          profile={cardProfile}
          overrideOccasionThemeId={previewBackgroundTheme?.id}
          contained={true}
        />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[60] px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-semibold shadow-xl border border-white/10 dark:border-black/10 animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      <div
        className={
          isPreviewMode
            ? 'relative z-10 w-full flex-1 flex flex-col'
            : 'flex-1 flex flex-col min-h-0 overflow-hidden relative w-full'
        }
      >
        {/* Top Platform Header */}
        <div className={isPreviewMode ? 'sticky top-0 z-40 w-full' : 'shrink-0 z-40 w-full'}>
          <HeaderNav
            currentProfile={{ ...profile, theme: activeTheme }}
            profileType={profileType}
            onSelectProfileType={(type) => setProfileType(type)}
            onOpenMyCard={() => setProfileType('individual')}
            canEdit={effectiveIsOwner}
            isEditing={isEditing}
            isSharing={isSharing}
            showEditActionsInHeader={false}
            onCancelEdit={handleCancelEdit}
            onSaveEdits={handleSaveAndExit}
            isSaving={isSaving}
            onOpenEdit={handleOpenEditMode}
            onOpenShare={handleOpenShareMode}
            isDark={isDark}
            onToggleTheme={handleToggleTheme}
            viewMode={previewViewMode}
            onToggleViewMode={setPreviewViewMode}
            session={currentUser}
            onLogout={handleLogout}
            theme={activeThemeConfig}
            onToggleSections={handleTriggerClick}
            onSectionsMouseEnter={handleTriggerMouseEnter}
            onSectionsMouseLeave={handleTriggerMouseLeave}
          />
        </div>

        {/* Central In-Page Mode Area: Edit | Share | Preview */}
        {screenMode === 'edit' && effectiveIsOwner && (
          <ProfileEditorView
            profile={cardProfile}
            theme={activeThemeConfig}
            isUploadingAvatar={isUploadingAvatar}
            isUploadingCover={isUploadingCover}
            onCancelClose={handleCancelEdit}
            onDoneClose={(savedProfile) => {
              setProfile(savedProfile);
              setCurrentDraft(savedProfile);
              navigateScreenMode(
                'preview',
                savedProfile.slug || savedProfile.id || initialProfile.slug || initialProfile.id
              );
              showToast('Profile saved successfully!');
            }}
            onSavePartial={handleSavePartial}
            onPreviewBackgroundTheme={setPreviewBackgroundTheme}
            onShowToast={showToast}
          />
        )}

        {screenMode === 'share' && (
          effectiveIsOwner ? (
            <UnifiedShareWorkspace
              isOpen={true}
              onClose={handleCloseShareMode}
              profile={profile}
              userProfiles={ownerProfiles}
              selectedProfileId={shareTargetProfileId}
              onSelectProfileId={setShareTargetProfileId}
              draftSelectionsByProfile={shareDraftSelections}
              onUpdateDraftSelection={(pid, fields) =>
                setShareDraftSelections((prev) => ({ ...prev, [pid]: fields }))
              }
              draftPresetByProfile={shareDraftPresets}
              onUpdateDraftPreset={(pid, preset) =>
                setShareDraftPresets((prev) => ({ ...prev, [pid]: preset }))
              }
              isDark={isDark}
              onAuthRequired={() => setCurrentUser(null)}
              onSwitchToPublicShare={() => {
                if (currentOwnerKey) setInvalidatedOwnerKey(currentOwnerKey);
                setCurrentUser(null);
              }}
              onCopySuccess={() => showToast('Secure link copied!')}
              onUpdateProfile={(updated) => {
                if (updated.id === profile.id) {
                  setProfile(updated);
                  setCurrentDraft(updated);
                  updateProfilePartial(updated);
                }
              }}
            />
          ) : (
            <VisitorPublicShareView
              profile={profile}
              onClose={handleCloseShareMode}
              onCopySuccess={() => showToast('Public profile link copied!')}
            />
          )
        )}

        {isPreviewMode && (
          <>
            {/* Section Navigation Drawer on Desktop (>= lg) */}
            <AnimatePresence>
              {desktopOpen && (
                <div className="hidden lg:block">
                  <motion.div
                    key="desktop-sidebar-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleCloseDesktop}
                    className="fixed inset-0 bg-black/40 z-50 cursor-pointer"
                  />
                  <motion.div
                    key="desktop-sidebar-drawer"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                    onMouseEnter={handlePanelMouseEnter}
                    onMouseLeave={handlePanelMouseLeave}
                    className="fixed inset-x-0 bottom-0 z-50 w-full max-w-md mx-auto max-h-[82dvh] rounded-t-3xl shadow-2xl overflow-hidden"
                  >
                    <DesktopProfileSidebar
                      onClose={handleCloseDesktop}
                      onSelectSection={handleDesktopSectionSelect}
                      isPublicView={true}
                    />
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Section Navigation Drawer on Mobile (< lg) */}
            <AnimatePresence>
              {mobileOpen && (
                <div className="lg:hidden">
                  <motion.div
                    key="mobile-viewport-sidebar-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleCloseMobile}
                    className="fixed inset-0 bg-black/40 z-50 cursor-pointer"
                  />
                  <motion.div
                    key="mobile-viewport-sidebar-drawer"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                    className="fixed inset-x-0 bottom-0 z-50 w-full max-w-md mx-auto max-h-[82dvh] rounded-t-3xl shadow-2xl overflow-hidden"
                  >
                    <DesktopProfileSidebar
                      onClose={handleCloseMobile}
                      onSelectSection={handleMobileSectionSelect}
                      isPublicView={true}
                    />
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Centered Profile Card Layer over Outer Decorative Background Wallpaper */}
            <main
              id="profile-scroll-panel"
              onClick={() => {
                if (desktopOpen) handleCloseDesktop();
                if (mobileOpen) handleCloseMobile();
                if (isSidebarOpen) handleCloseSidebar();
              }}
              className={`w-full flex-1 touch-pan-y transition-all duration-300 pb-24 ${previewViewMode === 'mobile'
                ? 'px-3 sm:px-6 py-4 sm:py-8'
                : hasCustomBackground
                  ? 'px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6'
                  : 'px-0 sm:px-6 lg:px-8 py-0 sm:py-6'
                }`}
            >
              <div
                data-testid="profile-card-shell"
                data-view-mode={previewViewMode}
                className={`@container w-full mx-auto transition-all duration-300 ${
                  previewViewMode === 'mobile'
                    ? 'max-w-[390px] rounded-2xl border shadow-xl'
                    : `max-w-3xl ${
                        hasCustomBackground
                          ? 'rounded-2xl sm:rounded-3xl border shadow-xl'
                          : 'rounded-none sm:rounded-3xl border-0 sm:border shadow-none sm:shadow-xl'
                      }`
                } ${activeThemeConfig.cardBorder} ${activeThemeConfig.cardBg} overflow-clip relative`}
              >
                {effectiveIsOwner && (
                  <div
                    data-testid="audience-preview-switcher"
                    className="px-3 sm:px-5 py-2.5 bg-[#FAF7F2]/95 dark:bg-zinc-900/95 border-b border-stone-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 min-w-0">
                      <Eye className="w-3.5 h-3.5 text-[#7A1C33] dark:text-amber-300 shrink-0" />
                      <span className="truncate">
                        {previewAudience === 'owner'
                          ? 'My Profile (Owner View)'
                          : previewAudience === 'public'
                            ? 'How Others See It — Public Visitor'
                            : 'How Others See It — Accepted Connection'}
                      </span>
                    </div>

                    <div
                      role="group"
                      aria-label="How others see your profile"
                      className="inline-flex items-center p-0.5 rounded-xl bg-stone-200/80 dark:bg-zinc-800 border border-stone-300/70 dark:border-zinc-700 shrink-0"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewAudience('owner')}
                        aria-pressed={previewAudience === 'owner'}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                          previewAudience === 'owner'
                            ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white shadow-2xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>My Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewAudience('public')}
                        aria-pressed={previewAudience === 'public'}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                          previewAudience === 'public'
                            ? 'bg-[#7A1C33] text-white shadow-2xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                        }`}
                      >
                        <Globe className="w-3 h-3" />
                        <span>Public</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewAudience('connection')}
                        aria-pressed={previewAudience === 'connection'}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                          previewAudience === 'connection'
                            ? 'bg-[#7A1C33] text-white shadow-2xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        <span>Connection</span>
                      </button>
                    </div>
                  </div>
                )}

                {effectiveIsOwner && cardProfile.profileVisibility === 'private' && (
                  <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-center text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Private profile — {previewAudience === 'owner' ? 'Visitors see your name only' : 'Showing exact visitor preview (name only)'}
                  </div>
                )}
                <AvtiveDigitalCard
                  key={`${cardProfile.id}-${previewAudience}`}
                  profile={renderedCardProfile}
                  userProfiles={ownerProfiles}
                  canEdit={isPreviewOwnerView}
                  isEditing={false}
                  onPreviewBackgroundTheme={setPreviewBackgroundTheme}
                  isConnected={effectiveIsOwner ? previewAudience === 'connection' : Boolean(isConnected)}
                  onDraftChange={handleDraftChange}
                  onOpenEdit={handleOpenEditMode}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdits={handleSaveEdits}
                  onSavePartial={handleSavePartial}
                  onSaveContact={handleSaveContact}
                  onOpenShare={handleOpenShareMode}
                  onOpenConnect={() => setIsConnectModalOpen(true)}
                  onOpenQRModal={() => setIsQRModalOpen(true)}
                  onOpenResumeModal={() => setIsResumeModalOpen(true)}
                  onSelectProject={(project) => setSelectedProject(project)}
                  onSelectTeamMember={(member) => {
                    const slug = member.profileId === 'individual' ? 'syedmesumraza' : member.profileId === 'team-member' ? 'hamza-malik' : member.id;
                    router.push(`/profile/${slug}`);
                  }}
                  onViewCompany={() => {
                    if (profile.companyId) {
                      router.push(`/profile/${profile.companyId}`);
                    }
                  }}
                  isDark={isDark}
                  viewMode={previewViewMode === 'mobile' ? 'mobile' : 'standard'}
                  activeSection={activeTabSection}
                  onSelectSection={(sec) => handleSectionSelect(sec, false)}
                  onToggleSections={handleTriggerClick}
                  onSectionsMouseEnter={handleTriggerMouseEnter}
                  onSectionsMouseLeave={handleTriggerMouseLeave}
                  isSidebarOpen={isSidebarOpen}
                  onToggleMobileSections={handleToggleMobile}
                  isMobileSectionsOpen={mobileOpen}
                  onToggleDesktopSections={handleToggleDesktop}
                  isDesktopSectionsOpen={desktopOpen}
                />
              </div>
            </main>
          </>
        )}
      </div>

      {/* Connect / Exchange Contact Modal */}
      {isConnectModalOpen && (
        <ExchangeContactModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          profile={profile}
          session={currentUser}
          onSuccess={() => showToast('Connected successfully!')}
        />
      )}

      {/* QR Code Fullscreen Modal */}
      {isQRModalOpen && (
        <QRFullscreenModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          profile={profile}
          isOwner={effectiveIsOwner}
        />
      )}

      {/* Resume Viewer Modal */}
      {isResumeModalOpen && (
        <ResumeViewerModal
          isOpen={isResumeModalOpen}
          onClose={() => setIsResumeModalOpen(false)}
          profile={profile}
        />
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
          profile={profile}
        />
      )}
      {!isEditing && Boolean(effectiveIsOwner || currentUser) && (
        <OwnerBottomNav
          profileHref={`/profile/${profile.slug || profile.id}`}
        />
      )}
    </div>
  );
}
