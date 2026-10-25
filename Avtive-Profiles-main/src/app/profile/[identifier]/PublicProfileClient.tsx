'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ProfileData, 
  ProfileTheme, 
  UserSession,
  ProjectItem,
  ProfileType 
} from '@/types/profile';
import { HeaderNav } from '@/components/HeaderNav';
import { AvtiveDigitalCard } from '@/components/AvtiveDigitalCard';
import { PhonePreview } from '@/components/PhonePreview';
import { getThemeConfig } from '@/components/themeStyles';
import { ShareModal } from '@/components/share/ShareModal';
import { ExchangeContactModal } from '@/components/ExchangeContactModal';
import { QRFullscreenModal } from '@/components/QRFullscreenModal';
import { ResumeViewerModal } from '@/components/ResumeViewerModal';
import { ProjectDetailModal } from '@/components/ProjectDetailModal';
import { ProfileEditorProvider, useProfileEditor } from '@/context/ProfileEditorContext';
import { downloadVCard } from '@/lib/vcard';
import { motion, AnimatePresence } from 'framer-motion';
import { DesktopProfileSidebar, DESKTOP_SIDEBAR_SECTIONS } from '@/components/profiles/DesktopProfileSidebar';
import { ProfileSectionTabBar } from '@/components/profiles/ProfileSectionTabBar';
import { Edit3, Save, X, Loader2, LayoutGrid, Sun, Moon, LogOut } from 'lucide-react';
import { DualScreenWorkspace } from '@/components/layout/DualScreenWorkspace';
import { usePortfolioTheme } from '@/context/ThemeContext';
import { uploadImageToStorage } from '@/lib/imageCompression';

export interface PublicProfileClientProps {
  initialProfile: ProfileData;
  session: UserSession | null;
  isOwner: boolean;
  initialIsEditing?: boolean;
  userProfiles?: ProfileData[];
}

export function PublicProfileClient({
  initialProfile,
  session,
  isOwner,
  initialIsEditing = false,
  userProfiles = []
}: PublicProfileClientProps) {
  return (
    <ProfileEditorProvider initialProfile={initialProfile} userProfiles={userProfiles}>
      <PublicProfileClientInner
        initialProfile={initialProfile}
        session={session}
        isOwner={isOwner}
        initialIsEditing={initialIsEditing}
        userProfiles={userProfiles}
      />
    </ProfileEditorProvider>
  );
}

function PublicProfileClientInner({
  initialProfile,
  session,
  isOwner,
  initialIsEditing = false,
  userProfiles = []
}: PublicProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [profileType, setProfileType] = useState<ProfileType>(initialProfile.type || 'individual');
  const [activeTheme, setActiveTheme] = useState<ProfileTheme>(
    initialProfile.theme && initialProfile.theme !== 'default' ? initialProfile.theme : 'editorial'
  );
  const { isDark, toggleDarkMode } = usePortfolioTheme();
  const [isEditing, setIsEditing] = useState(Boolean(initialIsEditing && isOwner));
  // Two independent sliders for Edit Mode Sections Navigation:
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isTouchRef = React.useRef(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(session);

  const activeThemeConfig = getThemeConfig(activeTheme);

  const isCompany = profileType === 'team' || profile.type === 'team';
  const mobileNavSections = React.useMemo(() => {
    return DESKTOP_SIDEBAR_SECTIONS.filter(s => {
      if (s.category !== 'core') return false;
      if (!isCompany && (s.key === 'teamMembers' || s.key === 'companyInfo')) return false;
      if (isCompany && (s.key === 'companyInfo' || s.key === 'personalDetails' || s.key === 'experience' || s.key === 'education' || s.key === 'certifications' || s.key === 'languages')) return false;
      return true;
    });
  }, [isCompany]);

  const getMobileShortLabel = (key: string, fullLabel: string) => {
    switch (key) {
      case 'profile': return 'Profile';
      case 'companyInfo': return 'Company';
      case 'teamMembers': return 'Team';
      case 'personalDetails': return 'Bio';
      case 'skills': return 'Skills';
      case 'projects': return 'Projects';
      case 'education': return 'Edu';
      case 'contactInfo': return 'Contact';
      case 'socialLinks': return 'Social';
      case 'experience': return 'Exp';
      case 'certifications': return 'Certs';
      case 'languages': return 'Langs';
      case 'customFields': return 'Custom';
      default: return fullLabel;
    }
  };

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

  // Track scroll position in the profile content panel to update active tab highlight
  useEffect(() => {
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

    const createScrollHandler = (panel: HTMLElement) => () => {
      const panelTop = panel.getBoundingClientRect().top;
      let currentSection = 'profile';

      for (const id of sectionIds) {
        const el = panel.querySelector<HTMLElement>(`#${id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top - panelTop <= 160) {
            const rawKey = id.replace('section-', '');
            if (rawKey === 'hero') currentSection = 'profile';
            else if (rawKey === 'about') currentSection = 'personalDetails';
            else if (rawKey === 'services') currentSection = 'skills';
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

    const desktopPanel = document.getElementById('profile-scroll-panel');
    const mobilePanel = document.getElementById('mobile-profile-scroll-panel');
    const cleanups: (() => void)[] = [];

    if (desktopPanel) {
      const handler = createScrollHandler(desktopPanel);
      desktopPanel.addEventListener('scroll', handler, { passive: true });
      cleanups.push(() => desktopPanel.removeEventListener('scroll', handler));
    }
    if (mobilePanel) {
      const handler = createScrollHandler(mobilePanel);
      mobilePanel.addEventListener('scroll', handler, { passive: true });
      cleanups.push(() => mobilePanel.removeEventListener('scroll', handler));
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);

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
      skills: ['section-skills', 'section-services'],
      services: ['section-skills', 'section-services'],
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

    const scrollToSectionInPanel = (panel: HTMLElement) => {
      if (!isElementVisible(panel)) return false;

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
    const mobilePanel = document.getElementById('mobile-profile-scroll-panel');

    if (isFromMobile && mobilePanel) {
      scrollToSectionInPanel(mobilePanel);
    } else if (isFromDesktop && desktopPanel) {
      scrollToSectionInPanel(desktopPanel);
    } else {
      let scrolledAny = false;
      if (desktopPanel && isElementVisible(desktopPanel)) {
        scrolledAny = scrollToSectionInPanel(desktopPanel) || scrolledAny;
      }
      if (mobilePanel && isElementVisible(mobilePanel)) {
        scrolledAny = scrollToSectionInPanel(mobilePanel) || scrolledAny;
      }
      if (!scrolledAny) {
        const fallbackEl = document.querySelector<HTMLElement>(selectors);
        if (fallbackEl) {
          fallbackEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // Synchronize edit mode with browser URL and listen to popstate (back/forward)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const isEditParam = params.get('edit') === 'true' || params.get('edit') === '1';
      if (isEditParam && isOwner) {
        setIsEditing(true);
      } else if (!isEditParam) {
        setIsEditing(false);
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [isOwner]);

  // Hydrate updated profile from localStorage on mount & listen to real-time updates
  useEffect(() => {
    try {
      const cached =
        localStorage.getItem(`avtive_profile_${initialProfile.slug}`) ||
        localStorage.getItem(`avtive_profile_${initialProfile.id}`) ||
        localStorage.getItem('avtive_last_saved_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.id === initialProfile.id || parsed.slug === initialProfile.slug)) {
          setProfile((prev) => ({ ...prev, ...parsed }));
          if (parsed.theme) setActiveTheme(parsed.theme);
        }
      }
    } catch {}

    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ProfileData>;
      if (customEvent.detail) {
        const updated = customEvent.detail;
        if (updated.id === initialProfile.id || updated.slug === initialProfile.slug) {
          setProfile((prev) => ({ ...prev, ...updated }));
          if (updated.theme) setActiveTheme(updated.theme);
        }
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('avtive_profile_') && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (updated && (updated.id === initialProfile.id || updated.slug === initialProfile.slug)) {
            setProfile((prev) => ({ ...prev, ...updated }));
            if (updated.theme) setActiveTheme(updated.theme);
          }
        } catch {}
      }
    };

    window.addEventListener('avtive_profile_updated', handleProfileUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('avtive_profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initialProfile.id, initialProfile.slug]);

  // Fetch / verify session dynamically so header auth status is accurate
  useEffect(() => {
    if (!currentUser) {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

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
      } catch {}
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

      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          updatedData: payload
        })
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json().catch(() => ({})) : null;

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('Profile payload is too large. Please select a photo under 4.5MB.');
        }
        throw new Error(data?.error || `Failed to save changes (${res.status}).`);
      }

      const savedProfile = data?.profile || payload;
      setProfile(savedProfile);
      setCurrentDraft(savedProfile);
      setIsEditing(false);
      try {
        localStorage.setItem(`avtive_profile_${savedProfile.slug || savedProfile.id}`, JSON.stringify(savedProfile));
        localStorage.setItem(`avtive_profile_${savedProfile.id}`, JSON.stringify(savedProfile));
        localStorage.setItem('avtive_last_saved_profile', JSON.stringify(savedProfile));
        window.dispatchEvent(new CustomEvent('avtive_profile_updated', { detail: savedProfile }));
        const targetSlug = savedProfile.slug || savedProfile.id || profile.slug || profile.id;
        if (targetSlug && typeof window !== 'undefined') {
          window.history.pushState(null, '', `/profile/${encodeURIComponent(targetSlug)}`);
        }
      } catch {}
      showToast('Profile saved successfully!');
    } catch (err: any) {
      console.error('Update profile error:', err);
      showToast(err.message || 'Failed to save profile changes.');
      throw err;
    }
  };

  const handleSavePartial = async (partialData: Partial<ProfileData>): Promise<ProfileData> => {
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

      // Never overwrite existing saved images with an empty value
      if (!sanitizedPartial.avatar) {
        if (currentDraft?.avatar) {
          sanitizedPartial.avatar = currentDraft.avatar;
        } else if (profile.avatar) {
          sanitizedPartial.avatar = profile.avatar;
        }
      }
      if (!sanitizedPartial.coverImage) {
        if (currentDraft?.coverImage) {
          sanitizedPartial.coverImage = currentDraft.coverImage;
        } else if (profile.coverImage) {
          sanitizedPartial.coverImage = profile.coverImage;
        }
      }

      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          updatedData: sanitizedPartial
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

      const updated = data?.profile || { ...profile, ...sanitizedPartial };
      setProfile(updated);
      setCurrentDraft(updated);
      try {
        localStorage.setItem(`avtive_profile_${updated.slug || updated.id}`, JSON.stringify(updated));
        localStorage.setItem(`avtive_profile_${updated.id}`, JSON.stringify(updated));
        localStorage.setItem('avtive_last_saved_profile', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('avtive_profile_updated', { detail: updated }));
      } catch {}
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

  const {
    liveProfile,
    activeSection,
    setActiveSection,
    isSaving,
    saveProfile,
    handleSwitchToProfile
  } = useProfileEditor();

  const [currentDraft, setCurrentDraft] = useState<ProfileData>(profile);

  useEffect(() => {
    setCurrentDraft(profile);
  }, [profile]);

  const handleDraftChange = (draft: ProfileData) => {
    setCurrentDraft(draft);
  };

  const handleOpenEditMode = () => {
    if (!isOwner) return;
    setIsEditing(true);
    const slug = profile.slug || profile.id || initialProfile.slug || initialProfile.id;
    if (slug && typeof window !== 'undefined') {
      window.history.pushState(null, '', `/profile/${encodeURIComponent(slug)}?edit=true`);
    }
  };

  const handleCancelEdit = () => {
    setCurrentDraft(profile);
    handleSwitchToProfile(profile);
    setIsEditing(false);
    const slug = profile.slug || profile.id || initialProfile.slug || initialProfile.id;
    if (slug && typeof window !== 'undefined') {
      window.history.pushState(null, '', `/profile/${encodeURIComponent(slug)}`);
    }
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

  const handleSaveAndExit = async () => {
    try {
      await handleSaveEdits(currentDraft);
    } catch (err: any) {
      console.error('Update profile error:', err);
    }
  };

  const handleReturnToView = (updatedProfile?: ProfileData) => {
    const fresh = updatedProfile || profile;
    setProfile(fresh);
    if (fresh.theme) setActiveTheme(fresh.theme);
    setIsEditing(false);
    const slug = fresh.slug || fresh.id || profile.slug || profile.id;
    if (slug && typeof window !== 'undefined') {
      window.history.pushState(null, '', `/profile/${encodeURIComponent(slug)}`);
    }
    router.refresh();
  };

  const desktopView = (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {/* Clean Public & Owner Header - Firmly Docked at Top */}
      <div className="shrink-0 z-40 w-full">
        <HeaderNav
          currentProfile={{ ...profile, theme: activeTheme }}
          profileType={profileType}
          onSelectProfileType={(type) => setProfileType(type)}
          canEdit={isOwner}
          isEditing={isEditing}
          onCancelEdit={handleCancelEdit}
          onSaveEdits={handleSaveAndExit}
          isSaving={isSaving}
          onOpenEdit={handleOpenEditMode}
          onOpenShare={() => setIsShareModalOpen(true)}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          session={currentUser}
          onLogout={handleLogout}
          theme={activeThemeConfig}
          onToggleSections={handleTriggerClick}
          onSectionsMouseEnter={handleTriggerMouseEnter}
          onSectionsMouseLeave={handleTriggerMouseLeave}
        />
      </div>

      {/* Pinned Visible Section Navigation Tab Bar (Stitch Design) */}
      <div className="shrink-0 z-30 w-full">
        <ProfileSectionTabBar
          profile={{ ...profile, type: profileType, theme: activeTheme }}
          activeSection={activeTabSection}
          onSelectSection={(sec) => handleSectionSelect(sec, false)}
          theme={activeThemeConfig}
          isEditing={isEditing}
          canEdit={isOwner}
        />
      </div>

      {/* Slide-In Section Drawer on Desktop (>= lg) */}
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
              initial={{ x: -340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -340, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              onMouseEnter={handlePanelMouseEnter}
              onMouseLeave={handlePanelMouseLeave}
              className="fixed top-0 bottom-0 left-0 z-50 h-full max-h-[100dvh] shadow-2xl max-w-full overflow-hidden"
            >
              <DesktopProfileSidebar
                onClose={handleCloseDesktop}
                onSelectSection={handleDesktopSectionSelect}
                isPublicView={!isEditing}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-In Section Drawer on Mobile (< lg) */}
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
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 bottom-0 left-0 z-50 h-full w-full max-w-[320px] shadow-2xl"
            >
              <DesktopProfileSidebar
                onClose={handleCloseMobile}
                onSelectSection={handleMobileSectionSelect}
                isPublicView={!isEditing}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Responsive Profile Container + Mobile 80/20 Docked Panel */}
      <div className="flex-1 min-h-0 w-full flex flex-row overflow-hidden relative">
        <div 
          id="profile-scroll-panel"
          onClick={() => {
            if (desktopOpen) handleCloseDesktop();
            if (mobileOpen) handleCloseMobile();
            if (isSidebarOpen) handleCloseSidebar();
          }}
          className="h-full min-h-0 overflow-y-auto overscroll-contain px-0 sm:px-4 lg:px-6 py-0 sm:py-4 box-border scrollbar-thin transition-all duration-300 w-full flex-1"
        >
          <div className={`w-full max-w-3xl mx-auto rounded-none sm:rounded-3xl border-0 sm:border ${activeThemeConfig.cardBorder} ${activeThemeConfig.cardBg} shadow-none sm:shadow-xl overflow-hidden relative`}>
            <AvtiveDigitalCard
              profile={{ ...profile, type: profileType, theme: activeTheme }}
              canEdit={isOwner}
              isEditing={isEditing}
              isConnected={false}
              onDraftChange={handleDraftChange}
              onOpenEdit={handleOpenEditMode}
              onCancelEdit={handleCancelEdit}
              onSaveEdits={handleSaveEdits}
              onSavePartial={handleSavePartial}
              onSaveContact={handleSaveContact}
              onOpenShare={() => setIsShareModalOpen(true)}
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
              viewMode="standard"
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
        </div>
      </div>
    </div>
  );

  const mobileView = (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 relative overflow-hidden">
      {/* If editing on mobile, show an elegant top edit action strip so the user can Save & Exit anytime! */}
      {isEditing && (
        <div className="shrink-0 z-40 w-full px-3 py-2 bg-slate-900/95 text-white dark:bg-black/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Editing Profile</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAndExit}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save & Done'}
            </button>
          </div>
        </div>
      )}

      {/* Pinned Visible Section Navigation Tab Bar (Stitch Design) */}
      <div className="shrink-0 z-30 w-full">
        <ProfileSectionTabBar
          profile={{ ...profile, type: profileType, theme: activeTheme }}
          activeSection={activeTabSection}
          onSelectSection={(sec) => handleSectionSelect(sec, true)}
          theme={activeThemeConfig}
          isEditing={isEditing}
          canEdit={isOwner}
        />
      </div>

      <div className="flex-1 w-full min-h-0 flex flex-row overflow-hidden relative">
        <div 
          id="mobile-profile-scroll-panel" 
          onClick={() => {
            if (mobileOpen) handleCloseMobile();
            if (isSidebarOpen) handleCloseSidebar();
          }}
          className="h-full min-h-0 overflow-y-auto overscroll-contain transition-all duration-300 w-full flex-1"
        >
          <AvtiveDigitalCard
            profile={{ ...profile, type: profileType, theme: activeTheme }}
            canEdit={isOwner}
            isEditing={isEditing}
            isConnected={false}
            onDraftChange={handleDraftChange}
            onOpenEdit={handleOpenEditMode}
            onCancelEdit={handleCancelEdit}
            onSaveEdits={handleSaveEdits}
            onSavePartial={handleSavePartial}
            onSaveContact={handleSaveContact}
            onOpenShare={() => setIsShareModalOpen(true)}
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
            viewMode="standard"
            onSelectSection={(sec) => handleSectionSelect(sec, true)}
            onToggleSections={handleTriggerClick}
            onSectionsMouseEnter={handleTriggerMouseEnter}
            onSectionsMouseLeave={handleTriggerMouseLeave}
            isSidebarOpen={isSidebarOpen}
            onToggleMobileSections={handleToggleMobile}
            isMobileSectionsOpen={mobileOpen}
          />
        </div>

        {/* Mobile Section Navigation Drawer - Floating Overlay (Public View) */}
        <AnimatePresence>
          {!isEditing && isSidebarOpen && (
            <>
              <motion.div
                key="mobile-drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleCloseSidebar}
                className="absolute inset-0 bg-black/40 z-30 cursor-pointer"
              />
              <motion.div
                key="mobile-drawer-panel"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="absolute top-0 bottom-0 right-0 h-full w-[80px] shrink-0 flex flex-col items-center py-2 px-1 border-l border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#070D1A] shadow-2xl overflow-y-auto overscroll-contain scrollbar-none z-40"
              >
                <div className="w-full flex flex-col items-center gap-1.5 pb-4">
                  {mobileNavSections.map((section) => {
                    const IconComponent = section.icon;
                    const isActive = activeTabSection === section.key;
                    return (
                      <button
                        key={`chassis-panel-${section.key}`}
                        type="button"
                        onClick={() => {
                          handleSectionSelect(section.key);
                          handleCloseSidebar();
                        }}
                        className={`min-h-[42px] h-[44px] w-full max-w-[68px] rounded-xl flex flex-col items-center justify-center p-1 transition-all cursor-pointer select-none active:scale-95 ${
                          isActive
                            ? 'bg-[#6C4CF1]/15 text-[#6C4CF1] dark:bg-cyan-500/20 dark:text-cyan-300 border border-[#6C4CF1]/30 dark:border-cyan-400/30 font-bold shadow-xs'
                            : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/10'
                        }`}
                        title={section.label}
                        aria-label={section.label}
                      >
                        <IconComponent className="w-4 h-4 shrink-0" />
                        <span className="text-[9px] font-medium leading-none tracking-tight truncate max-w-full mt-0.5">
                          {getMobileShortLabel(section.key, section.label)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Slide-In Section Drawer on Mobile Phone Chassis - STRICTLY EDIT MODE ONLY */}
        <AnimatePresence>
          {isEditing && mobileOpen && (
            <>
              <motion.div
                key="mobile-chassis-sidebar-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleCloseMobile}
                className="absolute inset-0 bg-black/40 z-40 cursor-pointer"
              />
              <motion.div
                key="mobile-chassis-sidebar-drawer"
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="absolute top-0 bottom-0 left-0 z-50 h-full w-full max-w-[320px] shadow-2xl"
              >
                <DesktopProfileSidebar
                  onClose={handleCloseMobile}
                  onSelectSection={handleMobileSectionSelect}
                  isPublicView={false}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div 
      data-theme={activeTheme}
      className={`h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden ${activeThemeConfig.pageBg} ${activeThemeConfig.textPrimary} transition-all duration-300 font-sans`}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold shadow-xl border border-white/10 dark:border-black/10 animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      <DualScreenWorkspace
        workflowTitle="Digital Pass Identity"
        workflowSubtitle="Verified Public Profile"
        currentUrlPath={`/profile/${profile.slug || profile.id}`}
        showWindowHeader={false}
        desktopContent={desktopView}
        mobileContent={mobileView}
      />

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

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          profile={profile}
        />
      )}

      {/* QR Code Fullscreen Modal */}
      {isQRModalOpen && (
        <QRFullscreenModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          profile={profile}
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
    </div>
  );
}
