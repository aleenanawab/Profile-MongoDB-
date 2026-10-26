'use client';
/* eslint-disable react-hooks/refs */

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Lock, 
  Shield, 
  Tag, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  RotateCcw, 
  CheckCircle2,
  Smartphone,
  ArrowRight,
  Sun,
  Moon,
  Upload,
  FolderGit2,
  Save,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  Code,
  GraduationCap,
  Link2,
  Briefcase,
  Sparkles,
  UserCheck,
  Archive,
  ShieldCheck,
  Settings,
  Layers,
  Menu,
  X,
  Building2,
  Users,
  Award,
  ArrowUp,
  ArrowDown,
  GripVertical,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileEditor } from '@/context/ProfileEditorContext';
import { usePortfolioTheme } from '@/context/ThemeContext';
import { PhonePreview } from '@/components/PhonePreview';
import { DESKTOP_SIDEBAR_SECTIONS } from './DesktopProfileSidebar';
import { ProfileSectionTabBar } from './ProfileSectionTabBar';
import { CompanyTeamManager } from './CompanyTeamManager';
import { normalizeSectionKey } from '@/lib/sections';
import { 
  ProfileTheme, 
  ProjectItem, 
  ExperienceItem, 
  EducationItem, 
  CertificationItem,
  CustomFieldItem,
  SocialLink
} from '@/types/profile';
import { LinkedInIcon, GithubIcon, TwitterIcon, WhatsAppIcon } from '@/components/BrandIcons';

export interface DesktopProfileContentProps {
  hideRightPreview?: boolean;
  instanceId?: string;
}

interface SectionCardProps {
  secKey: string;
  title: string;
  icon: React.ElementType;
  description: string;
  badgeText?: string | null;
  hasVisibilityToggle?: boolean;
  isOpen: boolean;
  isVisible: boolean;
  instanceId: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onToggle: () => void;
  onToggleVisibility?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children?: React.ReactNode;
}

function SectionCard({
  secKey,
  title,
  icon: IconComponent,
  description,
  badgeText,
  hasVisibilityToggle = true,
  isOpen,
  isVisible,
  instanceId,
  onMouseEnter,
  onMouseLeave,
  onToggle,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  children
}: SectionCardProps) {
  return (
    <div
      id={`section-card-${instanceId}-${secKey}`}
      data-section={secKey}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`w-full min-w-0 rounded-2xl border transition-all duration-200 overflow-hidden box-border ${
        isOpen
          ? 'border-cyan-500/40 dark:border-cyan-500/30 bg-white dark:bg-[#0C1222] shadow-sm'
          : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A101E] hover:border-slate-300 dark:hover:border-white/20'
      }`}
    >
      {/* Section Row Header */}
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none group"
      >
        {/* Left: Drag Handle + Icon + Title + Description/Badge */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {(onMoveUp || onMoveDown) && (
            <div 
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 cursor-grab active:cursor-grabbing shrink-0" 
              title="Drag or use Move Up/Down buttons to reorder"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            isOpen
              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
              : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 group-hover:bg-cyan-500/10 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
          }`}>
            <IconComponent className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {title}
              </h2>
              {badgeText && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 truncate">
                  {badgeText}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {description}
            </p>
          </div>
        </div>

        {/* Right: Reorder Up/Down + Visibility Toggle + THE YELLOW ARROW DROPDOWN TRIGGER */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onMoveUp && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              aria-label={`Move ${title} up`}
              title={`Move ${title} up`}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}

          {onMoveDown && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              aria-label={`Move ${title} down`}
              title={`Move ${title} down`}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          {hasVisibilityToggle && onToggleVisibility && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility();
              }}
              title={isVisible ? "Visible on profile card (Click to hide)" : "Hidden from profile card (Click to show)"}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isVisible
                  ? 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                  : 'text-amber-500 hover:text-amber-400 bg-amber-500/10'
              }`}
            >
              {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-amber-500" />}
            </button>
          )}

          {/* YELLOW ARROW EXPAND/OPEN CONTROL */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
            title={isOpen ? "Collapse section" : "Expand section details (Click or hover)"}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold transition-all shadow-xs cursor-pointer select-none active:scale-95 ${
              isOpen
                ? 'bg-amber-400 text-slate-950 dark:bg-amber-400 dark:text-slate-950 ring-2 ring-amber-400/40'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-slate-950'
            }`}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Section Details */}
      {isOpen && (
        <div className="p-4 sm:p-5 pt-1 border-t border-slate-100 dark:border-white/5 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function DesktopProfileContent({ 
  hideRightPreview = false,
  instanceId = 'desktop'
}: DesktopProfileContentProps) {
  const router = useRouter();
  const { isDark, toggleDarkMode } = usePortfolioTheme();
  const { 
    profile, 
    setProfile, 
    updateField, 
    activeSection, 
    setActiveSection,
    isSaving, 
    saveProfile,
    showToast,
    handleAvatarUpload,
    handleCoverUpload,
    isUploadingAvatar,
    isUploadingCover,
    activeTheme,
    setActiveTheme,
    expandedSections: sharedExpandedSections,
    setExpandedSections: setSharedExpandedSections,
    toggleSectionExpanded: sharedToggleSectionExpanded,
    toggleAllSections: sharedToggleAllSections,
    canonicalSectionOrder,
    handleMoveSection,
    autosaveStatus,
    autosaveStatusText,
    retryAutosave,
    flushAutosave
  } = useProfileEditor();

  const isCompany = profile.type === 'team';
  const containerRef = useRef<HTMLDivElement>(null);

  // Multi-section expanded state for single-page editing (synchronized via context or local fallback)
  const [localExpandedSections, setLocalExpandedSections] = useState<Record<string, boolean>>({
    profile: true
  });
  const expandedSections = sharedExpandedSections || localExpandedSections;
  const setExpandedSections = setSharedExpandedSections || setLocalExpandedSections;

  const pinnedSectionsRef = useRef<Record<string, boolean>>({ profile: true });
  const closeTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const isTouchRef = useRef(false);

  // Section dropdown state for LinkedIn-style dropdown navigation
  const [isSectionsDropdownOpen, setIsSectionsDropdownOpen] = useState(false);
  const sectionsDropdownRef = useRef<HTMLDivElement>(null);

  // Close sections dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (sectionsDropdownRef.current && !sectionsDropdownRef.current.contains(e.target as Node)) {
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

  useEffect(() => {
    const handleTouch = () => {
      isTouchRef.current = true;
    };
    window.addEventListener('touchstart', handleTouch, { passive: true });
    return () => window.removeEventListener('touchstart', handleTouch);
  }, []);

  const scrollSectionIntoView = (secKey: string) => {
    if (!containerRef.current) return;
    if (secKey === 'profile') {
      const topEl = 
        containerRef.current.querySelector('[data-section="profile"]') ||
        containerRef.current.querySelector(`#top-profile-header-${instanceId}`) ||
        containerRef.current.querySelector('#top-profile-header');
      if (topEl) {
        topEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    const el = 
      containerRef.current.querySelector(`[data-section="${secKey}"]`) ||
      containerRef.current.querySelector(`#section-card-${instanceId}-${secKey}`) ||
      containerRef.current.querySelector(`#section-card-${secKey}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleSelectSectionFromDropdown = (secKey: string) => {
    setIsSectionsDropdownOpen(false);
    setActiveSection(secKey);
    pinnedSectionsRef.current[secKey] = true;
    setExpandedSections(prev => ({ ...prev, [secKey]: true }));
    scrollSectionIntoView(secKey);
  };

  const isSectionExpanded = (key: string) => Boolean(expandedSections[key]);

  // Hover-to-open on desktop with intent buffer
  const handleSectionMouseEnter = (key: string) => {
    if (isTouchRef.current) return;
    if (closeTimersRef.current[key]) {
      clearTimeout(closeTimersRef.current[key]);
      delete closeTimersRef.current[key];
    }
    setExpandedSections(prev => {
      if (prev[key]) return prev;
      return { ...prev, [key]: true };
    });
  };

  const handleSectionMouseLeave = (key: string) => {
    if (isTouchRef.current) return;
    if (pinnedSectionsRef.current[key]) return; // Clicked/pinned sections stay open

    if (closeTimersRef.current[key]) {
      clearTimeout(closeTimersRef.current[key]);
    }
    closeTimersRef.current[key] = setTimeout(() => {
      setExpandedSections(prev => {
        if (pinnedSectionsRef.current[key]) return prev;
        return { ...prev, [key]: false };
      });
      delete closeTimersRef.current[key];
    }, 280);
  };

  const handleSectionToggle = (key: string) => {
    if (closeTimersRef.current[key]) {
      clearTimeout(closeTimersRef.current[key]);
      delete closeTimersRef.current[key];
    }
    if (sharedToggleSectionExpanded) {
      sharedToggleSectionExpanded(key);
    } else {
      setExpandedSections(prev => {
        const nextVal = !prev[key];
        pinnedSectionsRef.current[key] = nextVal;
        return { ...prev, [key]: nextVal };
      });
    }
  };

  // Sync with activeSection from sidebar drawer, preview click, or other screen
  useEffect(() => {
    if (activeSection) {
      pinnedSectionsRef.current[activeSection] = true;
      setExpandedSections(prev => ({ ...prev, [activeSection]: true }));
      scrollSectionIntoView(activeSection);
    }
  }, [activeSection]);

  const handleToggleAll = () => {
    if (sharedToggleAllSections) {
      sharedToggleAllSections();
    } else {
      const allKeys = [
        'contactInfo', 'personalDetails', 'skills', 'experience',
        'education', 'projects', 'certifications', 'socialLinks', 'enhanceProfile', 'limitations',
        'accountInfo', 'archive', 'security', 'settings'
      ];
      const anyClosed = allKeys.some(k => !expandedSections[k]);
      const newState: Record<string, boolean> = {};
      allKeys.forEach(k => {
        newState[k] = anyClosed;
        pinnedSectionsRef.current[k] = anyClosed;
      });
      setExpandedSections(newState);
    }
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Skills input state
  const [newSkillText, setNewSkillText] = useState('');

  // Projects input state
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', tags: '', link: '', image: '' });

  // Education input state
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [newEducation, setNewEducation] = useState({ degree: '', institution: '', period: '', description: '' });

  // Experience input state
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [newExperience, setNewExperience] = useState({ role: '', company: '', period: '', location: '', description: '' });

  // Certifications input state
  const [isAddingCertification, setIsAddingCertification] = useState(false);
  const [newCertification, setNewCertification] = useState({ name: '', issuer: '', issued: '', expires: '', credentialId: '', url: '' });

  // Custom Field input state
  const [newCustomFieldLabel, setNewCustomFieldLabel] = useState('');
  const [newCustomFieldValue, setNewCustomFieldValue] = useState('');
  const [newCustomFieldType, setNewCustomFieldType] = useState<'text' | 'markdown' | 'link'>('text');

  // Counts for status badges
  const skillsCount = Array.isArray(profile.skills) ? profile.skills.length : 0;
  const projectsCount = Array.isArray(profile.projects) ? profile.projects.length : 0;
  const experienceCount = Array.isArray(profile.experiences) ? profile.experiences.length : 0;
  const educationCount = Array.isArray(profile.education) ? profile.education.length : 0;
  const certificationsCount = Array.isArray(profile.certifications) ? profile.certifications.length : 0;
  const socialLinksCount = Array.isArray(profile.socialLinks) ? profile.socialLinks.filter(l => Boolean(l.url)).length : 0;
  const customFieldsCount = Array.isArray(profile.customFields) ? profile.customFields.length : 0;
  const hiddenCount = profile.sectionVisibility 
    ? Object.values(profile.sectionVisibility).filter(v => v === false).length 
    : 0;

  // Toggle Section Visibility
  const toggleSectionVisibility = (key: string) => {
    const current = profile.sectionVisibility || {};
    const updated = {
      ...current,
      [key]: current[key] === false ? true : false
    };
    updateField('sectionVisibility', updated);
    showToast(`Section "${key}" is now ${updated[key] ? 'Visible' : 'Hidden'}`);
  };

  // Skill Handlers
  const handleAddSkill = (skillToAdd?: string) => {
    const text = (skillToAdd || newSkillText).trim();
    if (!text) return;
    const currentSkills = Array.isArray(profile.skills) ? profile.skills : [];
    const skillStrings = currentSkills.map(s => typeof s === 'string' ? s : s.name);
    if (!skillStrings.includes(text)) {
      updateField('skills', [...currentSkills, text]);
      showToast(`Added skill: ${text}`);
    }
    setNewSkillText('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const currentSkills = Array.isArray(profile.skills) ? profile.skills : [];
    const filtered = currentSkills.filter(s => {
      const name = typeof s === 'string' ? s : s.name;
      return name !== skillToRemove;
    });
    updateField('skills', filtered);
  };

  // Project Handlers
  const handleSaveNewProject = () => {
    if (!newProject.title.trim()) {
      showToast('Please provide a project title.');
      return;
    }
    const tagsArray = newProject.tags ? newProject.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const projectItem: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: newProject.title.trim(),
      description: newProject.description.trim(),
      tags: tagsArray,
      technology: tagsArray.join(', '),
      link: newProject.link.trim() || undefined,
      liveUrl: newProject.link.trim() || undefined,
      image: newProject.image.trim() || undefined,
      coverImage: newProject.image.trim() || undefined
    };
    const current = Array.isArray(profile.projects) ? profile.projects : [];
    updateField('projects', [projectItem, ...current]);
    setNewProject({ title: '', description: '', tags: '', link: '', image: '' });
    setIsAddingProject(false);
    showToast('✓ Project added!');
  };

  const handleDeleteProject = (id: string) => {
    const current = Array.isArray(profile.projects) ? profile.projects : [];
    updateField('projects', current.filter(p => p.id !== id));
    showToast('Project removed.');
  };

  // Education Handlers
  const handleSaveNewEducation = () => {
    if (!newEducation.institution.trim() || !newEducation.degree.trim()) {
      showToast('Institution and degree are required.');
      return;
    }
    const eduItem: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: newEducation.degree.trim(),
      institution: newEducation.institution.trim(),
      period: newEducation.period.trim() || undefined,
      description: newEducation.description.trim() || undefined
    };
    const current = Array.isArray(profile.education) ? profile.education : [];
    updateField('education', [eduItem, ...current]);
    setNewEducation({ degree: '', institution: '', period: '', description: '' });
    setIsAddingEducation(false);
    showToast('✓ Education added!');
  };

  const handleDeleteEducation = (id: string) => {
    const current = Array.isArray(profile.education) ? profile.education : [];
    updateField('education', current.filter(e => e.id !== id));
    showToast('Education record removed.');
  };

  // Experience Handlers
  const handleSaveNewExperience = () => {
    if (!newExperience.company.trim() || !newExperience.role.trim()) {
      showToast('Company and role are required.');
      return;
    }
    const expItem: ExperienceItem = {
      id: `exp-${Date.now()}`,
      company: newExperience.company.trim(),
      role: newExperience.role.trim(),
      period: newExperience.period.trim() || undefined,
      location: newExperience.location.trim() || undefined,
      description: newExperience.description.trim() || undefined
    };
    const current = Array.isArray(profile.experiences) ? profile.experiences : [];
    updateField('experiences', [expItem, ...current]);
    setNewExperience({ role: '', company: '', period: '', location: '', description: '' });
    setIsAddingExperience(false);
    showToast('✓ Experience record added!');
  };

  const handleDeleteExperience = (id: string) => {
    const current = Array.isArray(profile.experiences) ? profile.experiences : [];
    updateField('experiences', current.filter(e => e.id !== id));
    showToast('Experience record removed.');
  };

  // Certification Handlers
  const handleSaveNewCertification = () => {
    if (!newCertification.name.trim() || !newCertification.issuer.trim()) {
      showToast('Certificate name and issuing organization are required.');
      return;
    }
    const certItem: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: newCertification.name.trim(),
      issuer: newCertification.issuer.trim(),
      issued: newCertification.issued.trim() || new Date().getFullYear().toString(),
      expires: newCertification.expires.trim() || undefined,
      credentialId: newCertification.credentialId.trim() || undefined,
      url: newCertification.url.trim() || undefined
    };
    const current = Array.isArray(profile.certifications) ? profile.certifications : [];
    updateField('certifications', [certItem, ...current]);
    setNewCertification({ name: '', issuer: '', issued: '', expires: '', credentialId: '', url: '' });
    setIsAddingCertification(false);
    showToast('✓ Certificate added!');
  };

  const handleDeleteCertification = (id: string) => {
    const current = Array.isArray(profile.certifications) ? profile.certifications : [];
    updateField('certifications', current.filter(c => c.id !== id));
    showToast('Certificate removed.');
  };

  // Custom Field Handlers
  const handleAddCustomField = () => {
    if (!newCustomFieldLabel.trim() || !newCustomFieldValue.trim()) {
      showToast('Field title and content are both required.');
      return;
    }
    const newField: CustomFieldItem = {
      id: `cf-${Date.now()}`,
      label: newCustomFieldLabel.trim(),
      value: newCustomFieldValue.trim(),
      type: newCustomFieldType,
      visible: true
    };
    const current = Array.isArray(profile.customFields) ? profile.customFields : [];
    updateField('customFields', [...current, newField]);
    setNewCustomFieldLabel('');
    setNewCustomFieldValue('');
    showToast('✓ Custom field added!');
  };

  const handleToggleCustomField = (id: string) => {
    const current = Array.isArray(profile.customFields) ? profile.customFields : [];
    const updated = current.map(f => f.id === id ? { ...f, visible: f.visible === false ? true : false } : f);
    updateField('customFields', updated);
  };

  const handleDeleteCustomField = (id: string) => {
    const current = Array.isArray(profile.customFields) ? profile.customFields : [];
    updateField('customFields', current.filter(f => f.id !== id));
    showToast('Custom field removed.');
  };

  // Social Links Handlers
  const updateSocialUrl = (platform: string, url: string) => {
    const currentLinks = Array.isArray(profile.socialLinks) ? profile.socialLinks : [];
    const existingIndex = currentLinks.findIndex(l => l.platform === platform);
    if (existingIndex >= 0) {
      const copy = [...currentLinks];
      copy[existingIndex] = { ...copy[existingIndex], url };
      updateField('socialLinks', copy);
    } else {
      updateField('socialLinks', [...currentLinks, { platform: platform as SocialLink['platform'], url }]);
    }
  };

  const getSocialUrl = (platform: string) => {
    const currentLinks = Array.isArray(profile.socialLinks) ? profile.socialLinks : [];
    const found = currentLinks.find(l => l.platform === platform);
    return found ? found.url : '';
  };

  const isSocialVisible = (platform: string) => {
    const currentLinks = Array.isArray(profile.socialLinks) ? profile.socialLinks : [];
    const found = currentLinks.find(l => l.platform === platform) as any;
    return found ? found.visible !== false : true;
  };

  const toggleSocialVisibility = (platform: string) => {
    const currentLinks = Array.isArray(profile.socialLinks) ? profile.socialLinks : [];
    const existingIndex = currentLinks.findIndex(l => l.platform === platform);
    if (existingIndex >= 0) {
      const copy = [...currentLinks];
      const curVis = (copy[existingIndex] as any).visible !== false;
      copy[existingIndex] = { ...copy[existingIndex], visible: !curVis };
      updateField('socialLinks', copy);
      showToast(`${platform} link is now ${!curVis ? 'Visible' : 'Hidden'}`);
    } else {
      updateField('socialLinks', [...currentLinks, { platform: platform as SocialLink['platform'], url: '', visible: false }]);
      showToast(`${platform} link is now Hidden`);
    }
  };

  // Sharing Settings Handlers
  const toggleSharingSetting = (key: keyof NonNullable<typeof profile.sharingSettings>) => {
    const current = profile.sharingSettings || {};
    const updated = {
      ...current,
      [key]: current[key] === false ? true : false
    };
    updateField('sharingSettings', updated);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Reusable Section Accordion Row with Prominent Yellow Arrow
  // ──────────────────────────────────────────────────────────────────────────
  const renderSectionCard = (
    secKey: string,
    title: string,
    icon: React.ElementType,
    description: string,
    badgeText?: string | null,
    hasVisibilityToggle = true,
    children?: React.ReactNode
  ) => {
    const normKey = normalizeSectionKey(secKey);
    const orderIndex = canonicalSectionOrder.indexOf(normKey);
    const isReorderable = orderIndex !== -1;
    const onMoveUp = isReorderable && orderIndex > 0 ? () => handleMoveSection(orderIndex, 'up') : undefined;
    const onMoveDown = isReorderable && orderIndex < canonicalSectionOrder.length - 1 ? () => handleMoveSection(orderIndex, 'down') : undefined;

    return (
      <SectionCard
        key={secKey}
        secKey={secKey}
        title={title}
        icon={icon}
        description={description}
        badgeText={badgeText}
        hasVisibilityToggle={hasVisibilityToggle}
        isOpen={isSectionExpanded(secKey)}
        isVisible={profile.sectionVisibility?.[secKey] !== false}
        instanceId={instanceId}
        onMouseEnter={() => handleSectionMouseEnter(secKey)}
        onMouseLeave={() => handleSectionMouseLeave(secKey)}
        onToggle={() => handleSectionToggle(secKey)}
        onToggleVisibility={() => toggleSectionVisibility(secKey)}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      >
        {children}
      </SectionCard>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 h-full min-h-0 flex overflow-hidden bg-slate-50 dark:bg-[#080D1A] transition-colors min-w-0"
    >
      
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SINGLE-PAGE SCROLLABLE SECTIONS EDIT PANEL                                 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 h-full min-h-0 overflow-y-auto p-3 sm:p-5 xl:p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 space-y-4 min-w-0">
        
        {/* Top Header Bar: ☰ Sections Dropdown Control at TOP-LEFT CORNER, Global Actions */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-white/10 min-w-0">
          
          {/* TOP-LEFT CORNER: ☰ Sections Dropdown Control (Requirements 8, 9 & 15) */}
          <div className="relative" ref={sectionsDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSectionsDropdownOpen(prev => !prev)}
              aria-expanded={isSectionsDropdownOpen}
              aria-haspopup="true"
              aria-label="Sections Menu"
              title="Select profile section to edit"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 border shrink-0 ${
                isSectionsDropdownOpen
                  ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-2xs dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-200 dark:border-white/10'
              }`}
            >
              <Menu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="font-semibold">Sections</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSectionsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* SECTIONS DROPDOWN MENU */}
            <AnimatePresence>
              {isSectionsDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-11 left-0 w-64 max-h-[420px] bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl p-2 z-50 flex flex-col overflow-hidden backdrop-blur-md"
                >
                  <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-white/10 mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Profile Sections</span>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">Select to jump</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
                    {DESKTOP_SIDEBAR_SECTIONS
                      .filter((sec) => isCompany 
                        ? (sec.key !== 'personalDetails' && sec.key !== 'experience' && sec.key !== 'education')
                        : (sec.key !== 'teamMembers' && sec.key !== 'companyInfo')
                      )
                      .map((sec) => {
                      const Icon = sec.icon;
                      const isActive = activeSection === sec.key;
                      return (
                        <button
                          key={sec.key}
                          type="button"
                          onClick={() => handleSelectSectionFromDropdown(sec.key)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                            isActive
                              ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 border border-cyan-400/40 font-bold shadow-2xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'
                            }`} />
                            <span className="truncate">{sec.label}</span>
                          </div>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Action Controls: Toggle All, Save, Dark/Light Mode */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleAll}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 dark:border-white/10 transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Toggle All</span>
            </button>

            {/* Central Autosave Status */}
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
              {autosaveStatus === 'saving' && (
                <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving…</span>
                </span>
              )}
              {autosaveStatus === 'saved' && (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}
              {autosaveStatus === 'error' && (
                <button
                  type="button"
                  onClick={retryAutosave}
                  title="Click to retry saving"
                  className="flex items-center gap-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 text-xs cursor-pointer underline"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Unable to save — changes retained locally (Retry)</span>
                </button>
              )}
              {autosaveStatus === 'idle' && (
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                  Autosave active
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer shrink-0"
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
        <div className="shrink-0 z-20 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10">
          <ProfileSectionTabBar
            profile={profile}
            activeSection={activeSection}
            onSelectSection={handleSelectSectionFromDropdown}
            isEditing={true}
            canEdit={true}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* LINKEDIN-STYLE PERMANENT TOP PROFILE HEADER (Always Visible at Top)        */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        <div id={`top-profile-header-${instanceId}`} data-section="profile" className="rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xs dark:shadow-sm transition-colors">
          {/* Cover Photo / Background Banner */}
          <div className="relative h-36 sm:h-48 md:h-52 w-full bg-slate-200 dark:bg-slate-800">
            <img 
              src={profile.coverImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop'} 
              alt="Cover" 
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop'; }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
            
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-md cursor-pointer transition-all"
            >
              {isUploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-cyan-400" />}
              <span>Change Cover</span>
            </button>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCoverUpload(file);
            }} />
          </div>

          {/* Profile Photo (Front / Overlapping Cover) + Name + Username + Actions */}
          <div className="p-4 sm:p-6 relative -mt-12 sm:-mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-end gap-3.5 sm:gap-4">
                <div className={`relative w-20 h-20 sm:w-24 sm:h-24 border-4 border-white dark:border-[#0E1526] overflow-hidden shadow-xl shrink-0 group ${
                  isCompany 
                    ? 'rounded-2xl p-1.5 bg-white dark:bg-[#080D1A] flex items-center justify-center' 
                    : 'rounded-full bg-slate-200 dark:bg-slate-800'
                }`}>
                  <img 
                    src={profile.avatar || (isCompany ? 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=400&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop')} 
                    alt={isCompany ? "Company Logo" : "Avatar"} 
                    onError={(e) => { e.currentTarget.src = isCompany ? 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=400&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'; }}
                    className={`w-full h-full ${isCompany ? 'object-contain rounded-xl' : 'object-cover'}`}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className={`absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                      isCompany ? 'rounded-2xl' : 'rounded-full'
                    }`}
                    title={isCompany ? "Upload Logo" : "Upload Avatar"}
                  >
                    {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-5 h-5 text-cyan-400" />}
                    <span className="text-[9px] font-bold mt-0.5">{isCompany ? 'Logo' : 'Upload'}</span>
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }} />
                </div>

                <div className="pb-1">
                  <div className="flex items-center gap-1.5">
                    {isCompany && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <Building2 className="w-3 h-3" />
                        <span>Company</span>
                      </span>
                    )}
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                      {profile.name || (isCompany ? 'Company Name' : 'Full Name')}
                    </h2>
                  </div>
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                    @{profile.username || profile.slug}
                  </p>
                </div>
              </div>

              <div className="pb-1 flex items-center gap-2 flex-wrap">
                {isCompany && (
                  <button
                    type="button"
                    onClick={() => handleSelectSectionFromDropdown('teamMembers')}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Manage team members"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Manage Team ({profile.teamMembers?.filter(m => m.status !== 'REMOVED')?.length || 0})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                >
                  {isCompany ? 'Change Logo' : 'Change Photo'}
                </button>
              </div>
            </div>

            {/* In-Place Identity Editable Inputs */}
            <div className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isCompany ? 'Company / Organization Name' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={profile.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder={isCompany ? "e.g. Acme Corporation" : "e.g. Aleeza Nawab"}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Username / Slug</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 dark:text-slate-500">@</span>
                    <input
                      type="text"
                      value={profile.username || profile.slug || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^@/, '');
                        updateField('username', val);
                        updateField('slug', val);
                      }}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isCompany ? 'Organization Focus / Mission' : 'Professional Title'}
                </label>
                <input
                  type="text"
                  value={profile.professionalTitle || profile.designation || ''}
                  onChange={(e) => {
                    updateField('professionalTitle', e.target.value);
                    updateField('designation', e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder={isCompany ? "e.g. Cloud Security & Enterprise Identity Systems" : "e.g. Botanist & Research Scientist"}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isCompany ? 'Company Tagline' : 'Short Bio / Headline'}
                </label>
                <input
                  type="text"
                  value={profile.shortBio || profile.bio || profile.tagline || ''}
                  onChange={(e) => {
                    updateField('shortBio', e.target.value);
                    updateField('bio', e.target.value);
                    updateField('tagline', e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder={isCompany ? "e.g. The Digital Identity Standard for Enterprise Teams" : "Brief 1-line headline"}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isCompany ? 'About Company / Overview' : 'About'}
                </label>
                <textarea
                  rows={3}
                  value={profile.about || profile.fullBio || ''}
                  onChange={(e) => {
                    updateField('about', e.target.value);
                    updateField('fullBio', e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  placeholder={isCompany ? "Overview of products, mission, history, and capabilities..." : "Comprehensive background, achievements, and details..."}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* SECTION NAVIGATION DIVIDER (LinkedIn-Style Structure)                       */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 pb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Profile Information Sections
            </h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400">
              {DESKTOP_SIDEBAR_SECTIONS.length - 1} Sections
            </span>
          </div>
        </div>

        {/* Dynamic Reorderable Profile Sections in Canonical Order */}
        {(() => {
          const sectionElements: Record<string, React.ReactNode> = {
            companyInfo: isCompany ? renderSectionCard(
          'companyInfo',
          'Company Information',
          Building2,
          'Industry, organization size, location, and corporate details',
          profile.company ? 'Configured' : 'Empty · Click to add',
          true,
          (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Industry</label>
                <input
                  type="text"
                  value={profile.companyInfo?.industry || ''}
                  onChange={(e) => {
                    const currentInfo = profile.companyInfo || {
                      id: profile.id,
                      name: profile.name,
                      tagline: profile.tagline || '',
                      logo: profile.avatar,
                      industry: '',
                      location: profile.location,
                      website: profile.website || '',
                      profileId: profile.slug
                    };
                    updateField('companyInfo', { ...currentInfo, industry: e.target.value });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Software / Technology, Healthcare, Finance"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Company Size</label>
                <select
                  value={profile.companyInfo?.employeeCount || '11-50'}
                  onChange={(e) => {
                    const currentInfo = profile.companyInfo || {
                      id: profile.id,
                      name: profile.name,
                      tagline: profile.tagline || '',
                      logo: profile.avatar,
                      industry: '',
                      location: profile.location,
                      website: profile.website || '',
                      profileId: profile.slug
                    };
                    updateField('companyInfo', { ...currentInfo, employeeCount: e.target.value });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Headquarters / Location</label>
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. San Francisco, CA / London, UK"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Official Website</label>
                <input
                  type="url"
                  value={profile.website || ''}
                  onChange={(e) => updateField('website', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="https://company.com"
                />
              </div>
            </div>
          )) : null,
          teamMembers: isCompany ? renderSectionCard(
          'teamMembers',
          'Team Members',
          Users,
          'Manage your organization roster, member roles, and employee passes',
          profile.teamMembers?.length ? `${profile.teamMembers.length} Members` : 'Empty · Click to add',
          true,
          (
            <CompanyTeamManager
              companyIdentifier={profile.slug || profile.id}
              profile={profile}
              onUpdateTeamMembers={(updated) => updateField('teamMembers', updated)}
              showToast={showToast}
              instanceId={instanceId}
            />
          )) : null,
          contactInfo: renderSectionCard(
          'contactInfo',
          'Contact Information',
          Phone,
          'Email, telephone, WhatsApp, and website',
          profile.email || profile.phone ? 'Configured' : 'Empty · Click to add',
          true,
          (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Business Email</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="contact@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Direct Telephone</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="+1 555 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">WhatsApp Number</label>
                <div className="relative">
                  <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={profile.whatsapp || ''}
                    onChange={(e) => updateField('whatsapp', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="+15551234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Portfolio / Website</label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={profile.website || ''}
                    onChange={(e) => updateField('website', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="https://mywebsite.com"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Office / Location Address</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={profile.location || ''}
                    onChange={(e) => updateField('location', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="San Francisco, CA, United States"
                  />
                </div>
              </div>
            </div>
          )),
          personalDetails: !isCompany ? renderSectionCard(
          'personalDetails',
          'Personal Details',
          FileText,
          'First name, last name, pronouns, birthdate, company, and organization',
          profile.firstName ? `${profile.firstName} ${profile.secondName || ''}` : 'Optional details',
          true,
          (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">First Name</label>
                <input
                  type="text"
                  value={profile.firstName || ''}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Syed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Last Name / Surname</label>
                <input
                  type="text"
                  value={profile.secondName || profile.lastName || ''}
                  onChange={(e) => {
                    updateField('secondName', e.target.value);
                    updateField('lastName', e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Raza"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Pronouns</label>
                <input
                  type="text"
                  value={profile.pronouns || ''}
                  onChange={(e) => updateField('pronouns', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. He/Him, They/Them"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Birthdate</label>
                <input
                  type="text"
                  value={profile.birthday || ''}
                  onChange={(e) => updateField('birthday', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. September 18"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Company / Organization</label>
                <input
                  type="text"
                  value={profile.company || ''}
                  onChange={(e) => updateField('company', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="Avtive Inc."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
                <input
                  type="text"
                  value={profile.department || ''}
                  onChange={(e) => updateField('department', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="Engineering"
                />
              </div>
            </div>
          )) : null,
          skills: renderSectionCard(
          'skills',
          'Skills & Expertise',
          Code,
          'Highlight competencies, technical skill badges, and technology stack',
          skillsCount > 0 ? `${skillsCount} skills` : 'Empty · Click to add',
          true,
          (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkillText}
                  onChange={(e) => setNewSkillText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Type skill name (e.g. React, Next.js, Node.js) and press Enter"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 py-0.5 mr-1 font-mono">Suggestions:</span>
                {['TypeScript', 'React.js', 'Next.js', 'Node.js', 'Tailwind CSS', 'GraphQL', 'PostgreSQL', 'Figma', 'UI/UX'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddSkill(s)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    + {s}
                  </button>
                ))}
              </div>

              {/* Active Skills Cloud */}
              <div className="pt-2">
                {skillsCount === 0 ? (
                  <p className="text-xs text-slate-400 italic">No skills added yet. Use the input or suggestions above to add competencies.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(profile.skills) ? profile.skills : []).map((skill, idx) => {
                      const skillName = typeof skill === 'string' ? skill : skill.name;
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-700 dark:text-cyan-300 text-xs font-semibold shadow-2xs group"
                        >
                          <span>{skillName}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skillName)}
                            className="text-cyan-600 dark:text-cyan-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-full p-0.5 transition-colors cursor-pointer"
                            title="Remove skill"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )),
          experience: !isCompany ? renderSectionCard(
          'experience',
          'Work Experience',
          Briefcase,
          'Career history, professional roles, responsibilities, and impact',
          experienceCount > 0 ? `${experienceCount} roles` : 'Empty · Click to add',
          true,
          (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Manage professional positions</span>
                <button
                  type="button"
                  onClick={() => setIsAddingExperience(!isAddingExperience)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingExperience ? 'Cancel' : 'New Experience'}</span>
                </button>
              </div>

              {isAddingExperience && (
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1526] border border-cyan-500/30 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400">Add Work Experience</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Company / Organization</label>
                      <input
                        type="text"
                        value={newExperience.company}
                        onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. Google, Meta, Startup"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Role / Job Title</label>
                      <input
                        type="text"
                        value={newExperience.role}
                        onChange={(e) => setNewExperience({ ...newExperience, role: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. Lead Frontend Architect"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Period / Dates</label>
                      <input
                        type="text"
                        value={newExperience.period}
                        onChange={(e) => setNewExperience({ ...newExperience, period: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. 2022 - Present"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Location (optional)</label>
                      <input
                        type="text"
                        value={newExperience.location}
                        onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. Remote / London"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Responsibilities &amp; Impact</label>
                      <textarea
                        rows={2}
                        value={newExperience.description}
                        onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 resize-none"
                        placeholder="Key achievements, technologies used, leadership..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingExperience(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewExperience}
                      className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 cursor-pointer"
                    >
                      Add Experience
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {experienceCount === 0 ? (
                  <p className="text-xs text-slate-400 italic">No work experience records added yet. Click &quot;New Experience&quot; to add your career background.</p>
                ) : (
                  (Array.isArray(profile.experiences) ? profile.experiences : []).map((exp) => (
                    <div key={exp.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E1526] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{exp.role || 'Role'}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{exp.company} {exp.period ? `· ${exp.period}` : ''}</p>
                        {exp.description && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{exp.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove experience"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )) : null,
          education: !isCompany ? renderSectionCard(
          'education',
          'Education & Credentials',
          GraduationCap,
          'Degrees, university institutions, diplomas, and academic background',
          educationCount > 0 ? `${educationCount} credentials` : 'Empty · Click to add',
          true,
          (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Academic background</span>
                <button
                  type="button"
                  onClick={() => setIsAddingEducation(!isAddingEducation)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingEducation ? 'Cancel' : 'Add Education'}</span>
                </button>
              </div>

              {isAddingEducation && (
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1526] border border-cyan-500/30 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400">Add Academic Credential</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Degree / Certificate</label>
                      <input
                        type="text"
                        value={newEducation.degree}
                        onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. BS in Computer Science"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Institution / University</label>
                      <input
                        type="text"
                        value={newEducation.institution}
                        onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. Stanford University"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Period / Dates</label>
                      <input
                        type="text"
                        value={newEducation.period}
                        onChange={(e) => setNewEducation({ ...newEducation, period: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. 2020 - 2024"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingEducation(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewEducation}
                      className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 cursor-pointer"
                    >
                      Add Education
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {educationCount === 0 ? (
                  <p className="text-xs text-slate-400 italic">No education records added yet. Click &quot;Add Education&quot; to list your university or certifications.</p>
                ) : (
                  (Array.isArray(profile.education) ? profile.education : []).map((edu) => (
                    <div key={edu.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E1526] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{edu.institution}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{edu.degree} {edu.period ? `· ${edu.period}` : ''}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteEducation(edu.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove education"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )) : null,
          projects: renderSectionCard(
          'projects',
          'Projects & Portfolio',
          FolderGit2,
          'Featured projects, software architectures, live links, and showcase case studies',
          projectsCount > 0 ? `${projectsCount} projects` : 'Empty · Click to add',
          true,
          (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Featured Portfolio Work</span>
                <button
                  type="button"
                  onClick={() => setIsAddingProject(!isAddingProject)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingProject ? 'Cancel' : 'New Project'}</span>
                </button>
              </div>

              {isAddingProject && (
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1526] border border-cyan-500/30 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400">Add Project Showcase</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Project Title</label>
                      <input
                        type="text"
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. Digital Profile Card Application"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 resize-none"
                        placeholder="Key features, responsive design system, technologies..."
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Live URL or Repository</label>
                        <input
                          type="url"
                          value={newProject.link}
                          onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                          placeholder="https://github.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Tags (comma separated)</label>
                        <input
                          type="text"
                          value={newProject.tags}
                          onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                          placeholder="React, Next.js, Tailwind"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingProject(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewProject}
                      className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 cursor-pointer"
                    >
                      Add Project
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {projectsCount === 0 ? (
                  <p className="text-xs text-slate-400 italic">No projects listed yet. Click &quot;New Project&quot; to showcase your repositories or portfolio case studies.</p>
                ) : (
                  (Array.isArray(profile.projects) ? profile.projects : []).map((proj) => (
                    <div key={proj.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E1526] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{proj.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{proj.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )),
          certifications: !isCompany ? renderSectionCard(
          'certifications',
          'Certificates & Licenses',
          Award,
          'Professional certifications, licenses, and verified credentials',
          certificationsCount > 0 ? `${certificationsCount} certificates` : 'Empty · Click to add',
          true,
          (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Showcase accredited credentials and licenses</span>
                <button
                  type="button"
                  onClick={() => setIsAddingCertification(!isAddingCertification)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingCertification ? 'Cancel' : 'New Certificate'}</span>
                </button>
              </div>

              {isAddingCertification && (
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1526] border border-cyan-500/30 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400">Add Certificate</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Certification Name *</label>
                      <input
                        type="text"
                        value={newCertification.name}
                        onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. AWS Certified Solutions Architect"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Issuing Organization *</label>
                      <input
                        type="text"
                        value={newCertification.issuer}
                        onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. Amazon Web Services"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Issue Date</label>
                      <input
                        type="text"
                        value={newCertification.issued}
                        onChange={(e) => setNewCertification({ ...newCertification, issued: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. 2023"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Expiration (optional)</label>
                      <input
                        type="text"
                        value={newCertification.expires}
                        onChange={(e) => setNewCertification({ ...newCertification, expires: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. 2026 or Never"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Credential ID (optional)</label>
                      <input
                        type="text"
                        value={newCertification.credentialId}
                        onChange={(e) => setNewCertification({ ...newCertification, credentialId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="e.g. AWS-12345"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Credential URL (optional)</label>
                      <input
                        type="url"
                        value={newCertification.url}
                        onChange={(e) => setNewCertification({ ...newCertification, url: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCertification(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewCertification}
                      className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 cursor-pointer"
                    >
                      Add Certificate
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {certificationsCount === 0 ? (
                  <p className="text-xs text-slate-400 italic">No certificates listed yet. Click &quot;New Certificate&quot; to add your credentials.</p>
                ) : (
                  (Array.isArray(profile.certifications) ? profile.certifications : []).map((cert) => (
                    <div key={cert.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E1526] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{cert.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{cert.issuer} • Issued {cert.issued}{cert.expires ? ` • Expires ${cert.expires}` : ''}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCertification(cert.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove certificate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )) : null,
          socialLinks: renderSectionCard(
          'socialLinks',
          'Social Media & Links',
          Link2,
          'LinkedIn, GitHub, Twitter/X, Instagram, WhatsApp, and external links',
          socialLinksCount > 0 ? `${socialLinksCount} active links` : 'Empty · Click to add',
          true,
          (
            <div className="space-y-3">
              {[
                { platform: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon },
                { platform: 'github', label: 'GitHub', icon: GithubIcon },
                { platform: 'twitter', label: 'Twitter / X', icon: TwitterIcon },
                { platform: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon }
              ].map(({ platform, label, icon: PlatformIcon }) => (
                <div key={platform} className="p-3 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 flex items-center gap-3">
                  <PlatformIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-0.5">{label}</label>
                    <input
                      type="url"
                      value={getSocialUrl(platform)}
                      onChange={(e) => updateSocialUrl(platform, e.target.value)}
                      placeholder={`https://${platform}.com/...`}
                      className="w-full text-xs bg-transparent border-0 text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSocialVisibility(platform)}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSocialVisible(platform)
                        ? 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        : 'text-amber-500 bg-amber-500/10'
                    }`}
                    title={isSocialVisible(platform) ? "Visible on card" : "Hidden from card"}
                  >
                    {isSocialVisible(platform) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )),
          enhanceProfile: renderSectionCard(
          'enhanceProfile',
          'Enhance Profile & Custom Fields',
          Sparkles,
          'Custom key-value fields, specialized credentials, and highlights',
          customFieldsCount > 0 ? `${customFieldsCount} custom fields` : 'Optional',
          true,
          (
            <div className="space-y-4">
              {/* Add Custom Field Form */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Field Title</label>
                    <input
                      type="text"
                      value={newCustomFieldLabel}
                      onChange={(e) => setNewCustomFieldLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                      placeholder="e.g. Office Hours, Tech Stack"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Content Type</label>
                    <select
                      value={newCustomFieldType}
                      onChange={(e) => setNewCustomFieldType(e.target.value as 'text' | 'markdown' | 'link')}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="text">Plain Text</option>
                      <option value="markdown">Markdown</option>
                      <option value="link">Hyperlink</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Content Value</label>
                    <input
                      type="text"
                      value={newCustomFieldValue}
                      onChange={(e) => setNewCustomFieldValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                      placeholder="e.g. Mon-Fri 10am-4pm PST"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Field</span>
                  </button>
                </div>
              </div>

              {/* Custom Fields List */}
              <div className="space-y-2">
                {customFieldsCount === 0 ? (
                  <p className="text-xs text-slate-400 italic">No custom fields added yet.</p>
                ) : (
                  (Array.isArray(profile.customFields) ? profile.customFields : []).map((cf) => (
                    <div key={cf.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{cf.label}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{cf.value}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCustomField(cf.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                          {cf.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomField(cf.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )),
        };

        return canonicalSectionOrder.map((secKey) => {
          const norm = normalizeSectionKey(secKey);
          const el = sectionElements[norm] || (norm === 'customFields' ? sectionElements.enhanceProfile : undefined);
          return el ? <React.Fragment key={secKey}>{el}</React.Fragment> : null;
        });
      })()}

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* 10. PRIVACY & VISIBILITY LIMITATIONS                                       */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {renderSectionCard(
          'limitations',
          'Privacy & Visibility Limitations',
          EyeOff,
          'Granular privacy and public display rules for cards and contact details',
          'Privacy controls',
          false,
          (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'email', label: 'Direct Email Visibility' },
                { key: 'phone', label: 'Telephone Number Visibility' },
                { key: 'contactInfo', label: 'All Contact Channels' },
                { key: 'skills', label: 'Skills & Badges Visibility' },
                { key: 'projects', label: 'Portfolio Projects Visibility' },
                { key: 'experience', label: 'Work Experience History' },
                { key: 'education', label: 'Education & Credentials' },
                { key: 'socialLinks', label: 'Social Media Accounts' },
                { key: 'nfcCard', label: 'Digital NFC Pass Badging' }
              ].map(({ key, label }) => {
                const isChecked = profile.sharingSettings?.[key as keyof typeof profile.sharingSettings] !== false;
                return (
                  <div
                    key={key}
                    onClick={() => toggleSharingSetting(key as any)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="text-xs text-slate-800 dark:text-slate-300 font-medium">{label}</span>
                    <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${isChecked ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${isChecked ? 'translate-x-3.5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* 11. ACCOUNT INFO SECTION                                                   */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {renderSectionCard(
          'accountInfo',
          'Account & Profile Information',
          UserCheck,
          'Account profile type, persona identity, and registration metadata',
          profile.type === 'team' ? 'Company Profile' : 'Individual Profile',
          false,
          (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Profile Persona Type:</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25">
                  {profile.type === 'team' ? 'Company / Organization' : 'Individual / Professional'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Profile Slug / ID:</span>
                <span className="text-xs font-mono text-slate-900 dark:text-white">{profile.slug || profile.id}</span>
              </div>
            </div>
          )
        )}

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* 12. ARCHIVE & HIDDEN SECTIONS                                              */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {renderSectionCard(
          'archive',
          'Archive & Hidden Sections',
          Archive,
          'Review sections currently toggled off on your public card and restore them',
          hiddenCount > 0 ? `${hiddenCount} hidden` : 'None hidden',
          false,
          (
            <div className="space-y-3">
              {hiddenCount === 0 ? (
                <p className="text-xs text-slate-400 italic">No sections are currently hidden. All profile sections are visible on your card.</p>
              ) : (
                Object.entries(profile.sectionVisibility || {})
                  .filter(([_, visible]) => visible === false)
                  .map(([sec]) => (
                    <div key={sec} className="p-3 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-300 capitalize">{sec}</span>
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility(sec)}
                        className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 cursor-pointer"
                      >
                        Restore to Card
                      </button>
                    </div>
                  ))
              )}
            </div>
          )
        )}

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* 13. SECURITY & VERIFICATION                                                */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {renderSectionCard(
          'security',
          'Security & Verification',
          ShieldCheck,
          'Pass verification badge, NFC pass finish, and sanitization protocols',
          'Verified Pass',
          false,
          (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Tamper-Proof Digital Pass</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Encrypted credentials with authenticated verification badge.</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Visitor Sanitization</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Restricted details are automatically filtered server-side for visitors.</p>
                </div>
              </div>
            </div>
          )
        )}

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* 14. SETTINGS & PROFILE CONFIGURATION                                       */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {renderSectionCard(
          'settings',
          'Settings & Profile Configuration',
          Settings,
          'Profile URL slug, theme switching, and card defaults',
          activeTheme ? `Theme: ${activeTheme}` : 'Default',
          false,
          (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Profile Identifier / URL Slug</label>
                <input
                  type="text"
                  value={profile.slug || ''}
                  onChange={(e) => updateField('slug', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
                  placeholder="custom-slug"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Portfolio Visual Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'editorial', label: 'Editorial Minimal' },
                    { id: 'cyber', label: 'Dev Terminal' },
                    { id: 'luxe', label: 'Luxe Velvet' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setActiveTheme(t.id as ProfileTheme);
                        updateField('theme', t.id as ProfileTheme);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        (profile.theme || activeTheme) === t.id
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 shadow-xs'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080D1A] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* RIGHT: Live Interactive Phone Preview Column (Sticky Alongside Content)    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {!hideRightPreview && (
        <aside className="w-[360px] xl:w-[390px] shrink-0 h-full border-l border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#060A14] flex flex-col items-center p-4 overflow-y-auto select-none scrollbar-thin">
          <div className="w-full max-w-[340px] flex items-center justify-between px-3 py-1.5 mb-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Live Card Preview</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-500 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Synchronized
            </span>
          </div>

          <PhonePreview
            profile={{ ...profile, theme: activeTheme }}
            isDark={isDark}
            canEdit={true}
            onOpenEdit={() => {}}
            onOpenShare={() => showToast('Share settings accessible in sidebar')}
            onOpenConnect={() => showToast('Connected!')}
            onSaveContact={() => showToast('Contact information saved!')}
            onSaveEdits={async (updated) => {
              setProfile(updated);
              showToast('Card updated!');
            }}
            hideHeaderLabel={true}
            onSelectSection={(secKey) => {
              const map: Record<string, string> = {
                hero: 'profile',
                basicInfo: 'profile',
                about: 'profile',
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
              const target = map[secKey] || secKey;
              setActiveSection(target);
            }}
          />

          <p className="text-[10px] text-slate-500 text-center mt-3 max-w-[300px]">
            Click any section on the left to edit. Changes reflect live on the card preview.
          </p>
        </aside>
      )}

    </div>
  );
}
