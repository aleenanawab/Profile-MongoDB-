'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Camera, Globe, Mail, Phone, UserPlus, Share2, MessageSquare, Building2, Users, LayoutGrid, SlidersHorizontal, Loader2, Trash2 } from 'lucide-react';
import { ProfileData, normalizeProfileType, SocialLink, CompanyInfo } from '../types/profile';
import { ThemeConfig, getThemeConfig } from './themeStyles';
import { GithubIcon, LinkedInIcon, TwitterXIcon, WhatsAppIcon } from './BrandIcons';
import { StatsRow } from './profiles/StatsRow';
import { ProfileSwitcher } from './profiles/ProfileSwitcher';
import { SUPABASE_DEFAULT_AVATAR, SUPABASE_DEFAULT_COVER } from '@/lib/supabase';
import { FormLabel, FormInput, FormTextarea, SectionSaveBar } from './ui/formControls';
import { SearchableCombobox } from './forms/SearchableCombobox';
import { COUNTRIES } from '@/data/countriesDataset';
import { compressImageFile, uploadImageToStorage } from '@/lib/imageCompression';
import { getTitle, getShortBio } from '@/lib/profileGetters';

interface HeroSectionProps {
  profile: ProfileData;
  canEdit?: boolean;
  theme?: ThemeConfig;
  navigationOrigin?: any;
  isEditing?: boolean;
  isConnected?: boolean;
  onUpdateField?: (field: keyof ProfileData, value: any) => void;
  onSavePartial?: (partialData: Partial<ProfileData>) => Promise<ProfileData>;
  onOpenEdit?: () => void;
  onOpenShare?: () => void;
  onOpenConnect?: () => void;
  onNavigateToCompany?: (companyId?: string) => void;
  onNavigateBack?: () => void;
  onOpenVirtualCard?: () => void;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
  onToggleSections?: () => void;
  onSectionsMouseEnter?: () => void;
  onSectionsMouseLeave?: () => void;
  isSidebarOpen?: boolean;
  onToggleSectionsDrawer?: () => void;
  isSectionsDrawerOpen?: boolean;
  onToggleMobileSections?: () => void;
  isMobileSectionsOpen?: boolean;
  onToggleDesktopSections?: () => void;
  isDesktopSectionsOpen?: boolean;
}

export function HeroSection({
  profile,
  canEdit = false,
  isEditing = false,
  theme = getThemeConfig(profile.theme || 'editorial'),
  onUpdateField,
  onSavePartial,
  onOpenEdit,
  onOpenShare,
  onOpenConnect,
  onSelectSection,
  onToggleSections,
  onSectionsMouseEnter,
  onSectionsMouseLeave,
  isSidebarOpen = false,
  onToggleSectionsDrawer,
  isSectionsDrawerOpen = false,
  onToggleMobileSections,
  isMobileSectionsOpen = false,
  onToggleDesktopSections,
  isDesktopSectionsOpen = false
}: HeroSectionProps) {
  const router = useRouter();
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [isUploadingCover, setIsUploadingCover] = React.useState(false);

  const [heroDraft, setHeroDraft] = React.useState({
    name: profile.name || '',
    username: profile.username || profile.slug || '',
    slug: profile.slug || profile.username || '',
    designation: getTitle(profile),
    profession: getTitle(profile),
    tagline: profile.tagline || '',
    location: profile.location || '',
    country: profile.country || '',
    shortBio: getShortBio(profile),
    avatar: profile.avatar || '',
    coverImage: profile.coverImage || '',
    companyInfo: (profile.companyInfo || {}) as Partial<CompanyInfo>,
  });
  const [snapshot, setSnapshot] = React.useState(heroDraft);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  const coverUrl = heroDraft.coverImage || profile.coverImage || (profile as any).coverUrl || SUPABASE_DEFAULT_COVER;
  const avatarUrl = heroDraft.avatar || profile.avatar || (profile as any).logoUrl || SUPABASE_DEFAULT_AVATAR;
  const sharing = profile.sharingSettings || {};

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previousCover = heroDraft.coverImage || profile.coverImage || '';
    setIsUploadingCover(true);
    setErrorMessage(undefined);
    try {
      const { dataUrl, file: compressedFile } = await compressImageFile(file);
      // Immediate visual preview in local draft
      setHeroDraft((prev) => ({ ...prev, coverImage: dataUrl }));

      // Upload to Cloudinary storage and obtain permanent HTTPS URL
      const cdnUrl = await uploadImageToStorage(compressedFile, 'profiles');
      if (!cdnUrl || !cdnUrl.startsWith('https://')) {
        throw new Error('Upload succeeded but did not return a permanent HTTPS URL.');
      }

      setHeroDraft((prev) => ({ ...prev, coverImage: cdnUrl }));
      setSnapshot((prev) => ({ ...prev, coverImage: cdnUrl }));
      onUpdateField?.('coverImage', cdnUrl);
      if (onSavePartial) {
        await onSavePartial({ coverImage: cdnUrl });
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      console.error('Cover upload and save failed:', err);
      // Revert preview on failure
      setHeroDraft((prev) => ({ ...prev, coverImage: previousCover }));
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to upload cover banner. Please select a valid photo under 5MB.');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previousAvatar = heroDraft.avatar || profile.avatar || '';
    setIsUploadingAvatar(true);
    setErrorMessage(undefined);
    try {
      const { dataUrl, file: compressedFile } = await compressImageFile(file);
      // Immediate visual preview in local draft
      setHeroDraft((prev) => ({ ...prev, avatar: dataUrl }));

      // Upload to Cloudinary storage and obtain permanent HTTPS URL
      const cdnUrl = await uploadImageToStorage(compressedFile, 'avatars');
      if (!cdnUrl || !cdnUrl.startsWith('https://')) {
        throw new Error('Upload succeeded but did not return a permanent HTTPS URL.');
      }

      setHeroDraft((prev) => ({ ...prev, avatar: cdnUrl }));
      setSnapshot((prev) => ({ ...prev, avatar: cdnUrl }));
      onUpdateField?.('avatar', cdnUrl);
      if (onSavePartial) {
        await onSavePartial({ avatar: cdnUrl });
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      console.error('Avatar upload and save failed:', err);
      // Revert preview on failure
      setHeroDraft((prev) => ({ ...prev, avatar: previousAvatar }));
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to upload profile photo. Please try a valid image under 5MB.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleRemoveCover = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeroDraft((prev) => ({ ...prev, coverImage: '' }));
    setSnapshot((prev) => ({ ...prev, coverImage: '' }));
    onUpdateField?.('coverImage', '');
    if (onSavePartial) {
      try {
        await onSavePartial({ coverImage: '' });
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to remove cover banner.');
      }
    }
  };

  const handleRemoveAvatar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeroDraft((prev) => ({ ...prev, avatar: '' }));
    setSnapshot((prev) => ({ ...prev, avatar: '' }));
    onUpdateField?.('avatar', '');
    if (onSavePartial) {
      try {
        await onSavePartial({ avatar: '' });
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to remove profile photo.');
      }
    }
  };

  const normalizedType = normalizeProfileType(profile.type);
  const isCompany = normalizedType === 'team';
  const typeBadgeLabel = isCompany ? 'Company · Organization' : 'Individual';
  const activeMemberCount = profile.teamMembers?.filter((m) => m.status !== 'REMOVED')?.length || 0;

  React.useEffect(() => {
    const nextDraft = {
      name: profile.name || '',
      username: profile.username || profile.slug || '',
      slug: profile.slug || profile.username || '',
      designation: getTitle(profile),
      profession: getTitle(profile),
      tagline: profile.tagline || '',
      location: profile.location || '',
      country: profile.country || '',
      shortBio: getShortBio(profile),
      avatar: profile.avatar || '',
      coverImage: profile.coverImage || '',
      companyInfo: (profile.companyInfo || {}) as Partial<CompanyInfo>,
    };
    setHeroDraft(nextDraft);
    setSnapshot(nextDraft);
  }, [
    profile.id,
    profile.name,
    profile.username,
    profile.slug,
    profile.designation,
    profile.profession,
    profile.tagline,
    profile.location,
    profile.country,
    profile.shortBio,
    profile.avatar,
    profile.coverImage,
    profile.companyInfo,
  ]);

  const isDirty = (
    heroDraft.name !== snapshot.name ||
    heroDraft.username !== snapshot.username ||
    heroDraft.designation !== snapshot.designation ||
    heroDraft.tagline !== snapshot.tagline ||
    heroDraft.location !== snapshot.location ||
    heroDraft.country !== snapshot.country ||
    heroDraft.shortBio !== snapshot.shortBio ||
    (heroDraft.avatar && heroDraft.avatar !== snapshot.avatar) ||
    (heroDraft.coverImage && heroDraft.coverImage !== snapshot.coverImage) ||
    JSON.stringify(heroDraft.companyInfo) !== JSON.stringify(snapshot.companyInfo)
  );

  const handleSaveHero = async () => {
    setSaveStatus('saving');
    setErrorMessage(undefined);
    try {
      const payload: Partial<ProfileData> = {
        name: heroDraft.name,
        username: heroDraft.username,
        slug: heroDraft.slug,
        designation: heroDraft.designation,
        profession: heroDraft.profession,
        tagline: heroDraft.tagline,
        location: heroDraft.location,
        country: heroDraft.country,
        shortBio: heroDraft.shortBio,
        ...(heroDraft.avatar ? { avatar: heroDraft.avatar } : profile.avatar ? { avatar: profile.avatar } : {}),
        ...(heroDraft.coverImage ? { coverImage: heroDraft.coverImage } : profile.coverImage ? { coverImage: profile.coverImage } : {}),
        ...(isCompany && heroDraft.companyInfo ? { companyInfo: heroDraft.companyInfo as CompanyInfo } : {}),
      };
      if (onSavePartial) {
        await onSavePartial(payload);
      }
      Object.entries(payload).forEach(([k, v]) => onUpdateField?.(k as any, v));
      setSnapshot(heroDraft);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save profile header');
    }
  };

  const handleCancelHero = () => {
    setHeroDraft(snapshot);
    setSaveStatus('idle');
    setErrorMessage(undefined);
  };

  const defaultStats = normalizedType === 'team'
    ? [
        { value: profile.highlights?.[0]?.value || '15+', label: profile.highlights?.[0]?.label || 'Team' },
        { value: profile.highlights?.[1]?.value || '25+', label: profile.highlights?.[1]?.label || 'Projects' },
        { value: profile.highlights?.[2]?.value || '4+', label: profile.highlights?.[2]?.label || 'Years' }
      ]
    : [
        { value: profile.highlights?.[0]?.value || '5', label: profile.highlights?.[0]?.label || 'Projects' },
        { value: profile.highlights?.[1]?.value || '3', label: profile.highlights?.[1]?.label || 'Credentials' },
        { value: profile.highlights?.[2]?.value || '2+', label: profile.highlights?.[2]?.label || 'Years' }
      ];

  // Dynamic Social Links strictly preserving user dragged & saved order
  const rawSocials = (Array.isArray(profile.socials) && profile.socials.length > 0)
    ? profile.socials
    : (Array.isArray(profile.socialLinks) && profile.socialLinks.length > 0)
    ? profile.socialLinks
    : (profile.socials && typeof profile.socials === 'object')
    ? Object.entries(profile.socials).map(([platform, url]) => ({ platform: platform as any, url: String(url) }))
    : [];

  const socials: SocialLink[] = rawSocials.filter((s: any) => s && s.url && typeof s.url === 'string' && s.url.trim() !== '');

  const renderSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'github':
        return <GithubIcon className="w-4 h-4 text-zinc-900 dark:text-white" />;
      case 'linkedin':
        return <LinkedInIcon className="w-4 h-4 text-blue-500" />;
      case 'twitter':
      case 'x':
        return <TwitterXIcon className="w-4 h-4 text-zinc-900 dark:text-white" />;
      case 'whatsapp':
        return <WhatsAppIcon className="w-4 h-4 text-emerald-500" />;
      case 'email':
      case 'mail':
        return <Mail className="w-4 h-4 text-rose-500" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-emerald-500" />;
      case 'website':
      default:
        return <Globe className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="relative w-full text-left font-sans">
      {/* Hidden File Inputs for Cover and Avatar */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverUpload}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
        aria-hidden="true"
      />

      {/* 1. Cover Image Banner */}
      <div 
        onClick={() => {
          if (isEditing) {
            coverInputRef.current?.click();
          } else if (canEdit) {
            onOpenEdit?.();
          }
        }}
        className={`relative h-36 sm:h-48 md:h-60 lg:h-72 w-full overflow-hidden bg-slate-900 ${
          canEdit || isEditing ? 'cursor-pointer group/cover hover:brightness-105 transition-all' : ''
        }`}
        title={isEditing ? 'Click to change cover image' : canEdit ? 'Click to edit profile' : undefined}
      >
        <img
          src={coverUrl}
          alt={`${profile.name} Cover`}
          onError={(e) => {
            e.currentTarget.src = SUPABASE_DEFAULT_COVER;
          }}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {/* Stitch-style Sections Slider Buttons - STRICTLY EDIT MODE ONLY */}
        {isEditing && (
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center">
            {/* If dedicated mobile view (e.g. mobile phone chassis): mobile button is ALWAYS visible */}
            {onToggleMobileSections && !onToggleDesktopSections && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMobileSections();
                }}
                aria-label="Toggle mobile profile sections slider"
                aria-expanded={isMobileSectionsOpen}
                className="flex px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black/95 text-white border border-white/20 shadow-lg items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-semibold select-none group"
                title="Open Sections navigation slider"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-90 transition-transform duration-200" />
                <span>Sections</span>
              </button>
            )}

            {/* If dedicated desktop view: desktop button is ALWAYS visible */}
            {onToggleDesktopSections && !onToggleMobileSections && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDesktopSections();
                }}
                aria-label="Toggle desktop profile sections slider"
                aria-expanded={isDesktopSectionsOpen}
                className="flex px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black/95 text-white border border-white/20 shadow-lg items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-semibold select-none group"
                title="Open Sections navigation slider"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-90 transition-transform duration-200" />
                <span>Sections</span>
              </button>
            )}

            {/* If both provided (responsive desktop view): mobile button on < lg, desktop button on >= lg */}
            {onToggleMobileSections && onToggleDesktopSections && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMobileSections();
                  }}
                  aria-label="Toggle mobile profile sections slider"
                  aria-expanded={isMobileSectionsOpen}
                  className="flex lg:hidden px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black/95 text-white border border-white/20 shadow-lg items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-semibold select-none group"
                  title="Open Sections navigation slider"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-90 transition-transform duration-200" />
                  <span>Sections</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleDesktopSections();
                  }}
                  aria-label="Toggle desktop profile sections slider"
                  aria-expanded={isDesktopSectionsOpen}
                  className="hidden lg:flex px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black/95 text-white border border-white/20 shadow-lg items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-semibold select-none group"
                  title="Open Sections navigation slider"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-90 transition-transform duration-200" />
                  <span>Sections</span>
                </button>
              </>
            )}

            {/* Fallback if legacy toggle handlers provided without mobile/desktop split */}
            {!onToggleMobileSections && !onToggleDesktopSections && (onToggleSectionsDrawer || onToggleSections) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  (onToggleSectionsDrawer || onToggleSections)?.();
                }}
                aria-label="Toggle profile sections slider"
                aria-expanded={isSectionsDrawerOpen || isSidebarOpen}
                className="flex px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black/95 text-white border border-white/20 shadow-lg items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-semibold select-none group"
                title="Open Sections navigation slider"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-90 transition-transform duration-200" />
                <span>Sections</span>
              </button>
            )}
          </div>
        )}

        {/* Cover Edit Overlay Badge */}
        {(isEditing || canEdit) && (
          <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-wrap items-center gap-1.5 sm:gap-2 transition-opacity ${
            isEditing ? 'opacity-95 hover:opacity-100' : 'opacity-0 group-hover/cover:opacity-100'
          }`}>
            <button
              type="button"
              disabled={isUploadingCover}
              onClick={(e) => {
                e.stopPropagation();
                if (isEditing) {
                  coverInputRef.current?.click();
                } else {
                  onOpenEdit?.();
                }
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xl border border-white/20 transition-transform hover:scale-105 cursor-pointer disabled:opacity-75 disabled:pointer-events-none select-none"
            >
              {isUploadingCover ? (
                <>
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>{isEditing ? 'Change Cover' : 'Edit Cover'}</span>
                </>
              )}
            </button>
            {isEditing && (heroDraft.coverImage || profile.coverImage) && (
              <button
                type="button"
                onClick={handleRemoveCover}
                className="min-h-[44px] px-3 py-2 rounded-full bg-rose-600/80 hover:bg-rose-600 backdrop-blur-md text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xl border border-rose-400/30 transition-transform hover:scale-105 cursor-pointer select-none"
                title="Remove cover banner"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            )}
          </div>
        )}

        {/* Cover Corner Section Navigation Button (Top corner of profile cover - Visible on Desktop & Mobile in Public Profile View) */}
        {!isEditing && (onToggleSections || onSectionsMouseEnter) && (
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSections?.();
              }}
              onMouseEnter={onSectionsMouseEnter}
              onMouseLeave={onSectionsMouseLeave}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl sm:rounded-2xl bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer z-20 ${
                isSidebarOpen ? 'ring-2 ring-white/60 bg-black/85' : ''
              }`}
              title="Profile Sections Menu"
              aria-label="Sections Menu"
              aria-expanded={isSidebarOpen}
            >
              <LayoutGrid className="w-4 h-4 text-white sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        )}

        {/* Cover Header Controls: Multi-Role Persona Switcher & Edit Icon (Owner Only in Public/Preview View) */}
        {canEdit && !isEditing && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-5 flex items-center gap-2 z-20">
            <ProfileSwitcher currentProfileIdOrSlug={profile.slug || profile.id} />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEdit?.();
              }}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Edit Profile"
              aria-label="Edit Profile"
            >
              <Pencil className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Identity Header */}
      <div className="px-4 sm:px-6 md:px-8 pb-6 -mt-10 sm:-mt-14 md:-mt-18 relative z-10 space-y-4">
        {/* Profile Photo / Company Logo */}
        {sharing.photo !== false && (
          isCompany ? (
            /* Corporate Logo Frame */
            <div 
              onClick={() => {
                if (isEditing) {
                  avatarInputRef.current?.click();
                } else if (canEdit) {
                  onOpenEdit?.();
                }
              }}
              className={`relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-2xl sm:rounded-3xl p-1.5 sm:p-2.5 overflow-hidden border-4 border-white dark:border-[#18181B] shadow-xl bg-white dark:bg-zinc-900 shrink-0 flex items-center justify-center ${
                canEdit || isEditing ? 'cursor-pointer group/avatar hover:ring-4 hover:ring-blue-500/50 transition-all' : ''
              }`}
              title={isEditing ? 'Click to change logo' : canEdit ? 'Click to edit profile' : undefined}
            >
              <img
                src={avatarUrl}
                alt={profile.name}
                onError={(e) => {
                  e.currentTarget.src = SUPABASE_DEFAULT_AVATAR;
                }}
                className="w-full h-full object-contain rounded-xl sm:rounded-2xl"
              />
              {(canEdit || isEditing) && (
                <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white rounded-2xl sm:rounded-3xl transition-opacity ${
                  isEditing ? 'opacity-85 hover:opacity-100' : 'opacity-0 group-hover/avatar:opacity-100'
                }`}>
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-md text-cyan-300 animate-spin" />
                      <span className="text-[9px] sm:text-[10px] font-bold mt-0.5">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-md text-cyan-300" />
                      <span className="text-[9px] sm:text-[10px] font-bold mt-0.5">{isEditing ? 'Change Logo' : 'Edit Logo'}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Individual Circular Headshot */
            <div 
              onClick={() => {
                if (isEditing) {
                  avatarInputRef.current?.click();
                } else if (canEdit) {
                  onOpenEdit?.();
                }
              }}
              className={`relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white dark:border-[#18181B] shadow-md bg-slate-100 dark:bg-zinc-800 shrink-0 ${
                canEdit || isEditing ? 'cursor-pointer group/avatar hover:ring-4 hover:ring-cyan-500/50 transition-all' : ''
              }`}
              title={isEditing ? 'Click to change photo' : canEdit ? 'Click to edit profile' : undefined}
            >
              <img
                src={avatarUrl}
                alt={profile.name}
                onError={(e) => {
                  e.currentTarget.src = SUPABASE_DEFAULT_AVATAR;
                }}
                className="w-full h-full object-cover"
              />
              {(canEdit || isEditing) && (
                <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white transition-opacity ${
                  isEditing ? 'opacity-85 hover:opacity-100' : 'opacity-0 group-hover/avatar:opacity-100'
                }`}>
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-md text-cyan-300 animate-spin" />
                      <span className="text-[9px] sm:text-[10px] font-bold mt-0.5">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-md text-cyan-300" />
                      <span className="text-[9px] sm:text-[10px] font-bold mt-0.5">{isEditing ? 'Change Photo' : 'Edit Photo'}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        )}
        {isEditing && (heroDraft.avatar || profile.avatar) && (
          <div className="pt-2 pb-1">
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="inline-flex min-h-[44px] items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer select-none"
              title="Remove profile photo"
            >
              <Trash2 className="w-4 h-4" />
              <span>Remove Photo</span>
            </button>
          </div>
        )}

        {/* Profile Role Badge & Name */}
        {sharing.nameAndTitle !== false && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              {isCompany ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Company · Organization</span>
                </div>
              ) : (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-black/5 dark:bg-white/10 text-slate-700 dark:text-zinc-300 border border-black/5 dark:border-white/10">
                  {typeBadgeLabel}
                </div>
              )}
            </div>

            {/* In-Place Name and Username/Slug Input or Heading */}
            {isEditing ? (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <FormLabel required>Full Name / Display Name</FormLabel>
                    <FormInput
                      value={heroDraft.name}
                      onChange={(val) => setHeroDraft((prev) => ({ ...prev, name: val }))}
                      placeholder="Your Full Name"
                    />
                  </div>
                  <div>
                    <FormLabel>Username / Slug</FormLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">@</span>
                      <FormInput
                        value={heroDraft.username}
                        onChange={(val) => {
                          const cleanSlug = val.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                          setHeroDraft((prev) => ({ ...prev, username: cleanSlug, slug: cleanSlug }));
                        }}
                        placeholder="username"
                        className="pl-7 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <FormLabel>Professional Title / Role</FormLabel>
                  <FormInput
                    value={heroDraft.designation}
                    onChange={(val) => setHeroDraft((prev) => ({ ...prev, designation: val, profession: val }))}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>

                {isCompany && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <FormLabel>Industry</FormLabel>
                      <FormInput
                        value={heroDraft.companyInfo?.industry || ''}
                        onChange={(val) =>
                          setHeroDraft((prev) => ({
                            ...prev,
                            companyInfo: { ...(prev.companyInfo || {}), industry: val },
                          }))
                        }
                        placeholder="e.g. Software, Fintech"
                      />
                    </div>
                    <div>
                      <FormLabel>Team Size</FormLabel>
                      <FormInput
                        value={heroDraft.companyInfo?.employeeCount || ''}
                        onChange={(val) =>
                          setHeroDraft((prev) => ({
                            ...prev,
                            companyInfo: { ...(prev.companyInfo || {}), employeeCount: val },
                          }))
                        }
                        placeholder="e.g. 20-50 Employees"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <FormLabel>Tagline / Motto</FormLabel>
                  <FormInput
                    value={heroDraft.tagline}
                    onChange={(val) => setHeroDraft((prev) => ({ ...prev, tagline: val }))}
                    placeholder="Tagline or motto (e.g. Building next-generation digital identities)"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <FormLabel>City / State</FormLabel>
                    <FormInput
                      value={heroDraft.location}
                      onChange={(val) => setHeroDraft((prev) => ({ ...prev, location: val }))}
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                  <div>
                    <FormLabel>Country</FormLabel>
                    <SearchableCombobox
                      options={COUNTRIES}
                      value={heroDraft.country}
                      onChange={(val) => setHeroDraft((prev) => ({ ...prev, country: val as string }))}
                      placeholder="Select Country..."
                    />
                  </div>
                </div>

                <div>
                  <FormLabel>Quick Bio</FormLabel>
                  <FormTextarea
                    rows={2}
                    value={heroDraft.shortBio}
                    onChange={(val) => setHeroDraft((prev) => ({ ...prev, shortBio: val }))}
                    placeholder="A concise overview of your background or focus..."
                  />
                </div>

                <SectionSaveBar
                  onSave={handleSaveHero}
                  onCancel={handleCancelHero}
                  isSaving={saveStatus === 'saving' || isUploadingAvatar || isUploadingCover}
                  isSaved={saveStatus === 'saved'}
                  isDirty={isDirty}
                  errorMessage={errorMessage}
                  saveLabel={isUploadingAvatar || isUploadingCover ? "Uploading image..." : "Save Profile Info"}
                  cancelLabel="Cancel"
                  className="pt-1"
                />
              </div>
            ) : (
              <>
                <div 
                  onClick={() => canEdit && onOpenEdit?.()}
                  className={`space-y-0.5 ${canEdit ? 'cursor-pointer group/name hover:opacity-85 transition-opacity' : ''}`}
                  title={canEdit ? 'Click to edit name' : undefined}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight ${theme.textPrimary} flex items-center gap-2 break-words`}>
                      <span>{profile.name}</span>
                    </h1>
                    {profile.pronouns && (
                      <span className={`text-xs font-normal ${theme.textMuted} opacity-80`}>
                        ({profile.pronouns})
                      </span>
                    )}
                    {profile.statusBadge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                        {profile.statusBadge}
                      </span>
                    )}
                  </div>
                  {(profile.username || profile.slug) && (
                    <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                      @{profile.username || profile.slug}
                    </p>
                  )}
                </div>

                <p 
                  onClick={() => canEdit && onOpenEdit?.()}
                  className={`text-sm sm:text-base md:text-lg font-medium ${theme.textSecondary} break-words ${canEdit ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
                  title={canEdit ? 'Click to edit title' : undefined}
                >
                  {[
                    getTitle(profile) || profile.profileName || (isCompany ? 'Organization' : 'Professional'),
                    !isCompany && profile.department
                  ].filter(Boolean).join(' • ')}
                </p>

                {/* Corporate Metadata Strip */}
                {isCompany && (
                  <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
                    {profile.companyInfo?.industry && (
                      <span 
                        onClick={() => canEdit && onOpenEdit?.()}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium ${canEdit ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
                        title={canEdit ? 'Click to edit company details' : undefined}
                      >
                        {profile.companyInfo.industry}
                      </span>
                    )}
                    {profile.companyInfo?.employeeCount && (
                      <span 
                        onClick={() => canEdit && onOpenEdit?.()}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium ${canEdit ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
                        title={canEdit ? 'Click to edit company details' : undefined}
                      >
                        {profile.companyInfo.employeeCount}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSection ? onSelectSection('teamMembers') : null;
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                      title="View organization team"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{activeMemberCount} {activeMemberCount === 1 ? 'Team Member' : 'Team Members'}</span>
                    </button>
                  </div>
                )}

                {/* Tagline */}
                {profile.tagline && (
                  <p 
                    onClick={() => canEdit && onOpenEdit?.()}
                    className={`text-xs sm:text-sm font-medium ${theme.textSecondary} italic pt-0.5 break-words ${canEdit ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
                    title={canEdit ? 'Click to edit tagline' : undefined}
                  >
                    &ldquo;{profile.tagline}&rdquo;
                  </p>
                )}

                {/* Location & Country */}
                {(profile.location || profile.country) && (
                  <p 
                    onClick={() => canEdit && onOpenEdit?.()}
                    className={`text-xs sm:text-sm ${theme.textMuted} break-words ${canEdit ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
                    title={canEdit ? 'Click to edit location' : undefined}
                  >
                    {[profile.location, profile.country].filter(Boolean).join(', ')}
                  </p>
                )}

                {/* Short Bio */}
                {sharing.bio !== false && getShortBio(profile) && (
                  <div
                    onClick={() => canEdit && onOpenEdit?.()}
                    className={`${
                      canEdit ? 'cursor-pointer group/bio rounded-2xl p-2 -ml-2 hover:bg-cyan-500/[0.04] dark:hover:bg-cyan-500/10 transition-all' : ''
                    }`}
                  >
                    <p className={`text-xs sm:text-sm md:text-base ${theme.textSecondary} leading-relaxed max-w-2xl break-words`}>
                      {getShortBio(profile)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Action Buttons Below Avatar */}
        <div className="flex items-center gap-2 pt-2 max-w-md w-full min-w-0 flex-wrap sm:flex-nowrap">
          {canEdit ? (
            isEditing ? null : isCompany ? (
              /* Company Owner / Editor Actions */
              <>
                <button
                  type="button"
                  onClick={() => onOpenEdit?.()}
                  className={`flex-1 min-w-0 min-h-[44px] py-2.5 px-3 sm:px-4 rounded-xl ${theme.btnPrimary} font-bold text-xs sm:text-sm shadow-xs hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 select-none`}
                  title="Edit Company Details"
                >
                  <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Edit Company</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectSection ? onSelectSection('teamMembers') : onOpenEdit?.()}
                  className="flex-1 min-w-0 min-h-[44px] py-2.5 px-3 sm:px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xs hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 select-none"
                  title="Manage Team Members"
                >
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
                  <span className="truncate">Manage Team</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenShare}
                  className={`min-h-[44px] min-w-[44px] py-2.5 px-3 sm:px-3.5 rounded-xl ${theme.btnSecondary} font-bold text-xs sm:text-sm shadow-xs hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shrink-0 select-none`}
                  title="Share Company Profile"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </>
            ) : (
              /* Individual Owner Actions */
              <>
                <button
                  type="button"
                  onClick={() => onOpenEdit?.()}
                  className={`flex-1 min-w-0 min-h-[44px] py-2.5 px-3.5 sm:px-5 rounded-full ${theme.btnPrimary} font-bold text-xs sm:text-sm shadow-xs hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 select-none`}
                  title="Edit Profile"
                >
                  <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenShare}
                  className={`flex-1 min-w-0 min-h-[44px] py-2.5 px-3.5 sm:px-5 rounded-full ${theme.btnSecondary} font-bold text-xs sm:text-sm shadow-xs hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 select-none`}
                >
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Share Profile</span>
                </button>
              </>
            )
          ) : (
            isCompany ? (
              /* Public Company Visitor Actions */
              <>
                <button
                  type="button"
                  onClick={onOpenConnect}
                  className={`flex-1 min-w-0 min-h-[44px] py-2.5 px-3 sm:px-5 rounded-xl ${theme.btnPrimary} font-bold text-xs sm:text-sm shadow-xs hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 select-none`}
                >
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Contact</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('company-team-section') || document.querySelector('[data-section="teamMembers"]') || document.querySelector('#team-members-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    else onSelectSection?.('teamMembers');
                  }}
                  className={`flex-1 min-w-0 min-h-[44px] py-2.5 px-3 sm:px-5 rounded-xl ${theme.btnSecondary} font-bold text-xs sm:text-sm shadow-xs hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 select-none`}
                >
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Team ({activeMemberCount})</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenShare}
                  className={`min-h-[44px] min-w-[44px] py-2.5 px-3 sm:px-3.5 rounded-xl ${theme.btnSecondary} font-bold text-xs sm:text-sm shadow-xs hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shrink-0 select-none`}
                  title="Share Company Profile"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                </button>
              </>
            ) : (
              /* Individual Public Visitor Actions (Unchanged) */
              <>
                <button
                  type="button"
                  onClick={onOpenConnect}
                  className={`flex-1 min-w-0 min-h-[44px] py-2.5 px-3.5 sm:px-5 rounded-full ${theme.btnPrimary} font-bold text-xs sm:text-sm shadow-xs hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 select-none`}
                >
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Connect</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenShare}
                  className={`flex-1 min-w-0 min-h-[44px] py-2.5 px-3.5 sm:px-5 rounded-full ${theme.btnSecondary} font-bold text-xs sm:text-sm shadow-xs hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 select-none`}
                >
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Share</span>
                </button>
              </>
            )
          )}
        </div>

        {/* Custom CTA Button if active and configured */}
        {profile.customCta?.active && profile.customCta.label && profile.customCta.url && (
          <div className="pt-2 max-w-md w-full min-w-0">
            <a
              href={profile.customCta.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-center text-xs sm:text-sm shadow-xs hover:opacity-90 transition-all ${theme.btnPrimary} flex items-center justify-center gap-2 select-none`}
            >
              <span>{profile.customCta.label}</span>
            </a>
          </div>
        )}

        {/* Direct Social Icon Bar: Respects exact drag-and-drop order from socials (hidden in Edit Mode) */}
        {!isEditing && sharing.socialLinks !== false && (
          <div 
            onClick={(e) => {
              if (canEdit && onSelectSection && (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('edit-socials-trigger'))) {
                onSelectSection('socials');
              }
            }}
            className={`flex items-center gap-2.5 pt-2 text-slate-600 dark:text-zinc-300 flex-wrap relative ${
              canEdit ? 'group/socials rounded-xl p-1.5 -ml-1.5 hover:bg-purple-500/[0.06] dark:hover:bg-purple-500/10 hover:ring-1 hover:ring-purple-500/30 transition-all' : ''
            }`}
            title={canEdit ? 'Click to edit Socials & Links in Studio' : undefined}
          >
            {/* Direct WhatsApp (if sharing enabled and not duplicate) */}
            {profile.whatsapp && sharing.phone !== false && !socials.some((s) => s.platform === 'whatsapp') && (
              <a
                href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-all hover:scale-105"
                title="WhatsApp"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-500" />
              </a>
            )}

            {/* Direct Email (if sharing enabled and not duplicate) */}
            {profile.email && sharing.email !== false && !socials.some((s) => s.platform === 'email') && (
              <a
                href={`mailto:${profile.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-all hover:scale-105"
                title="Email"
                aria-label="Email"
              >
                <Mail className="w-4 h-4 text-rose-500" />
              </a>
            )}

            {/* Dynamic Social Links In Dragged Order */}
            {socials.map((s, idx) => {
              const url = s.url?.trim() || '';
              if (!url) return null;
              const formattedUrl = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')
                ? url
                : `https://${url}`;

              return (
                <a
                  key={`${s.platform}-${idx}-${url}`}
                  href={formattedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-all hover:scale-105"
                  title={s.label || s.platform}
                  aria-label={s.label || s.platform}
                >
                  {renderSocialIcon(s.platform)}
                </a>
              );
            })}

            {canEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSection?.('socials');
                }}
                className="edit-socials-trigger opacity-0 group-hover/socials:opacity-100 transition-opacity ml-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-2.5 h-2.5" />
                <span>Edit Links</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
