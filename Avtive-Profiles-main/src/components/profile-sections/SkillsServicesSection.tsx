'use client';

import React from 'react';
import { Plus, X, Pencil, Pin, ChevronUp, ChevronDown, Sparkles, Code } from 'lucide-react';
import { ProfileData, ServiceItem, SkillItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { FormLabel, FormInput, FormTextarea, SectionSaveBar } from '@/components/ui/formControls';
import { SearchableCombobox } from '@/components/forms/SearchableCombobox';
import { POPULAR_SKILLS } from '@/data/skillsDataset';

export interface SkillsSectionProps {
  profile: ProfileData;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
  theme?: ThemeConfig;
}

export interface ServicesSectionProps {
  profile: ProfileData;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onInquireService?: (service: ServiceItem) => void;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
  theme?: ThemeConfig;
}

export interface SkillsServicesSectionProps extends SkillsSectionProps {
  onInquireService?: (service: ServiceItem) => void;
}

const normalizeSkillItems = (rawSkills?: any[]): SkillItem[] => {
  if (!Array.isArray(rawSkills)) return [];
  return rawSkills
    .map((s, idx): SkillItem => {
      if (typeof s === 'string') {
        return {
          id: `skill-${idx}-${Date.now()}`,
          name: s.trim(),
          category: 'Industry Knowledge',
          level: 'Intermediate',
          pinned: false
        };
      }
      return {
        id: s?.id || `skill-${idx}`,
        name: s?.name || '',
        category: s?.category || 'Industry Knowledge',
        level: s?.level || 'Intermediate',
        pinned: Boolean(s?.pinned)
      };
    })
    .filter((s) => typeof s.name === 'string' && s.name.trim().length > 0);
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. INDEPENDENT SKILLS SECTION
// ─────────────────────────────────────────────────────────────────────────────
export function SkillsSection({
  profile,
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSavePartial,
  onSelectSection,
  theme = getThemeConfig(profile.theme || 'editorial')
}: SkillsSectionProps) {
  const [skillsDraft, setSkillsDraft] = React.useState<SkillItem[]>(() => normalizeSkillItems(profile.skills));
  const [snapshot, setSnapshot] = React.useState<SkillItem[]>(() => normalizeSkillItems(profile.skills));
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  React.useEffect(() => {
    const nextSkills = normalizeSkillItems(profile.skills);
    setSkillsDraft(nextSkills);
    setSnapshot(nextSkills);
  }, [profile.id, profile.skills]);

  const isDirty = JSON.stringify(skillsDraft) !== JSON.stringify(snapshot);

  const updateSkills = (next: SkillItem[]) => {
    setSkillsDraft(next);
    onUpdateField?.('skills', next);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = { skills: skillsDraft };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      onUpdateField?.('skills', skillsDraft);
      setSnapshot(skillsDraft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save skills');
    }
  };

  const handleCancel = () => {
    setSkillsDraft(snapshot);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  const hasSkills = skillsDraft.length > 0;
  if (!hasSkills && !canEdit && !isEditing) {
    return null;
  }

  const handleAddSkillFromCombobox = (selectedSkill: string | string[]) => {
    if (!selectedSkill || typeof selectedSkill !== 'string') return;
    const trimmed = selectedSkill.trim();
    if (!trimmed) return;
    if (skillsDraft.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;

    const newSkill: SkillItem = {
      id: `skill-${Date.now()}`,
      name: trimmed,
      category: 'Industry Knowledge',
      level: 'Intermediate',
      pinned: skillsDraft.filter((s) => s.pinned).length < 3
    };
    updateSkills([...skillsDraft, newSkill]);
  };

  const handleRemoveSkill = (index: number) => {
    updateSkills(skillsDraft.filter((_, idx) => idx !== index));
  };

  const handleUpdateSkill = (index: number, updates: Partial<SkillItem>) => {
    updateSkills(skillsDraft.map((s, idx) => (idx === index ? { ...s, ...updates } : s)));
  };

  const handleMoveSkill = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= skillsDraft.length) return;
    const copy = [...skillsDraft];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    updateSkills(copy);
  };

  const handleTogglePinSkill = (index: number) => {
    const item = skillsDraft[index];
    const currentPinnedCount = skillsDraft.filter((s) => s.pinned).length;
    if (!item.pinned && currentPinnedCount >= 3) {
      alert('You can only pin up to 3 top skills.');
      return;
    }
    handleUpdateSkill(index, { pinned: !item.pinned });
  };

  const sortedSkillsForView = [...skillsDraft].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <section
      id="section-skills"
      data-section="skills"
      onClick={() => canEdit && !isEditing && onSelectSection?.('skills', 'skills')}
      className={`px-4 sm:px-6 md:px-8 py-5 space-y-4 text-left border-b ${theme.divider} ${theme.cardBg} transition-all relative ${
        canEdit && !isEditing ? 'cursor-pointer group/skills hover:bg-purple-500/[0.04] dark:hover:bg-purple-500/10' : ''
      }`}
      title={canEdit && !isEditing ? 'Click to edit Skills in Studio' : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary} flex items-center gap-1.5`}>
            <Code className="w-4 h-4 text-cyan-500" />
            <span>Skills</span>
          </h2>
          {hasSkills && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
              {skillsDraft.length}
            </span>
          )}
          {canEdit && !isEditing && (
            <span className="opacity-0 group/skills:opacity-100 transition-opacity text-[10px] font-mono font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Pencil className="w-2.5 h-2.5" />
              Edit
            </span>
          )}
        </div>
        {isEditing && (
          <span className="text-[11px] text-neutral-400">
            Top 3 pinned skills appear first
          </span>
        )}
      </div>

      {isEditing && (
        <div className="space-y-1.5 max-w-md" onClick={(e) => e.stopPropagation()}>
          <FormLabel>Add Skills (Search or Type Custom)</FormLabel>
          <SearchableCombobox
            options={POPULAR_SKILLS}
            value=""
            onChange={handleAddSkillFromCombobox}
            placeholder="Search 320+ skills (e.g. Next.js, Python, Figma)..."
            allowCustom
          />
        </div>
      )}

      {isEditing ? (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          {skillsDraft.map((skill, idx) => (
            <div
              key={skill.id || `skill-${idx}`}
              className={`p-3 rounded-xl border ${
                skill.pinned ? 'border-primary/40 bg-primary/5' : 'border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40'
              } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-mono text-[10px] text-neutral-400 font-semibold w-4 shrink-0">
                  #{idx + 1}
                </span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                  {skill.name}
                </span>
                {skill.pinned && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                    <Sparkles className="w-2.5 h-2.5" />
                    Top Pinned
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={skill.category || 'Industry Knowledge'}
                  onChange={(e) => handleUpdateSkill(idx, { category: e.target.value })}
                  className="h-10 min-h-[40px] text-[11px] px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
                >
                  <option value="Technical Skills">Technical Skills</option>
                  <option value="Industry Knowledge">Industry Knowledge</option>
                  <option value="Tools & Technologies">Tools & Tech</option>
                  <option value="Interpersonal Skills">Interpersonal</option>
                </select>

                <select
                  value={skill.level || 'Intermediate'}
                  onChange={(e) => handleUpdateSkill(idx, { level: e.target.value as any })}
                  className="h-10 min-h-[40px] text-[11px] px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleTogglePinSkill(idx)}
                  title={skill.pinned ? 'Unpin from top 3' : 'Pin to top 3'}
                  className={`w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                    skill.pinned
                      ? 'text-amber-500 bg-amber-500/10'
                      : 'text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveSkill(idx, 'up')}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === skillsDraft.length - 1}
                  onClick={() => handleMoveSkill(idx, 'down')}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveSkill(idx)}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl cursor-pointer"
                  title="Delete Skill"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : hasSkills ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {sortedSkillsForView.map((skill, idx) => (
            <span
              key={skill.id || `view-skill-${idx}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl border text-xs font-semibold shadow-xs transition-all ${
                skill.pinned
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/20'
                  : 'bg-slate-100 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-200'
              }`}
            >
              {skill.pinned && <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />}
              <span>{skill.name}</span>
              {skill.level && (
                <span className="text-[10px] font-mono text-neutral-400 font-normal">
                  • {skill.level}
                </span>
              )}
            </span>
          ))}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-center`}>
          <p className={`text-xs ${theme.textMuted}`}>No skills added yet.</p>
        </div>
      )}

      {isEditing && (
        <SectionSaveBar
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={saveStatus === 'saving'}
          isSaved={saveStatus === 'saved'}
          isDirty={isDirty}
          errorMessage={errorMessage}
          saveLabel="Save Skills"
          cancelLabel="Cancel"
          className="pt-2"
        />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. INDEPENDENT SERVICES SECTION
// ─────────────────────────────────────────────────────────────────────────────
export function ServicesSection({
  profile,
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSavePartial,
  onInquireService,
  onSelectSection,
  theme = getThemeConfig(profile.theme || 'editorial')
}: ServicesSectionProps) {
  const [servicesDraft, setServicesDraft] = React.useState<ServiceItem[]>(profile.services || []);
  const [snapshot, setSnapshot] = React.useState<ServiceItem[]>(profile.services || []);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  React.useEffect(() => {
    const nextServices = profile.services || [];
    setServicesDraft(nextServices);
    setSnapshot(nextServices);
  }, [profile.id, profile.services]);

  const isDirty = JSON.stringify(servicesDraft) !== JSON.stringify(snapshot);

  const updateServices = (next: ServiceItem[]) => {
    setServicesDraft(next);
    onUpdateField?.('services', next);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = { services: servicesDraft };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      onUpdateField?.('services', servicesDraft);
      setSnapshot(servicesDraft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save services');
    }
  };

  const handleCancel = () => {
    setServicesDraft(snapshot);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  const hasServices = servicesDraft.length > 0;
  if (!hasServices && !canEdit && !isEditing) {
    return null;
  }

  const handleAddService = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newService: ServiceItem = {
      id: `svc-${Date.now()}`,
      title: 'New Service',
      description: '',
      badge: 'Available'
    };
    updateServices([...servicesDraft, newService]);
  };

  const handleRemoveService = (id: string) => {
    updateServices(servicesDraft.filter((s) => s.id !== id));
  };

  const handleUpdateService = (id: string, updates: Partial<ServiceItem>) => {
    updateServices(servicesDraft.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  return (
    <section
      id="section-services"
      data-section="services"
      onClick={() => canEdit && !isEditing && onSelectSection?.('services', 'services')}
      className={`px-4 sm:px-6 md:px-8 py-5 space-y-4 text-left border-b ${theme.divider} ${theme.cardBg} transition-all relative ${
        canEdit && !isEditing ? 'cursor-pointer group/services hover:bg-purple-500/[0.04] dark:hover:bg-purple-500/10' : ''
      }`}
      title={canEdit && !isEditing ? 'Click to edit Services in Studio' : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary} flex items-center gap-1.5`}>
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Services</span>
          </h2>
          {hasServices && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
              {servicesDraft.length}
            </span>
          )}
          {canEdit && !isEditing && (
            <span className="opacity-0 group/services:opacity-100 transition-opacity text-[10px] font-mono font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Pencil className="w-2.5 h-2.5" />
              Edit
            </span>
          )}
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={handleAddService}
            className="min-h-[44px] flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" onClick={(e) => isEditing && e.stopPropagation()}>
        {servicesDraft.map((service) => (
          <div
            key={service.id}
            className={`p-4 rounded-xl ${theme.cardBg} border ${theme.cardBorder} ${theme.hoverBorder} space-y-2 shadow-xs transition-all`}
          >
            {isEditing ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between w-full gap-2">
                  <input
                    type="text"
                    value={service.title || ''}
                    onChange={(e) => handleUpdateService(service.id, { title: e.target.value })}
                    className={`flex-1 min-h-[40px] bg-transparent text-xs font-bold ${theme.textPrimary} focus:outline-none border-b border-dashed border-slate-300 dark:border-white/20`}
                    placeholder="Service Title"
                  />
                  <input
                    type="text"
                    value={service.badge || ''}
                    onChange={(e) => handleUpdateService(service.id, { badge: e.target.value })}
                    className="w-20 min-h-[40px] text-[10px] bg-transparent text-right font-mono text-slate-500 focus:outline-none border-b border-dashed border-slate-300 dark:border-white/20"
                    placeholder="Badge"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveService(service.id)}
                    className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl cursor-pointer"
                    title="Remove Service"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <FormTextarea
                  rows={2}
                  value={service.description || ''}
                  onChange={(val) => handleUpdateService(service.id, { description: val })}
                  placeholder="Service details, pricing, or deliverables..."
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold ${theme.textPrimary}`}>
                    {service.title}
                  </span>
                  {service.badge && (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} font-mono shrink-0`}>
                      {service.badge}
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className={`text-xs ${theme.textSecondary} leading-relaxed pt-0.5`}>
                    {service.description}
                  </p>
                )}
                {onInquireService && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInquireService(service);
                    }}
                    className={`mt-2 min-h-[40px] px-3 py-1.5 rounded-lg text-[11px] font-bold ${theme.btnPrimary} transition-all`}
                  >
                    Inquire
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        {!hasServices && (canEdit || isEditing) && (
          <div className={`col-span-1 sm:col-span-2 p-5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-center`}>
            <p className={`text-xs ${theme.textMuted}`}>No services listed yet.</p>
          </div>
        )}
      </div>

      {isEditing && (
        <SectionSaveBar
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={saveStatus === 'saving'}
          isSaved={saveStatus === 'saved'}
          isDirty={isDirty}
          errorMessage={errorMessage}
          saveLabel="Save Services"
          cancelLabel="Cancel"
          className="pt-2"
        />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BACKWARD-COMPATIBLE WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
export function SkillsServicesSection(props: SkillsServicesSectionProps) {
  return (
    <>
      <SkillsSection {...props} />
      <ServicesSection {...props} />
    </>
  );
}
