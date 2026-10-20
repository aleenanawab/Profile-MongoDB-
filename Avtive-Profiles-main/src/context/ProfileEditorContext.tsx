'use client';

/**
 * ProfileEditorContext
 * --------------------
 * Single source of truth for all profile-editing state.
 * Both EditProfileClient (preview side) and SlidingEditorPanel (editor side)
 * consume this context — no duplicated atoms, no stale-prop re-sync bugs.
 *
 * Architecture:
 *   <ProfileEditorProvider initialProfile={...} userProfiles={...}>
 *     <EditProfileClient />   ← reads liveProfile, calls setters
 *     <SlidingEditorPanel />  ← reads same atoms, calls same setters
 *   </ProfileEditorProvider>
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  ProfileData,
  ProfileTheme,
  ProjectItem,
  ExperienceItem,
  EducationItem,
  SharingSettings,
  CustomFieldItem,
  DynamicSection,
  DEFAULT_SECTION_ORDER,
  DEFAULT_SECTION_VISIBILITY,
  SocialLink,
} from '@/types/profile';
import { ALL_PROFILE_SECTIONS } from '@/components/sections/DynamicSectionGroups';

// ─── DraggableLinkItem ────────────────────────────────────────────────────────

export interface DraggableLinkItem {
  id: string;
  platform: 'github' | 'linkedin' | 'website' | 'twitter' | 'whatsapp' | 'other';
  title: string;
  url: string;
  visible: boolean;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function buildSocialLinksFromProfile(p: ProfileData): DraggableLinkItem[] {
  const safeSocials =
    Array.isArray(p.socials) && p.socials.length > 0
      ? p.socials
      : Array.isArray(p.socialLinks) && p.socialLinks.length > 0
      ? p.socialLinks
      : null;

  if (safeSocials && safeSocials.length > 0) {
    return safeSocials.map((s: { platform?: string; label?: string; url?: string; visible?: boolean }, idx: number) => {
      const platform = (s.platform || 'website') as DraggableLinkItem['platform'];
      return {
        id: `link-${platform}-${idx}`,
        platform,
        title: s.label || (platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Link'),
        url: s.url || '',
        visible: s.visible !== false,
      };
    });
  }

  return [
    { id: 'link-li-0', platform: 'linkedin', title: 'LinkedIn', url: 'https://linkedin.com', visible: true },
    { id: 'link-gh-1', platform: 'github', title: 'GitHub', url: 'https://github.com', visible: true },
    { id: 'link-web-2', platform: 'website', title: 'Website / Portfolio', url: p.website || 'https://avtive.app', visible: true },
  ];
}

function extractSkills(p: ProfileData): string[] {
  if (Array.isArray(p.skills) && p.skills.length > 0) {
    return p.skills.map((s) => (typeof s === 'string' ? s : s.name));
  }
  return ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'];
}

// ─── Context Shape ────────────────────────────────────────────────────────────

export interface ProfileEditorContextValue {
  // Core profile object (DB baseline — updated after save/switch)
  profile: ProfileData;

  // ── Editable field atoms ──────────────────────────────────────────────────
  activeTheme: ProfileTheme;
  setActiveTheme: (t: ProfileTheme) => void;

  firstName: string;
  setFirstName: (v: string) => void;
  secondName: string;
  setSecondName: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  professionalTitle: string;
  setProfessionalTitle: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  tagline: string;
  setTagline: (v: string) => void;
  company: string;
  setCompany: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  avatar: string;
  setAvatar: (v: string) => void;
  coverImage: string;
  setCoverImage: (v: string) => void;

  skills: string[];
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;
  about: string;
  setAbout: (v: string) => void;

  projects: ProjectItem[];
  setProjects: React.Dispatch<React.SetStateAction<ProjectItem[]>>;
  experiences: ExperienceItem[];
  setExperiences: React.Dispatch<React.SetStateAction<ExperienceItem[]>>;
  education: EducationItem[];
  setEducation: React.Dispatch<React.SetStateAction<EducationItem[]>>;

  socialLinks: DraggableLinkItem[];
  setSocialLinks: React.Dispatch<React.SetStateAction<DraggableLinkItem[]>>;
  customFields: CustomFieldItem[];
  setCustomFields: React.Dispatch<React.SetStateAction<CustomFieldItem[]>>;
  dynamicSections: DynamicSection[];
  setDynamicSections: React.Dispatch<React.SetStateAction<DynamicSection[]>>;

  sectionOrder: string[];
  setSectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
  sectionVisibility: Record<string, boolean>;
  setSectionVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  sharingSettings: SharingSettings;
  setSharingSettings: React.Dispatch<React.SetStateAction<SharingSettings>>;

  // ── Derived ───────────────────────────────────────────────────────────────
  fullName: string;
  liveProfile: ProfileData;          // use this for <AvtiveDigitalCard> / <PhonePreview>
  activeSocialsPayload: SocialLink[];

  // ── Upload / Save status ─────────────────────────────────────────────────
  isUploadingAvatar: boolean;
  isUploadingCover: boolean;
  isSaving: boolean;
  isConfirmed: boolean;
  setIsConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
  statusMessage: { type: 'success' | 'error'; text: string } | null;
  copySuccess: boolean;

  // ── Handlers ─────────────────────────────────────────────────────────────
  handleAvatarUpload: (file: File) => Promise<void>;
  handleCoverUpload: (file: File) => Promise<void>;
  handleAddLinkItem: (platform: DraggableLinkItem['platform']) => void;
  handleUpdateLink: (id: string, patch: Partial<DraggableLinkItem>) => void;
  handleDeleteLink: (id: string) => void;
  handleMoveLink: (index: number, direction: 'up' | 'down') => void;
  handleAddCustomField: () => void;
  handleUpdateCustomField: (id: string, patch: Partial<CustomFieldItem>) => void;
  handleDeleteCustomField: (id: string) => void;
  handleMoveCustomField: (index: number, direction: 'up' | 'down') => void;
  handleMoveSection: (index: number, direction: 'up' | 'down') => void;
  handleToggleSectionVisibility: (sectionKey: string) => void;
  handleInstantToggleSection: (sectionId: string, makeVisible: boolean) => void;
  toggleVisibilityField: (field: keyof SharingSettings) => void;
  handleCopyLink: () => Promise<void>;
  handleSaveChanges: () => Promise<void>;
  handleSwitchToProfile: (newProf: ProfileData) => void;
  handleProfileSectionLiveUpdate: (updatedFields: Partial<ProfileData>) => void;
  handleProfileSectionSaveSuccess: (savedProfile: ProfileData, isNew?: boolean) => void;

  // Identifier for public URL construction
  currentActiveIdentifier: string;
  publicProfileUrl: string;

  // ── Desktop Studio & Navigation Additions ─────────────────────────────────
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  activeSection: string;
  setActiveSection: (section: string) => void;
  activeSectionTarget: { sectionKey: string; fieldKey?: string; timestamp: number } | null;
  setActiveSectionTarget: (target: { sectionKey: string; fieldKey?: string; timestamp: number } | null) => void;
  updateField: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  updateProfilePartial: (partial: Partial<ProfileData>) => void;
  saveProfile: (overrideData?: Partial<ProfileData>) => Promise<boolean>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  userProfiles?: ProfileData[];
  currentIdentifier: string;
  handleSwitchPersona: (newProf: ProfileData) => void;
  expandedSections: Record<string, boolean>;
  setExpandedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  toggleSectionExpanded: (secKey: string) => void;
  toggleAllSections: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const FALLBACK_PROFILE_DATA: ProfileData = {
  id: 'default',
  name: 'User',
  slug: 'default',
  type: 'individual',
  email: '',
  avatar: '',
  location: '',
  theme: 'editorial',
  skills: [],
  projects: [],
  education: [],
  experiences: [],
  experience: [],
  socialLinks: [],
  socials: []
};

const DEFAULT_PROFILE_EDITOR_CONTEXT: ProfileEditorContextValue = {
  profile: FALLBACK_PROFILE_DATA,
  setProfile: () => {},
  userProfiles: [],
  currentActiveIdentifier: 'default',
  publicProfileUrl: '',
  handleSwitchToProfile: () => {},
  handleSwitchPersona: () => {},
  activeSection: 'profile',
  setActiveSection: () => {},
  activeSectionTarget: null,
  setActiveSectionTarget: () => {},
  activeTheme: 'editorial',
  setActiveTheme: () => {},
  isDark: true,
  setIsDark: () => {},
  currentIdentifier: 'default',
  saveProfile: async () => false,
  updateField: () => {},
  updateProfilePartial: () => {},
  toastMessage: null,
  showToast: () => {},
  expandedSections: { profile: true },
  setExpandedSections: () => {},
  toggleSectionExpanded: () => {},
  toggleAllSections: () => {},
  username: '',
  setUsername: () => {},
  fullName: '',
  firstName: '',
  setFirstName: () => {},
  secondName: '',
  setSecondName: () => {},
  professionalTitle: '',
  setProfessionalTitle: () => {},
  bio: '',
  setBio: () => {},
  about: '',
  setAbout: () => {},
  company: '',
  setCompany: () => {},
  location: '',
  setLocation: () => {},
  tagline: '',
  setTagline: () => {},
  avatar: '',
  setAvatar: () => {},
  coverImage: '',
  setCoverImage: () => {},
  skills: [],
  setSkills: () => {},
  projects: [],
  setProjects: () => {},
  experiences: [],
  setExperiences: () => {},
  education: [],
  setEducation: () => {},
  socialLinks: [],
  setSocialLinks: () => {},
  customFields: [],
  setCustomFields: () => {},
  dynamicSections: [],
  setDynamicSections: () => {},
  sectionOrder: [],
  setSectionOrder: () => {},
  sectionVisibility: {},
  setSectionVisibility: () => {},
  sharingSettings: {},
  setSharingSettings: () => {},
  liveProfile: FALLBACK_PROFILE_DATA,
  activeSocialsPayload: [],
  isUploadingAvatar: false,
  isUploadingCover: false,
  isSaving: false,
  isConfirmed: false,
  setIsConfirmed: () => {},
  statusMessage: null,
  copySuccess: false,
  handleAvatarUpload: async () => {},
  handleCoverUpload: async () => {},
  handleAddLinkItem: () => {},
  handleUpdateLink: () => {},
  handleDeleteLink: () => {},
  handleMoveLink: () => {},
  handleAddCustomField: () => {},
  handleUpdateCustomField: () => {},
  handleDeleteCustomField: () => {},
  handleMoveCustomField: () => {},
  handleMoveSection: () => {},
  handleToggleSectionVisibility: () => {},
  handleInstantToggleSection: () => {},
  toggleVisibilityField: () => {},
  handleCopyLink: async () => {},
  handleSaveChanges: async () => {},
  handleProfileSectionLiveUpdate: () => {},
  handleProfileSectionSaveSuccess: () => {},
};

const ProfileEditorContext = createContext<ProfileEditorContextValue | undefined>(undefined);

export function useProfileEditor(): ProfileEditorContextValue {
  const ctx = useContext(ProfileEditorContext);
  if (!ctx) {
    return DEFAULT_PROFILE_EDITOR_CONTEXT;
  }
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export interface ProfileEditorProviderProps {
  initialProfile: ProfileData;
  userProfiles?: ProfileData[];
  children: React.ReactNode;
  /** Called after a successful save (optional callback for toast / routing) */
  onSaveSuccess?: (saved: ProfileData) => void;
}

export function ProfileEditorProvider({
  initialProfile,
  userProfiles: _userProfiles,
  children,
  onSaveSuccess,
}: ProfileEditorProviderProps) {
  // ── Core profile baseline ─────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData>(initialProfile);

  // ── Theme ─────────────────────────────────────────────────────────────────
  const [activeTheme, setActiveTheme] = useState<ProfileTheme>(
    initialProfile.theme === 'default' ? 'editorial' : (initialProfile.theme || 'editorial')
  );

  // ── Basic Info ────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(
    initialProfile.firstName || (initialProfile.name ? initialProfile.name.split(' ')[0] : 'Aleena')
  );
  const [secondName, setSecondName] = useState(
    initialProfile.secondName ||
      initialProfile.lastName ||
      (initialProfile.name ? initialProfile.name.split(' ').slice(1).join(' ') : 'Nawab')
  );
  const [username, setUsername] = useState(
    initialProfile.username || initialProfile.slug || ''
  );
  const [professionalTitle, setProfessionalTitle] = useState(
    initialProfile.professionalTitle || initialProfile.designation || initialProfile.profession || 'Full Stack Engineer'
  );
  const [bio, setBio] = useState(
    initialProfile.bio ||
      initialProfile.shortBio ||
      'Passionate professional delivering intuitive digital experiences with modern technology and clean architecture.'
  );
  const [tagline, setTagline] = useState(
    initialProfile.tagline || ''
  );
  const [company, setCompany] = useState(initialProfile.company || 'Avtive');
  const [location, setLocation] = useState(initialProfile.location || 'Global');

  // ── Images ────────────────────────────────────────────────────────────────
  const [avatar, setAvatar] = useState(initialProfile.avatar || '');
  const [coverImage, setCoverImage] = useState(initialProfile.coverImage || '');

  // ── Skills / About ────────────────────────────────────────────────────────
  const [skills, setSkills] = useState<string[]>(extractSkills(initialProfile));
  const [about, setAbout] = useState(
    initialProfile.about ||
      initialProfile.fullBio ||
      'Hello! I am a full stack software engineer and product designer specializing in high-performance web applications, responsive user interfaces, and modular design systems. I bridge the gap between design and engineering to build products that delight users and scale seamlessly.'
  );

  // ── Projects / Experience / Education ─────────────────────────────────────
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    if (Array.isArray(initialProfile.projects) && initialProfile.projects.length > 0) {
      return initialProfile.projects;
    }
    return [
      {
        id: 'proj-1',
        title: 'Avtive Profiles Platform',
        description: 'Verified digital identity cards and granular privacy profiles built with Next.js and Tailwind CSS.',
        tags: ['Next.js', 'TypeScript', 'Tailwind CSS'],
        link: 'https://www.avtive.app',
        image: undefined,
        category: 'Web App',
      },
    ];
  });
  const [experiences, setExperiences] = useState<ExperienceItem[]>(
    Array.isArray(initialProfile.experiences || initialProfile.experience)
      ? (initialProfile.experiences || initialProfile.experience || [])
      : []
  );
  const [education, setEducation] = useState<EducationItem[]>(
    Array.isArray(initialProfile.education) ? initialProfile.education : []
  );

  // ── Social Links ──────────────────────────────────────────────────────────
  const [socialLinks, setSocialLinks] = useState<DraggableLinkItem[]>(() =>
    buildSocialLinksFromProfile(initialProfile)
  );

  // ── Custom Fields / Dynamic Sections ─────────────────────────────────────
  const [customFields, setCustomFields] = useState<CustomFieldItem[]>(
    Array.isArray(initialProfile.customFields) ? initialProfile.customFields : []
  );
  const [dynamicSections, setDynamicSections] = useState<DynamicSection[]>(
    Array.isArray(initialProfile.dynamicSections) ? initialProfile.dynamicSections : []
  );

  // ── Section Order & Visibility ────────────────────────────────────────────
  const [sectionOrder, setSectionOrder] = useState<string[]>(() =>
    Array.isArray(initialProfile.sectionOrder) && initialProfile.sectionOrder.length > 0
      ? initialProfile.sectionOrder
      : DEFAULT_SECTION_ORDER
  );
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>(() =>
    initialProfile.sectionVisibility && Object.keys(initialProfile.sectionVisibility).length > 0
      ? initialProfile.sectionVisibility
      : DEFAULT_SECTION_VISIBILITY
  );
  const [sharingSettings, setSharingSettings] = useState<SharingSettings>(
    initialProfile.sharingSettings || {
      photo: true,
      nameAndTitle: true,
      bio: true,
      skills: true,
      projects: true,
      experience: true,
      education: true,
      socialLinks: true,
      email: false,
      phone: false,
    }
  );

  // ── UI / Status ───────────────────────────────────────────────────────────
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────
  const fullName = (profile.name || `${firstName} ${secondName}`).trim();

  const activeSocialsPayload = useMemo<SocialLink[]>(
    () =>
      socialLinks
        .filter((s) => s.visible && s.url.trim())
        .map((s) => ({ platform: s.platform as SocialLink['platform'], url: s.url, label: s.title })),
    [socialLinks]
  );

  const liveProfile = useMemo<ProfileData>(
    () => ({
      ...profile,
      username: (profile.username || username || profile.slug || '').trim().replace(/^@/, ''),
      slug: (profile.slug || username || initialProfile.slug || initialProfile.id || '').trim().replace(/^@/, ''),
      name: profile.name !== undefined ? profile.name : fullName,
      firstName: profile.firstName !== undefined ? profile.firstName : (firstName.trim() || (profile.name ? profile.name.split(' ')[0] : '')),
      secondName: profile.secondName !== undefined ? profile.secondName : (secondName.trim() || (profile.name ? profile.name.split(' ').slice(1).join(' ') : '')),
      lastName: profile.lastName !== undefined ? profile.lastName : (secondName.trim() || (profile.name ? profile.name.split(' ').slice(1).join(' ') : '')),
      professionalTitle: profile.professionalTitle !== undefined ? profile.professionalTitle : (professionalTitle || profile.designation || ''),
      designation: profile.designation !== undefined ? profile.designation : (professionalTitle || profile.professionalTitle || ''),
      profession: profile.profession !== undefined ? profile.profession : (professionalTitle || profile.professionalTitle || ''),
      bio: profile.bio !== undefined ? profile.bio : (bio || profile.shortBio || ''),
      shortBio: profile.shortBio !== undefined ? profile.shortBio : (bio || profile.bio || ''),
      about: profile.about !== undefined ? profile.about : (about || profile.fullBio || ''),
      fullBio: profile.fullBio !== undefined ? profile.fullBio : (about || profile.about || ''),
      tagline: profile.tagline !== undefined ? profile.tagline : (tagline || ''),
      company: profile.company !== undefined ? profile.company : (company || ''),
      location: profile.location !== undefined ? profile.location : (location || ''),
      email: profile.email !== undefined ? profile.email : '',
      phone: profile.phone !== undefined ? profile.phone : '',
      whatsapp: profile.whatsapp !== undefined ? profile.whatsapp : '',
      theme: profile.theme || activeTheme,
      avatar: profile.avatar !== undefined ? profile.avatar : (avatar || ''),
      coverImage: profile.coverImage !== undefined ? profile.coverImage : (coverImage || ''),
      skills: profile.skills !== undefined ? profile.skills : (skills.length > 0 ? skills : []),
      projects: profile.projects !== undefined ? profile.projects : (projects.length > 0 ? projects : []),
      experience: profile.experience !== undefined ? profile.experience : (profile.experiences !== undefined ? profile.experiences : experiences),
      experiences: profile.experiences !== undefined ? profile.experiences : (profile.experience !== undefined ? profile.experience : experiences),
      education: profile.education !== undefined ? profile.education : (education.length > 0 ? education : []),
      socials: activeSocialsPayload.length > 0 ? activeSocialsPayload : (profile.socials || []),
      socialLinks: activeSocialsPayload.length > 0 ? activeSocialsPayload : (profile.socialLinks || []),
      customFields: profile.customFields !== undefined ? profile.customFields : (customFields.length > 0 ? customFields : []),
      dynamicSections: profile.dynamicSections !== undefined ? profile.dynamicSections : dynamicSections,
      sectionOrder: profile.sectionOrder !== undefined ? profile.sectionOrder : sectionOrder,
      sectionVisibility: profile.sectionVisibility !== undefined ? profile.sectionVisibility : sectionVisibility,
      sharingSettings: profile.sharingSettings !== undefined ? profile.sharingSettings : sharingSettings,
    }),
    [
      profile,
      username, fullName, firstName, secondName,
      professionalTitle, bio, about, tagline, company, location,
      activeTheme, avatar, coverImage,
      skills, projects, experiences, education,
      activeSocialsPayload, customFields, dynamicSections,
      sectionOrder, sectionVisibility, sharingSettings,
      initialProfile.slug, initialProfile.id,
    ]
  );

  // ── Public URL ────────────────────────────────────────────────────────────
  const currentActiveIdentifier =
    profile.slug || profile.id || initialProfile.slug || initialProfile.id;
  const publicProfileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/profile/${currentActiveIdentifier}`
      : `https://avtive.app/profile/${currentActiveIdentifier}`;

  // ── Desktop Studio & Navigation State ─────────────────────────────────────
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [activeSectionTarget, setActiveSectionTarget] = useState<{
    sectionKey: string;
    fieldKey?: string;
    timestamp: number;
  } | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronized multi-section expanded state across both desktop and mobile working screens
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    profile: true
  });

  const toggleSectionExpanded = useCallback((secKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [secKey]: !prev[secKey]
    }));
  }, []);

  const toggleAllSections = useCallback(() => {
    const allKeys = [
      'contactInfo', 'personalDetails', 'skills', 'experience',
      'education', 'projects', 'socialLinks', 'enhanceProfile', 'limitations',
      'accountInfo', 'archive', 'security', 'settings'
    ];
    setExpandedSections((prev) => {
      const anyClosed = allKeys.some(k => !prev[k]);
      const next: Record<string, boolean> = { profile: true };
      allKeys.forEach(k => { next[k] = anyClosed; });
      return next;
    });
  }, []);

  // Sync dark mode from document using MutationObserver subscription
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Update a single field in state
  const updateField = useCallback(<K extends keyof ProfileData>(key: K, val: ProfileData[K]) => {
    setProfile((prev) => ({
      ...prev,
      [key]: val,
    }));
    // Also sync corresponding atoms
    if (key === 'name' && typeof val === 'string') {
      const parts = val.trim().split(' ');
      setFirstName(parts[0] || '');
      setSecondName(parts.slice(1).join(' '));
    }
    if (key === 'theme' && typeof val === 'string') setActiveTheme(val as ProfileTheme);
    if (key === 'firstName' && typeof val === 'string') setFirstName(val);
    if (key === 'secondName' && typeof val === 'string') setSecondName(val);
    if (key === 'username' && typeof val === 'string') setUsername(val);
    if (key === 'professionalTitle' && typeof val === 'string') setProfessionalTitle(val);
    if (key === 'designation' && typeof val === 'string') setProfessionalTitle(val);
    if (key === 'profession' && typeof val === 'string') setProfessionalTitle(val);
    if (key === 'bio' && typeof val === 'string') setBio(val);
    if (key === 'shortBio' && typeof val === 'string') setBio(val);
    if (key === 'about' && typeof val === 'string') setAbout(val);
    if (key === 'fullBio' && typeof val === 'string') setAbout(val);
    if (key === 'tagline' && typeof val === 'string') setTagline(val);
    if (key === 'company' && typeof val === 'string') setCompany(val);
    if (key === 'location' && typeof val === 'string') setLocation(val);
    if (key === 'avatar' && typeof val === 'string') setAvatar(val);
    if (key === 'coverImage' && typeof val === 'string') setCoverImage(val);
    if (key === 'skills' && Array.isArray(val)) setSkills((val as (string | { name: string })[]).map(s => typeof s === 'string' ? s : s.name));
    if (key === 'projects' && Array.isArray(val)) setProjects(val as ProjectItem[]);
    if (key === 'experiences' && Array.isArray(val)) setExperiences(val as ExperienceItem[]);
    if (key === 'education' && Array.isArray(val)) setEducation(val as EducationItem[]);
    if (key === 'customFields' && Array.isArray(val)) setCustomFields(val as CustomFieldItem[]);
    if (key === 'dynamicSections' && Array.isArray(val)) setDynamicSections(val as DynamicSection[]);
    if (key === 'sectionOrder' && Array.isArray(val)) setSectionOrder(val as string[]);
    if (key === 'sectionVisibility' && typeof val === 'object' && val !== null) setSectionVisibility(val as Record<string, boolean>);
    if (key === 'sharingSettings' && typeof val === 'object' && val !== null) setSharingSettings(val as SharingSettings);
  }, []);

  // ── Upload Handlers ───────────────────────────────────────────────────────
  const handleCoverUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setCoverImage(reader.result as string);
        updateField('coverImage', reader.result as string);
      }
    };
    reader.readAsDataURL(file);
    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setCoverImage(data.url);
        updateField('coverImage', data.url);
        try {
          const updatedObj = { ...profile, coverImage: data.url };
          if (updatedObj.slug) localStorage.setItem(`avtive_profile_${updatedObj.slug}`, JSON.stringify(updatedObj));
          if (updatedObj.id) localStorage.setItem(`avtive_profile_${updatedObj.id}`, JSON.stringify(updatedObj));
          localStorage.setItem('avtive_last_saved_profile', JSON.stringify(updatedObj));
          window.dispatchEvent(new CustomEvent('avtive_profile_updated', { detail: updatedObj }));
        } catch {}
        showToast('✓ Cover banner updated!');
      } else {
        showToast('✓ Cover updated (preview mode)');
      }
    } catch (e) {
      console.error(e);
      showToast('✓ Cover updated (local mode)');
    } finally {
      setIsUploadingCover(false);
    }
  }, [updateField, showToast, profile]);

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setAvatar(reader.result as string);
        updateField('avatar', reader.result as string);
      }
    };
    reader.readAsDataURL(file);
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setAvatar(data.url);
        updateField('avatar', data.url);
        try {
          const updatedObj = { ...profile, avatar: data.url };
          if (updatedObj.slug) localStorage.setItem(`avtive_profile_${updatedObj.slug}`, JSON.stringify(updatedObj));
          if (updatedObj.id) localStorage.setItem(`avtive_profile_${updatedObj.id}`, JSON.stringify(updatedObj));
          localStorage.setItem('avtive_last_saved_profile', JSON.stringify(updatedObj));
          window.dispatchEvent(new CustomEvent('avtive_profile_updated', { detail: updatedObj }));
        } catch {}
        showToast('✓ Profile photo updated!');
      } else {
        showToast('✓ Photo updated (preview mode)');
      }
    } catch (e) {
      console.error(e);
      showToast('✓ Photo updated (local mode)');
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [updateField, showToast, profile]);

  // ── Social Link Handlers ──────────────────────────────────────────────────
  const handleUpdateLink = useCallback((id: string, patch: Partial<DraggableLinkItem>) => {
    setSocialLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const handleDeleteLink = useCallback((id: string) => {
    setSocialLinks((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const handleMoveLink = useCallback((index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setSocialLinks((prev) => {
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  }, []);

  const handleAddLinkItem = useCallback((platform: DraggableLinkItem['platform']) => {
    const newLink: DraggableLinkItem = {
      id: `link-${Date.now()}`,
      platform,
      title:
        platform === 'other'
          ? 'Custom Link'
          : platform.charAt(0).toUpperCase() + platform.slice(1),
      url: 'https://',
      visible: true,
    };
    setSocialLinks((prev) => [...prev, newLink]);
  }, []);

  // ── Custom Field Handlers ─────────────────────────────────────────────────
  const handleAddCustomField = useCallback(() => {
    const newField: CustomFieldItem = {
      id: `cf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: 'New Custom Field',
      value: '',
      type: 'text',
      visible: true,
      order: 0, // will be recomputed on update
    };
    setCustomFields((prev) => [...prev, { ...newField, order: prev.length }]);
  }, []);

  const handleUpdateCustomField = useCallback(
    (id: string, patch: Partial<CustomFieldItem>) => {
      setCustomFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    },
    []
  );

  const handleDeleteCustomField = useCallback((id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleMoveCustomField = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      setCustomFields((prev) => {
        if (targetIndex < 0 || targetIndex >= prev.length) return prev;
        const copy = [...prev];
        const [moved] = copy.splice(index, 1);
        copy.splice(targetIndex, 0, moved);
        return copy.map((f, i) => ({ ...f, order: i }));
      });
    },
    []
  );

  // ── Section Order / Visibility ────────────────────────────────────
  const handleMoveSection = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      setSectionOrder((prev) => {
        if (targetIndex < 0 || targetIndex >= prev.length) return prev;
        const copy = [...prev];
        const [moved] = copy.splice(index, 1);
        copy.splice(targetIndex, 0, moved);
        return copy;
      });
    },
    []
  );

  const handleToggleSectionVisibility = useCallback((sectionKey: string) => {
    setSectionVisibility((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey] === false ? true : false,
    }));
  }, []);

  /** Used by DynamicSectionGroups — toggles both sharingSettings key and sectionOrder */
  const handleInstantToggleSection = useCallback(
    (sectionId: string, makeVisible: boolean) => {
      const def = ALL_PROFILE_SECTIONS.find((s) => s.id === sectionId);
      if (!def) return;
      setSharingSettings((prev) => ({ ...prev, [def.key]: makeVisible }));
      setSectionOrder((prev) => {
        const without = prev.filter((id) => id !== sectionId);
        return [...without, sectionId];
      });
    },
    []
  );

  const toggleVisibilityField = useCallback((field: keyof SharingSettings) => {
    setSharingSettings((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // ── Copy Link ─────────────────────────────────────────────────────────────
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicProfileUrl);
    } catch {
      // ignore — still show success
    }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  }, [publicProfileUrl]);

  // ── Profile Section Editor callbacks (used by SlidingEditorPanel inline editor) ──
  const handleProfileSectionLiveUpdate = useCallback(
    (updatedFields: Partial<ProfileData>) => {
      if (updatedFields.firstName !== undefined) setFirstName(updatedFields.firstName);
      if (updatedFields.secondName !== undefined) setSecondName(updatedFields.secondName);
      if (updatedFields.username !== undefined) setUsername(updatedFields.username);
      if (updatedFields.profession !== undefined) setProfessionalTitle(updatedFields.profession);
      if (updatedFields.shortBio !== undefined) setBio(updatedFields.shortBio);
      if (updatedFields.fullBio !== undefined) setAbout(updatedFields.fullBio);
      if (updatedFields.tagline !== undefined) setTagline(updatedFields.tagline);
      if (updatedFields.company !== undefined) setCompany(updatedFields.company);
      if (updatedFields.location !== undefined) setLocation(updatedFields.location);
      if (updatedFields.theme !== undefined) setActiveTheme(updatedFields.theme);
      if (updatedFields.avatar !== undefined) setAvatar(updatedFields.avatar);
      if (updatedFields.coverImage !== undefined) setCoverImage(updatedFields.coverImage);
    },
    []
  );

  const handleProfileSectionSaveSuccess = useCallback(
    (savedProfile: ProfileData, isNew?: boolean) => {
      setProfile(savedProfile);
      if (savedProfile.theme) setActiveTheme(savedProfile.theme);
      if (savedProfile.firstName) setFirstName(savedProfile.firstName);
      if (savedProfile.secondName || savedProfile.lastName)
        setSecondName(savedProfile.secondName || savedProfile.lastName || '');
      if (savedProfile.username || savedProfile.slug)
        setUsername(savedProfile.username || savedProfile.slug || '');
      if (savedProfile.profession || savedProfile.designation || savedProfile.professionalTitle)
        setProfessionalTitle(
          savedProfile.profession || savedProfile.designation || savedProfile.professionalTitle || ''
        );
      if (savedProfile.bio || savedProfile.shortBio) setBio(savedProfile.bio || savedProfile.shortBio || '');
      if (savedProfile.about || savedProfile.fullBio) setAbout(savedProfile.about || savedProfile.fullBio || '');
      if (savedProfile.tagline !== undefined) setTagline(savedProfile.tagline || '');
      if (savedProfile.company) setCompany(savedProfile.company);
      if (savedProfile.location) setLocation(savedProfile.location);
      if (savedProfile.avatar) setAvatar(savedProfile.avatar);
      try {
        if (savedProfile.slug) localStorage.setItem(`avtive_profile_${savedProfile.slug}`, JSON.stringify(savedProfile));
        if (savedProfile.id) localStorage.setItem(`avtive_profile_${savedProfile.id}`, JSON.stringify(savedProfile));
        localStorage.setItem('avtive_last_saved_profile', JSON.stringify(savedProfile));
        window.dispatchEvent(new CustomEvent('avtive_profile_updated', { detail: savedProfile }));
      } catch {}

      setStatusMessage({
        type: 'success',
        text: isNew
          ? `✓ Created new profile persona "${savedProfile.profileName || savedProfile.name}"!`
          : '✓ Profile updated and synchronized successfully!',
      });

      onSaveSuccess?.(savedProfile);
    },
    [onSaveSuccess]
  );

  // ── Switch Profile Persona ────────────────────────────────────────────────
  const handleSwitchToProfile = useCallback((newProf: ProfileData) => {
    setProfile(newProf);
    setActiveTheme(newProf.theme === 'default' ? 'editorial' : (newProf.theme || 'editorial'));

    const fName = newProf.firstName || (newProf.name ? newProf.name.split(' ')[0] : '');
    const lName =
      newProf.secondName ||
      newProf.lastName ||
      (newProf.name ? newProf.name.split(' ').slice(1).join(' ') : '');
    setFirstName(fName);
    setSecondName(lName);
    setUsername(newProf.username || newProf.slug || '');
    setProfessionalTitle(newProf.professionalTitle || newProf.designation || newProf.profession || '');
    setBio(newProf.bio || newProf.shortBio || '');
    setTagline(newProf.tagline || '');
    setCompany(newProf.company || '');
    setLocation(newProf.location || '');
    setAvatar(newProf.avatar || '');
    setCoverImage(newProf.coverImage || '');
    setSkills(extractSkills(newProf));
    setAbout(newProf.about || newProf.fullBio || '');
    setProjects(Array.isArray(newProf.projects) ? newProf.projects : []);
    setExperiences(
      Array.isArray(newProf.experiences || newProf.experience)
        ? (newProf.experiences || newProf.experience || [])
        : []
    );
    setEducation(Array.isArray(newProf.education) ? newProf.education : []);
    setSocialLinks(buildSocialLinksFromProfile(newProf));
    setCustomFields(Array.isArray(newProf.customFields) ? newProf.customFields : []);
    setDynamicSections(Array.isArray(newProf.dynamicSections) ? newProf.dynamicSections : []);
    if (Array.isArray(newProf.sectionOrder) && newProf.sectionOrder.length > 0) {
      setSectionOrder(newProf.sectionOrder);
    } else {
      setSectionOrder(DEFAULT_SECTION_ORDER);
    }
    if (newProf.sectionVisibility && Object.keys(newProf.sectionVisibility).length > 0) {
      setSectionVisibility(newProf.sectionVisibility);
    } else {
      setSectionVisibility(DEFAULT_SECTION_VISIBILITY);
    }
    if (newProf.sharingSettings) setSharingSettings(newProf.sharingSettings);
    setIsConfirmed(false);

    setStatusMessage({
      type: 'success',
      text: `✓ Switched to profile: ${newProf.profileName || newProf.name}`,
    });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.type === 'success' ? null : prev));
    }, 3500);
  }, []);

  // ── Centralized Save Profile ──────────────────────────────────────────────
  const saveProfile = useCallback(async (overrideData?: Partial<ProfileData>): Promise<boolean> => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const dataToSave: ProfileData = {
        ...profile,
        ...liveProfile,
        ...(overrideData || {}),
      };

      const profileIdentifier =
        dataToSave.slug ||
        dataToSave.id ||
        profile.slug ||
        profile.id ||
        initialProfile.slug ||
        initialProfile.id;

      const reliableProfileId = dataToSave.id || profile.id || initialProfile.id;

      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profileIdentifier,
          profileSlug: profileIdentifier,
          slug: profileIdentifier,
          id: reliableProfileId,
          userId: dataToSave.userId || profile.userId || initialProfile.userId,
          updatedData: {
            ...dataToSave,
            id: reliableProfileId,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Failed to save changes.';
        setStatusMessage({ type: 'error', text: errorMsg });
        showToast(errorMsg);
        setIsSaving(false);
        return false;
      }

      const savedSlug =
        data.updatedProfile?.slug ||
        data.profile?.slug ||
        dataToSave.slug ||
        profile.slug ||
        initialProfile.slug ||
        initialProfile.id;

      const finalProfile: ProfileData =
        data.updatedProfile || data.profile || { ...dataToSave, slug: savedSlug };

      setProfile(finalProfile);

      // Cache locally and dispatch update event
      try {
        localStorage.setItem(`avtive_profile_${savedSlug}`, JSON.stringify(finalProfile));
        if (finalProfile.id) {
          localStorage.setItem(`avtive_profile_${finalProfile.id}`, JSON.stringify(finalProfile));
        }
        if (initialProfile.slug) {
          localStorage.setItem(`avtive_profile_${initialProfile.slug}`, JSON.stringify(finalProfile));
        }
        localStorage.setItem('avtive_last_saved_profile', JSON.stringify(finalProfile));
        window.dispatchEvent(new CustomEvent('avtive_profile_updated', { detail: finalProfile }));
      } catch (e) {
        console.error('Failed to cache profile in localStorage:', e);
      }

      const successMsg = '✓ Profile saved successfully! All changes persisted.';
      setStatusMessage({
        type: 'success',
        text: successMsg,
      });
      showToast('✓ Profile saved successfully!');

      onSaveSuccess?.(finalProfile);

      setTimeout(() => {
        setStatusMessage((prev) => (prev?.type === 'success' ? null : prev));
      }, 4000);

      return true;
    } catch (err: unknown) {
      console.error('Save profile error:', err);
      const networkErr = 'Network error while saving changes.';
      setStatusMessage({ type: 'error', text: networkErr });
      showToast(networkErr);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [profile, liveProfile, initialProfile, showToast, onSaveSuccess]);

  // Alias handleSaveChanges directly to saveProfile for 100% unified save behavior across desktop and mobile
  const handleSaveChanges = useCallback(async () => {
    await saveProfile();
  }, [saveProfile]);

  // Update multiple fields at once
  const updateProfilePartial = useCallback((partial: Partial<ProfileData>) => {
    setProfile((prev) => ({
      ...prev,
      ...partial,
    }));
    Object.entries(partial).forEach(([k, v]) => {
      updateField(k as keyof ProfileData, v);
    });
  }, [updateField]);

  // Persona switching
  const handleSwitchPersona = useCallback((newProf: ProfileData) => {
    setProfile(newProf);
    handleSwitchToProfile(newProf);
    if (newProf.theme) {
      setActiveTheme(newProf.theme === 'default' ? 'editorial' : newProf.theme);
    }
    showToast(`✓ Switched to persona: ${newProf.profileName || newProf.name}`);
  }, [handleSwitchToProfile, showToast]);

  const currentIdentifier = useMemo(() => {
    return profile.slug || profile.id || initialProfile.slug || initialProfile.id || '';
  }, [profile.slug, profile.id, initialProfile.slug, initialProfile.id]);

  // ── Context value ─────────────────────────────────────────────────────────
  const value = useMemo<ProfileEditorContextValue>(
    () => ({
      profile,
      setProfile,
      activeTheme, setActiveTheme,
      firstName, setFirstName,
      secondName, setSecondName,
      username, setUsername,
      professionalTitle, setProfessionalTitle,
      bio, setBio,
      tagline, setTagline,
      company, setCompany,
      location, setLocation,
      avatar, setAvatar,
      coverImage, setCoverImage,
      skills, setSkills,
      about, setAbout,
      projects, setProjects,
      experiences, setExperiences,
      education, setEducation,
      socialLinks, setSocialLinks,
      customFields, setCustomFields,
      dynamicSections, setDynamicSections,
      sectionOrder, setSectionOrder,
      sectionVisibility, setSectionVisibility,
      sharingSettings, setSharingSettings,
      fullName,
      liveProfile,
      activeSocialsPayload,
      isUploadingAvatar,
      isUploadingCover,
      isSaving,
      isConfirmed,
      setIsConfirmed,
      statusMessage,
      copySuccess,
      handleAvatarUpload,
      handleCoverUpload,
      handleAddLinkItem,
      handleUpdateLink,
      handleDeleteLink,
      handleMoveLink,
      handleAddCustomField,
      handleUpdateCustomField,
      handleDeleteCustomField,
      handleMoveCustomField,
      handleMoveSection,
      handleToggleSectionVisibility,
      handleInstantToggleSection,
      toggleVisibilityField,
      handleCopyLink,
      handleSaveChanges,
      handleSwitchToProfile,
      handleProfileSectionLiveUpdate,
      handleProfileSectionSaveSuccess,
      currentActiveIdentifier,
      publicProfileUrl,
      activeSection,
      setActiveSection,
      activeSectionTarget,
      setActiveSectionTarget,
      updateField,
      updateProfilePartial,
      saveProfile,
      toastMessage,
      showToast,
      isDark,
      setIsDark,
      userProfiles: _userProfiles,
      currentIdentifier,
      handleSwitchPersona,
      expandedSections,
      setExpandedSections,
      toggleSectionExpanded,
      toggleAllSections,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      profile, activeTheme, firstName, secondName, username,
      professionalTitle, bio, tagline, company, location, avatar, coverImage,
      skills, about, projects, experiences, education,
      socialLinks, customFields, dynamicSections,
      sectionOrder, sectionVisibility, sharingSettings,
      fullName, liveProfile, activeSocialsPayload,
      isUploadingAvatar, isUploadingCover, isSaving, isConfirmed, statusMessage, copySuccess,
      activeSection, activeSectionTarget, isDark, toastMessage, _userProfiles, currentIdentifier,
      expandedSections,
    ]
  );

  return (
    <ProfileEditorContext.Provider value={value}>
      {children}
    </ProfileEditorContext.Provider>
  );
}
