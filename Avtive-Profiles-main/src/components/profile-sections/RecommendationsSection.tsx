'use client';

import React from 'react';
import { Quote } from 'lucide-react';
import { ProfileData, RecommendationItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { SectionRepeater } from '@/components/ui/SectionRepeater';
import { FormLabel, FormInput, FormTextarea } from '@/components/ui/formControls';

export interface RecommendationsSectionProps {
  profile?: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function RecommendationsSection({
  profile = {} as ProfileData,
  theme = getThemeConfig(profile.theme || 'editorial'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSelectSection
}: RecommendationsSectionProps) {
  const recommendations: RecommendationItem[] = Array.isArray(profile.recommendations)
    ? profile.recommendations
    : [];

  const handleItemsChange = (items: RecommendationItem[]) => {
    onUpdateField?.('recommendations', items);
  };

  return (
    <SectionRepeater<RecommendationItem>
      title="Recommendations"
      sectionKey="recommendations"
      items={recommendations}
      isEditing={isEditing}
      canEdit={canEdit}
      theme={theme}
      addButtonLabel="Add Recommendation"
      emptyPromptText="No recommendations added yet."
      onSelectSection={onSelectSection}
      onItemsChange={handleItemsChange}
      createNewItem={() => ({
        id: `rec-${Date.now()}`,
        author: '',
        relationship: '',
        text: '',
        date: '',
        visible: true
      })}
      renderItemView={(rec) => (
        <div className="flex items-start gap-3.5">
          <div className={`w-9 h-9 rounded-xl ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
            <Quote className="w-4.5 h-4.5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-xs sm:text-sm font-bold ${theme.textPrimary}`}>
                {rec.author}
              </h3>
              {rec.date && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.subCardBorder} shrink-0 font-mono`}>
                  {rec.date}
                </span>
              )}
            </div>

            {rec.relationship && (
              <p className={`text-xs font-semibold ${theme.accentText}`}>
                {rec.relationship}
              </p>
            )}

            {rec.text && (
              <p className={`text-xs ${theme.textSecondary} leading-relaxed pt-1 italic`}>
                &ldquo;{rec.text}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}
      renderItemEdit={(rec, _index, updateItem) => (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <FormLabel required>Author / Recommender Name</FormLabel>
              <FormInput
                value={rec.author || ''}
                onChange={(val) => updateItem({ author: val })}
                placeholder="e.g. Sarah Connor, VP of Engineering"
              />
            </div>
            <div>
              <FormLabel>Relationship / Context</FormLabel>
              <FormInput
                value={rec.relationship || ''}
                onChange={(val) => updateItem({ relationship: val })}
                placeholder="e.g. Managed Alex directly at Acme"
              />
            </div>
          </div>

          <div>
            <FormLabel>Date</FormLabel>
            <FormInput
              value={rec.date || ''}
              onChange={(val) => updateItem({ date: val })}
              placeholder="e.g. March 2023"
            />
          </div>

          <div>
            <FormLabel required>Recommendation Text</FormLabel>
            <FormTextarea
              rows={3}
              value={rec.text || ''}
              onChange={(val) => updateItem({ text: val })}
              placeholder="The recommendation quote or testimonial..."
            />
          </div>
        </div>
      )}
    />
  );
}
