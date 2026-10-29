'use client';

import React from 'react';
import { Plus, X, Pencil, Pin, PinOff, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { ProfileData, ServiceItem, SkillItem } from '../types/profile';
import { ThemeConfig, getThemeConfig } from './themeStyles';
import { FormLabel, FormInput, FormTextarea, SectionSaveBar } from './ui/formControls';
import { SearchableCombobox } from './forms/SearchableCombobox';
import { POPULAR_SKILLS } from '@/data/skillsDataset';

interface SkillsServicesSectionProps {
  profile: ProfileData;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onInquireService?: (service: ServiceItem) => void;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
  theme?: ThemeConfig;
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

export function SkillsServicesSection({
  profile,
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSavePartial,
  onInquireService,
  onSelectSection,
  theme = getThemeConfig(profile.theme || 'elegant')
}: SkillsServicesSectionProps) {
  const [servicesDraft, setServicesDraft] = React.useState<ServiceItem[]>(profile.services || []);
  const [skillsDraft, setSkillsDraft] = React.useState<SkillItem[]>(() => normalizeSkillItems(profile.skills));
  const [snapshot, setSnapshot] = React.useState({
    services: profile.services || [],
    skills: normalizeSkillItems(profile.skills)
  });
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  React.useEffect(() => {
    const nextServices = profile.services || [];
    const nextSkills = normalizeSkillItems(profile.skills);
    setServicesDraft(nextServices);
    setSkillsDraft(nextSkills);
    setSnapshot({ services: nextServices, skills: nextSkills });
  }, [profile.id, profile.services, profile.skills]);

  const isDirty = (
    JSON.stringify(servicesDraft) !== JSON.stringify(snapshot.services) ||
    JSON.stringify(skillsDraft) !== JSON.stringify(snapshot.skills)
  );

  // Sorted skills for view mode: pinned first
  const sortedSkillsForView = React.useMemo(() => {
    return [...skillsDraft].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [skillsDraft]);

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = {
        services: servicesDraft,
        skills: skillsDraft,
      };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      onUpdateField?.('services', servicesDraft);
      onUpdateField?.('skills', skillsDraft);
      setSnapshot({ services: servicesDraft, skills: skillsDraft });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save skills and services');
    }
  };

  const handleCancel = () => {
    setServicesDraft(snapshot.services);
    setSkillsDraft(snapshot.skills);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  const hasServices = servicesDraft.length > 0;
  const hasSkills = skillsDraft.length > 0;

  if (!hasServices && !hasSkills && !canEdit && !isEditing) {
    return null;
  }

  // ── Services handlers ──────────────────────────────────────────────────────
  const handleAddService = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newService: ServiceItem = {
      id: `svc-${Date.now()}`,
      title: 'New Service',
      description: '',
      badge: 'Available'
    };
    const next = [...servicesDraft, newService];
    setServicesDraft(next);
    onUpdateField?.('services', next);
  };

  const handleRemoveService = (id: string) => {
    const next = servicesDraft.filter((s) => s.id !== id);
    setServicesDraft(next);
    onUpdateField?.('services', next);
  };

  const handleUpdateService = (id: string, updates: Partial<ServiceItem>) => {
    const next = servicesDraft.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setServicesDraft(next);
    onUpdateField?.('services', next);
  };

  // ── Skills handlers ────────────────────────────────────────────────────────
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
    const next = [...skillsDraft, newSkill];
    setSkillsDraft(next);
    onUpdateField?.('skills', next);
  };

  const handleRemoveSkill = (index: number) => {
    const next = skillsDraft.filter((_, idx) => idx !== index);
    setSkillsDraft(next);
    onUpdateField?.('skills', next);
  };

  const handleUpdateSkill = (index: number, updates: Partial<SkillItem>) => {
    const next = skillsDraft.map((s, idx) => (idx === index ? { ...s, ...updates } : s));
    setSkillsDraft(next);
    onUpdateField?.('skills', next);
  };

  const handleMoveSkill = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= skillsDraft.length) return;
    const copy = [...skillsDraft];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setSkillsDraft(copy);
    onUpdateField?.('skills', copy);
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

  const showServices = hasServices || canEdit || isEditing;
  const showSkills = hasSkills || canEdit || isEditing;

  return (
    <section
      id="section-skills"
      data-section="skills"
      onClick={() => canEdit && !isEditing && onSelectSection?.('skills', 'skills')}
      className={`px-4 sm:px-6 md:px-8 py-5 space-y-5 text-left border-b ${theme.divider} ${theme.cardBg} transition-all relative ${
        canEdit && !isEditing ? 'cursor-pointer group/skills hover:bg-purple-500/[0.04] dark:hover:bg-purple-500/10' : ''
      }`}
      title={canEdit && !isEditing ? 'Click to edit Skills & Services in Studio' : undefined}
    >
      {/* ── Services Section ───────────────────────────────────────────────── */}
      {showServices && (
        <div id="section-services" data-section="services" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
                Services
              </h2>
              {canEdit && !isEditing && (
                <span className="opacity-0 group/skills:opacity-100 transition-opacity text-[10px] font-mono font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <Pencil className="w-2.5 h-2.5" />
                  Edit
                </span>
              )}
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={handleAddService}
                className={`flex items-center gap-1 text-[11px] font-bold ${theme.accentText} hover:underline cursor-pointer`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {servicesDraft.map((service) => (
              <div
                key={service.id}
                className={`p-3.5 rounded-xl ${theme.cardBg} border ${theme.cardBorder} ${theme.hoverBorder} space-y-1.5 shadow-xs transition-all`}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between w-full gap-2">
                      <input
                        type="text"
                        value={service.title || ''}
                        onChange={(e) => handleUpdateService(service.id, { title: e.target.value })}
                        className={`flex-1 bg-transparent text-xs font-bold ${theme.textPrimary} focus:outline-none border-b border-dashed border-slate-300 dark:border-white/20`}
                        placeholder="Service Title"
                      />
                      <input
                        type="text"
                        value={service.badge || ''}
                        onChange={(e) => handleUpdateService(service.id, { badge: e.target.value })}
                        className="w-20 text-[10px] bg-transparent text-right font-mono text-slate-500 focus:outline-none border-b border-dashed border-slate-300 dark:border-white/20"
                        placeholder="Badge"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveService(service.id)}
                        className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer ml-1"
                        title="Remove Service"
                      >
                        <X className="w-3.5 h-3.5" />
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
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} font-mono shrink-0`}>
                          {service.badge}
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className={`text-xs ${theme.textSecondary} leading-relaxed pt-0.5`}>
                        {service.description}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}

            {!hasServices && (canEdit || isEditing) && (
              <div className={`col-span-1 sm:col-span-2 p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-center`}>
                <p className={`text-xs ${theme.textMuted}`}>
                  No services listed yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Skills Section ─────────────────────────────────────────────────── */}
      {showSkills && (
        <div className="space-y-3 pt-1 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
                Skills
              </h2>
              {hasSkills && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
                  {skillsDraft.length}
                </span>
              )}
            </div>
            {isEditing && (
              <span className="text-[11px] text-neutral-400">
                Top 3 pinned skills appear first
              </span>
            )}
          </div>

          {/* Searchable Combobox for skills */}
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

          {/* Edit Mode Skills List with Reorder, Category, Level, and Top-3 Pinning */}
          {isEditing ? (
            <div className="space-y-2">
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
                    {/* Category select */}
                    <select
                      value={skill.category || 'Industry Knowledge'}
                      onChange={(e) => handleUpdateSkill(idx, { category: e.target.value })}
                      className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
                    >
                      <option value="Technical Skills">Technical Skills</option>
                      <option value="Industry Knowledge">Industry Knowledge</option>
                      <option value="Tools & Technologies">Tools & Tech</option>
                      <option value="Interpersonal Skills">Interpersonal</option>
                    </select>

                    {/* Level select */}
                    <select
                      value={skill.level || 'Intermediate'}
                      onChange={(e) => handleUpdateSkill(idx, { level: e.target.value as any })}
                      className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>

                    {/* Pin button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePinSkill(idx)}
                      title={skill.pinned ? 'Unpin from top 3' : 'Pin to top 3'}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        skill.pinned
                          ? 'text-amber-500 bg-amber-500/10'
                          : 'text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    {/* Move up/down */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSkill(idx, 'up')}
                      className="p-1 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === skillsDraft.length - 1}
                      onClick={() => handleMoveSkill(idx, 'down')}
                      className="p-1 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* View Mode Skills Pills */
            hasSkills ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {sortedSkillsForView.map((skill, idx) => (
                  <span
                    key={skill.id || `view-skill-${idx}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-all ${
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
                <p className={`text-xs ${theme.textMuted}`}>
                  No skills added yet.
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* Unified Save & Cancel Bar */}
      {isEditing && (
        <SectionSaveBar
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={saveStatus === 'saving'}
          isSaved={saveStatus === 'saved'}
          isDirty={isDirty}
          errorMessage={errorMessage}
          saveLabel="Save Skills & Services"
          cancelLabel="Cancel"
          className="pt-2"
        />
      )}
    </section>
  );
}
