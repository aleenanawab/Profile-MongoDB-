'use client';

import React, { useRef, useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
  User,
  Image as ImageIcon
} from 'lucide-react';
import { ProfileData, ProfileTheme } from '@/types/profile';
import { ThemeConfig, PROFILE_THEMES } from '@/components/ui/themeStyles';
import { FormInput, FormLabel } from '@/components/ui/formControls';
import { compressImageFile, uploadImageToStorage } from '@/lib/imageCompression';
import { ProfileIntroductionMediaSection } from '@/components/profile-sections/ProfileIntroductionMedia';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';

interface IdentityEditorCardProps {
  profile: ProfileData;
  theme: ThemeConfig;
  activeTheme: ProfileTheme;
  onUpdateField: <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => void;
  onShowToast?: (msg: string) => void;
}

export function IdentityEditorCard({
  profile,
  theme,
  activeTheme,
  onUpdateField,
  onShowToast
}: IdentityEditorCardProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const avatarSrc = profile.avatar || (profile as any).logoUrl || '';
  const coverSrc = profile.coverImage || (profile as any).coverUrl || '';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (e.target) e.target.value = '';

    setIsUploadingAvatar(true);
    try {
      const { file: compressedFile } = await compressImageFile(file);
      const url = await uploadImageToStorage(compressedFile, 'avatars', {
        profileId: profile.id || profile.slug,
        field: 'avatar'
      });
      onUpdateField('avatar', url);
      onShowToast?.('Profile photo updated');
    } catch (err: unknown) {
      onShowToast?.(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (e.target) e.target.value = '';

    setIsUploadingCover(true);
    try {
      const { file: compressedFile } = await compressImageFile(file);
      const url = await uploadImageToStorage(compressedFile, 'profiles', {
        profileId: profile.id || profile.slug,
        field: 'coverImage'
      });
      onUpdateField('coverImage', url);
      onShowToast?.('Cover image updated');
    } catch (err: unknown) {
      onShowToast?.(err instanceof Error ? err.message : 'Failed to upload cover');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const headlineValue = profile.professionalTitle || profile.designation || profile.profession || '';

  return (
    <section
      aria-label="Profile identity"
      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] p-4 space-y-4 transition-colors"
    >
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={handleAvatarChange}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={handleCoverChange}
      />

      {/* Avatar + Quick Photo Actions */}
      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0">
          <div
            onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
            className="w-16 h-16 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 cursor-pointer relative group"
            title="Upload profile photo"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={profile.name || 'Profile photo'}
                onError={(e) => {
                  if (!e.currentTarget.dataset.fallbackApplied) {
                    e.currentTarget.dataset.fallbackApplied = '1';
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <User className="w-7 h-7" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              {isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
            aria-label="Change profile photo"
            title="Change profile photo"
            className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-black text-white dark:bg-white dark:text-black border border-white dark:border-black flex items-center justify-center shadow-xs cursor-pointer"
          >
            {isUploadingAvatar ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Camera className="w-3 h-3" />
            )}
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-white truncate">
              Profile Identity
            </h3>
            {avatarSrc && (
              <button
                type="button"
                onClick={() => onUpdateField('avatar', '')}
                className="text-xs font-medium text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove photo</span>
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Update your name, headline, company, and location.
          </p>
        </div>
      </div>

      {/* Primary Identity Fields (Name, Headline, Company, Location) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FormLabel htmlFor="p3-identity-name" required>
            Name
          </FormLabel>
          <FormInput
            value={profile.name || ''}
            onChange={(val) => onUpdateField('name', val)}
            placeholder="Your full name"
          />
        </div>

        <div>
          <FormLabel htmlFor="p3-identity-headline">Headline</FormLabel>
          <FormInput
            value={headlineValue}
            onChange={(val) => onUpdateField('professionalTitle', val)}
            placeholder="e.g. Product Designer & Engineer"
          />
        </div>

        <div>
          <FormLabel htmlFor="p3-identity-company">Company</FormLabel>
          <FormInput
            value={profile.company || ''}
            onChange={(val) => onUpdateField('company', val)}
            placeholder="e.g. Avtive Labs"
          />
        </div>

        <div>
          <FormLabel htmlFor="p3-identity-location">Location</FormLabel>
          <FormInput
            value={profile.location || ''}
            onChange={(val) => onUpdateField('location', val)}
            placeholder="e.g. London, UK"
          />
        </div>
      </div>

      {/* Progressive Disclosure: Handle, Tagline, Cover Image, Intro Media, System Style */}
      <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="w-full py-1.5 flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
        >
          <span>Cover, handle, tagline &amp; voice intro</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="pt-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FormLabel>Handle / Username</FormLabel>
                <FormInput
                  value={profile.username || profile.slug || ''}
                  onChange={(val) => onUpdateField('username', val.replace(/^@/, ''))}
                  placeholder="your-handle"
                />
              </div>

              <div>
                <FormLabel>Tagline</FormLabel>
                <FormInput
                  value={profile.tagline || ''}
                  onChange={(val) => onUpdateField('tagline', val)}
                  placeholder="Short personal motto"
                />
              </div>
            </div>

            {/* Cover Banner Control */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-7 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                  {coverSrc ? (
                    <img src={coverSrc} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                </div>
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {coverSrc ? 'Cover image active' : 'No cover image set'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {coverSrc && (
                  <button
                    type="button"
                    onClick={() => onUpdateField('coverImage', '')}
                    className="min-h-[32px] px-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="min-h-[32px] px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white cursor-pointer"
                >
                  {isUploadingCover ? 'Uploading...' : 'Upload cover'}
                </button>
              </div>
            </div>

            {/* Card Style Selector (Defaults to Minimalist Black & White) */}
            <div className="space-y-1.5">
              <FormLabel>Profile Card Surface Style</FormLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['editorial', 'dark', 'cyber', 'luxe'] as ProfileTheme[]).map((themeId) => {
                  const cfg = PROFILE_THEMES[themeId];
                  const isSel = activeTheme === themeId || (themeId === 'editorial' && activeTheme === 'default');
                  return (
                    <button
                      key={themeId}
                      type="button"
                      onClick={() => onUpdateField('theme', themeId)}
                      className={`min-h-[36px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold text-left truncate transition-all cursor-pointer ${
                        isSel
                          ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                      }`}
                    >
                      {cfg?.name || themeId}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Existing Profile Introduction Media Component */}
            <ProfileIntroductionMediaSection
              profile={profile}
              isEditing={true}
              canEdit={true}
              theme={theme}
              onUpdateField={onUpdateField}
            />
          </div>
        )}
      </div>
    </section>
  );
}
