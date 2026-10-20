'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Camera,
  Loader2,
  Check,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Globe,
  Building2,
  Briefcase,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  CheckCircle2,
  Layers,
  AtSign,
  Tag,
  Link as LinkIcon,
  Calendar,
  Users
} from 'lucide-react';
import { ProfileData, ProfileTheme, ProfileType, CustomFieldItem, normalizeProfileType } from '@/types/profile';
import { InlineAvatarPicker } from './InlineAvatarPicker';

export interface ProfileSectionEditorProps {
  /** Initial mode for the editor */
  initialMode?: 'edit' | 'add';
  /** The current active profile data (used for edit mode and baseline) */
  profile: ProfileData;
  /** Optional list of all user profiles (for switching or checks) */
  userProfiles?: ProfileData[];
  /** Controlled expansion state if provided */
  isExpanded?: boolean;
  /** Callback to toggle expansion */
  onToggleExpand?: () => void;
  /** Real-time callback triggered on any field modification */
  onLiveUpdate?: (updatedProfile: Partial<ProfileData>) => void;
  /** Save success callback */
  onSaveSuccess?: (savedProfile: ProfileData, isNew?: boolean) => void;
  /** Cancellation or collapse callback */
  onCancel?: () => void;
  /** Extra class names */
  className?: string;
}

export function ProfileSectionEditor({
  initialMode = 'edit',
  profile,
  userProfiles,
  isExpanded = true,
  onToggleExpand,
  onLiveUpdate,
  onSaveSuccess,
  onCancel,
  className = ''
}: ProfileSectionEditorProps) {
  // Mode state: 'edit' or 'add'
  const [mode, setMode] = useState<'edit' | 'add'>(initialMode);

  // File upload refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Form Fields State
  const [firstName, setFirstName] = useState(
    profile.firstName || (profile.name ? profile.name.split(' ')[0] : 'Aleena')
  );
  const [secondName, setSecondName] = useState(
    profile.secondName || profile.lastName || (profile.name ? profile.name.split(' ').slice(1).join(' ') : 'Nawab')
  );
  const [username, setUsername] = useState(
    profile.username || profile.slug || ''
  );
  const [profession, setProfession] = useState(
    profile.profession || profile.professionalTitle || profile.designation || 'Full Stack Engineer'
  );
  const [profileName, setProfileName] = useState(
    profile.profileName || (mode === 'add' ? 'New Profile Persona' : profile.name || 'Primary Profile')
  );
  const [profileType, setProfileType] = useState<ProfileType>(
    normalizeProfileType(profile.type || profile.profileType || 'individual')
  );
  const [theme, setTheme] = useState<ProfileTheme>(
    profile.theme === 'default' ? 'editorial' : (profile.theme || 'editorial')
  );

  // Bios & Narrative
  const [shortBio, setShortBio] = useState(
    profile.shortBio || profile.bio || 'Passionate professional delivering intuitive digital experiences with modern technology.'
  );
  const [fullBio, setFullBio] = useState(
    profile.fullBio || profile.about || 'Hello! I specialize in high-performance web applications, responsive user interfaces, and modular design systems.'
  );
  const [tagline, setTagline] = useState(
    profile.tagline || ''
  );

  // Organization & Location
  const [company, setCompany] = useState(profile.company || 'Avtive');
  const [department, setDepartment] = useState(profile.department || '');
  const [location, setLocation] = useState(profile.location || 'Global');
  const [pronouns, setPronouns] = useState(profile.pronouns || '');
  const [statusBadge, setStatusBadge] = useState(profile.statusBadge || 'Available for projects');

  // Contact Channels
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [bookingUrl, setBookingUrl] = useState(profile.bookingUrl || '');

  // Custom CTA
  const [ctaLabel, setCtaLabel] = useState(profile.customCta?.label || 'Get In Touch');
  const [ctaUrl, setCtaUrl] = useState(profile.customCta?.url || '');
  const [ctaActive, setCtaActive] = useState(profile.customCta?.active ?? false);

  // Photos
  const [avatar, setAvatar] = useState(profile.avatar || '');
  const [coverImage, setCoverImage] = useState(profile.coverImage || '');

  // UI / Action status
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSectionConfirmed, setIsSectionConfirmed] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSelectAvatar = (newAvatarUrl: string) => {
    setAvatar(newAvatarUrl);
    onLiveUpdate?.({ avatar: newAvatarUrl });
  };

  // Subsections toggle inside the expandable editor
  const [activeTab, setActiveTab] = useState<'basic' | 'bio' | 'contact'>('basic');

  // Sync state whenever the external profile prop changes (e.g. user switched persona outside)
  useEffect(() => {
    if (mode === 'edit') {
      const fName = profile.firstName || (profile.name ? profile.name.split(' ')[0] : '');
      const lName = profile.secondName || profile.lastName || (profile.name ? profile.name.split(' ').slice(1).join(' ') : '');
      setFirstName(fName);
      setSecondName(lName);
      setUsername(profile.username || profile.slug || '');
      setProfession(profile.profession || profile.professionalTitle || profile.designation || '');
      setProfileName(profile.profileName || profile.name || 'Primary Profile');
      setProfileType(normalizeProfileType(profile.type || profile.profileType || 'individual'));
      setTheme(profile.theme === 'default' ? 'editorial' : (profile.theme || 'editorial'));
      setShortBio(profile.shortBio || profile.bio || '');
      setFullBio(profile.fullBio || profile.about || '');
      setTagline(profile.tagline || '');
      setCompany(profile.company || '');
      setDepartment(profile.department || '');
      setLocation(profile.location || '');
      setPronouns(profile.pronouns || '');
      setStatusBadge(profile.statusBadge || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setWhatsapp(profile.whatsapp || '');
      setWebsite(profile.website || '');
      setBookingUrl(profile.bookingUrl || '');
      setCtaLabel(profile.customCta?.label || 'Get In Touch');
      setCtaUrl(profile.customCta?.url || '');
      if (profile.avatar) {
        setAvatar(profile.avatar);
      }
      if (profile.coverImage) {
        setCoverImage(profile.coverImage);
      }
    }
  }, [profile.id, profile.slug, profile.avatar, profile.coverImage, mode]);

  // Derived full name
  const fullName = `${firstName} ${secondName}`.trim() || firstName.trim() || 'Professional';

  // Live update trigger when fields change in edit mode
  useEffect(() => {
    if (mode === 'edit' && onLiveUpdate) {
      onLiveUpdate({
        name: fullName,
        firstName: firstName.trim(),
        secondName: secondName.trim(),
        lastName: secondName.trim(),
        username: username.trim().replace(/^@/, ''),
        profession: profession.trim(),
        professionalTitle: profession.trim(),
        designation: profession.trim(),
        profileName: profileName.trim(),
        type: profileType,
        theme,
        bio: shortBio.trim(),
        shortBio: shortBio.trim(),
        about: fullBio.trim(),
        fullBio: fullBio.trim(),
        tagline: tagline.trim(),
        company: company.trim(),
        department: department.trim(),
        location: location.trim(),
        pronouns: pronouns.trim(),
        statusBadge: statusBadge.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        website: website.trim(),
        bookingUrl: bookingUrl.trim(),
        avatar,
        coverImage,
        customCta: {
          label: ctaLabel.trim(),
          url: ctaUrl.trim(),
          active: ctaActive
        }
      });
    }
  }, [
    firstName,
    secondName,
    username,
    profession,
    profileName,
    profileType,
    theme,
    shortBio,
    fullBio,
    tagline,
    company,
    department,
    location,
    pronouns,
    statusBadge,
    email,
    phone,
    whatsapp,
    website,
    bookingUrl,
    avatar,
    coverImage,
    ctaLabel,
    ctaUrl,
    ctaActive,
    mode
  ]);

  // Handle switching between Edit and Add modes
  const handleSwitchMode = (newMode: 'edit' | 'add') => {
    setMode(newMode);
    setStatusFeedback(null);
    setIsSectionConfirmed(false);

    if (newMode === 'add') {
      // Reset form to clean template for new profile creation
      setFirstName('');
      setSecondName('');
      setUsername('');
      setProfession('Product Designer');
      setProfileName('Work Persona');
      setProfileType('individual');
      setTheme('editorial');
      setShortBio('Crafting exceptional digital identities and scalable products.');
      setFullBio('Welcome to my newly created profile persona.');
      setTagline('');
      setCompany('Avtive Innovations');
      setDepartment('');
      setLocation('Global');
      setPronouns('');
      setStatusBadge('Available for hire');
      setEmail('');
      setPhone('');
      setWhatsapp('');
      setWebsite('');
      setBookingUrl('');
      setCtaLabel('Contact Me');
      setCtaUrl('');
      setCtaActive(false);
      setAvatar(profile.avatar || '');
      setCoverImage(profile.coverImage || '');
    } else {
      // Reset back to original profile
      const fName = profile.firstName || (profile.name ? profile.name.split(' ')[0] : '');
      const lName = profile.secondName || profile.lastName || (profile.name ? profile.name.split(' ').slice(1).join(' ') : '');
      setFirstName(fName);
      setSecondName(lName);
      setUsername(profile.username || profile.slug || '');
      setProfession(profile.profession || profile.professionalTitle || profile.designation || '');
      setProfileName(profile.profileName || profile.name || 'Primary Profile');
      setProfileType(normalizeProfileType(profile.type || profile.profileType || 'individual'));
      setTheme(profile.theme === 'default' ? 'editorial' : (profile.theme || 'editorial'));
      setShortBio(profile.shortBio || profile.bio || '');
      setFullBio(profile.fullBio || profile.about || '');
      setTagline(profile.tagline || '');
      setCompany(profile.company || '');
      setDepartment(profile.department || '');
      setLocation(profile.location || '');
      setPronouns(profile.pronouns || '');
      setStatusBadge(profile.statusBadge || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setWhatsapp(profile.whatsapp || '');
      setWebsite(profile.website || '');
      setBookingUrl(profile.bookingUrl || '');
      setCtaLabel(profile.customCta?.label || 'Get In Touch');
      setCtaUrl(profile.customCta?.url || '');
      setCtaActive(profile.customCta?.active ?? false);
      setAvatar(profile.avatar || '');
      setCoverImage(profile.coverImage || '');
    }
  };

  // Upload image handlers
  const handleCoverUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatusFeedback({ type: 'error', text: 'Please select a valid image file.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setCoverImage(reader.result as string);
        onLiveUpdate?.({ coverImage: reader.result as string });
      }
    };
    reader.readAsDataURL(file);

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setCoverImage(data.url);
        onLiveUpdate?.({ coverImage: data.url });
      }
    } catch (e) {
      console.error('Cover upload failed:', e);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatusFeedback({ type: 'error', text: 'Please select a valid image file.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setAvatar(reader.result as string);
        onLiveUpdate?.({ avatar: reader.result as string });
      }
    };
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setAvatar(data.url);
        onLiveUpdate?.({ avatar: data.url });
      }
    } catch (e) {
      console.error('Avatar upload failed:', e);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save / Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isSectionConfirmed) {
      setStatusFeedback({ type: 'error', text: 'Please check the confirmation box to confirm this profile information before saving.' });
      return;
    }

    if (!firstName.trim() && !fullName.trim()) {
      setStatusFeedback({ type: 'error', text: 'Please provide at least a First Name or Full Name.' });
      return;
    }

    setIsSaving(true);
    setStatusFeedback(null);

    const profilePayload: Partial<ProfileData> = {
      name: fullName,
      firstName: firstName.trim(),
      secondName: secondName.trim(),
      lastName: secondName.trim(),
      username: username.trim().replace(/^@/, ''),
      profession: profession.trim(),
      professionalTitle: profession.trim(),
      designation: profession.trim(),
      profileName: profileName.trim() || fullName,
      type: profileType,
      theme,
      bio: shortBio.trim(),
      shortBio: shortBio.trim(),
      about: fullBio.trim(),
      fullBio: fullBio.trim(),
      tagline: tagline.trim(),
      company: company.trim(),
      department: department.trim(),
      location: location.trim(),
      pronouns: pronouns.trim(),
      statusBadge: statusBadge.trim(),
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      website: website.trim(),
      bookingUrl: bookingUrl.trim(),
      avatar,
      coverImage,
      customCta: {
        label: ctaLabel.trim(),
        url: ctaUrl.trim(),
        active: ctaActive
      }
    };

    try {
      if (mode === 'add') {
        // Create new profile persona via /api/profile/create
        const res = await fetch('/api/profile/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...profilePayload,
            profileName: profileName.trim() || fullName
          })
        });

        const data = await res.json();
        if (!res.ok || !data.profile) {
          setStatusFeedback({ type: 'error', text: data.error || 'Failed to create new profile.' });
          setIsSaving(false);
          return;
        }

        setStatusFeedback({ type: 'success', text: `✓ Profile persona "${data.profile.profileName || data.profile.name}" created successfully!` });
        onSaveSuccess?.(data.profile, true);
        setMode('edit');
      } else {
        // Update existing profile via /api/profile/update
        const targetIdentifier = profile.id || profile.slug;
        const res = await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId: targetIdentifier,
            profileSlug: profile.slug,
            slug: profile.slug,
            userId: profile.userId,
            updatedData: profilePayload
          })
        });

        const data = await res.json();
        if (!res.ok) {
          setStatusFeedback({ type: 'error', text: data.error || 'Failed to update profile.' });
          setIsSaving(false);
          return;
        }

        const savedProfile: ProfileData = data.updatedProfile || data.profile || { ...profile, ...profilePayload };
        setStatusFeedback({ type: 'success', text: '✓ Profile updated and synchronized successfully!' });
        onSaveSuccess?.(savedProfile, false);
      }

      setTimeout(() => {
        setStatusFeedback((prev) => (prev?.type === 'success' ? null : prev));
      }, 4000);
    } catch (err) {
      console.error('Save Profile Error:', err);
      setStatusFeedback({ type: 'error', text: 'Network error while saving profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const currentDisplayIdentifier = username.trim().replace(/^@/, '') || profile.slug || profile.id || 'username';

  return (
    <div className={`w-full font-sans ${className}`}>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="inline-profile-section-editor"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-3 space-y-4">
              {/* Dual Mode Switcher Bar (Edit vs Add) */}
              <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-100/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('edit')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      mode === 'edit'
                        ? 'bg-white dark:bg-[#1C1F28] text-slate-900 dark:text-white shadow-xs border border-slate-200/70 dark:border-white/15'
                        : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchMode('add')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      mode === 'add'
                        ? 'bg-white dark:bg-[#1C1F28] text-slate-900 dark:text-white shadow-xs border border-slate-200/70 dark:border-white/15'
                        : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Add New Profile</span>
                  </button>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  mode === 'add'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                }`}>
                  {mode === 'add' ? 'Add Persona State' : 'Update State'}
                </span>
              </div>

              {/* Status feedback alerts */}
              {statusFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    statusFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                  }`}
                >
                  {statusFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span className="flex-1">{statusFeedback.text}</span>
                  <button
                    type="button"
                    onClick={() => setStatusFeedback(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}

              {/* 1. Integrated Cover Photo & Avatar Area */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs">
                {/* Cover Banner */}
                <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img
                    src={coverImage}
                    alt="Cover Banner"
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                  {/* Change Cover Button */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploadingCover}
                      className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-white text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-sm"
                      title="Upload Cover Image"
                    >
                      {isUploadingCover ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Camera className="w-3 h-3" />
                      )}
                      <span>{isUploadingCover ? 'Uploading...' : 'Cover Photo'}</span>
                    </button>
                  </div>

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverUpload(file);
                    }}
                  />
                </div>

                {/* Avatar & Realtime Title */}
                <div className="px-4 pb-3.5 pt-0 relative -mt-8 flex items-end justify-between gap-3">
                  <div className="flex items-end gap-3 min-w-0">
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full border-3 border-white dark:border-[#111319] shadow-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 group">
                      <img
                        src={avatar}
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setIsAvatarPickerOpen((prev) => !prev)}
                        disabled={isUploadingAvatar}
                        className="absolute inset-0 bg-black/40 group-hover:bg-black/60 flex items-center justify-center text-white transition-colors cursor-pointer"
                        title="Choose avatar or upload photo inline"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="min-w-0 pb-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                          {fullName || (mode === 'add' ? 'New Profile' : 'Your Name')}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsAvatarPickerOpen((prev) => !prev)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                            isAvatarPickerOpen
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                          }`}
                          title="Toggle inline avatar choices & upload"
                        >
                          <Camera className="w-2.5 h-2.5" />
                          <span>{isAvatarPickerOpen ? 'Hide Choices' : 'Change Photo'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-white/60 truncate">
                        {profession || 'Professional Title'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pb-0.5 text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-white/70">
                      @{currentDisplayIdentifier}
                    </span>
                  </div>
                </div>

                {/* Inline Profile Photo Picker Tray */}
                <InlineAvatarPicker
                  currentAvatar={avatar}
                  onSelectAvatar={handleSelectAvatar}
                  isOpen={isAvatarPickerOpen}
                  onToggleOpen={() => setIsAvatarPickerOpen((prev) => !prev)}
                  onClose={() => setIsAvatarPickerOpen(false)}
                  isUploading={isUploadingAvatar}
                  onUploadFile={handleAvatarUpload}
                  className="px-4 pb-2"
                />
              </div>

              {/* Sub-Tab Navigation for Clear Ergonomics */}
              <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 pb-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'basic' as const, label: 'Identity & Info', icon: User },
                  { id: 'bio' as const, label: 'Bio & Org', icon: Building2 },
                  { id: 'contact' as const, label: 'Contact Channels', icon: Phone }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isCurrent = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        isCurrent
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                          : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: IDENTITY & NAME */}
              {activeTab === 'basic' && (
                <div className="space-y-3 pt-1">
                  {/* Persona Label & Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                        Persona Label / Profile Name
                      </label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="e.g. Work Persona, Executive, Creator"
                        className="figma-input w-full px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                        Profile Type
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setProfileType('individual')}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            profileType === 'individual'
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                              : 'bg-white dark:bg-white/5 text-slate-700 dark:text-white/70 border-slate-200 dark:border-white/10 hover:border-slate-300'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Individual</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfileType('team')}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            profileType === 'team'
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                              : 'bg-white dark:bg-white/5 text-slate-700 dark:text-white/70 border-slate-200 dark:border-white/10 hover:border-slate-300'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Team / Org</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First Name"
                        className="figma-input w-full px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={secondName}
                        onChange={(e) => setSecondName(e.target.value)}
                        placeholder="Last Name"
                        className="figma-input w-full px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                      />
                    </div>
                  </div>

                  {/* Username / URL Handle */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                      Username / URL Handle
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-semibold text-slate-400 dark:text-white/40 select-none">
                        @
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                        placeholder="username"
                        className="figma-input w-full pl-7 pr-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40 font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-white/40 mt-1 flex items-center gap-1">
                      <span>Public link:</span>
                      <span className="font-mono text-slate-600 dark:text-white/60 underline">
                        avtive.app/profile/{currentDisplayIdentifier}
                      </span>
                    </p>
                  </div>

                  {/* Profession / Professional Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                      Profession / Title / Designation
                    </label>
                    <div className="relative flex items-center">
                      <Briefcase className="absolute left-3 w-3.5 h-3.5 text-slate-400 dark:text-white/40 pointer-events-none" />
                      <input
                        type="text"
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        placeholder="e.g. Senior Full Stack Engineer, Head of Product"
                        className="figma-input w-full pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                      />
                    </div>
                  </div>

                  {/* Pronouns & Status Badge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                        Pronouns
                      </label>
                      <input
                        type="text"
                        value={pronouns}
                        onChange={(e) => setPronouns(e.target.value)}
                        placeholder="e.g. they/them, she/her, he/him"
                        className="figma-input w-full px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                        Status Badge / Slogan
                      </label>
                      <input
                        type="text"
                        value={statusBadge}
                        onChange={(e) => setStatusBadge(e.target.value)}
                        placeholder="e.g. 🚀 Open to work, 🟢 Consulting"
                        className="figma-input w-full px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                      />
                    </div>
                  </div>

                  {/* Describe yourself best */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                      Describe yourself best
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="A short punchy line or motto that describes you best…"
                      className="figma-input w-full px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: BIO & ORGANIZATION */}
              {activeTab === 'bio' && (
                <div className="space-y-3 pt-1">
                  {/* Short Bio */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                      Short Bio / Headline
                    </label>
                    <textarea
                      rows={2}
                      value={shortBio}
                      onChange={(e) => setShortBio(e.target.value)}
                      placeholder="A punchy, concise summary of your focus..."
                      className="figma-input w-full px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Full Bio / Narrative */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                      Full Bio & About Philosophy
                    </label>
                    <textarea
                      rows={4}
                      value={fullBio}
                      onChange={(e) => setFullBio(e.target.value)}
                      placeholder="Share your career journey, expertise, philosophy, or team mission..."
                      className="figma-input w-full px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Company & Department */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                        Company / Organization
                      </label>
                      <div className="relative flex items-center">
                        <Building2 className="absolute left-3 w-3.5 h-3.5 text-slate-400 dark:text-white/40 pointer-events-none" />
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Company name"
                          className="figma-input w-full pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                        Department / Team
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Engineering, Product, Design"
                        className="figma-input w-full px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                      Location / Region
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 w-3.5 h-3.5 text-slate-400 dark:text-white/40 pointer-events-none" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. San Francisco, CA or London, UK or Remote"
                        className="figma-input w-full pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                      />
                    </div>
                  </div>

                  {/* Describe yourself best */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                      Describe yourself best
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="A short punchy line or motto that describes you best…"
                      className="figma-input w-full px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: CONTACT CHANNELS & CTA */}
              {activeTab === 'contact' && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Direct Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                        Direct Email
                      </label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-3 w-3.5 h-3.5 text-slate-400 dark:text-white/40 pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@domain.com"
                          className="figma-input w-full pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                        Phone Number
                      </label>
                      <div className="relative flex items-center">
                        <Phone className="absolute left-3 w-3.5 h-3.5 text-slate-400 dark:text-white/40 pointer-events-none" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="figma-input w-full pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* WhatsApp */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                        WhatsApp Number / Link
                      </label>
                      <div className="relative flex items-center">
                        <MessageSquare className="absolute left-3 w-3.5 h-3.5 text-emerald-500 pointer-events-none" />
                        <input
                          type="text"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="+15550000000"
                          className="figma-input w-full pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                        />
                      </div>
                    </div>

                    {/* Official Website */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                        Personal Website / Portfolio
                      </label>
                      <div className="relative flex items-center">
                        <Globe className="absolute left-3 w-3.5 h-3.5 text-blue-500 pointer-events-none" />
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://yoursite.com"
                          className="figma-input w-full pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calendly / Booking URL */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-white/70 mb-1">
                      Calendar Booking URL (Calendly, Cal.com)
                    </label>
                    <div className="relative flex items-center">
                      <Calendar className="absolute left-3 w-3.5 h-3.5 text-purple-500 pointer-events-none" />
                      <input
                        type="url"
                        value={bookingUrl}
                        onChange={(e) => setBookingUrl(e.target.value)}
                        placeholder="https://cal.com/username/30min"
                        className="figma-input w-full pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/40"
                      />
                    </div>
                  </div>

                  {/* Custom Action Button (CTA) */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200/80 dark:border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Custom Call-To-Action Button
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCtaActive(!ctaActive)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                          ctaActive
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/50'
                        }`}
                      >
                        {ctaActive ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>

                    {ctaActive && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <input
                          type="text"
                          value={ctaLabel}
                          onChange={(e) => setCtaLabel(e.target.value)}
                          placeholder="Button Label (e.g. Schedule Call)"
                          className="figma-input w-full px-2.5 py-1.5 text-xs font-semibold"
                        />
                        <input
                          type="url"
                          value={ctaUrl}
                          onChange={(e) => setCtaUrl(e.target.value)}
                          placeholder="Destination URL (https://...)"
                          className="figma-input w-full px-2.5 py-1.5 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Inline Confirmation Checkbox */}
              <div className="pt-3 pb-1 border-t border-slate-200/80 dark:border-white/10">
                <label htmlFor="section-editor-confirm" className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    id="section-editor-confirm"
                    checked={isSectionConfirmed}
                    onChange={(e) => setIsSectionConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                  />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-white/80 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    I confirm that this profile persona information is accurate.
                  </span>
                </label>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Collapse
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSwitchMode(mode)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    title="Reset changes to baseline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSaving || !isSectionConfirmed}
                    className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all ${
                      mode === 'add'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'figma-pill-primary'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{mode === 'add' ? 'Creating Profile...' : 'Saving Changes...'}</span>
                      </>
                    ) : (
                      <>
                        {mode === 'add' ? <Plus className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{mode === 'add' ? 'Create & Switch Profile' : 'Update Profile'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
