'use client';

import React from 'react';
import Link from 'next/link';
import { Reorder } from 'framer-motion';
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
  Eye,
  EyeOff, 
  UserCheck, 
  Archive, 
  ShieldCheck, 
  Settings,
  ExternalLink,
  Save,
  Loader2,
  GripVertical,
  X,
  Users,
  Building2,
  Award,
  Globe,
  Tag,
  Layers,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { useProfileEditor } from '@/context/ProfileEditorContext';
import { AvtiveLogoIcon } from '@/components/DesktopWindowPreview';
import { ProfileSwitcher } from '@/components/profiles/ProfileSwitcher';

export interface SidebarSectionItem {
  key: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  category?: 'core' | 'advanced' | 'system';
}

export const DESKTOP_SIDEBAR_SECTIONS: SidebarSectionItem[] = [
  // 1-13: Core Profile Sections
  { key: 'profile', label: 'Profile', icon: User, category: 'core' },
  { key: 'companyInfo', label: 'Company Info', icon: Building2, category: 'core' },
  { key: 'teamMembers', label: 'Team Members', icon: Users, category: 'core' },
  { key: 'personalDetails', label: 'Personal Details', icon: FileText, category: 'core' },
  { key: 'contactInfo', label: 'Contact Info', icon: Phone, category: 'core' },
  { key: 'skills', label: 'Skills & Services', icon: Code, category: 'core' },
  { key: 'projects', label: 'Projects', icon: FolderGit2, category: 'core' },
  { key: 'customFields', label: 'Custom Fields', icon: Layers, category: 'core' },
  { key: 'experience', label: 'Experience', icon: Briefcase, category: 'core' },
  { key: 'education', label: 'Education', icon: GraduationCap, category: 'core' },
  { key: 'expertise', label: 'Expertise', icon: Award, category: 'core' },
  { key: 'certifications', label: 'Certifications', icon: CheckCircle2, category: 'core' },
  { key: 'languages', label: 'Languages', icon: Globe, category: 'core' },
  { key: 'socialLinks', label: 'Social Links', icon: Link2, category: 'core' },
  
  // 14-17: Advanced Management
  { key: 'enhanceProfile', label: 'Enhance Profile', icon: Sparkles, category: 'advanced' },
  { key: 'limitations', label: 'Limitations', icon: EyeOff, category: 'advanced' },
  { key: 'accountInfo', label: 'Account Info', icon: UserCheck, category: 'advanced' },
  { key: 'archive', label: 'Archive', icon: Archive, category: 'advanced' },
  
  // 18-19: Security & Settings
  { key: 'security', label: 'Security', icon: ShieldCheck, category: 'system' },
  { key: 'settings', label: 'Settings', icon: Settings, category: 'system' }
];

export interface DesktopProfileSidebarProps {
  onClose?: () => void;
  onSelectSection?: (sectionKey: string) => void;
  isPublicView?: boolean;
}

export function DesktopProfileSidebar({ 
  onClose,
  onSelectSection,
  isPublicView = false 
}: DesktopProfileSidebarProps) {
  const { 
    profile, 
    activeSection, 
    setActiveSection, 
    isSaving, 
    saveProfile, 
    currentIdentifier,
    userProfiles,
    handleSwitchPersona,
    sectionOrder,
    setSectionOrder,
    sectionVisibility,
    handleToggleSectionVisibility
  } = useProfileEditor();

  const skillsCount = Array.isArray(profile.skills) ? profile.skills.length : 0;
  const projectsCount = Array.isArray(profile.projects) ? profile.projects.length : 0;
  
  // Count hidden sections for Archive badge
  const hiddenCount = sectionVisibility 
    ? Object.values(sectionVisibility).filter(v => v === false).length 
    : 0;

  const customFieldsCount = Array.isArray(profile.customFields) ? profile.customFields.length : 0;

  const isCompany = profile.type === 'team';

  const getSectionBadge = (key: string) => {
    switch (key) {
      case 'skills':
        return skillsCount > 0 ? skillsCount : undefined;
      case 'projects':
        return projectsCount > 0 ? projectsCount : undefined;
      case 'teamMembers':
        return Array.isArray(profile.teamMembers) && profile.teamMembers.length > 0 
          ? `${profile.teamMembers.length} members` 
          : undefined;
      case 'companyInfo':
        return profile.company ? 'Configured' : undefined;
      case 'archive':
        return hiddenCount > 0 ? `${hiddenCount} hidden` : undefined;
      case 'enhanceProfile':
      case 'customFields':
        return customFieldsCount > 0 ? `${customFieldsCount} fields` : undefined;
      case 'certifications':
        return Array.isArray(profile.certifications) && profile.certifications.length > 0 ? profile.certifications.length : undefined;
      case 'languages':
        return Array.isArray(profile.languages) && profile.languages.length > 0 ? profile.languages.length : undefined;
      default:
        return undefined;
    }
  };

  // Build sorted core sections list based on shared sectionOrder and role
  const coreSections = React.useMemo(() => {
    return DESKTOP_SIDEBAR_SECTIONS.filter(s => {
      if (s.category !== 'core') return false;
      if (s.key === 'recommendations') return false;
      if (!isCompany && (s.key === 'teamMembers' || s.key === 'companyInfo')) return false;
      if (isCompany && (s.key === 'personalDetails' || s.key === 'experience' || s.key === 'education' || s.key === 'certifications' || s.key === 'languages')) return false;
      return true;
    });
  }, [isCompany]);
  const orderedCoreSections = React.useMemo(() => {
    if (!sectionOrder || sectionOrder.length === 0) return coreSections;
    
    // Key mapping for variations in naming
    const normalizeKey = (k: string) => {
      if (k === 'about') return 'personalDetails';
      if (k === 'contact') return 'contactInfo';
      if (k === 'services') return 'skills';
      if (k === 'custom-fields') return 'customFields';
      return k;
    };

    const ordered: SidebarSectionItem[] = [];
    // First, add sections in sectionOrder
    for (const key of sectionOrder) {
      const norm = normalizeKey(key);
      const found = coreSections.find(s => s.key === norm || s.key === key);
      if (found && !ordered.some(o => o.key === found.key)) {
        ordered.push(found);
      }
    }
    // Then add any remaining core sections
    for (const sec of coreSections) {
      if (!ordered.some(o => o.key === sec.key)) {
        ordered.push(sec);
      }
    }
    return ordered;
  }, [sectionOrder, coreSections]);

  // Handle Drag & Drop reorder
  const handleReorderCore = (newItems: SidebarSectionItem[]) => {
    const newCoreKeys = newItems.map(item => item.key);
    // Preserve any non-core sections that were in sectionOrder
    const nonCoreKeys = (sectionOrder || []).filter(k => !coreSections.some(c => c.key === k));
    const mergedOrder = [...newCoreKeys, ...nonCoreKeys];
    setSectionOrder(mergedOrder);
  };

  return (
    <aside className="w-[min(320px,100%)] max-w-full sm:w-[300px] xl:w-[330px] shrink-0 h-full min-h-0 bg-white dark:bg-[#080D1A] border-r border-slate-200 dark:border-white/10 flex flex-col select-none relative z-30 shadow-2xl transition-colors overflow-hidden">
      
      {/* 1. Header with Avtive Branding & Close Button */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
        <Link 
          href={`/profile/${currentIdentifier}`} 
          className="flex items-center gap-2.5 group"
          title="Return to Public Profile"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C4CF1] to-cyan-500 flex items-center justify-center shadow-md shadow-[#6C4CF1]/25 group-hover:scale-105 transition-transform">
            <AvtiveLogoIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">avtive</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#6C4CF1]/15 text-[#6C4CF1] dark:text-[#a594fd] font-mono font-bold border border-[#6C4CF1]/30">
                {isPublicView ? 'SECTIONS' : 'STUDIO'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {isPublicView ? 'Profile Navigation' : 'Desktop Profile Editor'}
            </span>
          </div>
        </Link>

        {/* Close Button for Slide-In Panel */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation panel"
            title="Close panel"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. User Profile Summary Card / Persona Switcher */}
      <div className="px-3.5 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full border-2 border-[#6C4CF1]/40 overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 shadow-sm">
            <img 
              src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'} 
              alt={profile.name}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';
              }}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#080D1A]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {profile.name || 'Your Profile'}
              </h3>
              {userProfiles && userProfiles.length > 1 && (
                <ProfileSwitcher 
                  currentProfileIdOrSlug={currentIdentifier}
                  initialProfiles={userProfiles}
                  onSelectProfile={handleSwitchPersona}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {profile.professionalTitle || profile.designation || 'Professional'}
              </p>
              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-[#6C4CF1]/10 text-[#6C4CF1] dark:text-[#a594fd] border border-[#6C4CF1]/20 font-mono">
                Professional Plan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Navigation List with Drag-and-Drop & Visibility Toggles */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2.5 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
        
        {/* Group 1: Core Profile Sections with Drag & Drop Reordering */}
        <div>
          <div className="flex items-center justify-between px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            <span>{isPublicView ? 'Profile Sections' : 'Section Navigation'}</span>
            {!isPublicView && <span className="text-[9px] text-[#6C4CF1]/80 lowercase">drag to reorder</span>}
          </div>

          <Reorder.Group 
            axis="y" 
            values={orderedCoreSections} 
            onReorder={handleReorderCore} 
            className="space-y-1"
          >
            {orderedCoreSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.key;
              const isVisible = sectionVisibility[sec.key] !== false && sectionVisibility[sec.key === 'personalDetails' ? 'about' : sec.key === 'contactInfo' ? 'contact' : sec.key] !== false;
              if (isPublicView && !isVisible) return null;
              const badge = getSectionBadge(sec.key);

              return (
                <Reorder.Item
                  key={sec.key}
                  value={sec}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-xs font-semibold transition-all relative select-none group ${
                    isActive
                      ? 'bg-cyan-50 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-blue-500/10 border border-cyan-400/50 dark:border-cyan-500/40 text-cyan-950 dark:text-white font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-sm shadow-cyan-400/80" />
                  )}
                  
                  {/* Drag Handle */}
                  {!isPublicView && (
                    <div 
                      title="Drag to reorder"
                      aria-label={`Drag to reorder ${sec.label}`}
                      className="p-1 text-slate-400 hover:text-cyan-600 dark:text-slate-600 dark:hover:text-cyan-400 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Section Label & Click Target */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection(sec.key);
                      onSelectSection?.(sec.key);
                    }}
                    className="flex-1 flex items-center gap-2 min-w-0 px-1 py-0.5 text-left cursor-pointer"
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200'
                    }`} />
                    <span className={`truncate text-xs ${!isVisible ? 'line-through text-slate-400 dark:text-slate-600' : ''}`}>
                      {sec.label}
                    </span>
                  </button>

                  {/* Badge & Visibility Toggle */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {badge !== undefined && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                        isActive 
                          ? 'bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-500/30 dark:text-cyan-200 dark:border-cyan-400/30' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10'
                      }`}>
                        {badge}
                      </span>
                    )}

                    {/* Show / Hide Eye Icon */}
                    {!isPublicView && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSectionVisibility(sec.key);
                          if (sec.key === 'personalDetails') handleToggleSectionVisibility('about');
                          if (sec.key === 'contactInfo') handleToggleSectionVisibility('contact');
                          if (sec.key === 'customFields') handleToggleSectionVisibility('custom-fields');
                        }}
                        title={isVisible ? `Hide ${sec.label}` : `Show ${sec.label}`}
                        aria-label={isVisible ? `Hide ${sec.label}` : `Show ${sec.label}`}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {isVisible ? (
                          <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400" />
                        )}
                      </button>
                    )}
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>

        {/* Group 2: Advanced Profile Tools */}
        {!isPublicView && (
          <div>
            <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Management & Enhancements
            </div>
            {DESKTOP_SIDEBAR_SECTIONS.filter(s => s.category === 'advanced').map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.key;
              const badge = getSectionBadge(sec.key);
              const isVisible = sectionVisibility[sec.key] !== false;

              return (
                <div
                  key={sec.key}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-cyan-50 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-blue-500/10 border border-cyan-400/50 dark:border-cyan-500/40 text-cyan-950 dark:text-white font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-sm shadow-cyan-400/80" />
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection(sec.key);
                      onSelectSection?.(sec.key);
                    }}
                    className="flex-1 flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'
                    }`} />
                    <span className="truncate text-xs">{sec.label}</span>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {badge !== undefined && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                        isActive 
                          ? 'bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-500/30 dark:text-cyan-200 dark:border-cyan-400/30' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10'
                      }`}>
                        {badge}
                      </span>
                    )}

                    {sec.key === 'enhanceProfile' && (
                      <button
                        type="button"
                        onClick={() => handleToggleSectionVisibility('customFields')}
                        title={isVisible ? "Hide custom fields" : "Show custom fields"}
                        aria-label="Toggle custom fields visibility"
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {isVisible ? (
                          <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Group 3: System & Security */}
        {!isPublicView && (
          <div>
            <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              System & Security
            </div>
            {DESKTOP_SIDEBAR_SECTIONS.filter(s => s.category === 'system').map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.key;

              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => {
                    setActiveSection(sec.key);
                    onSelectSection?.(sec.key);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative cursor-pointer text-left ${
                    isActive
                      ? 'bg-cyan-50 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-blue-500/10 border border-cyan-400/50 dark:border-cyan-500/40 text-cyan-950 dark:text-white font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-sm shadow-cyan-400/80" />
                  )}
                  
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'
                    }`} />
                    <span className="truncate text-xs">{sec.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* 4. Bottom Sticky Action Footer - Stitch style */}
      {!isPublicView && (
        <div className="p-3.5 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#080D1A] space-y-2 shrink-0 transition-colors">
          <button
            type="button"
            onClick={() => saveProfile()}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#6C4CF1] hover:bg-[#5b3de0] text-white shadow-md shadow-[#6C4CF1]/25 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>

          <Link
            href={`/profile/${currentIdentifier}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors shadow-2xs"
            title="Open Public Card in New Tab"
          >
            <ExternalLink className="w-3 h-3 text-[#6C4CF1] dark:text-cyan-400" />
            <span>View Public Profile</span>
          </Link>
        </div>
      )}

    </aside>
  );
}
