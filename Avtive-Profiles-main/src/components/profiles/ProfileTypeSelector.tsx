'use client';

import React from 'react';
import { User, Users } from 'lucide-react';
import { ProfileType, normalizeProfileType } from '@/types/profile';

interface ProfileTypeSelectorProps {
  selectedType: ProfileType;
  onChange: (type: ProfileType) => void;
  className?: string;
}

export const PROFILE_TYPES_CONFIG = [
  {
    type: 'individual' as const,
    title: 'Individual',
    description: 'Personal professional identity & portfolio',
    icon: User
  },
  {
    type: 'team' as const,
    title: 'Team',
    description: 'Organization, agency, or group presence',
    icon: Users
  }
];

export function ProfileTypeSelector({
  selectedType,
  onChange,
  className = ''
}: ProfileTypeSelectorProps) {
  const currentNormalized = normalizeProfileType(selectedType);

  return (
    <div className={`space-y-3 ${className}`}>
      {PROFILE_TYPES_CONFIG.map((option) => {
        const isSelected = currentNormalized === option.type;
        const IconComponent = option.icon;

        return (
          <button
            key={option.type}
            type="button"
            onClick={() => onChange(option.type)}
            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
              isSelected
                ? 'bg-black/[0.03] dark:bg-white/[0.06] border-black dark:border-white shadow-sm'
                : 'bg-white dark:bg-[#18181B] border-[#E4E4E7] dark:border-white/10 hover:border-black/30 dark:hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'bg-black/[0.04] text-black/70 dark:bg-white/10 dark:text-white/70'
                }`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm sm:text-base text-black dark:text-white">
                  {option.title}
                </div>
                <div className="text-xs text-black/60 dark:text-white/60 truncate">
                  {option.description}
                </div>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                isSelected
                  ? 'border-black dark:border-white'
                  : 'border-[#D4D4D8] dark:border-white/30'
              }`}
            >
              {isSelected && (
                <div className="w-2.5 h-2.5 rounded-full bg-black dark:bg-white" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
