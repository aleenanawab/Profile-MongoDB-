'use client';

import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { ProfileData } from '../types/profile';
import { getThemeConfig } from './themeStyles';

interface ResumeSectionProps {
  profile: ProfileData;
  onOpenResumeModal?: () => void;
}

export function ResumeSection({ profile, onOpenResumeModal }: ResumeSectionProps) {
  if (!profile.resumeUrl && !profile.resumeFileName) {
    return null;
  }

  const theme = getThemeConfig(profile.theme || 'elegant');

  return (
    <section className={`px-6 sm:px-8 py-5 text-left ${theme.cardBg} border-b ${theme.divider} transition-colors`}>
      <h2 className={`text-xs font-bold uppercase tracking-wider ${theme.textPrimary} font-mono mb-3`}>
        Credentials & Resume
      </h2>

      <div
        onClick={onOpenResumeModal}
        className={`cursor-pointer group flex items-center justify-between p-4 sm:p-5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} ${theme.hoverBorder} transition-all shadow-2xs hover:shadow-md`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`w-10 h-10 rounded-xl ${theme.badgeBg} ${theme.accentText} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className={`text-sm font-bold ${theme.textPrimary} group-hover:${theme.accentText} transition-colors`}>
              Professional Resume
            </h3>
            <p className={`text-[11px] ${theme.textSecondary} truncate font-medium`}>
              Credentials • Background • Track Record
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-1 text-xs font-bold ${theme.textPrimary} shrink-0 ml-3`}>
          <span>View Resume</span>
          <ArrowRight className={`w-3.5 h-3.5 group-hover:translate-x-1 transition-transform ${theme.accentText}`} />
        </div>
      </div>
    </section>
  );
}
