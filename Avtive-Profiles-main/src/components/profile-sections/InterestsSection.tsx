'use client';

import React from 'react';
import { Compass, ExternalLink } from 'lucide-react';
import { ProfileData, InterestItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { SectionRepeater } from '@/components/ui/SectionRepeater';
import { FormLabel, FormInput } from '@/components/ui/formControls';

export interface InterestsSectionProps {
  profile?: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function InterestsSection({
  profile = {} as ProfileData,
  theme = getThemeConfig(profile.theme || 'editorial'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSelectSection
}: InterestsSectionProps) {
  const interests: InterestItem[] = Array.isArray(profile.interests)
    ? profile.interests
    : [];

  const handleItemsChange = (items: InterestItem[]) => {
    onUpdateField?.('interests', items);
  };

  return (
    <SectionRepeater<InterestItem>
      title="Interests"
      sectionKey="interests"
      items={interests}
      isEditing={isEditing}
      canEdit={canEdit}
      theme={theme}
      addButtonLabel="Add Interest"
      emptyPromptText="No interests added yet."
      onSelectSection={onSelectSection}
      onItemsChange={handleItemsChange}
      createNewItem={() => ({
        id: `int-${Date.now()}`,
        name: '',
        type: 'topic',
        url: '',
        visible: true
      })}
      renderItemView={(item) => (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0 border ${theme.cardBorder}`}>
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-xs sm:text-sm font-semibold truncate ${theme.textPrimary}`}>
                {item.name}
              </h3>
              {item.type && (
                <span className={`text-[10px] uppercase font-mono font-bold tracking-wider ${theme.textMuted}`}>
                  {item.type}
                </span>
              )}
            </div>
          </div>

          {item.url && (
            <a
              href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 rounded-lg text-neutral-400 hover:text-primary transition-colors shrink-0`}
              title="Visit link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}
      renderItemEdit={(item, _index, updateItem) => (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <FormLabel required>Interest Name</FormLabel>
              <FormInput
                value={item.name || ''}
                onChange={(val) => updateItem({ name: val })}
                placeholder="e.g. Artificial Intelligence / Satya Nadella"
              />
            </div>
            <div>
              <FormLabel>Interest Type</FormLabel>
              <select
                value={item.type || 'topic'}
                onChange={(e) => updateItem({ type: e.target.value as any })}
                className="w-full min-h-[44px] h-11 px-3.5 text-base sm:text-sm font-normal rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
              >
                <option value="topic">Topic</option>
                <option value="company">Company</option>
                <option value="person">Person / Influencer</option>
                <option value="group">Group / Community</option>
              </select>
            </div>
          </div>

          <div>
            <FormLabel>URL</FormLabel>
            <FormInput
              value={item.url || ''}
              onChange={(val) => updateItem({ url: val })}
              placeholder="https://..."
            />
          </div>
        </div>
      )}
    />
  );
}
