'use client';

import React from 'react';
import { HeartHandshake } from 'lucide-react';
import { ProfileData, VolunteerItem } from '../types/profile';
import { ThemeConfig, getThemeConfig } from './themeStyles';
import { SectionRepeater } from './ui/SectionRepeater';
import { FormLabel, FormInput, FormTextarea } from './ui/formControls';

export interface VolunteerSectionProps {
  profile: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

const getInitialVolunteer = (profile: ProfileData): VolunteerItem[] => {
  if (Array.isArray(profile.volunteerExperiences) && profile.volunteerExperiences.length > 0) {
    return profile.volunteerExperiences;
  }
  if (Array.isArray(profile.volunteer) && profile.volunteer.length > 0) {
    return profile.volunteer;
  }
  return [];
};

export function VolunteerSection({
  profile,
  theme = getThemeConfig(profile.theme || 'elegant'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSelectSection
}: VolunteerSectionProps) {
  const volunteerItems = getInitialVolunteer(profile);

  const handleItemsChange = (items: VolunteerItem[]) => {
    // Derive period for each item if startDate/endDate/current provided
    const normalized = items.map((item) => {
      let derivedPeriod = item.period;
      if (item.startDate || item.endDate || item.current) {
        const start = item.startDate || '';
        const end = item.current ? 'Present' : (item.endDate || '');
        derivedPeriod = start ? (end ? `${start} - ${end}` : start) : end;
      }
      return {
        ...item,
        period: derivedPeriod || item.period
      };
    });

    onUpdateField?.('volunteerExperiences', normalized);
    onUpdateField?.('volunteer', normalized);
  };

  return (
    <SectionRepeater<VolunteerItem>
      title="Volunteer Experience"
      sectionKey="volunteer"
      items={volunteerItems}
      isEditing={isEditing}
      canEdit={canEdit}
      theme={theme}
      addButtonLabel="Add Volunteer Experience"
      emptyPromptText="No volunteer experience added yet."
      onSelectSection={onSelectSection}
      onItemsChange={handleItemsChange}
      createNewItem={() => ({
        id: `vol-${Date.now()}`,
        role: '',
        organization: '',
        cause: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        visible: true
      })}
      renderItemView={(vol) => (
        <div className="flex items-start gap-3.5">
          <div className={`w-9 h-9 rounded-xl ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
            <HeartHandshake className="w-4.5 h-4.5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-xs sm:text-sm font-bold ${theme.textPrimary}`}>
                {vol.role}
              </h3>
              {(vol.period || vol.startDate || vol.endDate) && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.subCardBorder} shrink-0 font-mono`}>
                  {vol.period || `${vol.startDate || ''} - ${vol.current ? 'Present' : (vol.endDate || '')}`}
                </span>
              )}
            </div>

            <p className={`text-xs font-semibold ${theme.accentText}`}>
              {vol.organization}
            </p>

            {(vol.cause || vol.category) && (
              <p className={`text-[10px] ${theme.textMuted} font-mono`}>
                {vol.cause || vol.category}
              </p>
            )}

            {vol.description && (
              <p className={`text-xs ${theme.textSecondary} leading-relaxed pt-1`}>
                {vol.description}
              </p>
            )}
          </div>
        </div>
      )}
      renderItemEdit={(vol, _index, updateItem) => (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <FormLabel required>Role / Title</FormLabel>
              <FormInput
                value={vol.role || ''}
                onChange={(val) => updateItem({ role: val })}
                placeholder="e.g. Volunteer Mentor"
              />
            </div>
            <div>
              <FormLabel required>Organization</FormLabel>
              <FormInput
                value={vol.organization || ''}
                onChange={(val) => updateItem({ organization: val })}
                placeholder="e.g. Red Cross / Local Shelter"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <FormLabel>Cause / Category</FormLabel>
              <FormInput
                value={vol.cause || vol.category || ''}
                onChange={(val) => updateItem({ cause: val, category: val })}
                placeholder="e.g. Education, Environment"
              />
            </div>
            <div>
              <FormLabel>Start Date</FormLabel>
              <FormInput
                value={vol.startDate || ''}
                onChange={(val) => updateItem({ startDate: val })}
                placeholder="e.g. Jun 2021"
              />
            </div>
            <div>
              <FormLabel>End Date</FormLabel>
              <FormInput
                disabled={vol.current}
                value={vol.endDate || ''}
                onChange={(val) => updateItem({ endDate: val })}
                placeholder={vol.current ? 'Present' : 'e.g. Dec 2022'}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id={`vol-current-${vol.id}`}
              checked={Boolean(vol.current)}
              onChange={(e) => updateItem({ current: e.target.checked })}
              className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <label htmlFor={`vol-current-${vol.id}`} className="text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
              I currently volunteer in this role
            </label>
          </div>

          <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea
              rows={2}
              value={vol.description || ''}
              onChange={(val) => updateItem({ description: val })}
              placeholder="What you did or accomplished..."
            />
          </div>
        </div>
      )}
    />
  );
}
