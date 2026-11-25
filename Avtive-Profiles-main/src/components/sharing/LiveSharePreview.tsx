'use client';

import React, { useMemo } from 'react';
import {
  Eye,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  GraduationCap,
  Code,
  FolderGit2,
  Award,
  FileText,
  Mic,
  Link2,
  ShieldCheck,
  Sparkles,
  Calendar
} from 'lucide-react';
import { ProfileData } from '@/types/profile';
import { sanitizeProfileForShare } from '@/lib/sharing/sanitize';
import { getTitle, getAbout } from '@/lib/profileGetters';

interface LiveSharePreviewProps {
  profile: ProfileData;
  selectedFields: string[];
}

export function LiveSharePreview({ profile, selectedFields }: LiveSharePreviewProps) {
  const previewProfile = useMemo(
    () => sanitizeProfileForShare(profile, { selectedFields }),
    [profile, selectedFields]
  );

  const sharing = previewProfile.sharingSettings || {};
  const visibleCustomFields = previewProfile.customFields || [];
  const expList = previewProfile.experiences || [];
  const eduList = previewProfile.education || [];
  const projList = previewProfile.projects || [];
  const skillsList = previewProfile.skills || [];
  const socialList = previewProfile.socials || previewProfile.socialLinks || [];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50/90 dark:bg-white/[0.03] overflow-hidden shadow-inner">
      <div className="px-3.5 py-2 border-b border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          Recipient Live Preview
        </span>
        <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Hidden &amp; Never Share omitted
        </span>
      </div>

      {/* Simulated sanitized card */}
      <div className="p-3.5 space-y-3 text-left">
        {/* Optional Cover Bar */}
        {(sharing as any).coverImage && previewProfile.coverImage && (
          <div className="h-16 w-full rounded-xl overflow-hidden bg-slate-800 border border-slate-200 dark:border-white/10">
            <img
              src={previewProfile.coverImage}
              alt="Shared cover"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header Row */}
        <div className="flex items-center gap-3">
          {sharing.photo && previewProfile.avatar ? (
            <img
              src={previewProfile.avatar}
              alt={previewProfile.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-white/15 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300 shrink-0">
              {previewProfile.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {previewProfile.name}
              </h4>
              {previewProfile.pronouns && sharing.pronouns && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  ({previewProfile.pronouns})
                </span>
              )}
            </div>
            {(sharing as any).title && getTitle(previewProfile) && (
              <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                {getTitle(previewProfile)}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {sharing.bio && getAbout(previewProfile) && (
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed bg-white dark:bg-black/20 p-2.5 rounded-xl border border-slate-200/70 dark:border-white/10">
            {getAbout(previewProfile)}
          </p>
        )}

        {/* Intro Media */}
        {sharing.introductionMedia && previewProfile.introductionMedia?.url && (
          <div className="flex items-center gap-2 text-[11px] font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1.5 rounded-lg">
            <Mic className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Included: {previewProfile.introductionMedia.title || `${previewProfile.introductionMedia.type} introduction`}
            </span>
          </div>
        )}

        {/* Contact Chips */}
        {sharing.contactInfo && (
          <div className="flex flex-wrap gap-1.5">
            {sharing.email && previewProfile.email && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] text-slate-700 dark:text-slate-200">
                <Mail className="w-3 h-3 text-rose-500" />
                {previewProfile.email}
              </span>
            )}
            {sharing.phone && previewProfile.phone && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] text-slate-700 dark:text-slate-200">
                <Phone className="w-3 h-3 text-emerald-500" />
                {previewProfile.phone}
              </span>
            )}
            {(sharing as any).website && previewProfile.website && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] text-slate-700 dark:text-slate-200">
                <Globe className="w-3 h-3 text-amber-500" />
                {previewProfile.website}
              </span>
            )}
            {(sharing as any).location && previewProfile.location && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] text-slate-700 dark:text-slate-200">
                <MapPin className="w-3 h-3 text-blue-500" />
                {previewProfile.location}
              </span>
            )}
            {sharing.birthday && previewProfile.birthday && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300">
                <Calendar className="w-3 h-3" />
                {previewProfile.birthday}
              </span>
            )}
          </div>
        )}

        {/* Section Summaries */}
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {sharing.socialLinks && socialList.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-200">
              <Link2 className="w-3 h-3" />
              {socialList.length} Socials
            </span>
          )}
          {sharing.skills && skillsList.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-200">
              <Code className="w-3 h-3" />
              {skillsList.length} Skills
            </span>
          )}
          {sharing.experience && expList.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-200">
              <Briefcase className="w-3 h-3" />
              {expList.length} Roles
            </span>
          )}
          {sharing.education && eduList.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-200">
              <GraduationCap className="w-3 h-3" />
              {eduList.length} Education
            </span>
          )}
          {sharing.projects && projList.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-200">
              <FolderGit2 className="w-3 h-3" />
              {projList.length} Projects
            </span>
          )}
          {sharing.certifications && (previewProfile.certifications?.length || 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-200">
              <Award className="w-3 h-3" />
              {previewProfile.certifications?.length} Certs
            </span>
          )}
          {sharing.resume && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 font-semibold">
              <FileText className="w-3 h-3" />
              CV / Resume
            </span>
          )}
        </div>

        {/* Custom Fields Authorized */}
        {visibleCustomFields.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-white/5">
            {visibleCustomFields.map((cf) => (
              <div
                key={cf.id}
                className="flex items-center justify-between gap-2 text-[11px] bg-white dark:bg-white/5 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-white/10"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 truncate">
                  <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
                  {cf.label || (cf as any).title}
                </span>
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                  {cf.value || (cf as any).content}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
