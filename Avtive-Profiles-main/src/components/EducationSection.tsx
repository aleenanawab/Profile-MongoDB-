'use client';

import React from 'react';
import { Plus, X, GraduationCap } from 'lucide-react';
import { ProfileData, EducationItem } from '../types/profile';
import { ThemeConfig, getThemeConfig } from './themeStyles';
import { FormLabel, FormInput, FormTextarea, SectionSaveBar } from './ui/formControls';

interface EducationSectionProps {
  profile: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function EducationSection({ 
  profile, 
  theme = getThemeConfig(profile.theme || 'elegant'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSavePartial,
  onSelectSection
}: EducationSectionProps) {
  const [educationDraft, setEducationDraft] = React.useState<EducationItem[]>(profile.education || []);
  const [snapshot, setSnapshot] = React.useState<EducationItem[]>(profile.education || []);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  React.useEffect(() => {
    const next = profile.education || [];
    setEducationDraft(next);
    setSnapshot(next);
  }, [profile.id, profile.education]);

  const isDirty = JSON.stringify(educationDraft) !== JSON.stringify(snapshot);

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = {
        education: educationDraft,
      };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      onUpdateField?.('education', educationDraft);
      setSnapshot(educationDraft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save education');
    }
  };

  const handleCancel = () => {
    setEducationDraft(snapshot);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  const hasEducation = educationDraft.length > 0;

  if (!hasEducation && !canEdit && !isEditing) {
    return null;
  }

  const handleAddEducation = () => {
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: 'Degree / Program',
      institution: 'University / Institution',
      period: '2019 - 2023',
      description: ''
    };
    setEducationDraft((prev) => [newEdu, ...prev]);
  };

  const handleUpdateItem = (id: string, updates: Partial<EducationItem>) => {
    setEducationDraft((prev) => prev.map((edu) => (edu.id === id ? { ...edu, ...updates } : edu)));
  };

  const handleRemoveItem = (id: string) => {
    setEducationDraft((prev) => prev.filter((edu) => edu.id !== id));
  };

  return (
    <section 
      onClick={() => canEdit && !isEditing && onSelectSection?.('education')}
      className={`px-4 sm:px-6 md:px-8 py-5 space-y-3.5 text-left ${theme.cardBg} border-b ${theme.divider} transition-colors ${
        canEdit && !isEditing ? 'cursor-pointer hover:bg-accent/5 transition-all' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
          Education
        </h2>
        {isEditing ? (
          <button
            type="button"
            onClick={handleAddEducation}
            className={`flex items-center gap-1 text-[11px] font-bold ${theme.accentText} hover:underline cursor-pointer`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Education</span>
          </button>
        ) : (
          canEdit && onSelectSection && (
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded font-medium">
              Click to edit
            </span>
          )
        )}
      </div>

      {hasEducation ? (
        <div className="space-y-3">
          {educationDraft.map((edu) => (
            <div
              key={edu.id}
              className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} space-y-2.5 shadow-2xs relative`}
              onClick={(e) => e.stopPropagation()}
            >
              {isEditing ? (
                /* Editable Education Card */
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <FormLabel required>Degree / Program</FormLabel>
                        <FormInput
                          value={edu.degree || ''}
                          onChange={(val) => handleUpdateItem(edu.id, { degree: val })}
                          placeholder="e.g. B.S. in Computer Science"
                        />
                      </div>
                      <div>
                        <FormLabel required>School / Institution</FormLabel>
                        <FormInput
                          value={edu.institution || (edu as any).school || ''}
                          onChange={(val) => handleUpdateItem(edu.id, { institution: val })}
                          placeholder="e.g. Stanford University"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(edu.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0 mt-6"
                      title="Remove education"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <FormLabel>Graduation Year / Period</FormLabel>
                    <FormInput
                      value={edu.period || edu.year || ''}
                      onChange={(val) => handleUpdateItem(edu.id, { period: val, year: val })}
                      placeholder="e.g. 2019 - 2023"
                    />
                  </div>

                  <div>
                    <FormLabel>Notes / Honors / Activities</FormLabel>
                    <FormTextarea
                      rows={2}
                      value={edu.description || ''}
                      onChange={(val) => handleUpdateItem(edu.id, { description: val })}
                      placeholder="Honors, thesis, activities, or coursework..."
                    />
                  </div>
                </div>
              ) : (
                /* View Education Card */
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`text-sm font-bold ${theme.textPrimary}`}>
                        {edu.degree}
                      </h3>
                      <p className={`text-xs font-semibold ${theme.accentText} mt-0.5`}>
                        {edu.institution || (edu as any).school}
                      </p>
                    </div>

                    {(edu.period || edu.year) && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.cardBorder} shrink-0 font-mono`}>
                        {edu.period || edu.year}
                      </span>
                    )}
                  </div>

                  {edu.description && (
                    <p className={`text-xs ${theme.textSecondary} leading-relaxed pt-1`}>
                      {edu.description}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-center space-y-2`}>
          <p className={`text-xs ${theme.textMuted}`}>
            No education details added yet.
          </p>
          {isEditing && (
            <button
              type="button"
              onClick={handleAddEducation}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed ${theme.cardBorder} text-xs font-bold ${theme.accentText} hover:opacity-80 cursor-pointer`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add your first education</span>
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
          saveLabel="Save Education"
          cancelLabel="Cancel"
          className="pt-1"
        />
      )}
    </section>
  );
}
