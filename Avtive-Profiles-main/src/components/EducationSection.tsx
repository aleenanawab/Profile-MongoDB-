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
      degree: '',
      institution: '',
      period: '',
      description: ''
    };
    const next = [newEdu, ...educationDraft];
    setEducationDraft(next);
    onUpdateField?.('education', next);
  };

  const handleUpdateItem = (id: string, updates: Partial<EducationItem>) => {
    const next = educationDraft.map((edu) => (edu.id === id ? { ...edu, ...updates } : edu));
    setEducationDraft(next);
    onUpdateField?.('education', next);
  };

  const handleRemoveItem = (id: string) => {
    const next = educationDraft.filter((edu) => edu.id !== id);
    setEducationDraft(next);
    onUpdateField?.('education', next);
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
                        <FormLabel required>School / University</FormLabel>
                        <FormInput
                          value={edu.institution || (edu as any).school || ''}
                          onChange={(val) => handleUpdateItem(edu.id, { institution: val, school: val })}
                          placeholder="e.g. Stanford University"
                        />
                      </div>
                      <div>
                        <FormLabel required>Degree / Program</FormLabel>
                        <FormInput
                          value={edu.degree || ''}
                          onChange={(val) => handleUpdateItem(edu.id, { degree: val })}
                          placeholder="e.g. Bachelor of Science"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <FormLabel>Field of Study</FormLabel>
                      <FormInput
                        value={edu.fieldOfStudy || ''}
                        onChange={(val) => handleUpdateItem(edu.id, { fieldOfStudy: val })}
                        placeholder="e.g. Computer Science & AI"
                      />
                    </div>
                    <div>
                      <FormLabel>Grade / GPA</FormLabel>
                      <FormInput
                        value={edu.grade || ''}
                        onChange={(val) => handleUpdateItem(edu.id, { grade: val })}
                        placeholder="e.g. 3.9 / 4.0 or First Class"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <FormLabel>Start Year</FormLabel>
                      <FormInput
                        value={edu.startYear || ''}
                        onChange={(val) => {
                          const start = val;
                          const end = edu.endYear || '';
                          const derivedPeriod = start ? (end ? `${start} - ${end}` : start) : end;
                          handleUpdateItem(edu.id, { startYear: val, period: derivedPeriod || edu.period });
                        }}
                        placeholder="e.g. 2019"
                      />
                    </div>
                    <div>
                      <FormLabel>End Year (or Expected)</FormLabel>
                      <FormInput
                        value={edu.endYear || ''}
                        onChange={(val) => {
                          const start = edu.startYear || '';
                          const end = val;
                          const derivedPeriod = start ? (end ? `${start} - ${end}` : start) : end;
                          handleUpdateItem(edu.id, { endYear: val, period: derivedPeriod || edu.period });
                        }}
                        placeholder="e.g. 2023"
                      />
                    </div>
                  </div>

                  <div>
                    <FormLabel>Activities & Societies</FormLabel>
                    <FormInput
                      value={edu.activities || ''}
                      onChange={(val) => handleUpdateItem(edu.id, { activities: val })}
                      placeholder="e.g. Robotics Club, Student Council"
                    />
                  </div>

                  <div>
                    <FormLabel>Description / Notes</FormLabel>
                    <FormTextarea
                      rows={2}
                      value={edu.description || ''}
                      onChange={(val) => handleUpdateItem(edu.id, { description: val })}
                      placeholder="Thesis, awards, honors, or key courses..."
                    />
                  </div>
                </div>
              ) : (
                /* View Education Card */
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`text-sm font-bold ${theme.textPrimary}`}>
                        {edu.institution || (edu as any).school}
                      </h3>
                      <p className={`text-xs font-semibold ${theme.accentText} mt-0.5`}>
                        {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(', ')}
                      </p>
                    </div>

                    {(edu.period || edu.year || edu.startYear || edu.endYear) && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.cardBorder} shrink-0 font-mono`}>
                        {edu.period || `${edu.startYear || ''} - ${edu.endYear || ''}` || edu.year}
                      </span>
                    )}
                  </div>

                  {edu.grade && (
                    <p className={`text-[11px] ${theme.textSecondary} font-medium`}>
                      Grade: {edu.grade}
                    </p>
                  )}

                  {edu.activities && (
                    <p className={`text-[11px] ${theme.textSecondary} italic`}>
                      Activities: {edu.activities}
                    </p>
                  )}

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
