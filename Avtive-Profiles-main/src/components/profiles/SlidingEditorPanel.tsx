'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  X,
  Camera,
  Pencil,
  Plus,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  Trash2,
  FolderGit2,
  Briefcase,
  GraduationCap,
  Code,
  FileText,
  Link2,
  Globe,
  Eye,
  EyeOff,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Copy,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  User,
  CheckCircle2,
  Smartphone,
  Layers,
  Tag,
  Share2,
  Palette,
  Sparkles,
  SlidersHorizontal,
  Building2,
  Phone,
  Mail,
  RotateCcw
} from 'lucide-react';
import {
  ProfileData,
  ProfileTheme,
  ProjectItem,
  DEFAULT_SECTION_ORDER,
  DEFAULT_SECTION_VISIBILITY,
} from '@/types/profile';
import { useProfileEditor, DraggableLinkItem as CtxDraggableLinkItem } from '@/context/ProfileEditorContext';
import { ProfileSwitcher } from '@/components/profiles/ProfileSwitcher';
import { LinkedInIcon, GithubIcon, TwitterIcon, WhatsAppIcon } from '@/components/BrandIcons';

export interface SlidingEditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: ProfileData;
  userProfiles?: ProfileData[];
  onLiveUpdate?: (updatedProfile: ProfileData) => void;
  onSaveSuccess?: (savedProfile: ProfileData) => void;
}

// Use context's DraggableLinkItem type to avoid local duplication
type DraggableLinkItem = CtxDraggableLinkItem;

const SECTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  hero: { label: 'Hero & Identity Header', icon: User, color: 'text-blue-500' },
  about: { label: 'Bio & About Section', icon: FileText, color: 'text-amber-500' },
  contact: { label: 'Contact & Quick Actions', icon: Phone, color: 'text-emerald-500' },
  'custom-fields': { label: 'Custom Fields', icon: Tag, color: 'text-purple-500' },
  services: { label: 'Services & Offerings', icon: Briefcase, color: 'text-indigo-500' },
  skills: { label: 'Skills Badges', icon: Code, color: 'text-cyan-500' },
  projects: { label: 'Projects & Portfolio', icon: FolderGit2, color: 'text-rose-500' },
  experience: { label: 'Work Experience', icon: Briefcase, color: 'text-orange-500' },
  education: { label: 'Education & Credentials', icon: GraduationCap, color: 'text-violet-500' },
  certifications: { label: 'Certifications', icon: CheckCircle2, color: 'text-teal-500' },
  languages: { label: 'Languages Spoken', icon: Globe, color: 'text-blue-400' },
  recommendations: { label: 'Endorsements & Recommendations', icon: Sparkles, color: 'text-yellow-500' },
  'virtual-card': { label: 'Digital Identity Card', icon: Smartphone, color: 'text-sky-500' },
  company: { label: 'Company / Team Overview', icon: Building2, color: 'text-slate-500' }
};

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero & Identity Header',
  about: 'Bio & About Section',
  contact: 'Contact & Quick Actions',
  'custom-fields': 'Custom Fields',
  services: 'Services & Offerings',
  skills: 'Skills Badges',
  projects: 'Projects & Portfolio',
  experience: 'Work Experience',
  education: 'Education & Credentials',
  certifications: 'Certifications',
  languages: 'Languages Spoken',
  recommendations: 'Endorsements & Recommendations',
  'virtual-card': 'Digital Identity Card',
  company: 'Company / Team Overview'
};

function buildSocialLinksFromProfile(p: ProfileData): DraggableLinkItem[] {
  const safeSocials = (Array.isArray(p.socials) && p.socials.length > 0)
    ? p.socials
    : (Array.isArray(p.socialLinks) && p.socialLinks.length > 0)
    ? p.socialLinks
    : null;

  if (safeSocials && safeSocials.length > 0) {
    return safeSocials.map((s: any, idx: number) => {
      const platform = (s.platform || 'website') as DraggableLinkItem['platform'];
      return {
        id: `link-${platform}-${idx}`,
        platform,
        title: s.label || (platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Link'),
        url: s.url || '',
        visible: s.visible !== false
      };
    });
  }

  return [
    {
      id: 'link-li-0',
      platform: 'linkedin',
      title: 'LinkedIn',
      url: 'https://linkedin.com',
      visible: true
    },
    {
      id: 'link-gh-1',
      platform: 'github',
      title: 'GitHub',
      url: 'https://github.com',
      visible: true
    },
    {
      id: 'link-web-2',
      platform: 'website',
      title: 'Website / Portfolio',
      url: p.website || 'https://avtive.app',
      visible: true
    }
  ];
}

function DraggableLinkCard({
  link,
  index,
  total,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown
}: {
  link: DraggableLinkItem;
  index: number;
  total: number;
  onUpdate: (updated: Partial<DraggableLinkItem>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const dragControls = useDragControls();

  const renderIcon = () => {
    switch (link.platform) {
      case 'github':
        return <GithubIcon className="w-4 h-4 text-zinc-900 dark:text-white" />;
      case 'linkedin':
        return <LinkedInIcon className="w-4 h-4 text-blue-500" />;
      case 'twitter':
        return <TwitterIcon className="w-4 h-4 text-sky-500" />;
      case 'whatsapp':
        return <WhatsAppIcon className="w-4 h-4 text-emerald-500" />;
      case 'website':
      default:
        return <Globe className="w-4 h-4 text-slate-500 dark:text-white/60" />;
    }
  };

  return (
    <Reorder.Item
      value={link}
      id={link.id}
      dragListener={false}
      dragControls={dragControls}
      className={`p-3 rounded-xl bg-white dark:bg-white/5 border transition-all flex items-center gap-2.5 shadow-2xs ${
        link.visible
          ? 'border-slate-200 dark:border-white/10'
          : 'border-slate-200/50 dark:border-white/5 opacity-60 bg-slate-50/50 dark:bg-black/20'
      }`}
    >
      {/* Drag Handle */}
      <button
        type="button"
        onPointerDown={(e) => dragControls.start(e)}
        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-grab active:cursor-grabbing shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Accessible Move Arrows */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
          title="Move up"
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
          title="Move down"
        >
          <ArrowDown className="w-3 h-3" />
        </button>
      </div>

      {/* Platform Icon */}
      <div className="shrink-0 w-6 flex items-center justify-center">
        {renderIcon()}
      </div>

      {/* URL Input */}
      <div className="flex-1 min-w-0">
        <input
          type="url"
          value={link.url}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder={`https://${link.platform}.com/...`}
          className="figma-input w-full px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
        />
      </div>

      {/* Visibility Toggle */}
      <button
        type="button"
        onClick={() => onUpdate({ visible: !link.visible })}
        className={`px-2 py-1 rounded-md text-[10px] font-bold shrink-0 transition-colors cursor-pointer ${
          link.visible
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/40'
        }`}
        title={link.visible ? 'Visible on profile' : 'Hidden from profile'}
      >
        {link.visible ? 'ON' : 'OFF'}
      </button>

      {/* Delete button */}
      <button
        type="button"
        onClick={onDelete}
        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 shrink-0 cursor-pointer"
        title="Remove link"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </Reorder.Item>
  );
}

import { ProfileSectionEditor } from '@/components/profiles/ProfileSectionEditor';

function DraggableSectionItem({
  sectionKey,
  label,
  icon: Icon,
  iconColor,
  isVisible,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isExpanded,
  onToggleExpand,
  children
}: {
  sectionKey: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  children?: React.ReactNode;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={sectionKey}
      id={sectionKey}
      dragListener={false}
      dragControls={dragControls}
      className={`group rounded-xl border transition-all select-none overflow-hidden ${
        isVisible
          ? 'bg-white dark:bg-white/5 border-slate-200/90 dark:border-white/10 shadow-2xs hover:border-slate-300 dark:hover:border-white/20'
          : 'bg-slate-100/50 dark:bg-black/25 border-dashed border-slate-200/60 dark:border-white/5 opacity-60'
      }`}
    >
      {/* Row Header */}
      <div className="px-2.5 py-2 flex items-center justify-between gap-2">
        {/* Left: Drag Handle + Section Icon + Section Name */}
        <div
          onClick={onToggleExpand}
          className={`flex items-center gap-2 min-w-0 flex-1 ${onToggleExpand ? 'cursor-pointer' : ''}`}
        >
          {/* Drag Handle */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              dragControls.start(e);
            }}
            className="p-1 -ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-grab active:cursor-grabbing shrink-0 transition-colors"
            title="Drag to rearrange section"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          {/* Small Section Icon */}
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isVisible
                ? 'bg-slate-100 dark:bg-white/10'
                : 'bg-slate-200/50 dark:bg-white/5'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isVisible ? iconColor : 'text-slate-400 dark:text-zinc-500'}`} />
          </div>

          {/* Section Name */}
          <span
            className={`text-xs font-medium truncate transition-colors ${
              isVisible
                ? 'text-slate-900 dark:text-zinc-100 font-semibold'
                : 'text-slate-400 dark:text-zinc-500'
            }`}
          >
            {label}
          </span>

          {onToggleExpand && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ml-1 transition-colors ${
              isExpanded
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold'
                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60'
            }`}>
              {isExpanded ? 'Expanded' : 'Edit inline'}
            </span>
          )}
        </div>

        {/* Right Controls: Micro Up/Down Arrows + Expand Chevron + Eye Visibility Control */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Subtle Up/Down arrows for keyboard accessibility */}
          <div className="hidden sm:flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer"
              title="Move up"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer"
              title="Move down"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>

          {/* Expand Toggle Button */}
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isExpanded
                  ? 'bg-slate-200/80 dark:bg-white/15 text-slate-900 dark:text-white'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
              title={isExpanded ? 'Collapse section' : 'Expand section editor inline'}
              aria-label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Eye Visibility Control */}
          <button
            type="button"
            onClick={onToggleVisibility}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isVisible
                ? 'text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                : 'text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-white/5'
            }`}
            title={isVisible ? 'Visible (Click to hide)' : 'Hidden (Click to show)'}
            aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
          >
            {isVisible ? (
              <Eye className="w-4 h-4 text-emerald-500 hover:text-emerald-600 dark:text-emerald-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            )}
          </button>
        </div>
      </div>

      {/* Inline Expanded Content Container (Directly Beneath Row) */}
      {isExpanded && children && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-black/25">
          {children}
        </div>
      )}
    </Reorder.Item>
  );
}

export function SlidingEditorPanel({
  isOpen,
  onClose,
  initialProfile,
  userProfiles,
  onLiveUpdate,
  onSaveSuccess
}: SlidingEditorPanelProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── All shared profile state comes from the single context ────────────────
  const {
    profile,
    activeTheme, setActiveTheme,
    firstName, setFirstName,
    secondName, setSecondName,
    username, setUsername,
    professionalTitle, setProfessionalTitle,
    bio, setBio,
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
    isUploadingAvatar,
    isUploadingCover,
    isSaving,
    statusMessage,
    copySuccess,
    fullName,
    currentActiveIdentifier,
    publicProfileUrl,
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
    isConfirmed,
    setIsConfirmed,
    handleSwitchToProfile,
    handleProfileSectionLiveUpdate,
    handleProfileSectionSaveSuccess,
    liveProfile,
  } = useProfileEditor();

  // 2. Skills (panel-only input state)
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isInlineProjectOpen, setIsInlineProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', tags: '', link: '', image: '' });

  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true, skills: true, about: true, projects: true,
    socials: true, customFields: true, sectionsLayout: false, share: true
  });

  const [expandedInlineSectionKey, setExpandedInlineSectionKey] = useState<string | null>('hero');
  const [inlineProfileMode, setInlineProfileMode] = useState<'edit' | 'add'>('edit');

  const handleToggleInlineSection = (sectionKey: string, targetMode?: 'edit' | 'add') => {
    if (targetMode) {
      setInlineProfileMode(targetMode);
      setExpandedInlineSectionKey(sectionKey);
      return;
    }
    setExpandedInlineSectionKey((prev) => (prev === sectionKey ? null : sectionKey));
  };

  const toggleSection = (section: keyof typeof expandedSections) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const scrollToSection = (sectionKey: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [sectionKey]: true }));
    const el = document.getElementById(`section-${sectionKey}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Skills (panel-local handlers that delegate to context setters) ─────────
  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills((prev) => [...prev, trimmed]);
    setNewSkillInput('');
  };
  const handleRemoveSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

  // ── Projects (panel-local project form state; setProjects comes from context) ─
  const handleOpenAddProject = () => {
    setEditingProject(null);
    setProjectForm({ title: '', description: '', tags: '', link: '', image: '' });
    setIsInlineProjectOpen(true);
  };
  const handleOpenEditProject = (p: ProjectItem) => {
    setEditingProject(p);
    setProjectForm({ title: p.title, description: p.description, tags: Array.isArray(p.tags) ? p.tags.join(', ') : '', link: p.link || p.liveUrl || '', image: p.image || p.coverImage || '' });
    setIsInlineProjectOpen(true);
  };
  const handleSaveInlineProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim()) return;
    const tagsArray = projectForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (editingProject) {
      setProjects((prev) => prev.map((p) =>
        p.id === editingProject.id
          ? { ...p, title: projectForm.title.trim(), description: projectForm.description.trim(), tags: tagsArray, link: projectForm.link.trim(), image: projectForm.image.trim() || p.image, coverImage: projectForm.image.trim() || p.coverImage }
          : p
      ));
    } else {
      setProjects((prev) => [{ id: `proj-${Date.now()}`, title: projectForm.title.trim(), description: projectForm.description.trim(), tags: tagsArray, link: projectForm.link.trim(), image: projectForm.image.trim() || undefined, coverImage: projectForm.image.trim() || undefined, category: 'Project' }, ...prev]);
    }
    setIsInlineProjectOpen(false);
  };
  const handleDeleteProject = (id: string) => setProjects((prev) => prev.filter((p) => p.id !== id));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Lightweight backdrop overlay for mobile viewports */}
          <motion.div
            key="sliding-editor-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-xs lg:hidden"
            aria-hidden="true"
          />

          {/* Linktree-style Smooth Sliding Editor Panel */}
          <motion.aside
            key="sliding-editor-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              duration: 0.28,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="fixed top-0 bottom-0 left-0 z-40 h-full w-full sm:w-[500px] md:w-[540px] lg:w-[580px] xl:w-[620px] backdrop-blur-2xl bg-white/95 dark:bg-[#111319]/95 border-r border-slate-200/80 dark:border-white/10 shadow-2xl flex flex-col font-sans overflow-hidden"
            style={{ willChange: 'transform' }}
          >
          {/* Top Panel Navigation Bar */}
          <div className="shrink-0 px-4 py-3 border-b border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-[#111319]/60 backdrop-blur-md flex items-center justify-between gap-3 z-20">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate">
                    Avtive Studio
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
                    Live Sync
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-white/50 truncate">
                  Realtime updates to the profile preview
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Persona Switcher */}
              <ProfileSwitcher
                currentProfileIdOrSlug={profile.slug || profile.id || initialProfile.slug || initialProfile.id}
                initialProfiles={userProfiles}
                onSelectProfile={handleSwitchToProfile}
              />

              {/* Collapse Button */}
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white/90 transition-colors cursor-pointer"
                title="Collapse editor panel"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Collapse</span>
              </button>
            </div>
          </div>

          {/* Quick Section Jump Pills */}
          <div className="shrink-0 px-3 py-2 border-b border-slate-200/60 dark:border-white/5 bg-slate-50/70 dark:bg-black/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { key: 'basicInfo' as const, label: 'Identity & Profile', icon: User },
              { key: 'skills' as const, label: 'Skills', icon: Code },
              { key: 'about' as const, label: 'About', icon: FileText },
              { key: 'projects' as const, label: 'Projects', icon: FolderGit2 },
              { key: 'socials' as const, label: 'Socials', icon: Link2 },
              { key: 'customFields' as const, label: 'Custom Fields', icon: Tag },
              { key: 'sectionsLayout' as const, label: 'Section Editor', icon: Layers },
              { key: 'share' as const, label: 'Share & Privacy', icon: Share2 }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => scrollToSection(item.key)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-white/80 border border-slate-200/70 dark:border-white/10 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Icon className="w-3 h-3 text-slate-400 dark:text-white/50" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Form Content */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overscroll-contain space-y-4 p-4 sm:p-5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700"
          >
            {/* 1. Header Banner & Profile Photo Area */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs">
              <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                <img
                  src={coverImage}
                  alt="Cover Banner"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                {/* Cover Change Button */}
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-md"
                  title="Change Cover Banner"
                >
                  {isUploadingCover ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverUpload(file);
                  }}
                />
              </div>

              {/* Avatar & Realtime Title */}
              <div className="px-4 pb-4 pt-0 relative -mt-10 flex items-end justify-between gap-3">
                <div className="flex items-end gap-3 min-w-0">
                  <div className="relative w-20 h-20 rounded-full border-3 border-white dark:border-[#111319] shadow-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                    <img
                      src={avatar}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors cursor-pointer"
                      title="Change Profile Photo"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(file);
                      }}
                    />
                  </div>

                  <div className="min-w-0 pb-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {fullName || 'Your Name'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-white/60 truncate">
                      {professionalTitle || 'Professional Title'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pb-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-white/70">
                    @{username || 'handle'}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* SECTION 1: BASIC INFO & THEME */}
            <div id="section-basicInfo" className="rounded-2xl bg-white/70 dark:bg-[#1B1E28]/70 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs backdrop-blur-sm">
              <button
                type="button"
                onClick={() => toggleSection('basicInfo')}
                className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span>1. Identity & Profile Editor</span>
                </div>
                {expandedSections.basicInfo ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-white/50" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-white/50" />}
              </button>

              {expandedSections.basicInfo && (
                <div className="p-4 pt-1 border-t border-slate-200/60 dark:border-white/5">
                  <ProfileSectionEditor
                    initialMode="edit"
                    profile={liveProfile}
                    userProfiles={userProfiles}
                    isExpanded={true}
                    onLiveUpdate={handleProfileSectionLiveUpdate}
                    onSaveSuccess={handleProfileSectionSaveSuccess}
                  />
                </div>
              )}
            </div>

            {/* SECTION 2: SKILLS */}
            <div id="section-skills" className="rounded-2xl bg-white/70 dark:bg-[#1B1E28]/70 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs backdrop-blur-sm">
              <button
                type="button"
                onClick={() => toggleSection('skills')}
                className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-slate-600 dark:text-white/70" />
                  <span>2. Skills & Badges ({skills.length})</span>
                </div>
                {expandedSections.skills ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-white/50" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-white/50" />}
              </button>

              {expandedSections.skills && (
                <div className="p-4 pt-1 space-y-3 border-t border-slate-200/60 dark:border-white/5">
                  <form onSubmit={handleAddSkill} className="flex gap-2">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      placeholder="Add skill (e.g. Next.js, GraphQL, Figma)..."
                      className="figma-input flex-1 px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                    />
                    <button
                      type="submit"
                      className="figma-pill-primary px-3 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/15 text-xs font-medium text-slate-800 dark:text-white shadow-2xs"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: ABOUT */}
            <div id="section-about" className="rounded-2xl bg-white/70 dark:bg-[#1B1E28]/70 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs backdrop-blur-sm">
              <button
                type="button"
                onClick={() => toggleSection('about')}
                className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600 dark:text-white/70" />
                  <span>3. About & Philosophy</span>
                </div>
                {expandedSections.about ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-white/50" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-white/50" />}
              </button>

              {expandedSections.about && (
                <div className="p-4 pt-1 space-y-2 border-t border-slate-200/60 dark:border-white/5">
                  <textarea
                    rows={4}
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Share your detailed career journey, achievements, or project specialties..."
                    className="figma-input w-full px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40 leading-relaxed resize-none"
                  />
                </div>
              )}
            </div>

            {/* SECTION 4: PROJECTS */}
            <div id="section-projects" className="rounded-2xl bg-white/70 dark:bg-[#1B1E28]/70 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs backdrop-blur-sm">
              <div className="w-full p-3.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleSection('projects')}
                  className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-white/80 transition-colors cursor-pointer"
                >
                  <FolderGit2 className="w-4 h-4 text-slate-600 dark:text-white/70" />
                  <span>4. Projects ({projects.length})</span>
                  {expandedSections.projects ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-white/50 ml-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-white/50 ml-1" />}
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddProject}
                  className="figma-pill-primary px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Project</span>
                </button>
              </div>

              {expandedSections.projects && (
                <div className="p-4 pt-0 space-y-3 border-t border-slate-200/60 dark:border-white/5">
                  {/* Inline Project Add/Edit Form */}
                  {isInlineProjectOpen && (
                    <form onSubmit={handleSaveInlineProject} className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/20 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-white/10">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {editingProject ? 'Edit Project' : 'New Project'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsInlineProjectOpen(false)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={projectForm.title}
                          onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                          placeholder="Project Title"
                          className="figma-input w-full px-2.5 py-1.5 text-xs font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <textarea
                          rows={2}
                          value={projectForm.description}
                          onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                          placeholder="Project Description"
                          className="figma-input w-full px-2.5 py-1.5 text-xs resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="url"
                          value={projectForm.link}
                          onChange={(e) => setProjectForm({ ...projectForm, link: e.target.value })}
                          placeholder="Live URL (https://...)"
                          className="figma-input w-full px-2.5 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={projectForm.tags}
                          onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })}
                          placeholder="Tags (comma separated)"
                          className="figma-input w-full px-2.5 py-1.5 text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsInlineProjectOpen(false)}
                          className="px-3 py-1 text-xs text-slate-600 dark:text-white/60 hover:text-slate-900 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="figma-pill-primary px-3 py-1 text-xs font-bold cursor-pointer"
                        >
                          Save Project
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Projects List */}
                  {projects.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 dark:text-white/40">
                      No projects added yet. Click &quot;Add Project&quot; above.
                    </div>
                  ) : (
                    projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 hover:bg-slate-100/80 dark:hover:bg-white/[0.08] transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {(proj.image || proj.coverImage) ? (
                            <img
                              src={proj.image || proj.coverImage}
                              alt={proj.title}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0 bg-slate-100 dark:bg-slate-900"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shrink-0">
                              <FolderGit2 className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{proj.title}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-white/60 line-clamp-1">{proj.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProject(proj)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 hover:text-slate-900 dark:text-white/80 dark:hover:text-white cursor-pointer"
                            title="Edit Project"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-500/15 dark:bg-white/10 dark:hover:bg-rose-500/20 text-slate-700 hover:text-rose-600 dark:text-white/80 dark:hover:text-rose-400 cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* SECTION 5: DRAGGABLE SOCIAL LINKS */}
            <div id="section-socials" className="rounded-2xl bg-white/70 dark:bg-[#1B1E28]/70 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs backdrop-blur-sm">
              <div className="w-full p-3.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleSection('socials')}
                  className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-white/80 transition-colors cursor-pointer"
                >
                  <Link2 className="w-4 h-4 text-slate-600 dark:text-white/70" />
                  <span>5. Social Links & Ordering ({socialLinks.length})</span>
                  {expandedSections.socials ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-white/50 ml-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-white/50 ml-1" />}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAddLinkItem('twitter')}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors cursor-pointer"
                    title="Add Twitter / X"
                  >
                    + X
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddLinkItem('whatsapp')}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors cursor-pointer"
                    title="Add WhatsApp"
                  >
                    + WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddLinkItem('other')}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors cursor-pointer"
                    title="Add Custom Link"
                  >
                    + Link
                  </button>
                </div>
              </div>

              {expandedSections.socials && (
                <div className="p-4 pt-0 space-y-2 border-t border-slate-200/60 dark:border-white/5">
                  <p className="text-[11px] text-slate-500 dark:text-white/50 mb-2 flex items-center gap-1">
                    <GripVertical className="w-3 h-3" />
                    Drag handles or click arrows to reorder. Live preview updates instantly.
                  </p>

                  <Reorder.Group
                    axis="y"
                    values={socialLinks}
                    onReorder={setSocialLinks}
                    className="space-y-2"
                  >
                    {socialLinks.map((link, idx) => (
                      <DraggableLinkCard
                        key={link.id}
                        link={link}
                        index={idx}
                        total={socialLinks.length}
                        onUpdate={(patch) => handleUpdateLink(link.id, patch)}
                        onDelete={() => handleDeleteLink(link.id)}
                        onMoveUp={() => handleMoveLink(idx, 'up')}
                        onMoveDown={() => handleMoveLink(idx, 'down')}
                      />
                    ))}
                  </Reorder.Group>
                </div>
              )}
            </div>

            {/* SECTION 6: CUSTOM FIELDS */}
            <div id="section-customFields" className="rounded-2xl bg-white/70 dark:bg-[#1B1E28]/70 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs backdrop-blur-sm">
              <div className="w-full p-3.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleSection('customFields')}
                  className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-white/80 transition-colors cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-purple-500" />
                  <span>6. Custom Fields ({customFields.length})</span>
                  {expandedSections.customFields ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-white/50 ml-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-white/50 ml-1" />}
                </button>

                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
              </div>

              {expandedSections.customFields && (
                <div className="p-4 pt-0 space-y-3 border-t border-slate-200/60 dark:border-white/5">
                  <p className="text-[11px] text-slate-500 dark:text-white/50 mb-2">
                    Add custom contact channels, calendar links, or public identifiers.
                  </p>

                  {customFields.length === 0 ? (
                    <div className="text-center py-4 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                      <Tag className="w-5 h-5 text-slate-400 dark:text-white/30 mx-auto mb-1" />
                      <p className="text-xs text-slate-500 dark:text-white/50 mb-2">No custom fields yet</p>
                      <button
                        type="button"
                        onClick={handleAddCustomField}
                        className="px-3 py-1 rounded-md text-xs font-semibold bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        + Create Field
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {customFields.map((field, idx) => (
                        <div
                          key={field.id}
                          className={`p-3 rounded-xl bg-white dark:bg-white/5 border transition-all flex flex-col gap-2 shadow-2xs ${
                            field.visible !== false
                              ? 'border-slate-200 dark:border-white/10'
                              : 'border-slate-200/50 dark:border-white/5 opacity-60 bg-slate-50/50 dark:bg-black/20'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveCustomField(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveCustomField(idx, 'down')}
                                disabled={idx === customFields.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => handleUpdateCustomField(field.id, { label: e.target.value })}
                                placeholder="Field Label (e.g. Calendly, Discord)"
                                className="figma-input w-full px-2.5 py-1.5 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                              />
                              <div className="flex items-center gap-1.5">
                                <input
                                  type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                                  value={field.value}
                                  onChange={(e) => handleUpdateCustomField(field.id, { value: e.target.value })}
                                  placeholder="Value or Link..."
                                  className="figma-input flex-1 px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                                />
                                <select
                                  value={field.type || 'text'}
                                  onChange={(e) => handleUpdateCustomField(field.id, { type: e.target.value as any })}
                                  className="figma-input px-2 py-1.5 text-[11px] bg-slate-50 dark:bg-[#191c25] focus:outline-hidden cursor-pointer"
                                  title="Field Type"
                                >
                                  <option value="text">Text</option>
                                  <option value="link">Link</option>
                                  <option value="email">Email</option>
                                  <option value="phone">Phone</option>
                                  <option value="number">Number</option>
                                  <option value="date">Date</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateCustomField(field.id, { visible: field.visible === false ? true : false })}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                                  field.visible !== false
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/40'
                                }`}
                                title={field.visible !== false ? 'Visible on profile' : 'Hidden from profile'}
                              >
                                {field.visible !== false ? 'ON' : 'OFF'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomField(field.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                                title="Delete Field"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 7: SECTION EDITOR & REORDERING (Based on Figma Screen #8) */}
            <div id="section-sectionsLayout" className="rounded-2xl bg-white/70 dark:bg-[#1B1E28]/70 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs backdrop-blur-sm">
              <button
                type="button"
                onClick={() => toggleSection('sectionsLayout')}
                className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>7. Section Editor ({sectionOrder.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 font-mono">
                    {sectionOrder.filter((k) => sectionVisibility[k] !== false).length} visible
                  </span>
                  {expandedSections.sectionsLayout ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-white/50" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-white/50" />}
                </div>
              </button>

              {expandedSections.sectionsLayout && (
                <div className="p-3.5 pt-0 space-y-2.5 border-t border-slate-200/60 dark:border-white/5">
                  {/* Compact Header Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 pb-0.5">
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Drag handle to rearrange. Click eye icon to show or hide.
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleInlineSection('hero', 'add')}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors cursor-pointer flex items-center gap-1"
                        title="Add a new profile persona inline"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Add Profile</span>
                      </button>

                      {sectionOrder.some((k) => sectionVisibility[k] === false) && (
                        <button
                          type="button"
                          onClick={() => {
                            const allShown: Record<string, boolean> = {};
                            sectionOrder.forEach((k) => { allShown[k] = true; });
                            setSectionVisibility(allShown);
                          }}
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Show All
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSectionOrder(DEFAULT_SECTION_ORDER);
                          setSectionVisibility(DEFAULT_SECTION_VISIBILITY);
                        }}
                        className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer flex items-center gap-0.5"
                        title="Reset to default order and visibility"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* Compact Reorderable Section Items List */}
                  <Reorder.Group
                    axis="y"
                    values={sectionOrder}
                    onReorder={setSectionOrder}
                    className="space-y-1.5"
                  >
                    {sectionOrder.map((sectionKey, idx) => {
                      const cfg = SECTION_CONFIG[sectionKey] || {
                        label: SECTION_LABELS[sectionKey] || (sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)),
                        icon: Layers,
                        color: 'text-slate-500'
                      };
                      const isVisible = sectionVisibility[sectionKey] !== false;
                      const isHero = sectionKey === 'hero';
                      const isItemExpanded = expandedInlineSectionKey === sectionKey;

                      return (
                        <DraggableSectionItem
                          key={sectionKey}
                          sectionKey={sectionKey}
                          label={cfg.label}
                          icon={cfg.icon}
                          iconColor={cfg.color}
                          isVisible={isVisible}
                          onToggleVisibility={() => handleToggleSectionVisibility(sectionKey)}
                          onMoveUp={() => handleMoveSection(idx, 'up')}
                          onMoveDown={() => handleMoveSection(idx, 'down')}
                          isFirst={idx === 0}
                          isLast={idx === sectionOrder.length - 1}
                          isExpanded={isItemExpanded}
                          onToggleExpand={isHero ? () => handleToggleInlineSection(sectionKey) : undefined}
                        >
                          {isHero && isItemExpanded && (
                            <ProfileSectionEditor
                              initialMode={inlineProfileMode}
                              profile={liveProfile}
                              userProfiles={userProfiles}
                              isExpanded={true}
                              onLiveUpdate={handleProfileSectionLiveUpdate}
                              onSaveSuccess={handleProfileSectionSaveSuccess}
                              onCancel={() => setExpandedInlineSectionKey(null)}
                            />
                          )}
                        </DraggableSectionItem>
                      );
                    })}
                  </Reorder.Group>
                </div>
              )}
            </div>

            {/* SECTION 8: SHARE PROFILE & VISIBILITY CONTROLS */}
            <div id="section-share" className="rounded-2xl bg-white/70 dark:bg-[#1B1E28]/70 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs backdrop-blur-sm">
              <button
                type="button"
                onClick={() => toggleSection('share')}
                className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-amber-500" />
                  <span>8. Share Profile & Privacy Controls</span>
                </div>
                {expandedSections.share ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-white/50" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-white/50" />}
              </button>

              {expandedSections.share && (
                <div className="p-4 pt-1 space-y-4 border-t border-slate-200/60 dark:border-white/5">
                  {/* Share Link Box */}
                  <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-700 dark:text-white/80 truncate">
                      {publicProfileUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                        copySuccess
                          ? 'bg-emerald-600 text-white'
                          : 'figma-pill-primary'
                      }`}
                    >
                      {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Granular Field Visibility Controls */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                      Toggle What To Show Publicly
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { key: 'photo' as const, label: 'Profile Photo' },
                        { key: 'nameAndTitle' as const, label: 'Name & Title' },
                        { key: 'bio' as const, label: 'Bio & About' },
                        { key: 'skills' as const, label: 'Skills Badges' },
                        { key: 'projects' as const, label: 'Projects' },
                        { key: 'socialLinks' as const, label: 'Social Links' },
                        { key: 'experience' as const, label: 'Experience' },
                        { key: 'education' as const, label: 'Education' },
                        { key: 'email' as const, label: 'Direct Email' },
                        { key: 'phone' as const, label: 'Phone Number' }
                      ].map((field) => {
                        const isChecked = sharingSettings[field.key] !== false;
                        return (
                          <button
                            key={field.key}
                            type="button"
                            onClick={() => toggleVisibilityField(field.key)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all text-left cursor-pointer ${
                              isChecked
                                ? 'bg-white dark:bg-white/10 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white shadow-2xs'
                                : 'bg-slate-100/50 dark:bg-black/20 border-slate-200/60 dark:border-white/5 text-slate-400 dark:text-white/40 opacity-70'
                            }`}
                          >
                            <span>{field.label}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isChecked
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                            }`}>
                              {isChecked ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Action Footer */}
          {/* Sticky Action Footer */}
          <div className="shrink-0 border-t border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#111319]/70 backdrop-blur-md z-20">
            {/* Inline confirmation checkbox */}
            <div className="px-3.5 sm:px-4 py-2.5 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/70 dark:bg-black/30">
              <label htmlFor="sliding-editor-confirm" className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  id="sliding-editor-confirm"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                />
                <span className="text-[11px] font-medium text-slate-700 dark:text-white/80 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  I confirm that all profile changes are accurate and ready to save.
                </span>
              </label>
            </div>

            <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Collapse
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${profile.slug || profile.id || initialProfile.slug || initialProfile.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="figma-pill-secondary py-2 px-3 text-xs font-bold flex items-center justify-center gap-1 shrink-0"
                  title="Open live public profile in a new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open Live</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSaving || !isConfirmed}
                  className="figma-pill-primary py-2 px-5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
