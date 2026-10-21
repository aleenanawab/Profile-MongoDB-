'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  Code, 
  FolderGit2, 
  GraduationCap, 
  Phone, 
  Link2, 
  Briefcase, 
  EyeOff, 
  Eye, 
  Pencil, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Camera, 
  Check, 
  Loader2, 
  Lock, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink, 
  Bookmark, 
  Puzzle, 
  MoreVertical, 
  Sparkles, 
  Share2, 
  Tag,
  CreditCard,
  Building2,
  Mail,
  MapPin,
  Globe,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { 
  ProfileData, 
  ProjectItem, 
  ExperienceItem, 
  EducationItem, 
  CustomFieldItem 
} from '@/types/profile';
import { SUPABASE_DEFAULT_AVATAR } from '@/lib/supabase';
import { compressImageFile } from '@/lib/imageCompression';

// Stylized Avtive double-chevron "A" Logo
export function AvtiveLogoIcon({ className = 'w-5 h-5 text-white' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 19L12 4.5L19.5 19" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 19L12 11.5L16 19" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export interface DesktopWindowPreviewProps {
  profile: ProfileData;
  url?: string;
  onUpdateProfile: (updatedProfile: ProfileData) => void;
  onSave: () => Promise<any> | void;
  onNext?: () => void;
  onViewCard?: () => void;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
  activeSectionTarget?: { sectionKey: string; fieldKey?: string; timestamp: number } | null;
  isSaving?: boolean;
}

export function DesktopWindowPreview({
  profile,
  url,
  onUpdateProfile,
  onSave,
  onNext,
  onViewCard,
  onSelectSection,
  activeSectionTarget,
  isSaving = false
}: DesktopWindowPreviewProps) {
  const [activeNav, setActiveNav] = useState<string>('profile');
  const [newSkillText, setNewSkillText] = useState('');
  const [newCustomFieldLabel, setNewCustomFieldLabel] = useState('');
  const [newCustomFieldValue, setNewCustomFieldValue] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', tags: '', link: '', image: '' });
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Expanded state for accordion sections inside desktop window
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    profile: true,
    personalDetails: false,
    skills: false,
    projects: false,
    education: false,
    contactInfo: false,
    socialLinks: false,
    experience: false,
    hiddenSections: false,
    customFields: false
  });

  const toggleRow = (key: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setActiveNav(key);
  };

  // Scroll to and expand row when requested
  const scrollToRow = (key: string) => {
    setActiveNav(key);
    setExpandedRows(prev => ({ ...prev, [key]: true }));
    const el = document.getElementById(`desktop-row-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle section target from mobile preview interactions
  useEffect(() => {
    if (!activeSectionTarget) return;
    const keyMap: Record<string, string> = {
      hero: 'profile',
      basicInfo: 'profile',
      about: 'profile',
      profile: 'profile',
      personal: 'personalDetails',
      personalDetails: 'personalDetails',
      skills: 'skills',
      services: 'skills',
      projects: 'projects',
      portfolio: 'projects',
      education: 'education',
      socials: 'socialLinks',
      socialLinks: 'socialLinks',
      contact: 'contactInfo',
      contactInfo: 'contactInfo',
      customFields: 'customFields',
      'custom-fields': 'customFields',
      experience: 'experience',
      hiddenSections: 'hiddenSections'
    };
    const targetKey = keyMap[activeSectionTarget.sectionKey] || activeSectionTarget.sectionKey;
    if (targetKey) {
      scrollToRow(targetKey);
    }
  }, [activeSectionTarget]);

  // Section visibility helper
  const isSectionVisible = (key: string): boolean => {
    if (profile.sectionVisibility && typeof profile.sectionVisibility[key] === 'boolean') {
      return profile.sectionVisibility[key];
    }
    const sharing = profile.sharingSettings || {};
    switch (key) {
      case 'profile':
      case 'hero':
      case 'about': return sharing.bio !== false && sharing.nameAndTitle !== false;
      case 'personalDetails': return sharing.email !== false || sharing.phone !== false;
      case 'skills': return sharing.skills !== false;
      case 'projects': return sharing.projects !== false;
      case 'education': return sharing.education !== false;
      case 'contactInfo':
      case 'contact': return sharing.contactInfo !== false;
      case 'socialLinks':
      case 'socials': return sharing.socialLinks !== false;
      case 'experience': return sharing.experience !== false;
      case 'customFields':
      case 'custom-fields': return true;
      default: return true;
    }
  };

  // Toggle visibility of a section
  const handleToggleVisibility = (sectionKey: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const current = isSectionVisible(sectionKey);
    const nextVal = !current;

    const newVisibility = {
      ...(profile.sectionVisibility || {}),
      [sectionKey]: nextVal
    };

    // Keep sharingSettings in sync
    const newSharing = { ...(profile.sharingSettings || {}) };
    if (sectionKey === 'profile') {
      newSharing.nameAndTitle = nextVal;
      newSharing.bio = nextVal;
      newVisibility.hero = nextVal;
      newVisibility.about = nextVal;
    } else if (sectionKey === 'personalDetails') {
      newSharing.phone = nextVal;
      newSharing.email = nextVal;
    } else if (sectionKey === 'skills') {
      newSharing.skills = nextVal;
      newVisibility.skills = nextVal;
      newVisibility.services = nextVal;
    } else if (sectionKey === 'projects') {
      newSharing.projects = nextVal;
      newVisibility.projects = nextVal;
    } else if (sectionKey === 'education') {
      newSharing.education = nextVal;
      newVisibility.education = nextVal;
    } else if (sectionKey === 'contactInfo' || sectionKey === 'contact') {
      newSharing.contactInfo = nextVal;
      newVisibility.contact = nextVal;
    } else if (sectionKey === 'socialLinks') {
      newSharing.socialLinks = nextVal;
      newVisibility.socials = nextVal;
    } else if (sectionKey === 'experience') {
      newSharing.experience = nextVal;
      newVisibility.experience = nextVal;
    } else if (sectionKey === 'customFields') {
      newVisibility['custom-fields'] = nextVal;
    }

    onUpdateProfile({
      ...profile,
      sectionVisibility: newVisibility,
      sharingSettings: newSharing
    });
  };

  // Field change helper
  const handleFieldChange = (key: keyof ProfileData, value: any) => {
    onUpdateProfile({
      ...profile,
      [key]: value
    });
  };

  // Add skill
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillText.trim()) return;
    const current = Array.isArray(profile.skills)
      ? profile.skills.map(s => typeof s === 'string' ? s : s.name)
      : [];
    if (!current.includes(newSkillText.trim())) {
      onUpdateProfile({
        ...profile,
        skills: [...current, newSkillText.trim()]
      });
    }
    setNewSkillText('');
  };

  // Remove skill
  const handleRemoveSkill = (skillToRemove: string) => {
    const current = Array.isArray(profile.skills)
      ? profile.skills.map(s => typeof s === 'string' ? s : s.name)
      : [];
    onUpdateProfile({
      ...profile,
      skills: current.filter(s => s !== skillToRemove)
    });
  };

  // Add project
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    const item: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: newProject.title.trim(),
      description: newProject.description.trim(),
      tags: newProject.tags ? newProject.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      link: newProject.link.trim() || undefined,
      image: newProject.image.trim() || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop'
    };
    const current = profile.projects || [];
    onUpdateProfile({
      ...profile,
      projects: [...current, item]
    });
    setNewProject({ title: '', description: '', tags: '', link: '', image: '' });
    setIsAddingProject(false);
  };

  // Remove project
  const handleDeleteProject = (id: string) => {
    onUpdateProfile({
      ...profile,
      projects: (profile.projects || []).filter(p => p.id !== id)
    });
  };

  // Add Custom Field
  const handleAddCustomField = () => {
    if (!newCustomFieldLabel.trim()) return;
    const newField: CustomFieldItem = {
      id: `cf-${Date.now()}`,
      label: newCustomFieldLabel.trim(),
      value: newCustomFieldValue.trim(),
      type: 'text',
      visible: true,
      order: (profile.customFields || []).length
    };
    onUpdateProfile({
      ...profile,
      customFields: [...(profile.customFields || []), newField]
    });
    setNewCustomFieldLabel('');
    setNewCustomFieldValue('');
  };

  // Delete Custom Field
  const handleDeleteCustomField = (id: string) => {
    onUpdateProfile({
      ...profile,
      customFields: (profile.customFields || []).filter(f => f.id !== id)
    });
  };

  // Avatar upload
  const handleAvatarFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const { dataUrl } = await compressImageFile(file);
      handleFieldChange('avatar', dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          handleFieldChange('avatar', reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Cover upload
  const handleCoverFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const { dataUrl } = await compressImageFile(file);
      handleFieldChange('coverImage', dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          handleFieldChange('coverImage', reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const identifier = profile.slug || profile.id || '';
  const displayUrl = url || (identifier ? `https://avtive-profiles-d297.vercel.app/profile/${identifier}` : '');

  // Hidden sections count
  const allSectionKeys = ['profile', 'personalDetails', 'skills', 'projects', 'education', 'contactInfo', 'socialLinks', 'experience'];
  const hiddenCount = allSectionKeys.filter(k => !isSectionVisible(k)).length;

  return (
    <div className="w-full h-full flex flex-col font-sans select-none">
      
      {/* Outer Window Container with Realistic Shadow & Border */}
      <div className="w-full rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0A101D] shadow-xl shadow-slate-200/50 dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col flex-1 min-h-[720px] transition-all">
        
        {/* ========================================================================= */}
        {/* 1. BROWSER WINDOW CHROME & TAB BAR                                         */}
        {/* ========================================================================= */}
        <div className="bg-slate-100 dark:bg-[#0E1626] border-b border-slate-200 dark:border-slate-800/80 px-3 py-2 flex items-center justify-between gap-2 shrink-0 transition-colors">
          
          {/* Left: macOS 3 Window Control Dots + Tab */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mac-style Window Controls */}
            <div className="flex items-center gap-1.5 shrink-0 px-1">
              <span className="w-3 h-3 rounded-full bg-[#EF4444] border border-[#DC2626] shadow-xs cursor-pointer hover:opacity-80" />
              <span className="w-3 h-3 rounded-full bg-[#F59E0B] border border-[#D97706] shadow-xs cursor-pointer hover:opacity-80" />
              <span className="w-3 h-3 rounded-full bg-[#10B981] border border-[#059669] shadow-xs cursor-pointer hover:opacity-80" />
            </div>

            {/* Active Browser Tab */}
            <div className="flex items-center gap-2 bg-white dark:bg-[#131E33] border-t-2 border-t-blue-500 border-x border-slate-200 dark:border-slate-700/50 rounded-t-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white font-medium shadow-xs truncate max-w-[220px]">
              <AvtiveLogoIcon className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
              <span className="truncate">Avtive Profiles</span>
              <X className="w-3 h-3 text-slate-400 hover:text-slate-700 dark:hover:text-white ml-1 shrink-0 cursor-pointer" />
            </div>

            {/* New Tab Plus */}
            <button type="button" className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 p-1 rounded-md cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Window Controls (Minimize, Maximize, Close) */}
          <div className="hidden sm:flex items-center gap-3 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs px-2">
            <span className="cursor-pointer">—</span>
            <span className="cursor-pointer">□</span>
            <span className="cursor-pointer">✕</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. OMNIBOX / BROWSER ADDRESS BAR                                           */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 dark:bg-[#0B1220] border-b border-slate-200 dark:border-slate-800/80 px-3 py-2 flex items-center justify-between gap-2 shrink-0 transition-colors">
          
          {/* Navigation Controls: Back, Forward, Reload */}
          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            <button type="button" className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white cursor-pointer" title="Back">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button type="button" className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white cursor-pointer" title="Forward">
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button type="button" className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white cursor-pointer" title="Reload">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Centered URL Address Bar */}
          <div className="flex-1 max-w-2xl mx-auto flex items-center gap-2 bg-white dark:bg-[#131D2F] border border-slate-200 dark:border-slate-700/50 rounded-full px-3 py-1 text-xs text-slate-700 dark:text-slate-300 font-mono shadow-xs min-w-0">
            <Lock className="w-3 h-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="truncate text-[11px] text-slate-800 dark:text-slate-200">
              {displayUrl}
            </span>
          </div>

          {/* Right Utility Icons */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 shrink-0">
            <button type="button" className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white cursor-pointer" title="Bookmark">
              <Bookmark className="w-3.5 h-3.5" />
            </button>
            <button type="button" className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white cursor-pointer" title="Extensions">
              <Puzzle className="w-3.5 h-3.5" />
            </button>
            <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 shrink-0 ml-1">
              <img 
                src={profile.avatar || SUPABASE_DEFAULT_AVATAR} 
                alt="avatar" 
                onError={(e) => { e.currentTarget.src = SUPABASE_DEFAULT_AVATAR; }}
                className="w-full h-full object-cover" 
              />
            </div>
            <button type="button" className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white cursor-pointer">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. WINDOW WORKSPACE (LEFT SIDEBAR + MAIN EDITOR CANVAS)                    */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100 dark:bg-[#070C18] transition-colors">
          
          {/* ──────────────────────────────────────────────────────────────────────── */}
          {/* A. LEFT SIDEBAR (User Identity, Navigation Menu, Card Preview)           */}
          {/* ──────────────────────────────────────────────────────────────────────── */}
          <aside className="w-full md:w-60 xl:w-64 bg-white dark:bg-[#0B1322] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between p-3.5 sm:p-4 shrink-0 overflow-y-auto transition-colors">
            
            <div className="space-y-4">
              {/* Top Avtive Brand in Window */}
              <div className="flex items-center gap-2 px-1">
                <AvtiveLogoIcon className="w-5 h-5 text-slate-900 dark:text-white shrink-0" />
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white font-sans">
                  avtive
                </span>
              </div>

              {/* User Identity Snippet */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-[#111A2D] border border-slate-200 dark:border-slate-800/60 shadow-2xs">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500/40 shrink-0 bg-slate-200 dark:bg-slate-800">
                  <img 
                    src={profile.avatar || SUPABASE_DEFAULT_AVATAR} 
                    alt={profile.name || 'User'} 
                    onError={(e) => { e.currentTarget.src = SUPABASE_DEFAULT_AVATAR; }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {profile.name || ''}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {profile.professionalTitle || profile.designation || ''}
                  </p>
                </div>
              </div>

              {/* Navigation Menu (Matching Screenshot) */}
              <nav className="space-y-1">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'personalDetails', label: 'Personal Details', icon: User },
                  { id: 'skills', label: 'Skills', icon: SlidersHorizontal },
                  { id: 'projects', label: 'Projects', icon: FolderGit2 },
                  { id: 'education', label: 'Education', icon: GraduationCap },
                  { id: 'contactInfo', label: 'Contact Info', icon: Phone },
                  { id: 'socialLinks', label: 'Social Links', icon: Link2 },
                  { id: 'experience', label: 'Experience', icon: Briefcase },
                  { id: 'customFields', label: 'Custom Fields', icon: Tag },
                  { id: 'hiddenSections', label: 'Hidden Sections', icon: EyeOff, badge: hiddenCount > 0 ? `${hiddenCount}` : undefined }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToRow(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-[#182B48] dark:text-white font-bold shadow-2xs border dark:border-blue-500/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Card: "Preview your card" Widget (Matching Screenshot) */}
            <div className="pt-4 mt-auto">
              <div className="rounded-2xl p-3.5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#12223B] dark:to-[#0D1829] border border-slate-200 dark:border-blue-500/20 shadow-xs flex flex-col space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Preview your card
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      See how your profile looks as a digital business card.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onViewCard) onViewCard();
                    else scrollToRow('profile');
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-[#1B2F50] dark:hover:bg-[#223B64] text-[11px] font-bold border border-slate-900 dark:border-blue-500/30 transition-all text-center cursor-pointer shadow-xs active:scale-98"
                >
                  View Card
                </button>
              </div>
            </div>

          </aside>

          {/* ──────────────────────────────────────────────────────────────────────── */}
          {/* B. MAIN DESKTOP EDITOR CANVAS (Header + Section Cards List)             */}
          {/* ──────────────────────────────────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-[#070C18] p-4 sm:p-6 lg:p-7 space-y-5 transition-colors">
            
            {/* Main Header Bar (Matching Screenshot) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Edit Profile
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update your information and manage what others can see.
                </p>
              </div>

              {/* Action Buttons: Save Changes & Next */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Save changes to database"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className="px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 dark:bg-transparent dark:hover:bg-white/10 dark:text-white dark:border-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Next / Share profile"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Section Cards List (Matching the Screenshot Exactly) */}
            <div className="space-y-3">
              
              {/* ──────────────────────────────────────────────────────────────────── */}
              {/* 1. PROFILE SECTION ROW                                               */}
              {/* ──────────────────────────────────────────────────────────────────── */}
              <div 
                id="desktop-row-profile"
                className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D1527] hover:border-slate-300 dark:hover:border-slate-700/80 transition-all overflow-hidden shadow-xs"
              >
                <div 
                  onClick={() => toggleRow('profile')}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Profile</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Your name, title, bio and profile photo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleVisibility('profile', e)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSectionVisible('profile')
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700/40 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                      }`}
                      title="Toggle visibility of profile on public card"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSectionVisible('profile') ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{isSectionVisible('profile') ? 'Visible' : 'Hidden'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('profile'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('profile'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {expandedRows.profile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Inline Editing Controls */}
                {expandedRows.profile && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800/60 space-y-3.5 bg-slate-50/50 dark:bg-[#090F1C]/70">
                    
                    {/* Images: Cover & Avatar */}
                    <div className="flex items-center gap-4 pt-2">
                       <div className="relative group/av">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500/40 bg-slate-100 dark:bg-slate-800 shrink-0">
                          <img 
                            src={profile.avatar || SUPABASE_DEFAULT_AVATAR} 
                            alt="avatar" 
                            onError={(e) => { e.currentTarget.src = SUPABASE_DEFAULT_AVATAR; }}
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/av:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                          title="Change Avatar"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAvatarFile(file);
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">Profile Photo & Cover</span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Upload high-res avatar or cover photo</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="text-[10px] font-bold px-2 py-1 rounded-md bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 dark:bg-blue-600/20 dark:text-blue-400 dark:hover:bg-blue-600/30 border border-blue-500/30 cursor-pointer"
                          >
                            Upload Avatar
                          </button>
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700 cursor-pointer"
                          >
                            Change Cover
                          </button>
                          <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCoverFile(file);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Full Name & Title Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={profile.name || ''}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          placeholder="e.g. Aleena Nawab"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Professional Title</label>
                        <input
                          type="text"
                          value={profile.professionalTitle || profile.designation || ''}
                          onChange={(e) => {
                            handleFieldChange('professionalTitle', e.target.value);
                            handleFieldChange('designation', e.target.value);
                          }}
                          placeholder="e.g. Full Stack Engineer"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Short Bio */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Bio / Headline</label>
                      <textarea
                        rows={2}
                        value={profile.bio || profile.shortBio || ''}
                        onChange={(e) => {
                          handleFieldChange('bio', e.target.value);
                          handleFieldChange('shortBio', e.target.value);
                        }}
                        placeholder="Brief summary displayed at the top of your profile..."
                        className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ──────────────────────────────────────────────────────────────────── */}
              {/* 2. PERSONAL DETAILS ROW                                              */}
              {/* ──────────────────────────────────────────────────────────────────── */}
              <div 
                id="desktop-row-personalDetails"
                className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D1527] hover:border-slate-300 dark:hover:border-slate-700/80 transition-all overflow-hidden shadow-xs"
              >
                <div 
                  onClick={() => toggleRow('personalDetails')}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Personal Details</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Your basic information (name, phone, location, etc.)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleVisibility('personalDetails', e)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSectionVisible('personalDetails')
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700/40 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                      }`}
                      title="Toggle visibility"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSectionVisible('personalDetails') ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{isSectionVisible('personalDetails') ? 'Visible' : 'Hidden'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('personalDetails'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('personalDetails'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {expandedRows.personalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedRows.personalDetails && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800/60 space-y-3 bg-slate-50/50 dark:bg-[#090F1C]/70">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={profile.email || ''}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          placeholder="email@domain.com"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={profile.phone || ''}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          placeholder="+1 555 123 4567"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Location / City</label>
                        <input
                          type="text"
                          value={profile.location || ''}
                          onChange={(e) => handleFieldChange('location', e.target.value)}
                          placeholder="San Francisco, CA"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Company / Organization</label>
                        <input
                          type="text"
                          value={profile.company || ''}
                          onChange={(e) => handleFieldChange('company', e.target.value)}
                          placeholder="Avtive Corp"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ──────────────────────────────────────────────────────────────────── */}
              {/* 3. SKILLS ROW                                                        */}
              {/* ──────────────────────────────────────────────────────────────────── */}
              <div 
                id="desktop-row-skills"
                className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D1527] hover:border-slate-300 dark:hover:border-slate-700/80 transition-all overflow-hidden shadow-xs"
              >
                <div 
                  onClick={() => toggleRow('skills')}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Skills</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Technologies and tools you work with</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleVisibility('skills', e)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSectionVisible('skills')
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700/40 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSectionVisible('skills') ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{isSectionVisible('skills') ? 'Visible' : 'Hidden'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('skills'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('skills'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {expandedRows.skills ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedRows.skills && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800/60 space-y-3 bg-slate-50/50 dark:bg-[#090F1C]/70">
                    <form onSubmit={handleAddSkill} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newSkillText}
                        onChange={(e) => setNewSkillText(e.target.value)}
                        placeholder="Add skill (e.g. Next.js, TypeScript, Figma)..."
                        className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </form>

                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(profile.skills) ? profile.skills : []).map((s) => {
                        const name = typeof s === 'string' ? s : s.name;
                        return (
                          <span
                            key={name}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#111A2D] border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-800 dark:text-slate-200"
                          >
                            <span>{name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(name)}
                              className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ──────────────────────────────────────────────────────────────────── */}
              {/* 4. PROJECTS ROW                                                      */}
              {/* ──────────────────────────────────────────────────────────────────── */}
              <div 
                id="desktop-row-projects"
                className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D1527] hover:border-slate-300 dark:hover:border-slate-700/80 transition-all overflow-hidden shadow-xs"
              >
                <div 
                  onClick={() => toggleRow('projects')}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Projects</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Your featured projects and work samples</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleVisibility('projects', e)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSectionVisible('projects')
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700/40 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSectionVisible('projects') ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{isSectionVisible('projects') ? 'Visible' : 'Hidden'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('projects'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('projects'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {expandedRows.projects ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedRows.projects && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800/60 space-y-3 bg-slate-50/50 dark:bg-[#090F1C]/70">
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Project Showcase ({(profile.projects || []).length})</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingProject(!isAddingProject)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Project</span>
                      </button>
                    </div>

                    {/* Inline Add Form */}
                    {isAddingProject && (
                      <form onSubmit={handleSaveProject} className="p-3 rounded-xl bg-slate-50 dark:bg-[#111A2D] border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <input
                          type="text"
                          value={newProject.title}
                          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                          placeholder="Project Title"
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          required
                        />
                        <textarea
                          rows={2}
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                          placeholder="Project Description"
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newProject.tags}
                            onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                            placeholder="Tags (comma separated)"
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                          <input
                            type="url"
                            value={newProject.link}
                            onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                            placeholder="https://..."
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingProject(false)}
                            className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2 py-1"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="text-xs font-bold px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                          >
                            Save Project
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Project List */}
                    <div className="space-y-2">
                      {(profile.projects || []).map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={p.image || p.coverImage || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=200&auto=format&fit=crop'} 
                              alt={p.title} 
                              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=200&auto=format&fit=crop'; }}
                              className="w-8 h-8 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0" 
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.title}</h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{p.description}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-500"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ──────────────────────────────────────────────────────────────────── */}
              {/* 5. EDUCATION ROW                                                     */}
              {/* ──────────────────────────────────────────────────────────────────── */}
              <div 
                id="desktop-row-education"
                className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D1527] hover:border-slate-300 dark:hover:border-slate-700/80 transition-all overflow-hidden shadow-xs"
              >
                <div 
                  onClick={() => toggleRow('education')}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-500 dark:text-violet-400 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Education</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Your academic background</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleVisibility('education', e)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSectionVisible('education')
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700/40 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSectionVisible('education') ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{isSectionVisible('education') ? 'Visible' : 'Hidden'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('education'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('education'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {expandedRows.education ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedRows.education && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800/60 space-y-3 bg-slate-50/50 dark:bg-[#090F1C]/70">
                    <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">Academic background & qualifications</p>
                    {(profile.education || []).map((edu, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="font-bold text-slate-900 dark:text-white">{edu.institution}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">{edu.degree} {edu.period ? `· ${edu.period}` : edu.year ? `· ${edu.year}` : ''}</div>
                      </div>
                    ))}
                    {(!profile.education || profile.education.length === 0) && (
                      <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">
                        No education records yet.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ──────────────────────────────────────────────────────────────────── */}
              {/* 6. CONTACT INFO ROW                                                  */}
              {/* ──────────────────────────────────────────────────────────────────── */}
              <div 
                id="desktop-row-contactInfo"
                className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D1527] hover:border-slate-300 dark:hover:border-slate-700/80 transition-all overflow-hidden shadow-xs"
              >
                <div 
                  onClick={() => toggleRow('contactInfo')}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Contact Info</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Your email, phone and location details</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleVisibility('contactInfo', e)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSectionVisible('contactInfo')
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700/40 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSectionVisible('contactInfo') ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{isSectionVisible('contactInfo') ? 'Visible' : 'Hidden'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('contactInfo'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('contactInfo'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {expandedRows.contactInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedRows.contactInfo && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800/60 space-y-3 bg-slate-50/50 dark:bg-[#090F1C]/70">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Public Email</label>
                        <input
                          type="email"
                          value={profile.email || ''}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          placeholder="public@domain.com"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">WhatsApp / Phone</label>
                        <input
                          type="tel"
                          value={profile.whatsapp || profile.phone || ''}
                          onChange={(e) => {
                            handleFieldChange('whatsapp', e.target.value);
                            handleFieldChange('phone', e.target.value);
                          }}
                          placeholder="+1 555 000 1234"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ──────────────────────────────────────────────────────────────────── */}
              {/* 7. SOCIAL LINKS ROW                                                  */}
              {/* ──────────────────────────────────────────────────────────────────── */}
              <div 
                id="desktop-row-socialLinks"
                className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D1527] hover:border-slate-300 dark:hover:border-slate-700/80 transition-all overflow-hidden shadow-xs"
              >
                <div 
                  onClick={() => toggleRow('socialLinks')}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Social Links</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Your social media and professional links</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleVisibility('socialLinks', e)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSectionVisible('socialLinks')
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700/40 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSectionVisible('socialLinks') ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{isSectionVisible('socialLinks') ? 'Visible' : 'Hidden'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('socialLinks'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('socialLinks'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {expandedRows.socialLinks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedRows.socialLinks && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800/60 space-y-3 bg-slate-50/50 dark:bg-[#090F1C]/70">
                    <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">Direct portfolio links & platforms</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Website</label>
                        <input
                          type="url"
                          value={profile.website || ''}
                          onChange={(e) => handleFieldChange('website', e.target.value)}
                          placeholder="https://..."
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">LinkedIn Profile</label>
                        <input
                          type="url"
                          value={(profile.socials || []).find(s => s.platform === 'linkedin')?.url || ''}
                          onChange={(e) => {
                            const other = (profile.socials || []).filter(s => s.platform !== 'linkedin');
                            handleFieldChange('socials', [...other, { platform: 'linkedin', url: e.target.value }]);
                          }}
                          placeholder="https://linkedin.com/in/..."
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">GitHub Profile</label>
                        <input
                          type="url"
                          value={(profile.socials || []).find(s => s.platform === 'github')?.url || ''}
                          onChange={(e) => {
                            const other = (profile.socials || []).filter(s => s.platform !== 'github');
                            handleFieldChange('socials', [...other, { platform: 'github', url: e.target.value }]);
                          }}
                          placeholder="https://github.com/..."
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Twitter / X</label>
                        <input
                          type="url"
                          value={(profile.socials || []).find(s => s.platform === 'twitter')?.url || ''}
                          onChange={(e) => {
                            const other = (profile.socials || []).filter(s => s.platform !== 'twitter');
                            handleFieldChange('socials', [...other, { platform: 'twitter', url: e.target.value }]);
                          }}
                          placeholder="https://x.com/..."
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ──────────────────────────────────────────────────────────────────── */}
              {/* 8. EXPERIENCE ROW                                                    */}
              {/* ──────────────────────────────────────────────────────────────────── */}
              <div 
                id="desktop-row-experience"
                className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D1527] hover:border-slate-300 dark:hover:border-slate-700/80 transition-all overflow-hidden shadow-xs"
              >
                <div 
                  onClick={() => toggleRow('experience')}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Experience</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Your work experience and roles</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleVisibility('experience', e)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSectionVisible('experience')
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700/40 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSectionVisible('experience') ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{isSectionVisible('experience') ? 'Visible' : 'Hidden'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('experience'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('experience'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {expandedRows.experience ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedRows.experience && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800/60 space-y-3 bg-slate-50/50 dark:bg-[#090F1C]/70">
                    <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">Career timeline and organizations</p>
                    {(profile.experiences || profile.experience || []).map((exp, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="font-bold text-slate-900 dark:text-white">{exp.role || 'Role'}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">{exp.company} {exp.period ? `· ${exp.period}` : ''}</div>
                      </div>
                    ))}
                    {(!profile.experiences || profile.experiences.length === 0) && (
                      <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">
                        No experience records yet.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ──────────────────────────────────────────────────────────────────── */}
              {/* 9. CUSTOM FIELDS ROW                                                 */}
              {/* ──────────────────────────────────────────────────────────────────── */}
              <div 
                id="desktop-row-customFields"
                className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D1527] hover:border-slate-300 dark:hover:border-slate-700/80 transition-all overflow-hidden shadow-xs"
              >
                <div 
                  onClick={() => toggleRow('customFields')}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Custom Fields</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Custom titled fields and links ({(profile.customFields || []).length})</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleVisibility('customFields', e)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSectionVisible('customFields')
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700/40 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSectionVisible('customFields') ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{isSectionVisible('customFields') ? 'Visible' : 'Hidden'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('customFields'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow('customFields'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {expandedRows.customFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedRows.customFields && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800/60 space-y-3 bg-slate-50/50 dark:bg-[#090F1C]/70">
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <input
                        type="text"
                        value={newCustomFieldLabel}
                        onChange={(e) => setNewCustomFieldLabel(e.target.value)}
                        placeholder="Field Title (e.g. Publications, Office Hours)"
                        className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-purple-500"
                      />
                      <input
                        type="text"
                        value={newCustomFieldValue}
                        onChange={(e) => setNewCustomFieldValue(e.target.value)}
                        placeholder="Field Content or Link"
                        className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-300 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomField}
                        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(profile.customFields || []).map((f) => (
                        <div key={f.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#111A2D] border border-slate-200 dark:border-slate-800 text-xs">
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white block">{f.label}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate block">{f.value || (f as any).content}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomField(f.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ──────────────────────────────────────────────────────────────────── */}
              {/* 10. HIDDEN SECTIONS ROW (Matching Screenshot)                        */}
              {/* ──────────────────────────────────────────────────────────────────── */}
              <div 
                id="desktop-row-hiddenSections"
                className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D1527] hover:border-slate-300 dark:hover:border-slate-700/80 transition-all overflow-hidden shadow-xs"
              >
                <div 
                  onClick={() => toggleRow('hiddenSections')}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700/20 border border-slate-200 dark:border-slate-700/30 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                      <EyeOff className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Hidden Sections</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Sections that are hidden from your profile</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{hiddenCount > 0 ? `${hiddenCount} Hidden` : 'None'}</span>
                    </span>

                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      {expandedRows.hiddenSections ? <ChevronUp className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedRows.hiddenSections && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800/60 space-y-2.5 bg-slate-50/50 dark:bg-[#090F1C]/70">
                    <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
                      Click any hidden section below to restore it to your public card:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { key: 'profile', name: 'Profile' },
                        { key: 'personalDetails', name: 'Personal Details' },
                        { key: 'skills', name: 'Skills' },
                        { key: 'projects', name: 'Projects' },
                        { key: 'education', name: 'Education' },
                        { key: 'contactInfo', name: 'Contact Info' },
                        { key: 'socialLinks', name: 'Social Links' },
                        { key: 'experience', name: 'Experience' },
                        { key: 'customFields', name: 'Custom Fields' }
                      ].map((item) => {
                        const visible = isSectionVisible(item.key);
                        return (
                          <div 
                            key={item.key} 
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                              visible 
                                ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/40 text-slate-400 dark:text-slate-500 opacity-60' 
                                : 'bg-white dark:bg-[#111A2D] border-blue-400/40 dark:border-blue-500/30 text-slate-900 dark:text-white shadow-xs'
                            }`}
                          >
                            <span className="font-semibold">{item.name}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(item.key)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${
                                visible
                                  ? 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                                  : 'bg-blue-600 text-white hover:bg-blue-500'
                              }`}
                            >
                              {visible ? 'Hide' : 'Unhide'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
