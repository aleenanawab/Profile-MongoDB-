'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { ProfileData, OrganizationItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { SectionRepeater } from '@/components/ui/SectionRepeater';
import { FormLabel, FormInput, FormTextarea } from '@/components/ui/formControls';

export interface OrganizationsSectionProps {
  profile?: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function OrganizationsSection({
  profile = {} as ProfileData,
  theme = getThemeConfig(profile.theme || 'editorial'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSelectSection
}: OrganizationsSectionProps) {
  const organizations: OrganizationItem[] = Array.isArray(profile.organizations)
    ? profile.organizations
    : [];

  const handleItemsChange = (items: OrganizationItem[]) => {
    onUpdateField?.('organizations', items);
  };

  return (
    <SectionRepeater<OrganizationItem>
      title="Organizations"
      sectionKey="organizations"
      items={organizations}
      isEditing={isEditing}
      canEdit={canEdit}
      theme={theme}
      addButtonLabel="Add Organization"
      emptyPromptText="No organizations added yet."
      onSelectSection={onSelectSection}
      onItemsChange={handleItemsChange}
      createNewItem={() => ({
        id: `org-${Date.now()}`,
        name: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        visible: true
      })}
      renderItemView={(item) => (
        <div className="flex items-start gap-3.5">
          <div className={`w-9 h-9 rounded-xl ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
            <Users className="w-4.5 h-4.5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-xs sm:text-sm font-bold ${theme.textPrimary}`}>
                {item.name}
              </h3>
              {(item.startDate || item.endDate || item.current) && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.subCardBorder} shrink-0 font-mono`}>
                  {item.startDate || ''} - {item.current ? 'Present' : (item.endDate || '')}
                </span>
              )}
            </div>

            {item.position && (
              <p className={`text-xs font-semibold ${theme.accentText}`}>
                {item.position}
              </p>
            )}

            {item.description && (
              <p className={`text-xs ${theme.textSecondary} leading-relaxed pt-1`}>
                {item.description}
              </p>
            )}
          </div>
        </div>
      )}
      renderItemEdit={(item, _index, updateItem) => (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <FormLabel required>Organization Name</FormLabel>
              <FormInput
                value={item.name || ''}
                onChange={(val) => updateItem({ name: val })}
                placeholder="e.g. ACM / Rotary Club"
              />
            </div>
            <div>
              <FormLabel>Position / Membership Role</FormLabel>
              <FormInput
                value={item.position || ''}
                onChange={(val) => updateItem({ position: val })}
                placeholder="e.g. Member / Board Director"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <FormLabel>Start Date</FormLabel>
              <FormInput
                value={item.startDate || ''}
                onChange={(val) => updateItem({ startDate: val })}
                placeholder="e.g. Jan 2020"
              />
            </div>
            <div>
              <FormLabel>End Date</FormLabel>
              <FormInput
                disabled={item.current}
                value={item.endDate || ''}
                onChange={(val) => updateItem({ endDate: val })}
                placeholder={item.current ? 'Present' : 'e.g. Dec 2022'}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id={`org-current-${item.id}`}
              checked={Boolean(item.current)}
              onChange={(e) => updateItem({ current: e.target.checked })}
              className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <label htmlFor={`org-current-${item.id}`} className="text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
              I am currently active in this organization
            </label>
          </div>

          <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea
              rows={2}
              value={item.description || ''}
              onChange={(val) => updateItem({ description: val })}
              placeholder="Involvement, committees, or responsibilities..."
            />
          </div>
        </div>
      )}
    />
  );
}
