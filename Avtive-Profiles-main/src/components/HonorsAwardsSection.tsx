'use client';

import React from 'react';
import { Award } from 'lucide-react';
import { ProfileData, HonorsAwardItem } from '../types/profile';
import { ThemeConfig, getThemeConfig } from './themeStyles';
import { SectionRepeater } from './ui/SectionRepeater';
import { FormLabel, FormInput, FormTextarea } from './ui/formControls';

export interface HonorsAwardsSectionProps {
  profile?: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function HonorsAwardsSection({
  profile = {} as ProfileData,
  theme = getThemeConfig(profile.theme || 'editorial'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSelectSection
}: HonorsAwardsSectionProps) {
  const honorsAwards: HonorsAwardItem[] = Array.isArray(profile.honorsAwards)
    ? profile.honorsAwards
    : (Array.isArray((profile as any).honors) ? (profile as any).honors : []);

  const handleItemsChange = (items: HonorsAwardItem[]) => {
    onUpdateField?.('honorsAwards', items);
    onUpdateField?.('honors' as any, items);
  };

  return (
    <SectionRepeater<HonorsAwardItem>
      title="Honors & Awards"
      sectionKey="honorsAwards"
      items={honorsAwards}
      isEditing={isEditing}
      canEdit={canEdit}
      theme={theme}
      addButtonLabel="Add Honor / Award"
      emptyPromptText="No honors or awards added yet."
      onSelectSection={onSelectSection}
      onItemsChange={handleItemsChange}
      createNewItem={() => ({
        id: `honor-${Date.now()}`,
        title: '',
        issuer: '',
        date: '',
        description: '',
        visible: true
      })}
      renderItemView={(item) => (
        <div className="flex items-start gap-3.5">
          <div className={`w-9 h-9 rounded-xl ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
            <Award className="w-4.5 h-4.5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-xs sm:text-sm font-bold ${theme.textPrimary}`}>
                {item.title}
              </h3>
              {item.date && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.subCardBorder} shrink-0 font-mono`}>
                  {item.date}
                </span>
              )}
            </div>

            {item.issuer && (
              <p className={`text-xs font-semibold ${theme.accentText}`}>
                {item.issuer}
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
              <FormLabel required>Title / Award Name</FormLabel>
              <FormInput
                value={item.title || ''}
                onChange={(val) => updateItem({ title: val })}
                placeholder="e.g. Innovator of the Year"
              />
            </div>
            <div>
              <FormLabel>Issuing Organization</FormLabel>
              <FormInput
                value={item.issuer || ''}
                onChange={(val) => updateItem({ issuer: val })}
                placeholder="e.g. IEEE / Forbes"
              />
            </div>
          </div>

          <div>
            <FormLabel>Issue Date</FormLabel>
            <FormInput
              value={item.date || ''}
              onChange={(val) => updateItem({ date: val })}
              placeholder="e.g. May 2023"
            />
          </div>

          <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea
              rows={2}
              value={item.description || ''}
              onChange={(val) => updateItem({ description: val })}
              placeholder="Details about the recognition or accomplishment..."
            />
          </div>
        </div>
      )}
    />
  );
}
