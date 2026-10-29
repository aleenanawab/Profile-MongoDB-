'use client';

import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { ProfileData, PublicationItem } from '../types/profile';
import { ThemeConfig, getThemeConfig } from './themeStyles';
import { SectionRepeater } from './ui/SectionRepeater';
import { FormLabel, FormInput, FormTextarea } from './ui/formControls';

export interface PublicationsSectionProps {
  profile?: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function PublicationsSection({
  profile = {} as ProfileData,
  theme = getThemeConfig(profile.theme || 'editorial'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSelectSection
}: PublicationsSectionProps) {
  const publications: PublicationItem[] = Array.isArray(profile.publications)
    ? profile.publications
    : [];

  const handleItemsChange = (items: PublicationItem[]) => {
    onUpdateField?.('publications', items);
  };

  return (
    <SectionRepeater<PublicationItem>
      title="Publications"
      sectionKey="publications"
      items={publications}
      isEditing={isEditing}
      canEdit={canEdit}
      theme={theme}
      addButtonLabel="Add Publication"
      emptyPromptText="No publications added yet."
      onSelectSection={onSelectSection}
      onItemsChange={handleItemsChange}
      createNewItem={() => ({
        id: `pub-${Date.now()}`,
        title: '',
        publisher: '',
        date: '',
        url: '',
        description: '',
        visible: true
      })}
      renderItemView={(item) => (
        <div className="flex items-start gap-3.5">
          <div className={`w-9 h-9 rounded-xl ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
            <BookOpen className="w-4.5 h-4.5" />
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

            {item.publisher && (
              <p className={`text-xs font-semibold ${theme.accentText}`}>
                {item.publisher}
              </p>
            )}

            {item.description && (
              <p className={`text-xs ${theme.textSecondary} leading-relaxed pt-1`}>
                {item.description}
              </p>
            )}

            {item.url && (
              <a
                href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-[11px] font-medium ${theme.accentText} hover:underline pt-1`}
              >
                <span>View publication</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
      renderItemEdit={(item, _index, updateItem) => (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <FormLabel required>Publication Title</FormLabel>
              <FormInput
                value={item.title || ''}
                onChange={(val) => updateItem({ title: val })}
                placeholder="e.g. Distributed Consensus in Cloud Systems"
              />
            </div>
            <div>
              <FormLabel>Publisher / Journal</FormLabel>
              <FormInput
                value={item.publisher || ''}
                onChange={(val) => updateItem({ publisher: val })}
                placeholder="e.g. ACM / Nature"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <FormLabel>Publication Date</FormLabel>
              <FormInput
                value={item.date || ''}
                onChange={(val) => updateItem({ date: val })}
                placeholder="e.g. Oct 2022"
              />
            </div>
            <div>
              <FormLabel>Publication URL</FormLabel>
              <FormInput
                value={item.url || ''}
                onChange={(val) => updateItem({ url: val })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea
              rows={2}
              value={item.description || ''}
              onChange={(val) => updateItem({ description: val })}
              placeholder="Abstract or summary of the publication..."
            />
          </div>
        </div>
      )}
    />
  );
}
