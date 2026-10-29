'use client';

import React from 'react';
import { X, Download, FileText, CheckCircle2 } from 'lucide-react';
import { ProfileData } from '@/types/profile';
import { getThemeConfig } from '@/components/ui/themeStyles';

interface ResumeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
}

export function ResumeViewerModal({ isOpen, onClose, profile }: ResumeViewerModalProps) {
  if (!isOpen) return null;
  const theme = getThemeConfig(profile.theme || 'elegant');

  const handleDownload = () => {
    const resumeText = `
=====================================================
${profile.name.toUpperCase()}
${profile.designation}
=====================================================
Organization: ${profile.company || 'Avtive'}
Location:     ${profile.location || 'N/A'}
Contact:      ${profile.email || 'N/A'} | ${profile.phone || 'N/A'}
Website:      ${profile.website || 'https://www.avtive.app'}

EXECUTIVE SUMMARY
-----------------------------------------------------
${profile.fullBio || profile.shortBio || 'No summary provided.'}

CORE COMPETENCIES & SERVICES
-----------------------------------------------------
${profile.skills ? profile.skills.map(s => typeof s === 'string' ? `• ${s}` : `• ${s.name}`).join('\n') : 'N/A'}
${profile.services ? profile.services.map(s => `• ${s.title}`).join('\n') : ''}

PROFESSIONAL EXPERIENCE
-----------------------------------------------------
${profile.experiences ? profile.experiences.map(e => `
* ${e.role || 'Role'} | ${e.company} (${e.period || 'Present'})
  ${e.description || ''}
`).join('\n') : 'N/A'}

EDUCATION & CREDENTIALS
-----------------------------------------------------
${profile.certifications ? profile.certifications.map(c => `• ${c.name} (${c.issuer}, ${c.issued})`).join('\n') : 'N/A'}

=====================================================
Verified Digital Record: Avtive Cloud Platform
Profile URL: https://www.avtive.app/profile/${profile.slug || profile.id}
=====================================================
    `.trim();

    const blob = new Blob([resumeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.slug || 'resume'}-executive-profile.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-left overflow-y-auto">
      <div className={`relative w-full max-w-lg max-h-[85dvh] overflow-y-auto rounded-[32px] ${theme.cardBg} border ${theme.cardBorder} shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 transition-colors`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${theme.divider}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl ${theme.badgeBg} ${theme.accentText} flex items-center justify-center`}>
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${theme.textPrimary}`}>
                Executive Resume
              </h2>
              <p className={`text-xs ${theme.textSecondary}`}>
                {profile.name} • {profile.designation}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full ${theme.textMuted} hover:${theme.textPrimary} ${theme.subCardBg} transition-colors flex items-center justify-center cursor-pointer`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="space-y-4">
          {/* Summary */}
          <div className={`p-4 rounded-2xl ${theme.subCardBg} border ${theme.subCardBorder} space-y-1.5`}>
            <h3 className={`text-xs font-bold ${theme.textPrimary} font-mono uppercase tracking-wider`}>
              Professional Summary
            </h3>
            <p className={`text-xs ${theme.textSecondary} leading-relaxed`}>
              {profile.fullBio || profile.shortBio}
            </p>
          </div>

          {/* Highlights */}
          {profile.skills && (
            <div className={`p-4 rounded-2xl ${theme.subCardBg} border ${theme.subCardBorder} space-y-2`}>
              <h3 className={`text-xs font-bold ${theme.textPrimary} font-mono uppercase tracking-wider`}>
                Core Competencies & Leadership
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {profile.skills.map((skill, idx) => (
                  <div key={idx} className={`flex items-center gap-2 text-xs ${theme.textPrimary}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${theme.accentText} shrink-0`} />
                    <span>{typeof skill === 'string' ? skill : skill.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download Action */}
          <div className="pt-2">
            <button
              onClick={handleDownload}
              className={`w-full min-h-[44px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl ${theme.btnPrimary} font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer`}
            >
              <Download className="w-4 h-4" />
              <span>Download Executive Resume (.TXT)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
