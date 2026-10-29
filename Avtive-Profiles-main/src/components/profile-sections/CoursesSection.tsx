'use client';

import React from 'react';
import { GraduationCap } from 'lucide-react';
import { ProfileData, CourseItem } from '@/types/profile';
import { ThemeConfig, getThemeConfig } from '@/components/ui/themeStyles';
import { SectionRepeater } from '@/components/ui/SectionRepeater';
import { FormLabel, FormInput } from '@/components/ui/formControls';

export interface CoursesSectionProps {
  profile?: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

export function CoursesSection({
  profile = {} as ProfileData,
  theme = getThemeConfig(profile.theme || 'editorial'),
  canEdit = false,
  isEditing = false,
  onUpdateField,
  onSelectSection
}: CoursesSectionProps) {
  const courses: CourseItem[] = Array.isArray(profile.courses)
    ? profile.courses
    : [];

  const handleItemsChange = (items: CourseItem[]) => {
    onUpdateField?.('courses', items);
  };

  return (
    <SectionRepeater<CourseItem>
      title="Courses"
      sectionKey="courses"
      items={courses}
      isEditing={isEditing}
      canEdit={canEdit}
      theme={theme}
      addButtonLabel="Add Course"
      emptyPromptText="No courses added yet."
      onSelectSection={onSelectSection}
      onItemsChange={handleItemsChange}
      createNewItem={() => ({
        id: `course-${Date.now()}`,
        name: '',
        number: '',
        associatedWith: '',
        visible: true
      })}
      renderItemView={(item) => (
        <div className="flex items-start gap-3.5">
          <div className={`w-9 h-9 rounded-xl ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
            <GraduationCap className="w-4.5 h-4.5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-xs sm:text-sm font-bold ${theme.textPrimary}`}>
                {item.name}
              </h3>
              {item.number && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} border ${theme.subCardBorder} shrink-0 font-mono`}>
                  {item.number}
                </span>
              )}
            </div>

            {item.associatedWith && (
              <p className={`text-xs font-semibold ${theme.accentText}`}>
                Associated with: {item.associatedWith}
              </p>
            )}
          </div>
        </div>
      )}
      renderItemEdit={(item, _index, updateItem) => (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <FormLabel required>Course Name</FormLabel>
              <FormInput
                value={item.name || ''}
                onChange={(val) => updateItem({ name: val })}
                placeholder="e.g. Advanced Operating Systems"
              />
            </div>
            <div>
              <FormLabel>Course Number / Code</FormLabel>
              <FormInput
                value={item.number || ''}
                onChange={(val) => updateItem({ number: val })}
                placeholder="e.g. CS 6210"
              />
            </div>
          </div>

          <div>
            <FormLabel>Associated With (School / Degree / Organization)</FormLabel>
            <FormInput
              value={item.associatedWith || ''}
              onChange={(val) => updateItem({ associatedWith: val })}
              placeholder="e.g. Stanford University - M.S. Computer Science"
            />
          </div>
        </div>
      )}
    />
  );
}
