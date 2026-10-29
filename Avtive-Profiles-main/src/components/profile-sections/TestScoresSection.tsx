'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ProfileData, TestScoreItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { SectionRepeater } from '@/components/ui/SectionRepeater';
import { FormLabel, FormInput, FormTextarea } from '@/components/ui/formControls';

export interface TestScoresSectionProps {
  profile?: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function TestScoresSection({
  profile = {} as ProfileData,
  theme = getThemeConfig(profile.theme || 'editorial'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSelectSection
}: TestScoresSectionProps) {
  const testScores: TestScoreItem[] = Array.isArray(profile.testScores)
    ? profile.testScores
    : [];

  const handleItemsChange = (items: TestScoreItem[]) => {
    onUpdateField?.('testScores', items);
  };

  return (
    <SectionRepeater<TestScoreItem>
      title="Test Scores"
      sectionKey="testScores"
      items={testScores}
      isEditing={isEditing}
      canEdit={canEdit}
      theme={theme}
      addButtonLabel="Add Test Score"
      emptyPromptText="No test scores added yet."
      onSelectSection={onSelectSection}
      onItemsChange={handleItemsChange}
      createNewItem={() => ({
        id: `test-${Date.now()}`,
        name: '',
        score: '',
        date: '',
        description: '',
        visible: true
      })}
      renderItemView={(item) => (
        <div className="flex items-start gap-3.5">
          <div className={`w-9 h-9 rounded-xl ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-xs sm:text-sm font-bold ${theme.textPrimary}`}>
                {item.name}
              </h3>
              {item.score && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.subCardBorder} shrink-0 font-mono`}>
                  Score: {item.score}
                </span>
              )}
            </div>

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
          </div>
        </div>
      )}
      renderItemEdit={(item, _index, updateItem) => (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <FormLabel required>Test / Exam Name</FormLabel>
              <FormInput
                value={item.name || ''}
                onChange={(val) => updateItem({ name: val })}
                placeholder="e.g. GRE / GMAT / TOEFL"
              />
            </div>
            <div>
              <FormLabel required>Score</FormLabel>
              <FormInput
                value={item.score || ''}
                onChange={(val) => updateItem({ score: val })}
                placeholder="e.g. 330 / 115"
              />
            </div>
          </div>

          <div>
            <FormLabel>Test Date</FormLabel>
            <FormInput
              value={item.date || ''}
              onChange={(val) => updateItem({ date: val })}
              placeholder="e.g. Nov 2022"
            />
          </div>

          <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea
              rows={2}
              value={item.description || ''}
              onChange={(val) => updateItem({ description: val })}
              placeholder="Percentiles, sections, or additional details..."
            />
          </div>
        </div>
      )}
    />
  );
}
