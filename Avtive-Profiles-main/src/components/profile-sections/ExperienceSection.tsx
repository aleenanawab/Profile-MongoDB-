'use client';

import React from 'react';
import { Plus, X, Pencil, Briefcase } from 'lucide-react';
import { ProfileData, ExperienceItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { FormLabel, FormInput, FormTextarea, SectionSaveBar } from '@/components/ui/formControls';

interface ExperienceSectionProps {
  profile: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

const getInitialExperiences = (profile: ProfileData): ExperienceItem[] => {
  if (profile.experiences && profile.experiences.length > 0) return profile.experiences;
  if (profile.experience && profile.experience.length > 0) return profile.experience;
  return [];
};

export function ExperienceSection({ 
  profile, 
  theme = getThemeConfig(profile.theme || 'elegant'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSavePartial,
  onSelectSection
}: ExperienceSectionProps) {
  const [experiencesDraft, setExperiencesDraft] = React.useState<ExperienceItem[]>(getInitialExperiences(profile));
  const [snapshot, setSnapshot] = React.useState<ExperienceItem[]>(getInitialExperiences(profile));
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  React.useEffect(() => {
    const next = getInitialExperiences(profile);
    setExperiencesDraft(next);
    setSnapshot(next);
  }, [profile.id, profile.experiences, profile.experience]);

  const isDirty = JSON.stringify(experiencesDraft) !== JSON.stringify(snapshot);

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = {
        experiences: experiencesDraft,
        experience: experiencesDraft,
      };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      onUpdateField?.('experiences', experiencesDraft);
      onUpdateField?.('experience', experiencesDraft);
      setSnapshot(experiencesDraft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save experience');
    }
  };

  const handleCancel = () => {
    setExperiencesDraft(snapshot);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  const hasExperience = experiencesDraft.length > 0;

  if (!hasExperience && !canEdit && !isEditing) {
    return null;
  }

  const handleAddExperience = () => {
    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}`,
      company: '',
      role: '',
      period: '',
      location: '',
      description: ''
    };
    const next = [newExp, ...experiencesDraft];
    setExperiencesDraft(next);
    onUpdateField?.('experiences', next);
    onUpdateField?.('experience', next);
  };

  const handleUpdateItem = (id: string, updates: Partial<ExperienceItem>) => {
    const next = experiencesDraft.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp));
    setExperiencesDraft(next);
    onUpdateField?.('experiences', next);
    onUpdateField?.('experience', next);
  };

  const handleRemoveItem = (id: string) => {
    const next = experiencesDraft.filter((exp) => exp.id !== id);
    setExperiencesDraft(next);
    onUpdateField?.('experiences', next);
    onUpdateField?.('experience', next);
  };

  return (
    <section 
      onClick={() => canEdit && !isEditing && onSelectSection?.('experience')}
      className={`px-4 sm:px-6 md:px-8 py-5 space-y-3.5 text-left ${theme.cardBg} border-b ${theme.divider} transition-colors ${
        canEdit && !isEditing ? 'cursor-pointer hover:bg-accent/5 transition-all' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
          Experience
        </h2>
        {isEditing ? (
          <button
            type="button"
            onClick={handleAddExperience}
            className={`flex items-center gap-1 text-[11px] font-bold ${theme.accentText} hover:underline cursor-pointer`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Experience</span>
          </button>
        ) : (
          canEdit && (
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 opacity-80 hover:opacity-100">
              Click to edit ↗
            </span>
          )
        )}
      </div>

      {hasExperience ? (
        <div className="space-y-3">
          {experiencesDraft.map((exp) => (
            <div
              key={exp.id}
              className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} space-y-2.5 shadow-2xs relative`}
              onClick={(e) => e.stopPropagation()}
            >
              {isEditing ? (
                /* Editable Experience Card */
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <FormLabel required>Role / Title</FormLabel>
                        <FormInput
                          value={exp.role || ''}
                          onChange={(val) => handleUpdateItem(exp.id, { role: val })}
                          placeholder="e.g. Lead Designer"
                        />
                      </div>
                      <div>
                        <FormLabel required>Company Name</FormLabel>
                        <FormInput
                          value={exp.company || ''}
                          onChange={(val) => handleUpdateItem(exp.id, { company: val })}
                          placeholder="e.g. Acme Corp"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(exp.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0 mt-6"
                      title="Remove experience"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <FormLabel>Employment Type</FormLabel>
                      <select
                        value={exp.employmentType || ''}
                        onChange={(e) => handleUpdateItem(exp.id, { employmentType: e.target.value })}
                        className="w-full min-h-[44px] h-11 px-3.5 text-base sm:text-sm font-normal rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
                      >
                        <option value="">Select type...</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Self-employed">Self-employed</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Apprenticeship">Apprenticeship</option>
                      </select>
                    </div>
                    <div>
                      <FormLabel>Location Type</FormLabel>
                      <select
                        value={exp.locationType || ''}
                        onChange={(e) => handleUpdateItem(exp.id, { locationType: e.target.value as any })}
                        className="w-full min-h-[44px] h-11 px-3.5 text-base sm:text-sm font-normal rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
                      >
                        <option value="">Select location type...</option>
                        <option value="On-site">On-site</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <FormLabel>Start Date</FormLabel>
                      <FormInput
                        value={exp.startDate || ''}
                        onChange={(val) => {
                          const start = val;
                          const end = exp.current ? 'Present' : (exp.endDate || '');
                          const derivedPeriod = start ? (end ? `${start} - ${end}` : start) : end;
                          handleUpdateItem(exp.id, { startDate: val, period: derivedPeriod || exp.period });
                        }}
                        placeholder="e.g. Jan 2021"
                      />
                    </div>
                    <div>
                      <FormLabel>End Date</FormLabel>
                      <FormInput
                        disabled={exp.current}
                        value={exp.endDate || ''}
                        onChange={(val) => {
                          const start = exp.startDate || '';
                          const end = exp.current ? 'Present' : val;
                          const derivedPeriod = start ? (end ? `${start} - ${end}` : start) : end;
                          handleUpdateItem(exp.id, { endDate: val, period: derivedPeriod || exp.period });
                        }}
                        placeholder={exp.current ? 'Present' : 'e.g. Dec 2023'}
                      />
                    </div>
                    <div>
                      <FormLabel>Location</FormLabel>
                      <FormInput
                        value={exp.location || ''}
                        onChange={(val) => handleUpdateItem(exp.id, { location: val })}
                        placeholder="e.g. San Francisco, CA"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id={`exp-current-${exp.id}`}
                      checked={Boolean(exp.current)}
                      onChange={(e) => {
                        const isCurrent = e.target.checked;
                        const start = exp.startDate || '';
                        const end = isCurrent ? 'Present' : (exp.endDate || '');
                        const derivedPeriod = start ? (end ? `${start} - ${end}` : start) : end;
                        handleUpdateItem(exp.id, { current: isCurrent, period: derivedPeriod || exp.period });
                      }}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor={`exp-current-${exp.id}`} className="text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                      I currently work in this role
                    </label>
                  </div>

                  <div>
                    <FormLabel>Skills Used (comma-separated)</FormLabel>
                    <FormInput
                      value={Array.isArray(exp.skills) ? exp.skills.join(', ') : ''}
                      onChange={(val) => {
                        const parsed = val.split(',').map((s) => s.trim()).filter(Boolean);
                        handleUpdateItem(exp.id, { skills: parsed });
                      }}
                      placeholder="e.g. React, TypeScript, Product Management"
                    />
                  </div>

                  <div>
                    <FormLabel>Description & Accomplishments</FormLabel>
                    <FormTextarea
                      rows={2}
                      value={exp.description || ''}
                      onChange={(val) => handleUpdateItem(exp.id, { description: val })}
                      placeholder="Highlights, achievements, or tech stack used..."
                    />
                  </div>
                </div>
              ) : (
                /* View Experience Card */
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`text-sm font-bold ${theme.textPrimary}`}>
                        {exp.company}
                      </h3>
                      {exp.role && (
                        <p className={`text-xs font-semibold ${theme.accentText} mt-0.5`}>
                          {exp.role} {exp.employmentType ? `• ${exp.employmentType}` : ''}
                        </p>
                      )}
                    </div>

                    {(exp.period || exp.startDate || exp.endDate) && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.cardBorder} shrink-0 font-mono`}>
                        {exp.period || `${exp.startDate || ''} - ${exp.current ? 'Present' : (exp.endDate || '')}`}
                      </span>
                    )}
                  </div>

                  {(exp.location || exp.locationType) && (
                    <p className={`text-[11px] ${theme.textSecondary} font-medium`}>
                      {[exp.location, exp.locationType].filter(Boolean).join(' • ')}
                    </p>
                  )}

                  {exp.description && (
                    <p className={`text-xs ${theme.textSecondary} leading-relaxed pt-1`}>
                      {exp.description}
                    </p>
                  )}

                  {Array.isArray(exp.skills) && exp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {exp.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 ${theme.textPrimary} border border-neutral-200 dark:border-neutral-700`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-center space-y-2`}>
          <p className={`text-xs ${theme.textMuted}`}>
            No work experience added yet.
          </p>
          {isEditing && (
            <button
              type="button"
              onClick={handleAddExperience}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed ${theme.cardBorder} text-xs font-bold ${theme.accentText} hover:opacity-80 cursor-pointer`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add your first work experience</span>
            </button>
          )}
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
          saveLabel="Save Experience"
          cancelLabel="Cancel"
          className="pt-1"
        />
      )}
    </section>
  );
}
