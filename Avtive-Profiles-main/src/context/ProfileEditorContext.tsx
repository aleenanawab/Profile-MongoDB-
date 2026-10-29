'use client';

/**
 * ProfileEditorContext
 * --------------------
 * Single source of truth for all profile-editing state.
 * Both DualScreenWorkspace (preview side) and profile section editors
 * consume this context — no duplicated atoms, no stale-prop re-sync bugs.
 *
 * Architecture:
 *   <ProfileEditorProvider initialProfile={...} userProfiles={...}>
 *     <DualScreenWorkspace /> ← reads liveProfile, synchronizes drafts, calls setters
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
  DEFAULT_SHARING_SETTINGS,
  CustomFieldItem,
  DynamicSection,
  DEFAULT_SECTION_ORDER,
  DEFAULT_SECTION_VISIBILITY,
  SocialLink,
  SkillItem,
} from '@/types/profile';
import { ALL_PROFILE_SECTIONS } from '@/components/profile-sections/DynamicSectionGroups';
import { uploadImageToStorage } from '@/lib/imageCompression';
import {
  getCanonicalSectionOrder,
  normalizeSectionKey,
  isCanonicalSectionVisible,
  reconcileSectionVisibility,
  toggleCanonicalSectionVisibility,
} from '@/lib/sections';
import { isProfileDirty, diffProfile, arePrimitivesEqual, areArraysEqual } from '@/lib/profileDiff';


// ─── DraggableLinkItem ────────────────────────────────────────────────────────

export interface DraggableLinkItem {
  id: string;
  platform: 'github' | 'linkedin' | 'website' | 'twitter' | 'whatsapp' | 'other';
  title: string;
  url: string;
  visible: boolean;
}

export const LIVE_PROFILE_ATOM_KEYS: (keyof ProfileData)[] = [
  'username',
  'slug',
  'name',
  'firstName',
  'secondName',
  'lastName',
  'professionalTitle',
  'designation',
  'profession',
  'bio',
  'shortBio',
  'about',
  'fullBio',
  'tagline',
  'company',
  'location',
  'email',
  'phone',
  'whatsapp',
  'website',
  'country',
  'officeAddress',
  'customContacts',
  'contactOrder',
  'theme',
  'avatar',
  'coverImage',
  'skills',
  'projects',
  'experience',
  'experiences',
  'education',
  'certifications',
  'languages',
  'socials',
  'socialLinks',
  'customFields',
  'dynamicSections',
  'sectionOrder',
  'sectionVisibility',
  'sharingSettings',
  'industry',
  'headline',
  'openToWork',
  'phoneType',
  'websites',
  'featured',
  'honorsAwards',
  'publications',
  'patents',
  'courses',
  'testScores',
  'organizations',
  'interests',
  'volunteer',
  'volunteerExperiences',
  'recommendations'
];

// ─── Utilities ────────────────────────────────────────────────────────────────

export function buildSocialLinksFromProfile(p: ProfileData): DraggableLinkItem[] {
  const safeSocials =
    Array.isArray(p.socials) && p.socials.length > 0
      ? p.socials
      : Array.isArray(p.socialLinks) && p.socialLinks.length > 0
      ? p.socialLinks
      : null;

  if (safeSocials && safeSocials.length > 0) {
    return safeSocials.map((s: { id?: string; platform?: string; label?: string; title?: string; url?: string; visible?: boolean }, idx: number) => {
      const platform = (s.platform || 'website') as DraggableLinkItem['platform'];
      return {
        id: s.id || `link-${platform}-${idx}`,
        platform,
        title: s.label || s.title || (platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Link'),
        url: s.url || '',
        visible: s.visible !== false,
      };
    });
  }

  return [];
}

export function extractSkillItems(p: ProfileData): SkillItem[] {
  if (Array.isArray(p.skills) && p.skills.length > 0) {
    return p.skills.map((s) => {
      if (typeof s === 'string') {
        return { name: s, category: 'Technical Skills', level: 'Intermediate', pinned: false };
      }
      return {
        name: s?.name || '',
        category: s?.category || 'Technical Skills',
        level: s?.level || 'Intermediate',
        pinned: !!s?.pinned
      };
    }).filter((s) => s.name.trim().length > 0);
  }
  return [];
}

export function extractSkills(p: ProfileData): any[] {
  return extractSkillItems(p);
}

export interface SaveProfileResult {
  ok: boolean;
  profile?: ProfileData;
  error?: string;
}

export interface ProfileEditorContextValue {
  // Core profile object (DB baseline — updated after save/switch)
  profile: ProfileData;
  savedBaseline: ProfileData;

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

  phone: string;
  setPhone: (v: string) => void;
  whatsapp: string;
  setWhatsapp: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  officeAddress: string;
  setOfficeAddress: (v: string) => void;
  customContacts: any[];
  setCustomContacts: React.Dispatch<React.SetStateAction<any[]>>;
  contactOrder: string[];
  setContactOrder: React.Dispatch<React.SetStateAction<string[]>>;

  skills: SkillItem[];
  setSkills: React.Dispatch<React.SetStateAction<SkillItem[]>>;
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
  isSectionVisible: (sectionKey: string) => boolean;
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
  saveProfile: (overrideData?: Partial<ProfileData>, options?: { keepalive?: boolean }) => Promise<SaveProfileResult>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  userProfiles?: ProfileData[];
  currentIdentifier: string;
  handleSwitchPersona: (newProf: ProfileData) => void;
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  autosaveStatusText: string;
  flushAutosave: (currentDraftOverride?: Partial<ProfileData>, options?: { keepalive?: boolean }) => Promise<SaveProfileResult>;
  retryAutosave: () => Promise<SaveProfileResult>;
  canonicalSectionOrder: string[];
  expandedSections: Record<string, boolean>;
  setExpandedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  toggleSectionExpanded: (secKey: string) => void;
  toggleAllSections: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const FALLBACK_PROFILE_DATA: ProfileData = {
  id: 'default',
  name: '',
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
  savedBaseline: FALLBACK_PROFILE_DATA,
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
  saveProfile: async () => ({ ok: false, error: 'Context uninitialized' }),
  updateField: () => {},
  updateProfilePartial: () => {},
  toastMessage: null,
  showToast: () => {},
  expandedSections: { profile: true },
  setExpandedSections: () => {},
  toggleSectionExpanded: () => {},
  toggleAllSections: () => {},
  autosaveStatus: 'idle',
  autosaveStatusText: '',
  flushAutosave: async () => ({ ok: true }),
  retryAutosave: async () => ({ ok: false, error: 'Context uninitialized' }),
  canonicalSectionOrder: [],
  phone: '',
  setPhone: () => {},
  whatsapp: '',
  setWhatsapp: () => {},
  email: '',
  setEmail: () => {},
  website: '',
  setWebsite: () => {},
  country: '',
  setCountry: () => {},
  officeAddress: '',
  setOfficeAddress: () => {},
  customContacts: [],
  setCustomContacts: () => {},
  contactOrder: [],
  setContactOrder: () => {},
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
  isSectionVisible: () => true,
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

function getProfileSnapshot(p: ProfileData): string {
  return JSON.stringify({
    name: p.name,
    firstName: p.firstName,
    secondName: p.secondName,
    lastName: p.lastName,
    username: p.username,
    slug: p.slug,
    type: p.type,
    professionalTitle: p.professionalTitle,
    designation: p.designation,
    profession: p.profession,
    bio: p.bio,
    about: p.about,
    tagline: p.tagline,
    company: p.company,
    location: p.location,
    email: p.email,
    phone: p.phone,
    whatsapp: p.whatsapp,
    website: p.website,
    theme: p.theme,
    avatar: p.avatar,
    coverImage: p.coverImage,
    skills: p.skills,
    projects: p.projects,
    experiences: p.experiences,
    experience: p.experience,
    education: p.education,
    certifications: p.certifications,
    languages: p.languages,
    socials: p.socials,
    socialLinks: p.socialLinks,
    customFields: p.customFields,
    dynamicSections: p.dynamicSections,
    sectionOrder: p.sectionOrder,
    sectionVisibility: p.sectionVisibility,
    sharingSettings: p.sharingSettings,
    companyInfo: p.companyInfo,
    teamMembers: p.teamMembers
  });
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
  const [savedBaseline, setSavedBaseline] = useState<ProfileData>(initialProfile);

  // ── Autosave & Request Sequence State ─────────────────────────────────────
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autosaveStatusText, setAutosaveStatusText] = useState<string>('');

  const requestCounterRef = React.useRef<number>(0);
  const latestDispatchedRef = React.useRef<number>(0);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = React.useRef<boolean>(false);
  const lastSavedSnapshotRef = React.useRef<string>('');
  const lastSavedProfileRef = React.useRef<ProfileData>(initialProfile);
  const liveProfileRef = React.useRef<ProfileData>(initialProfile);
  const isSavingInProgressRef = React.useRef<boolean>(false);
  const pendingTrailingSaveOverrideRef = React.useRef<Partial<ProfileData> | null>(null);
  const hasPendingTrailingSaveRef = React.useRef<boolean>(false);
  const trailingDeferredsRef = React.useRef<{
    resolve: (res: SaveProfileResult) => void;
    reject: (err: any) => void;
  }[]>([]);
  const isUserInitiatedChangeRef = React.useRef<boolean>(false);
  const saveProfileRef = React.useRef<((override?: Partial<ProfileData>, options?: { keepalive?: boolean }) => Promise<SaveProfileResult>) | null>(null);

  // ── Theme ─────────────────────────────────────────────────────────────────
  const [activeTheme, setActiveTheme] = useState<ProfileTheme>(
    initialProfile.theme === 'default' ? 'editorial' : (initialProfile.theme || 'editorial')
  );

  // ── Basic Info ────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(
    initialProfile.firstName || (initialProfile.name ? initialProfile.name.split(' ')[0] : '')
  );
  const [secondName, setSecondName] = useState(
    initialProfile.secondName ||
      initialProfile.lastName ||
      (initialProfile.name ? initialProfile.name.split(' ').slice(1).join(' ') : '')
  );
  const [username, setUsername] = useState(
    initialProfile.username || initialProfile.slug || ''
  );
  const [professionalTitle, setProfessionalTitle] = useState(
    initialProfile.professionalTitle || initialProfile.designation || initialProfile.profession || ''
  );
  const [bio, setBio] = useState(
    initialProfile.bio ||
      initialProfile.shortBio ||
      ''
  );
  const [tagline, setTagline] = useState(
    initialProfile.tagline || ''
  );
  const [company, setCompany] = useState(initialProfile.company || '');
  const [location, setLocation] = useState(initialProfile.location || '');

  // ── Images ────────────────────────────────────────────────────────────────
  const [avatar, setAvatar] = useState(initialProfile.avatar || '');
  const [coverImage, setCoverImage] = useState(initialProfile.coverImage || '');

  // ── Contact Info ──────────────────────────────────────────────────────────
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [whatsapp, setWhatsapp] = useState(initialProfile.whatsapp || '');
  const [email, setEmail] = useState(initialProfile.email || '');
  const [website, setWebsite] = useState(initialProfile.website || '');
  const [country, setCountry] = useState(initialProfile.country || '');
  const [officeAddress, setOfficeAddress] = useState(initialProfile.officeAddress || '');
  const [customContacts, setCustomContacts] = useState(initialProfile.customContacts || []);
  const [contactOrder, setContactOrder] = useState<string[]>(initialProfile.contactOrder || []);

  // ── Skills / About ────────────────────────────────────────────────────────
  const [skills, setSkills] = useState<SkillItem[]>(() => extractSkillItems(initialProfile));
  const [about, setAbout] = useState(
    initialProfile.about ||
      initialProfile.fullBio ||
      ''
  );

  // ── Projects / Experience / Education ─────────────────────────────────────
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    if (Array.isArray(initialProfile.projects) && initialProfile.projects.length > 0) {
      return initialProfile.projects;
    }
    return [];
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
    getCanonicalSectionOrder(initialProfile.sectionOrder, initialProfile.type)
  );

  const canonicalSectionOrder = useMemo(
    () => getCanonicalSectionOrder(sectionOrder, profile.type || initialProfile.type),
    [sectionOrder, profile.type, initialProfile.type]
  );

  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>(() =>
    reconcileSectionVisibility(initialProfile.sectionVisibility, initialProfile.sharingSettings)
  );
  const [sharingSettings, setSharingSettings] = useState<SharingSettings>(
    initialProfile.sharingSettings || DEFAULT_SHARING_SETTINGS
  );

  // ── UI / Status ───────────────────────────────────────────────────────────
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────
  const fullName = (firstName.trim() || secondName.trim()) 
    ? `${firstName.trim()} ${secondName.trim()}`.trim() 
    : (firstName === '' && secondName === '' ? '' : (profile.name || '').trim());

  const activeSocialsPayload = useMemo<SocialLink[]>(
    () =>
      socialLinks.map((s) => ({
        platform: s.platform as SocialLink['platform'],
        url: s.url || '',
        label: s.title || (s.platform ? s.platform.charAt(0).toUpperCase() + s.platform.slice(1) : 'Link'),
        visible: s.visible !== false,
      })),
    [socialLinks]
  );

  const cleanUsername = (username || '').trim().replace(/^@/, '');
  const cleanSlug = cleanUsername || (profile.slug || initialProfile.slug || initialProfile.id || '').trim().replace(/^@/, '');

  const liveProfile = useMemo<ProfileData>(
    () => ({
      ...profile,
      username: cleanUsername,
      slug: cleanSlug,
      name: fullName,
      firstName: firstName,
      secondName: secondName,
      lastName: secondName,
      professionalTitle: professionalTitle,
      designation: professionalTitle,
      profession: professionalTitle,
      bio: bio !== undefined ? bio : (profile.bio || ''),
      shortBio: bio !== undefined ? bio : (profile.shortBio || ''),
      about: about !== undefined ? about : (profile.about || ''),
      fullBio: about !== undefined ? about : (profile.fullBio || ''),
      tagline: tagline !== undefined ? tagline : (profile.tagline || ''),
      company: company !== undefined ? company : (profile.company || ''),
      location: location !== undefined ? location : (profile.location || ''),
      email: email !== undefined ? email : (profile.email || ''),
      phone: phone !== undefined ? phone : (profile.phone || ''),
      whatsapp: whatsapp !== undefined ? whatsapp : (profile.whatsapp || ''),
      website: website !== undefined ? website : (profile.website || ''),
      country: country !== undefined ? country : (profile.country || ''),
      officeAddress: officeAddress !== undefined ? officeAddress : (profile.officeAddress || ''),
      customContacts: customContacts || profile.customContacts || [],
      contactOrder: contactOrder || profile.contactOrder || [],
      theme: activeTheme || profile.theme,
      avatar: avatar,
      coverImage: coverImage,
      skills: skills,
      projects: projects,
      experience: experiences,
      experiences: experiences,
      education: education,
      socials: activeSocialsPayload,
      socialLinks: activeSocialsPayload,
      customFields: customFields,
      dynamicSections: dynamicSections,
      sectionOrder: canonicalSectionOrder,
      sectionVisibility: sectionVisibility,
      sharingSettings: sharingSettings,
      companyInfo: profile.companyInfo,
      teamMembers: profile.teamMembers
    }),
    [
      profile,
      cleanUsername, cleanSlug, fullName, firstName, secondName,
      professionalTitle, bio, about, tagline, company, location,
      email, phone, whatsapp, website, country, officeAddress, customContacts, contactOrder,
      activeTheme, avatar, coverImage,
      skills, projects, experiences, education,
      activeSocialsPayload, customFields, dynamicSections,
      canonicalSectionOrder, sectionVisibility, sharingSettings,
    ]
  );

  useEffect(() => {
    liveProfileRef.current = liveProfile;
  }, [liveProfile]);

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
    isUserInitiatedChangeRef.current = true;
    setProfile((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'name' && typeof val === 'string') {
        const parts = val.trim() ? val.trim().split(/\s+/) : [];
        const f = parts[0] || '';
        const l = parts.slice(1).join(' ');
        next.firstName = f;
        next.secondName = l;
        next.lastName = l;
      }
      if (key === 'professionalTitle' || key === 'designation' || key === 'profession') {
        next.professionalTitle = val as string;
        next.designation = val as string;
        next.profession = val as string;
      }
      if (key === 'username' || key === 'slug') {
        const clean = typeof val === 'string' ? val.trim().replace(/^@/, '') : '';
        next.username = clean;
        next.slug = clean;
      }
      if (key === 'bio' || key === 'shortBio') {
        next.bio = val as string;
        next.shortBio = val as string;
      }
      if (key === 'about' || key === 'fullBio') {
        next.about = val as string;
        next.fullBio = val as string;
      }
      if (key === 'secondName' || key === 'lastName') {
        next.secondName = val as string;
        next.lastName = val as string;
      }
      if (key === 'experiences' || key === 'experience') {
        next.experiences = val as any;
        next.experience = val as any;
      }
      if (key === 'socials' || key === 'socialLinks') {
        next.socials = val as any;
        next.socialLinks = val as any;
      }
      if (key === 'volunteer' || key === 'volunteerExperiences') {
        next.volunteer = val as any;
        next.volunteerExperiences = val as any;
      }
      if (key === 'honors' || key === 'honorsAwards') {
        next.honors = val as any;
        next.honorsAwards = val as any;
      }
      if (key === 'recommendations' || key === 'testimonials') {
        next.recommendations = val as any;
        next.testimonials = val as any;
      }
      return next;
    });

    // Also sync corresponding atoms
    if (key === 'name' && typeof val === 'string') {
      const parts = val.trim() ? val.trim().split(/\s+/) : [];
      setFirstName(parts[0] || '');
      setSecondName(parts.slice(1).join(' '));
    }
    if (key === 'theme' && typeof val === 'string') setActiveTheme(val as ProfileTheme);
    if (key === 'firstName' && typeof val === 'string') setFirstName(val);
    if ((key === 'secondName' || key === 'lastName') && typeof val === 'string') setSecondName(val);
    if ((key === 'username' || key === 'slug') && typeof val === 'string') setUsername(val.trim().replace(/^@/, ''));
    if ((key === 'professionalTitle' || key === 'designation' || key === 'profession') && typeof val === 'string') setProfessionalTitle(val);
    if ((key === 'bio' || key === 'shortBio') && typeof val === 'string') setBio(val);
    if ((key === 'about' || key === 'fullBio') && typeof val === 'string') setAbout(val);
    if (key === 'tagline' && typeof val === 'string') setTagline(val);
    if (key === 'company' && typeof val === 'string') setCompany(val);
    if (key === 'location' && typeof val === 'string') setLocation(val);
    if (key === 'avatar' && typeof val === 'string') setAvatar(val);
    if (key === 'coverImage' && typeof val === 'string') setCoverImage(val);
    if (key === 'phone' && typeof val === 'string') setPhone(val);
    if (key === 'whatsapp' && typeof val === 'string') setWhatsapp(val);
    if (key === 'email' && typeof val === 'string') setEmail(val);
    if (key === 'website' && typeof val === 'string') setWebsite(val);
    if (key === 'country' && typeof val === 'string') setCountry(val);
    if (key === 'officeAddress' && typeof val === 'string') setOfficeAddress(val);
    if (key === 'customContacts' && Array.isArray(val)) setCustomContacts(val as any[]);
    if (key === 'contactOrder' && Array.isArray(val)) setContactOrder(val as string[]);
    if (key === 'skills' && Array.isArray(val)) setSkills(extractSkillItems({ ...profile, skills: val as any }));
    if (key === 'projects' && Array.isArray(val)) setProjects(val as ProjectItem[]);
    if ((key === 'experiences' || key === 'experience') && Array.isArray(val)) setExperiences(val as ExperienceItem[]);
    if (key === 'education' && Array.isArray(val)) setEducation(val as EducationItem[]);
    if ((key === 'socialLinks' || key === 'socials') && Array.isArray(val)) {
      const items: DraggableLinkItem[] = (val as any[]).map((s: any, idx: number) => {
        const platform = (s.platform || 'website') as DraggableLinkItem['platform'];
        return {
          id: s.id || `link-${platform}-${idx}`,
          platform,
          title: s.label || s.title || (platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Link'),
          url: s.url || '',
          visible: s.visible !== false,
        };
      });
      setSocialLinks(items);
    }
    if (key === 'customFields' && Array.isArray(val)) setCustomFields(val as CustomFieldItem[]);
    if (key === 'dynamicSections' && Array.isArray(val)) setDynamicSections(val as DynamicSection[]);
    if (key === 'sectionOrder' && Array.isArray(val)) setSectionOrder(val as string[]);
    if (key === 'sectionVisibility' && typeof val === 'object' && val !== null) setSectionVisibility(val as Record<string, boolean>);
    if (key === 'sharingSettings' && typeof val === 'object' && val !== null) setSharingSettings(val as SharingSettings);
  }, []);

  // ── Upload Handlers ───────────────────────────────────────────────────────
  const handleCoverUpload = useCallback(async (file: File) => {
    const previous = coverImage;
    const localUrl = URL.createObjectURL(file);
    setCoverImage(localUrl);
    updateField('coverImage', localUrl);
    setIsUploadingCover(true);
    try {
      const url = await uploadImageToStorage(file, 'profiles');
      if (!url || typeof url !== 'string' || !url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
        throw new Error('Upload succeeded but did not return a permanent HTTPS image URL.');
      }
      setCoverImage(url);
      updateField('coverImage', url);
      setIsUploadingCover(false);
      URL.revokeObjectURL(localUrl);

      if (saveProfileRef.current) {
        const saved = await saveProfileRef.current({ coverImage: url });
        if (!saved || !saved.ok) {
          throw new Error(saved?.error || 'Failed to save cover banner to database.');
        }
      }
      showToast('✓ Cover banner updated and saved!');
    } catch (error) {
      setCoverImage(previous);
      updateField('coverImage', previous);
      setIsUploadingCover(false);
      URL.revokeObjectURL(localUrl);
      const message = error instanceof Error ? error.message : 'Cover upload failed.';
      setStatusMessage({ type: 'error', text: message });
      showToast(message);
    }
  }, [coverImage, showToast, updateField]);

  const handleAvatarUpload = useCallback(async (file: File) => {
    const previous = avatar;
    const localUrl = URL.createObjectURL(file);
    setAvatar(localUrl);
    updateField('avatar', localUrl);
    setIsUploadingAvatar(true);
    try {
      const url = await uploadImageToStorage(file, 'avatars');
      if (!url || typeof url !== 'string' || !url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
        throw new Error('Upload succeeded but did not return a permanent HTTPS image URL.');
      }
      setAvatar(url);
      updateField('avatar', url);
      setIsUploadingAvatar(false);
      URL.revokeObjectURL(localUrl);

      if (saveProfileRef.current) {
        const saved = await saveProfileRef.current({ avatar: url });
        if (!saved || !saved.ok) {
          throw new Error(saved?.error || 'Failed to save profile photo to database.');
        }
      }
      showToast('✓ Profile photo updated and saved!');
    } catch (error) {
      setAvatar(previous);
      updateField('avatar', previous);
      setIsUploadingAvatar(false);
      URL.revokeObjectURL(localUrl);
      const message = error instanceof Error ? error.message : 'Profile photo upload failed.';
      setStatusMessage({ type: 'error', text: message });
      showToast(message);
    }
  }, [avatar, showToast, updateField]);


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
      url: '',
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
        const canonical = getCanonicalSectionOrder(prev, profile.type);
        if (targetIndex < 0 || targetIndex >= canonical.length) return canonical;
        const copy = [...canonical];
        const [moved] = copy.splice(index, 1);
        copy.splice(targetIndex, 0, moved);
        return copy;
      });
    },
    [profile.type]
  );

  const isSectionVisible = useCallback(
    (sectionKey: string): boolean => {
      return isCanonicalSectionVisible(sectionVisibility, sharingSettings, sectionKey);
    },
    [sectionVisibility, sharingSettings]
  );

  const handleToggleSectionVisibility = useCallback((sectionKey: string) => {
    isUserInitiatedChangeRef.current = true;
    const { nextVisibility, nextSharingPatch } = toggleCanonicalSectionVisibility(
      sectionVisibility,
      sectionKey
    );
    setSectionVisibility(nextVisibility);
    setSharingSettings((prev) => ({
      ...prev,
      ...nextSharingPatch,
    }));
  }, [sectionVisibility]);

  /** Used by DynamicSectionGroups — toggles both sharingSettings key and sectionOrder */
  const handleInstantToggleSection = useCallback(
    (sectionId: string, makeVisible: boolean) => {
      isUserInitiatedChangeRef.current = true;
      const canonical = normalizeSectionKey(sectionId);
      const current = isCanonicalSectionVisible(sectionVisibility, sharingSettings, sectionId);
      if (current !== makeVisible) {
        handleToggleSectionVisibility(sectionId);
      }
      setSectionOrder((prev) => {
        const without = prev.filter((id) => id !== sectionId && normalizeSectionKey(id) !== canonical);
        return [...without, sectionId];
      });
    },
    [handleToggleSectionVisibility, sectionVisibility, sharingSettings]
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
      isUserInitiatedChangeRef.current = true;
      Object.entries(updatedFields).forEach(([k, v]) => {
        updateField(k as keyof ProfileData, v);
      });
    },
    [updateField]
  );

  const handleProfileSectionSaveSuccess = useCallback(
    (savedProfile: ProfileData, isNew?: boolean) => {
      setProfile(savedProfile);
      setSavedBaseline(savedProfile);
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
      if (savedProfile.phone !== undefined) setPhone(savedProfile.phone);
      if (savedProfile.whatsapp !== undefined) setWhatsapp(savedProfile.whatsapp);
      if (savedProfile.email !== undefined) setEmail(savedProfile.email);
      if (savedProfile.website !== undefined) setWebsite(savedProfile.website);
      if (savedProfile.country !== undefined) setCountry(savedProfile.country);
      if (savedProfile.officeAddress !== undefined) setOfficeAddress(savedProfile.officeAddress);
      if (savedProfile.customContacts !== undefined) setCustomContacts(savedProfile.customContacts);
      if (savedProfile.contactOrder !== undefined) setContactOrder(savedProfile.contactOrder);
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
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    lastSavedProfileRef.current = newProf;
    setProfile(newProf);
    setSavedBaseline(newProf);
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
    setPhone(newProf.phone || '');
    setWhatsapp(newProf.whatsapp || '');
    setEmail(newProf.email || '');
    setWebsite(newProf.website || '');
    setCountry(newProf.country || '');
    setOfficeAddress(newProf.officeAddress || '');
    setCustomContacts(Array.isArray(newProf.customContacts) ? newProf.customContacts : []);
    setContactOrder(Array.isArray(newProf.contactOrder) ? newProf.contactOrder : []);
    setSkills(extractSkillItems(newProf));
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
    setSectionVisibility(
      reconcileSectionVisibility(newProf.sectionVisibility || DEFAULT_SECTION_VISIBILITY, newProf.sharingSettings)
    );
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

  // ── Centralized Save Profile with Sequence Counter & Concurrency Guard ──
  const saveProfile = useCallback(async (
    overrideData?: Partial<ProfileData>,
    options?: { keepalive?: boolean }
  ): Promise<SaveProfileResult> => {
    // 1. Guard against concurrent in-flight saves: coalesce into one trailing save and return deferred Promise
    if (isSavingInProgressRef.current) {
      hasPendingTrailingSaveRef.current = true;
      if (overrideData) {
        pendingTrailingSaveOverrideRef.current = {
          ...(pendingTrailingSaveOverrideRef.current || {}),
          ...overrideData,
        };
      }
      return new Promise<SaveProfileResult>((resolve, reject) => {
        trailingDeferredsRef.current.push({ resolve, reject });
      });
    }

    const hasAvatarOverride = Boolean(overrideData && 'avatar' in overrideData);
    const hasCoverOverride = Boolean(overrideData && 'coverImage' in overrideData);
    if ((isUploadingAvatar && !hasAvatarOverride) || (isUploadingCover && !hasCoverOverride)) {
      const message = 'Please wait for the image upload to finish before saving.';
      setStatusMessage({ type: 'error', text: message });
      showToast(message);
      return { ok: false, error: message };
    }

    const dataToSave: ProfileData = {
      ...profile,
      ...liveProfile,
      ...(overrideData || {}),
    };

    // 2. Deep normalized diff against last-saved baseline: no-op if nothing changed
    const diff = diffProfile(lastSavedProfileRef.current, dataToSave);
    if (!diff.hasChanges) {
      isUserInitiatedChangeRef.current = false;
      setAutosaveStatus('saved');
      setAutosaveStatusText('Saved');
      return { ok: true, profile: lastSavedProfileRef.current };
    }

    isSavingInProgressRef.current = true;
    const thisRequestId = ++requestCounterRef.current;
    setIsSaving(true);
    setAutosaveStatus('saving');
    setAutosaveStatusText('Saving…');
    setStatusMessage(null);

    let executionResult: SaveProfileResult = { ok: false, error: 'Save failed' };

    try {
      // Guard: Do not send local blob URLs to API
      if (typeof dataToSave.avatar === 'string' && dataToSave.avatar.startsWith('blob:')) {
        dataToSave.avatar = profile.avatar || '';
      }
      if (typeof dataToSave.coverImage === 'string' && dataToSave.coverImage.startsWith('blob:')) {
        dataToSave.coverImage = profile.coverImage || '';
      }

      const reliableProfileId = dataToSave.id || profile.id || initialProfile.id;
      const lookupIdentifier =
        reliableProfileId ||
        lastSavedProfileRef.current?.slug ||
        initialProfile.slug ||
        profile.slug ||
        dataToSave.slug;

      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: Boolean(options?.keepalive),
        body: JSON.stringify({
          profileId: lookupIdentifier,
          id: reliableProfileId,
          profileSlug: lookupIdentifier,
          slug: dataToSave.slug || cleanSlug,
          userId: dataToSave.userId || profile.userId || initialProfile.userId,
          patch: diff.patch,
          clearFields: diff.clearFields,
        }),
      });

      // Discard stale response if newer request was dispatched
      if (thisRequestId < latestDispatchedRef.current) {
        executionResult = { ok: true, profile: lastSavedProfileRef.current };
        return executionResult;
      }
      latestDispatchedRef.current = thisRequestId;

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json().catch(() => ({})) : null;

      if (!res.ok) {
        const errorMsg = res.status === 413
          ? 'Profile payload is too large. Please select a photo under 4.5MB.'
          : (data?.error || `Failed to save changes (${res.status}).`);
        setAutosaveStatus('error');
        setAutosaveStatusText('Unable to save — changes retained locally');
        setStatusMessage({ type: 'error', text: errorMsg });
        showToast(errorMsg);
        setIsSaving(false);
        executionResult = { ok: false, error: errorMsg };
        return executionResult;
      }

      if (data?.rejectedKeys && data.rejectedKeys.length > 0) {
        console.warn('[saveProfile] Unknown keys stripped by server:', data.rejectedKeys);
        const err = `Failed to save: rejected keys [${data.rejectedKeys.join(', ')}]`;
        setAutosaveStatus('error');
        setAutosaveStatusText(err);
        setStatusMessage({ type: 'error', text: err });
        showToast(err);
        setIsSaving(false);
        executionResult = { ok: false, error: err };
        return executionResult;
      }
      if (data?.skippedKeys && data.skippedKeys.length > 0) {
        console.warn('[saveProfile] Wipe guard protected keys:', data.skippedKeys);
        const warnMsg = `Failed to save: skipped keys [${data.skippedKeys.join(', ')}]`;
        setAutosaveStatus('error');
        setAutosaveStatusText(warnMsg);
        setStatusMessage({ type: 'error', text: warnMsg });
        showToast(warnMsg);
        setIsSaving(false);
        executionResult = { ok: false, error: warnMsg };
        return executionResult;
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

      // Update baseline with confirmed server document
      lastSavedProfileRef.current = finalProfile;
      lastSavedSnapshotRef.current = getProfileSnapshot(finalProfile);
      setSavedBaseline(finalProfile);

      // Merge server values only into fields the user has not edited while request was in-flight
      setProfile((currentDraft) => {
        const next: ProfileData = { ...currentDraft };
        for (const [k, v] of Object.entries(finalProfile)) {
          const wasModifiedInFlight = !arePrimitivesEqual((currentDraft as any)[k], (dataToSave as any)[k]) &&
            !areArraysEqual((currentDraft as any)[k], (dataToSave as any)[k]);
          if (!wasModifiedInFlight) {
            (next as any)[k] = v;
          }
        }
        return next;
      });

      const isStillDirty = diffProfile(finalProfile, liveProfileRef.current).hasChanges;
      if (!isStillDirty) {
        isUserInitiatedChangeRef.current = false;
        setAutosaveStatus('saved');
        setAutosaveStatusText('Saved');
      }

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

      onSaveSuccess?.(finalProfile);

      setTimeout(() => {
        setAutosaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
        setAutosaveStatusText((prev) => (prev === 'Saved' ? '' : prev));
        setStatusMessage((prev) => (prev?.type === 'success' ? null : prev));
      }, 3500);

      executionResult = { ok: true, profile: finalProfile };
      return executionResult;
    } catch (err: unknown) {
      if (thisRequestId < latestDispatchedRef.current) {
        executionResult = { ok: true, profile: lastSavedProfileRef.current };
        return executionResult;
      }
      latestDispatchedRef.current = thisRequestId;
      console.error('Save profile error:', err);
      const networkErr = err instanceof Error ? err.message : 'Unable to save — changes retained locally';
      setAutosaveStatus('error');
      setAutosaveStatusText(networkErr);
      setStatusMessage({ type: 'error', text: networkErr });
      showToast(networkErr);
      executionResult = { ok: false, error: networkErr };
      return executionResult;
    } finally {
      isSavingInProgressRef.current = false;
      setIsSaving(false);

      if (hasPendingTrailingSaveRef.current) {
        hasPendingTrailingSaveRef.current = false;
        const trailingOverride = pendingTrailingSaveOverrideRef.current;
        pendingTrailingSaveOverrideRef.current = null;
        const deferreds = [...trailingDeferredsRef.current];
        trailingDeferredsRef.current = [];

        if (saveProfileRef.current) {
          saveProfileRef.current(trailingOverride || undefined)
            .then((res) => {
              deferreds.forEach((d) => d.resolve(res));
            })
            .catch((err) => {
              deferreds.forEach((d) => d.resolve({ ok: false, error: err?.message || 'Trailing save failed' }));
            });
        } else {
          deferreds.forEach((d) => d.resolve(executionResult));
        }
      } else {
        const deferreds = [...trailingDeferredsRef.current];
        trailingDeferredsRef.current = [];
        deferreds.forEach((d) => d.resolve(executionResult));
      }
    }
  }, [profile, liveProfile, initialProfile, showToast, onSaveSuccess, isUploadingAvatar, isUploadingCover]);

  // Keep saveProfileRef updated for image uploads and unmount flushes
  useEffect(() => {
    saveProfileRef.current = saveProfile;
  }, [saveProfile]);

  // Flush pending autosave immediately
  const flushAutosave = useCallback(async (
    currentDraftOverride?: Partial<ProfileData>,
    options?: { keepalive?: boolean }
  ): Promise<SaveProfileResult> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    return await saveProfile(currentDraftOverride, options);
  }, [saveProfile]);

  const retryAutosave = useCallback(async (): Promise<SaveProfileResult> => {
    return await saveProfile();
  }, [saveProfile]);

  // ── Autosave Debounce Effect (Triggers on derived dirtiness against baseline) ─
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      lastSavedProfileRef.current = liveProfile;
      lastSavedSnapshotRef.current = getProfileSnapshot(liveProfile);
      return;
    }

    if (isUploadingAvatar || isUploadingCover) return;
    if (liveProfile.avatar?.startsWith('blob:') || liveProfile.coverImage?.startsWith('blob:')) return;

    const diff = diffProfile(lastSavedProfileRef.current, liveProfile);
    if (!diff.hasChanges) {
      return;
    }

    setAutosaveStatus('saving');
    setAutosaveStatusText('Saving…');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      debounceTimerRef.current = null;
      if (diffProfile(lastSavedProfileRef.current, liveProfileRef.current).hasChanges) {
        await saveProfileRef.current?.();
      }
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [liveProfile, isUploadingAvatar, isUploadingCover]);

  // Flush on field blur, tab hidden, pagehide, and before leaving (registered ONCE)
  useEffect(() => {
    const handleFlush = (keepalive = false) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (diffProfile(lastSavedProfileRef.current, liveProfileRef.current).hasChanges) {
        saveProfileRef.current?.(undefined, { keepalive });
      }
    };

    const handleWindowBlur = () => {
      handleFlush(false);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleFlush(true);
      }
    };
    const handlePageHide = () => {
      handleFlush(true);
    };
    const handleBeforeUnload = () => {
      handleFlush(true);
    };

    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Flush on true unmount of provider
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (diffProfile(lastSavedProfileRef.current, liveProfileRef.current).hasChanges) {
        saveProfileRef.current?.(undefined, { keepalive: true });
      }
    };
  }, []);

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
      savedBaseline,
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
      phone, setPhone,
      whatsapp, setWhatsapp,
      email, setEmail,
      website, setWebsite,
      country, setCountry,
      officeAddress, setOfficeAddress,
      customContacts, setCustomContacts,
      contactOrder, setContactOrder,
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
      isSectionVisible,
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
      autosaveStatus,
      autosaveStatusText,
      flushAutosave,
      retryAutosave,
      canonicalSectionOrder,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      profile, savedBaseline, activeTheme, firstName, secondName, username,
      professionalTitle, bio, tagline, company, location, avatar, coverImage,
      skills, about, projects, experiences, education,
      socialLinks, customFields, dynamicSections,
      sectionOrder, sectionVisibility, sharingSettings,
      fullName, liveProfile, activeSocialsPayload,
      isUploadingAvatar, isUploadingCover, isSaving, isConfirmed, statusMessage, copySuccess,
      activeSection, activeSectionTarget, isDark, toastMessage, _userProfiles, currentIdentifier,
      expandedSections, autosaveStatus, autosaveStatusText, canonicalSectionOrder,
    ]
  );

  return (
    <ProfileEditorContext.Provider value={value}>
      {children}
    </ProfileEditorContext.Provider>
  );
}
