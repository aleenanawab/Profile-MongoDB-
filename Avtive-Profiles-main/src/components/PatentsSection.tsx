'use client';

import React from 'react';
import { Lightbulb, ExternalLink } from 'lucide-react';
import { ProfileData, PatentItem } from '../types/profile';
import { ThemeConfig, getThemeConfig } from './themeStyles';
import { SectionRepeater } from './ui/SectionRepeater';
import { FormLabel, FormInput, FormTextarea } from './ui/formControls';

export interface PatentsSectionProps {
  profile?: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function PatentsSection({
  profile = {} as ProfileData,
  theme = getThemeConfig(profile.theme || 'editorial'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSelectSection
}: PatentsSectionProps) {
  const patents: PatentItem[] = Array.isArray(profile.patents)
    ? profile.patents
    : [];

  const handleItemsChange = (items: PatentItem[]) => {
    onUpdateField?.('patents', items);
  };

  return (
    <SectionRepeater<PatentItem>
      title="Patents"
      sectionKey="patents"
      items={patents}
      isEditing={isEditing}
      canEdit={canEdit}
      theme={theme}
      addButtonLabel="Add Patent"
      emptyPromptText="No patents added yet."
      onSelectSection={onSelectSection}
      onItemsChange={handleItemsChange}
      createNewItem={() => ({
        id: `patent-${Date.now()}`,
        title: '',
        office: '',
        number: '',
        status: 'Issued',
        date: '',
        url: '',
        description: '',
        visible: true
      })}
      renderItemView={(item) => (
        <div className="flex items-start gap-3.5">
          <div className={`w-9 h-9 rounded-xl ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
            <Lightbulb className="w-4.5 h-4.5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-xs sm:text-sm font-bold ${theme.textPrimary}`}>
                {item.title}
              </h3>
              {item.status && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.subCardBorder} shrink-0 font-mono`}>
                  {item.status}
                </span>
              )}
            </div>

            <p className={`text-xs font-semibold ${theme.accentText}`}>
              {[item.office, item.number].filter(Boolean).join(' • ')}
            </p>

            {item.date && (
              <p className={`text-[10px] ${theme.textMuted} font-mono`}>
                {item.date}
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
                <span>View patent</span>
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
              <FormLabel required>Patent Title</FormLabel>
              <FormInput
                value={item.title || ''}
                onChange={(val) => updateItem({ title: val })}
                placeholder="e.g. Adaptive Caching for Graph Databases"
              />
            </div>
            <div>
              <FormLabel>Patent Office</FormLabel>
              <FormInput
                value={item.office || ''}
                onChange={(val) => updateItem({ office: val })}
                placeholder="e.g. USPTO / EPO"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <FormLabel>Application / Patent Number</FormLabel>
              <FormInput
                value={item.number || ''}
                onChange={(val) => updateItem({ number: val })}
                placeholder="e.g. US 11,234,567"
              />
            </div>
            <div>
              <FormLabel>Status</FormLabel>
              <FormInput
                value={item.status || ''}
                onChange={(val) => updateItem({ status: val })}
                placeholder="e.g. Issued / Pending"
              />
            </div>
            <div>
              <FormLabel>Issue / Filing Date</FormLabel>
              <FormInput
                value={item.date || ''}
                onChange={(val) => updateItem({ date: val })}
                placeholder="e.g. Aug 2021"
              />
            </div>
          </div>

          <div>
            <FormLabel>Patent URL</FormLabel>
            <FormInput
              value={item.url || ''}
              onChange={(val) => updateItem({ url: val })}
              placeholder="https://patents.google.com/..."
            />
          </div>

          <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea
              rows={2}
              value={item.description || ''}
              onChange={(val) => updateItem({ description: val })}
              placeholder="Brief summary of the invention..."
            />
          </div>
        </div>
      )}
    />
  );
}
