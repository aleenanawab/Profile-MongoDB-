'use client';

import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import {
  GripVertical,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  FileText,
  Code,
  FolderGit2,
  Briefcase,
  GraduationCap,
  Link2,
  Phone,
  Building2,
  Award,
  Sparkles,
  Globe,
  MessageSquare,
  CreditCard,
  Layers,
  CheckCircle2,
  Tag,
  Info
} from 'lucide-react';
import { SharingSettings } from '@/types/profile';

export interface ProfileSectionMeta {
  id: string;
  key: keyof SharingSettings;
  label: string;
  description: string;
  icon: React.ElementType;
}

export const ALL_PROFILE_SECTIONS: ProfileSectionMeta[] = [
  {
    id: 'about',
    key: 'bio',
    label: 'About & Bio',
    description: 'Personal summary, introduction & career philosophy',
    icon: FileText
  },
  {
    id: 'custom-fields',
    key: 'customFields',
    label: 'Custom Fields',
    description: 'Custom key-value attributes, details & public links',
    icon: Tag
  },
  {
    id: 'skills',
    key: 'skills',
    label: 'Skills & Badges',
    description: 'Technical competencies, tags & highlighted skills',
    icon: Code
  },
  {
    id: 'projects',
    key: 'projects',
    label: 'Projects & Portfolio',
    description: 'Featured case studies, repositories & live demos',
    icon: FolderGit2
  },
  {
    id: 'experience',
    key: 'experience',
    label: 'Work Experience',
    description: 'Career timeline, company roles & achievements',
    icon: Briefcase
  },
  {
    id: 'education',
    key: 'education',
    label: 'Education',
    description: 'Degrees, institutions, honors & academics',
    icon: GraduationCap
  },
  {
    id: 'socialLinks',
    key: 'socialLinks',
    label: 'Social & Web Links',
    description: 'LinkedIn, GitHub, Website & interactive channels',
    icon: Link2
  },
  {
    id: 'contact',
    key: 'contactInfo',
    label: 'Contact Information',
    description: 'Direct email, phone, office & messaging buttons',
    icon: Phone
  },
  {
    id: 'company',
    key: 'companySection',
    label: 'Company & Team',
    description: 'Organization info, brand badge & team roster',
    icon: Building2
  },
  {
    id: 'certifications',
    key: 'certifications',
    label: 'Certifications',
    description: 'Professional credentials, licenses & certificates',
    icon: Award
  },

  {
    id: 'languages',
    key: 'languages',
    label: 'Languages',
    description: 'Spoken, written and native language proficiencies',
    icon: Globe
  },
  {
    id: 'recommendations',
    key: 'recommendations',
    label: 'Recommendations',
    description: 'Client testimonials, reviews & peer endorsements',
    icon: MessageSquare
  },
  {
    id: 'virtual-card',
    key: 'nfcCard',
    label: 'Virtual Card & NFC',
    description: 'Digital identity pass preview and QR code pass',
    icon: CreditCard
  }
];

interface SectionCardProps {
  section: ProfileSectionMeta;
  index: number;
  total: number;
  isVisibleGroup: boolean;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SectionReorderCard({
  section,
  index,
  total,
  isVisibleGroup,
  onToggleVisibility,
  onMoveUp,
  onMoveDown
}: SectionCardProps) {
  const dragControls = useDragControls();
  const Icon = section.icon;

  return (
    <Reorder.Item
      value={section}
      id={section.id}
      dragListener={false}
      dragControls={dragControls}
      className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-150 flex items-center gap-2.5 sm:gap-3 select-none ${
        isVisibleGroup
          ? 'bg-white dark:bg-[#181B24] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-xs'
          : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/60 dark:border-white/5 opacity-75 hover:opacity-100'
      }`}
    >
      {/* Drag Handle */}
      <button
        type="button"
        onPointerDown={(e) => dragControls.start(e)}
        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-grab active:cursor-grabbing shrink-0 transition-colors"
        title="Drag to reorder"
        aria-label={`Drag to reorder ${section.label}`}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Accessible Step Up / Down Controls */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Move Up"
          aria-label={`Move ${section.label} up`}
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Move Down"
          aria-label={`Move ${section.label} down`}
        >
          <ArrowDown className="w-3 h-3" />
        </button>
      </div>

      {/* Numerical Sequence Index Badge for Visible items */}
      {isVisibleGroup && (
        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/10 text-[10px] font-mono font-bold flex items-center justify-center text-slate-600 dark:text-white/70 shrink-0">
          {index + 1}
        </div>
      )}

      {/* Section Icon */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
          isVisibleGroup
            ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border-slate-200 dark:border-white/10'
            : 'bg-slate-100/60 dark:bg-white/5 text-slate-400 dark:text-white/40 border-slate-200/50 dark:border-white/5'
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Section Title & Description */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <h4
            className={`text-xs font-bold truncate ${
              isVisibleGroup
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-white/60 line-through decoration-slate-300 dark:decoration-white/20'
            }`}
          >
            {section.label}
          </h4>
          {isVisibleGroup && (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 uppercase">
              Visible
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-white/40 line-clamp-1">
          {section.description}
        </p>
      </div>

      {/* Dynamic Eye Icon Action Button */}
      <button
        type="button"
        onClick={onToggleVisibility}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
          isVisibleGroup
            ? 'bg-slate-100 hover:bg-rose-50 dark:bg-white/10 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-white/80 dark:hover:text-rose-400 border border-slate-200 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-800'
            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
        }`}
        title={
          isVisibleGroup
            ? 'Click eye to hide section (move to Hidden Sections)'
            : 'Click eye to show section (move to Visible Sections)'
        }
        aria-label={
          isVisibleGroup
            ? `Hide ${section.label}`
            : `Show ${section.label}`
        }
      >
        {isVisibleGroup ? (
          <>
            <EyeOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Hide</span>
          </>
        ) : (
          <>
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px]">Show</span>
          </>
        )}
      </button>
    </Reorder.Item>
  );
}

export interface DynamicSectionGroupsProps {
  sectionOrder: string[];
  sharingSettings: SharingSettings;
  onSectionOrderChange: (newOrder: string[]) => void;
  onSharingSettingsChange: (newSettings: SharingSettings) => void;
  onInstantToggle: (sectionId: string, makeVisible: boolean) => void;
}

export function DynamicSectionGroups({
  sectionOrder,
  sharingSettings,
  onSectionOrderChange,
  onSharingSettingsChange,
  onInstantToggle
}: DynamicSectionGroupsProps) {
  // 1. Build canonical list of section definitions
  const allMap = new Map<string, ProfileSectionMeta>();
  ALL_PROFILE_SECTIONS.forEach((s) => allMap.set(s.id, s));

  // Determine active visible order
  const effectiveSectionOrder: string[] = [];
  (sectionOrder || []).forEach((id) => {
    if (allMap.has(id) && !effectiveSectionOrder.includes(id)) {
      effectiveSectionOrder.push(id);
    }
  });
  ALL_PROFILE_SECTIONS.forEach((s) => {
    if (!effectiveSectionOrder.includes(s.id)) {
      effectiveSectionOrder.push(s.id);
    }
  });

  // 2. Separate into Visible vs Hidden lists
  const visibleList: ProfileSectionMeta[] = [];
  const hiddenList: ProfileSectionMeta[] = [];

  effectiveSectionOrder.forEach((id) => {
    const sec = allMap.get(id);
    if (!sec) return;
    const isVisible = sharingSettings[sec.key] !== false;
    if (isVisible) {
      visibleList.push(sec);
    } else {
      hiddenList.push(sec);
    }
  });

  // Handlers for Visible Reordering (Drag & Drop)
  const handleReorderVisible = (newVisible: ProfileSectionMeta[]) => {
    const newVisibleIds = newVisible.map((s) => s.id);
    const hiddenIds = hiddenList.map((s) => s.id);
    const combinedOrder = [...newVisibleIds, ...hiddenIds];
    onSectionOrderChange(combinedOrder);
  };

  // Handlers for Hidden Reordering (Drag & Drop)
  const handleReorderHidden = (newHidden: ProfileSectionMeta[]) => {
    const visibleIds = visibleList.map((s) => s.id);
    const newHiddenIds = newHidden.map((s) => s.id);
    const combinedOrder = [...visibleIds, ...newHiddenIds];
    onSectionOrderChange(combinedOrder);
  };

  // Accessible move helpers
  const handleMoveVisible = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= visibleList.length) return;
    const copy = [...visibleList];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    handleReorderVisible(copy);
  };

  const handleMoveHidden = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= hiddenList.length) return;
    const copy = [...hiddenList];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    handleReorderHidden(copy);
  };

  // Toggle Visibility: Clicking eye immediately moves item between groups
  const handleToggle = (section: ProfileSectionMeta, currentlyVisible: boolean) => {
    onInstantToggle(section.id, !currentlyVisible);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Micro-Instructions Banner */}
      <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-start gap-2.5 text-xs text-slate-600 dark:text-white/70">
        <Layers className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Arrange your public profile layout. Drag sections to reorder them in either group. <strong>Click the eye icon</strong> on any section to immediately toggle it between <strong>Visible</strong> and <strong>Hidden</strong>.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. VISIBLE SECTIONS GROUP                                                 */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
              Visible Sections ({visibleList.length})
            </h3>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Active on Live Preview
          </span>
        </div>

        {visibleList.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50/50 dark:bg-white/[0.02] text-center space-y-1.5">
            <EyeOff className="w-6 h-6 mx-auto text-slate-400 dark:text-white/40" />
            <p className="text-xs font-bold text-slate-700 dark:text-white/80">
              All sections are currently hidden
            </p>
            <p className="text-[11px] text-slate-500 dark:text-white/50">
              Click the <Eye className="w-3 h-3 inline text-emerald-500 mx-0.5" /> icon on any section below to show it on your profile.
            </p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={visibleList}
            onReorder={handleReorderVisible}
            className="space-y-2"
          >
            {visibleList.map((sec, idx) => (
              <SectionReorderCard
                key={sec.id}
                section={sec}
                index={idx}
                total={visibleList.length}
                isVisibleGroup={true}
                onToggleVisibility={() => handleToggle(sec, true)}
                onMoveUp={() => handleMoveVisible(idx, 'up')}
                onMoveDown={() => handleMoveVisible(idx, 'down')}
              />
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. HIDDEN SECTIONS GROUP                                                  */}
      {/* ========================================================================= */}
      <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-white/40" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/50 font-mono">
              Hidden Sections ({hiddenList.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-white/40">
            Excluded from Public View
          </span>
        </div>

        {hiddenList.length === 0 ? (
          <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-white/[0.01] text-center">
            <p className="text-xs text-slate-400 dark:text-white/40 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              All sections are visible on your profile.
            </p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={hiddenList}
            onReorder={handleReorderHidden}
            className="space-y-2"
          >
            {hiddenList.map((sec, idx) => (
              <SectionReorderCard
                key={sec.id}
                section={sec}
                index={idx}
                total={hiddenList.length}
                isVisibleGroup={false}
                onToggleVisibility={() => handleToggle(sec, false)}
                onMoveUp={() => handleMoveHidden(idx, 'up')}
                onMoveDown={() => handleMoveHidden(idx, 'down')}
              />
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}
