'use client';

import React from 'react';
import { Sparkles, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { ProfileData, FeaturedItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { SectionRepeater } from '@/components/ui/SectionRepeater';
import { FormLabel, FormInput, FormTextarea } from '@/components/ui/formControls';

export interface FeaturedSectionProps {
  profile?: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function FeaturedSection({
  profile = {} as ProfileData,
  theme = getThemeConfig(profile.theme || 'editorial'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSavePartial,
  onSelectSection
}: FeaturedSectionProps) {
  const featured: FeaturedItem[] = Array.isArray(profile.featured)
    ? profile.featured
    : [];

  const handleItemsChange = (items: FeaturedItem[]) => {
    onUpdateField?.('featured', items);
  };

  return (
    <SectionRepeater<FeaturedItem>
      title="Featured"
      sectionKey="featured"
      items={featured}
      isEditing={isEditing}
      canEdit={canEdit}
      theme={theme}
      addButtonLabel="Add Featured Item"
      emptyPromptText="No featured items added yet."
      onSelectSection={onSelectSection}
      onItemsChange={handleItemsChange}
      onToggleItemVisibility={(items) => {
        void onSavePartial?.({ featured: items });
      }}
      createNewItem={() => ({
        id: `feat-${Date.now()}`,
        type: 'link',
        title: '',
        url: '',
        image: '',
        description: '',
        visible: true
      })}
      renderItemView={(item) => (
        <div className="flex flex-col @md:flex-row gap-3.5 items-start">
          {item.image && (
            <div className="w-full @md:w-28 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-zinc-700 bg-neutral-100 dark:bg-neutral-800">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h3 className={`text-xs @md:text-sm font-bold break-words ${theme.textPrimary}`}>
                {item.title}
              </h3>
              {item.type && (
                <span className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.subCardBorder} shrink-0`}>
                  {item.type}
                </span>
              )}
            </div>

            {item.description && (
              <p className={`text-xs ${theme.textSecondary} leading-relaxed pt-0.5 break-words`}>
                {item.description}
              </p>
            )}

            {item.url && (
              <a
                href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-[11px] font-medium break-all ${theme.accentText} hover:underline pt-1`}
              >
                <span>View item</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}
          </div>
        </div>
      )}
      renderItemEdit={(item, _index, updateItem) => (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 @md:grid-cols-2 gap-2.5">
            <div>
              <FormLabel required>Title</FormLabel>
              <FormInput
                value={item.title || ''}
                onChange={(val) => updateItem({ title: val })}
                placeholder="e.g. Keynote at TechCrunch Disrupt"
              />
            </div>
            <div>
              <FormLabel>Type</FormLabel>
              <select
                value={item.type || 'link'}
                onChange={(e) => updateItem({ type: e.target.value as any })}
                className="w-full min-h-[44px] h-11 px-3.5 text-base @md:text-sm font-normal rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 cursor-pointer"
              >
                <option value="link">Link</option>
                <option value="post">Post</option>
                <option value="media">Media</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 @md:grid-cols-2 gap-2.5">
            <div>
              <FormLabel>URL</FormLabel>
              <FormInput
                value={item.url || ''}
                onChange={(val) => updateItem({ url: val })}
                placeholder="https://..."
              />
            </div>
            <div>
              <FormLabel>Image URL</FormLabel>
              <FormInput
                value={item.image || ''}
                onChange={(val) => updateItem({ image: val })}
                placeholder="https://... (or data URL)"
              />
            </div>
          </div>

          <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea
              rows={2}
              value={item.description || ''}
              onChange={(val) => updateItem({ description: val })}
              placeholder="Highlight or summary..."
            />
          </div>
        </div>
      )}
    />
  );
}
