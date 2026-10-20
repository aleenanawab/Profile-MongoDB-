'use client';

import React from 'react';
import { Plus, X, Pencil } from 'lucide-react';
import { ProfileData, ServiceItem } from '../types/profile';
import { ThemeConfig, getThemeConfig } from './themeStyles';
import { FormLabel, FormInput, SectionSaveBar } from './ui/formControls';
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

const normalizeSkills = (rawSkills?: any[]): string[] => {
  if (!Array.isArray(rawSkills)) return [];
  return rawSkills
    .map((s) => (typeof s === 'string' ? s : s?.name))
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
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
  const [skillsDraft, setSkillsDraft] = React.useState<string[]>(normalizeSkills(profile.skills));
  const [snapshot, setSnapshot] = React.useState({
    services: profile.services || [],
    skills: normalizeSkills(profile.skills)
  });
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  React.useEffect(() => {
    const nextServices = profile.services || [];
    const nextSkills = normalizeSkills(profile.skills);
    setServicesDraft(nextServices);
    setSkillsDraft(nextSkills);
    setSnapshot({ services: nextServices, skills: nextSkills });
  }, [profile.id, profile.services, profile.skills]);

  const isDirty = (
    JSON.stringify(servicesDraft) !== JSON.stringify(snapshot.services) ||
    JSON.stringify(skillsDraft) !== JSON.stringify(snapshot.skills)
  );

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

  const handleAddService = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newService: ServiceItem = {
      id: `svc-${Date.now()}`,
      title: 'New Service',
      badge: 'Available'
    };
    setServicesDraft((prev) => [...prev, newService]);
  };

  const handleRemoveService = (id: string) => {
    setServicesDraft((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateServiceTitle = (id: string, title: string) => {
    setServicesDraft((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  };

  const handleAddSkillFromCombobox = (selectedSkill: string | string[]) => {
    if (!selectedSkill || typeof selectedSkill !== 'string') return;
    const trimmed = selectedSkill.trim();
    if (!trimmed) return;
    if (skillsDraft.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    setSkillsDraft((prev) => [...prev, trimmed]);
  };

  const handleRemoveSkill = (index: number) => {
    setSkillsDraft((prev) => prev.filter((_, idx) => idx !== index));
  };

  const showServices = hasServices || canEdit || isEditing;
  const showSkills = hasSkills || canEdit || isEditing;

  return (
    <section 
      onClick={() => canEdit && !isEditing && onSelectSection?.('skills', 'skills')}
      className={`px-4 sm:px-6 md:px-8 py-5 space-y-4 text-left border-b ${theme.divider} ${theme.cardBg} transition-all relative ${
        canEdit && !isEditing ? 'cursor-pointer group/skills hover:bg-purple-500/[0.04] dark:hover:bg-purple-500/10' : ''
      }`}
      title={canEdit && !isEditing ? 'Click to edit Skills & Services in Studio' : undefined}
    >
      {/* Services Section */}
      {showServices && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
                Services
              </h2>
              {canEdit && !isEditing && (
                <span className="opacity-0 group/skills:opacity-100 transition-opacity text-[10px] font-mono font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <Pencil className="w-2.5 h-2.5" />
                  Edit Skills & Services
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

          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 gap-2">
            {servicesDraft.map((service) => (
              <div
                key={service.id}
                className={`p-3 rounded-xl ${theme.cardBg} border ${theme.cardBorder} ${theme.hoverBorder} flex items-center justify-between gap-1 shadow-xs transition-all`}
              >
                {isEditing ? (
                  <div className="flex items-center justify-between w-full gap-1">
                    <input
                      type="text"
                      value={service.title}
                      onChange={(e) => handleUpdateServiceTitle(service.id, e.target.value)}
                      className={`w-full bg-transparent text-xs font-bold ${theme.textPrimary} focus:outline-none border-b border-dashed border-slate-300 dark:border-white/20`}
                      placeholder="Service name"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveService(service.id)}
                      className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                      title="Remove Service"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`text-xs font-bold ${theme.textPrimary}`}>
                      {service.title}
                    </span>
                    {service.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} font-mono`}>
                        {service.badge}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
            {!hasServices && (canEdit || isEditing) && (
              <div className={`col-span-2 sm:col-span-3 p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-center`}>
                <p className={`text-xs ${theme.textMuted}`}>
                  No services listed yet.
                </p>
              </div>
            )}
            {isEditing && (!servicesDraft || servicesDraft.length === 0) && (
              <button
                type="button"
                onClick={handleAddService}
                className={`col-span-2 sm:col-span-3 p-3 rounded-xl border border-dashed ${theme.cardBorder} text-xs font-bold ${theme.textMuted} hover:${theme.accentText} flex items-center justify-center gap-1.5 cursor-pointer`}
              >
                <Plus className="w-4 h-4" />
                <span>Add your first service</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Skills Pills */}
      {showSkills && (
        <div className="space-y-2.5 pt-1 text-left">
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
              Skills
            </h2>
          </div>

          {/* Searchable Combobox for 300+ skills + custom skills */}
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

          {hasSkills ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skillsDraft.map((skillLabel, idx) => (
                <span
                  key={`${skillLabel}-${idx}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 text-xs font-medium text-slate-800 dark:text-zinc-200 shadow-xs"
                >
                  <span>{skillLabel}</span>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(idx)}
                      className="text-slate-400 hover:text-rose-500 ml-0.5 p-0.5 cursor-pointer transition-colors"
                      title="Remove skill"
                    >
                      <X className="w-3 h-3" />
                    </button>
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
          )}
        </div>
      )}

      {/* Unified Save & Cancel Bar for Skills and Services */}
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
