import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { ProfileData, ProjectItem } from '@/types/profile';
import { getThemeConfig } from '@/components/ui/themeStyles';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem | null;
  profile?: ProfileData;
}

export function ProjectDetailModal({ isOpen, onClose, project, profile }: ProjectDetailModalProps) {
  if (!isOpen || !project) return null;
  const theme = getThemeConfig(profile?.theme || 'elegant');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-left overflow-y-auto">
      <div className={`relative w-full max-w-lg max-h-[85dvh] overflow-y-auto rounded-[32px] ${theme.cardBg} border ${theme.cardBorder} shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 transition-colors`}>
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${theme.badgeBg} ${theme.badgeText} border ${theme.subCardBorder} font-mono`}>
            {project.category}
          </span>

          <button
            onClick={onClose}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full ${theme.textMuted} hover:${theme.textPrimary} ${theme.subCardBg} transition-colors flex items-center justify-center cursor-pointer`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Cover Image */}
        {project.coverImage && (
          <div className={`relative h-44 sm:h-56 w-full rounded-2xl overflow-hidden shadow-md ${theme.coverFallback}`}>
            <img
              src={project.coverImage}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Project Content */}
        <div className="space-y-3">
          <div>
            <h2 className={`text-xl font-extrabold ${theme.textPrimary}`}>
              {project.title}
            </h2>
            {project.tagline && (
              <p className={`text-xs ${theme.accentText} font-semibold mt-0.5`}>
                {project.tagline}
              </p>
            )}
          </div>

          <p className={`text-xs sm:text-sm ${theme.textSecondary} leading-relaxed`}>
            {project.description}
          </p>

          {/* Metadata Grid */}
          <div className={`grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl ${theme.subCardBg} border ${theme.subCardBorder} text-xs`}>
            {project.client && (
              <div className="space-y-0.5">
                <span className={`text-[10px] ${theme.textMuted} font-mono`}>CLIENT</span>
                <p className={`font-bold ${theme.textPrimary}`}>{project.client}</p>
              </div>
            )}
            {project.year && (
              <div className="space-y-0.5">
                <span className={`text-[10px] ${theme.textMuted} font-mono`}>TIMELINE</span>
                <p className={`font-bold ${theme.textPrimary}`}>{project.year}</p>
              </div>
            )}
            {project.technology && (
              <div className={`col-span-2 space-y-0.5 border-t ${theme.divider} pt-2 mt-1`}>
                <span className={`text-[10px] ${theme.textMuted} font-mono`}>CORE STACK</span>
                <p className={`font-bold ${theme.textPrimary}`}>{project.technology}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {project.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${theme.subCardBg} ${theme.textPrimary} border ${theme.subCardBorder}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {project.liveUrl && (
            <div className="pt-3">
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full min-h-[44px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl ${theme.btnPrimary} font-bold text-xs shadow-xs transition-all active:scale-95`}
              >
                <span>Visit Live Platform</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
