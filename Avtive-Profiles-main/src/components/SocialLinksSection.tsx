'use client';

import React from 'react';
import { Globe, Mail, ArrowUpRight, Plus, X } from 'lucide-react';
import { ProfileData, SocialLink } from '../types/profile';
import { LinkedInIcon, TwitterXIcon, GithubIcon, InstagramIcon, FacebookIcon, BehanceIcon } from './BrandIcons';
import { getThemeConfig, ThemeConfig } from './themeStyles';
import { FormLabel, FormInput, SectionSaveBar } from './ui/formControls';

interface SocialLinksSectionProps {
  profile: ProfileData;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionId: string) => void;
}

const AVAILABLE_PLATFORMS: SocialLink['platform'][] = [
  'linkedin',
  'github',
  'twitter',
  'instagram',
  'facebook',
  'behance',
  'whatsapp',
  'email',
  'website'
];

const getInitialSocials = (profile: ProfileData): SocialLink[] => {
  const raw = (Array.isArray(profile.socials) && profile.socials.length > 0)
    ? profile.socials
    : (Array.isArray(profile.socialLinks) && profile.socialLinks.length > 0
    ? (profile.socialLinks as unknown as SocialLink[])
    : []);
  return raw.map((s: any) => ({
    platform: s.platform || 'website',
    url: s.url || '',
    label: s.label || s.title || '',
    visible: s.visible !== false
  }));
};

export function SocialLinksSection({ 
  profile, 
  canEdit = false, 
  isEditing = false,
  onUpdateField,
  onSavePartial,
  onSelectSection 
}: SocialLinksSectionProps) {
  const theme = getThemeConfig(profile.theme || 'elegant');

  const [socialsDraft, setSocialsDraft] = React.useState<SocialLink[]>(getInitialSocials(profile));
  const [snapshot, setSnapshot] = React.useState<SocialLink[]>(getInitialSocials(profile));
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  React.useEffect(() => {
    const next = getInitialSocials(profile);
    setSocialsDraft(next);
    setSnapshot(next);
  }, [profile.id, profile.socials, profile.socialLinks]);

  const isDirty = JSON.stringify(socialsDraft) !== JSON.stringify(snapshot);

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = {
        socials: socialsDraft,
        socialLinks: socialsDraft,
      };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      onUpdateField?.('socials', socialsDraft);
      onUpdateField?.('socialLinks', socialsDraft);
      setSnapshot(socialsDraft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save social links');
    }
  };

  const handleCancel = () => {
    setSocialsDraft(snapshot);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return <LinkedInIcon className={`w-4 h-4 ${theme.accentText}`} />;
      case 'behance':
        return <BehanceIcon className={`w-4 h-4 ${theme.accentText}`} />;
      case 'instagram':
        return <InstagramIcon className={`w-4 h-4 ${theme.accentText}`} />;
      case 'facebook':
        return <FacebookIcon className={`w-4 h-4 ${theme.accentText}`} />;
      case 'twitter':
      case 'x':
        return <TwitterXIcon className={`w-4 h-4 ${theme.accentText}`} />;
      case 'github':
        return <GithubIcon className={`w-4 h-4 ${theme.accentText}`} />;
      case 'email':
        return <Mail className={`w-4 h-4 ${theme.accentText}`} />;
      default:
        return <Globe className={`w-4 h-4 ${theme.accentText}`} />;
    }
  };

  const handleAddLink = () => {
    const newLink: SocialLink = {
      platform: 'website',
      url: '',
      label: 'Portfolio',
      visible: true
    };
    setSocialsDraft((prev) => [...prev, newLink]);
  };

  const handleUpdateLink = (index: number, updates: Partial<SocialLink>) => {
    setSocialsDraft((prev) => prev.map((link, idx) => (idx === index ? { ...link, ...updates } : link)));
  };

  const handleRemoveLink = (index: number) => {
    setSocialsDraft((prev) => prev.filter((_, idx) => idx !== index));
  };

  const renderedLinks = isEditing
    ? socialsDraft
    : socialsDraft.filter((item) => {
        if (item.visible === false) return false;
        const u = (item.url || '').trim();
        return u !== '' && u !== 'https://' && u !== 'http://';
      });

  if (renderedLinks.length === 0 && !canEdit && !isEditing) {
    return null;
  }

  return (
    <section 
      onClick={() => canEdit && !isEditing && onSelectSection?.('socialLinks')}
      className={`px-4 sm:px-6 md:px-8 py-5 space-y-3.5 text-left ${theme.cardBg} border-b ${theme.divider} transition-colors ${
        canEdit && !isEditing && onSelectSection ? 'cursor-pointer hover:bg-accent/5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
          Social & Professional Links
        </h2>
        {isEditing ? (
          <button
            type="button"
            onClick={handleAddLink}
            className={`flex items-center gap-1 text-[11px] font-bold ${theme.accentText} hover:underline cursor-pointer`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>
        ) : (
          canEdit && onSelectSection && (
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded font-medium">
              Click to edit
            </span>
          )
        )}
      </div>

      {renderedLinks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {renderedLinks.map((item, idx) => {
            if (isEditing) {
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} space-y-2.5 shadow-2xs relative`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${theme.badgeBg} flex items-center justify-center shrink-0 border ${theme.cardBorder}`}>
                        {getPlatformIcon(item.platform)}
                      </div>
                      <select
                        value={item.platform}
                        onChange={(e) => handleUpdateLink(idx, { platform: e.target.value as any })}
                        className={`text-xs font-semibold h-8 px-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/70 ${theme.textPrimary}`}
                      >
                        {AVAILABLE_PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Remove link"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <FormLabel>Label</FormLabel>
                      <FormInput
                        value={item.label || ''}
                        onChange={(val) => handleUpdateLink(idx, { label: val })}
                        placeholder="e.g. LinkedIn, Portfolio"
                      />
                    </div>
                    <div>
                      <FormLabel required>Link URL</FormLabel>
                      <FormInput
                        type="url"
                        value={item.url || ''}
                        onChange={(val) => handleUpdateLink(idx, { url: val })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              );
            }

            const handleText: string = ('handle' in item && typeof (item as any).handle === 'string' && (item as any).handle)
              ? (item as any).handle
              : (item.url ? item.url.replace(/^https?:\/\//, '') : '');

            return (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between p-3.5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} ${theme.hoverBorder} transition-colors group shadow-2xs`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl ${theme.badgeBg} flex items-center justify-center shrink-0 border ${theme.cardBorder} shadow-2xs`}>
                    {getPlatformIcon(item.platform)}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className={`text-xs font-bold ${theme.textPrimary}`}>
                      {item.label || item.platform}
                    </p>
                    <p className={`text-[11px] ${theme.textSecondary} truncate font-medium`}>
                      {handleText}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className={`w-4 h-4 ${theme.textMuted} group-hover:${theme.accentText} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2`} />
              </a>
            );
          })}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-center space-y-2`}>
          <p className={`text-xs ${theme.textMuted}`}>
            No social or professional links added yet.
          </p>
          {isEditing && (
            <button
              type="button"
              onClick={handleAddLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed ${theme.cardBorder} text-xs font-bold ${theme.accentText} hover:opacity-80 cursor-pointer`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add your first link</span>
            </button>
          )}
        </div>
      )}

      {isEditing && (
        <SectionSaveBar
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={saveStatus === 'saving'}
          isSaved={saveStatus === 'saved'}
          isDirty={isDirty}
          errorMessage={errorMessage}
          saveLabel="Save Social Links"
          cancelLabel="Cancel"
          className="pt-1"
        />
      )}
    </section>
  );
}
