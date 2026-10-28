'use client';

import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { ProfileData } from '../types/profile';
import { ThemeConfig, getThemeConfig } from './themeStyles';
import { FormLabel, FormInput, FormTextarea, SectionSaveBar } from './ui/formControls';

import { getAbout } from '@/lib/profileGetters';

interface AboutSectionProps {
  profile: ProfileData;
  canEdit?: boolean;
  isEditing?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
  theme?: ThemeConfig;
}

export function AboutSection({ 
  profile, 
  canEdit = false, 
  isEditing = false, 
  onUpdateField,
  onSavePartial,
  onSelectSection,
  theme = getThemeConfig(profile.theme || 'elegant')
}: AboutSectionProps) {
  // Local state for editing fields
  const [taglineDraft, setTaglineDraft] = useState(profile.tagline || '');
  const [aboutDraft, setAboutDraft] = useState(getAbout(profile));
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync draft when external profile changes or edit mode toggles
  useEffect(() => {
    setTaglineDraft(profile.tagline || '');
    setAboutDraft(getAbout(profile));
    setSaveStatus('idle');
    setErrorMessage(null);
  }, [profile.tagline, profile.about, profile.fullBio, isEditing]);

  const hasBio = Boolean(getAbout(profile) || profile.tagline);
  const isDirty =
    taglineDraft !== (profile.tagline || '') ||
    aboutDraft !== getAbout(profile);

  if (!hasBio && !canEdit && !isEditing) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    setErrorMessage(null);
    try {
      const payload: Partial<ProfileData> = {
        tagline: taglineDraft.trim(),
        about: aboutDraft.trim(),
        fullBio: aboutDraft.trim()
      };
      if (onSavePartial) {
        await onSavePartial(payload);
      } else {
        onUpdateField?.('tagline', payload.tagline);
        onUpdateField?.('about', payload.about);
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2200);
    } catch (err: any) {
      console.error('Failed to save About section:', err);
      setSaveStatus('error');
      setErrorMessage(err.message || 'Failed to save About story. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTaglineDraft(profile.tagline || '');
    setAboutDraft(profile.about || profile.fullBio || profile.shortBio || '');
    onUpdateField?.('tagline', profile.tagline || '');
    onUpdateField?.('about', profile.about || profile.fullBio || profile.shortBio || '');
    setSaveStatus('idle');
    setErrorMessage(null);
  };

  return (
    <section 
      onClick={() => canEdit && !isEditing && onSelectSection?.('about', 'about')}
      className={`px-4 sm:px-6 md:px-8 py-5 space-y-3.5 text-left border-b ${theme.divider} ${theme.cardBg} transition-all relative ${
        canEdit && !isEditing ? 'cursor-pointer group/about hover:bg-purple-500/[0.04] dark:hover:bg-purple-500/10' : ''
      }`}
      title={canEdit && !isEditing ? 'Click to edit Story & Bio' : undefined}
    >
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
          About
        </h2>
        {canEdit && !isEditing && (
          <span className="opacity-0 group-hover/about:opacity-100 transition-opacity text-[10px] font-mono font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
            <Pencil className="w-2.5 h-2.5" />
            Edit Story
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3.5 pt-1" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-1">
            <FormLabel>Personal Tagline / Motto</FormLabel>
            <FormInput
              type="text"
              value={taglineDraft}
              onChange={(val) => {
                setTaglineDraft(val);
                onUpdateField?.('tagline', val);
              }}
              placeholder="A punchy phrase or personal motto that describes you best..."
            />
          </div>

          <div className="space-y-1">
            <FormLabel>Professional Story / Bio</FormLabel>
            <FormTextarea
              rows={4}
              value={aboutDraft}
              onChange={(val) => {
                setAboutDraft(val);
                onUpdateField?.('about', val);
              }}
              placeholder="Write your background, experience, accomplishments, or philosophy..."
            />
          </div>

          <SectionSaveBar
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving}
            isDirty={isDirty}
            saveStatus={saveStatus}
            errorMessage={errorMessage}
            saveLabel="Save Story"
          />
        </div>
      ) : hasBio ? (
        <div className="space-y-2">
          {profile.tagline && (
            <p className={`text-xs sm:text-sm font-medium italic ${theme.accentText}`}>
              &ldquo;{profile.tagline}&rdquo;
            </p>
          )}
          {getAbout(profile) && (
            <p className={`text-xs sm:text-sm ${theme.textSecondary} leading-relaxed font-normal whitespace-pre-line`}>
              {getAbout(profile)}
            </p>
          )}
        </div>
      ) : (
        <div className={`p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} text-center`}>
          <p className={`text-xs ${theme.textMuted}`}>
            No bio or story added yet.
          </p>
        </div>
      )}
    </section>
  );
}
