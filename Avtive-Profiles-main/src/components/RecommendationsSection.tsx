'use client';

import React from 'react';
import { ProfileData, RecommendationItem } from '../types/profile';
import { ThemeConfig } from './themeStyles';

export interface RecommendationsSectionProps {
  profile?: ProfileData;
  theme?: ThemeConfig;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
}

/**
 * RecommendationsSection
 * Removed from visible and navigable sections per project requirements.
 * Retains component signature to safely handle legacy calls without errors.
 */
export function RecommendationsSection(_props?: RecommendationsSectionProps) {
  return null;
}
