'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  X,
  Share2,
  Link2,
  Layers,
  Eye,
  EyeOff,
  QrCode,
  Copy,
  Check,
  Smartphone,
  Send,
  Users,
  Tag,
  Lock,
  ChevronDown,
  Loader2,
  Clock,
  BookmarkPlus,
  Contact,
  AlertCircle
} from 'lucide-react';
import { buildProfileUrlForMode } from '@/lib/profileScreenMode';
import { PrivacyTier, ProfileData } from '@/types/profile';
import {
  ContactTagSummary,
  ShareChannel,
  ShareExpiryOption,
  ShareLinkClientView,
  SharePresetKey,
  ShareRecipientAssociation,
  ShareTemplateRecord
} from '@/types/sharing';
import {
  PRESET_DEFINITIONS,
  SHAREABLE_FIELD_GROUPS,
  SHAREABLE_FIELD_MAP,
  SHAREABLE_FIELDS,
  getAllAvailableShareFieldKeys,
  getCustomFieldDisplay,
  getFieldPrivacyTier,
  getPresetFieldsForProfile,
  hasFieldValue,
  isFieldOwnerHidden,
  isSensitiveNeverShareLabel
} from '@/lib/sharing/presets';
import { sanitizeProfileForShare } from '@/lib/sharing/sanitize';
import { downloadVCard } from '@/lib/vcard';
import { generateCardPdf } from '@/lib/cardPdfGenerator';
import { SafetyCheckPanel, SafetyCheckTarget } from './SafetyCheckPanel';
import { RecipientPickerModal } from './RecipientPickerModal';
import { LiveSharePreview } from './LiveSharePreview';
import { LinkQrReadyPanel } from './LinkQrReadyPanel';
import { SharedLinksTab } from './SharedLinksTab';
import { ShareTemplatesTab } from './ShareTemplatesTab';
import { InPersonShareView } from './InPersonShareView';

export interface UnifiedShareWorkspaceProps {
  isOpen?: boolean;
  onClose: () => void;
  profile: ProfileData;
  userProfiles?: ProfileData[];
  selectedProfileId?: string;
  onSelectProfileId?: (profileId: string) => void;
  draftSelectionsByProfile?: Record<string, string[]>;
  onUpdateDraftSelection?: (profileId: string, fields: string[]) => void;
  draftPresetByProfile?: Record<string, SharePresetKey | 'custom'>;
  onUpdateDraftPreset?: (profileId: string, preset: SharePresetKey | 'custom') => void;
  onCopySuccess?: () => void;
  onUpdateProfile?: (updatedProfile: ProfileData) => void;
  onAuthRequired?: () => void;
  onSwitchToPublicShare?: () => void;
  isDark?: boolean;
}

type MainTab = 'share' | 'links' | 'templates';
type ShareSubView = 'configure' | 'recipients' | 'ready' | 'in_person';

export function UnifiedShareWorkspace({
  isOpen = true,
  onClose,
  profile,
  userProfiles,
  selectedProfileId,
  onSelectProfileId,
  draftSelectionsByProfile,
  onUpdateDraftSelection,
  draftPresetByProfile,
  onUpdateDraftPreset,
  onCopySuccess,
  onUpdateProfile,
  onAuthRequired,
  onSwitchToPublicShare,
  isDark = false
}: UnifiedShareWorkspaceProps) {
  const [roles, setRoles] = useState<ProfileData[]>(
    userProfiles && userProfiles.length > 0 ? userProfiles : [profile]
  );
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    () => selectedProfileId || profile.id
  );
  const [patchedPrivacyByProfile, setPatchedPrivacyByProfile] = useState<
    Record<string, Record<string, PrivacyTier>>
  >({});

  const availableRoles = useMemo(
    () => (roles.length > 1 || !userProfiles?.length ? roles : userProfiles),
    [roles, userProfiles]
  );

  const activeProfile = useMemo<ProfileData>(() => {
    const match =
      availableRoles.find((p) => p.id === selectedRoleId || p.slug === selectedRoleId) ||
      (profile.id === selectedRoleId ? profile : availableRoles[0]) ||
      profile;
    const base = match.id === profile.id ? profile : match;
    const privacyPatch = patchedPrivacyByProfile[base.id];
    return privacyPatch ? { ...base, fieldPrivacy: privacyPatch } : base;
  }, [availableRoles, selectedRoleId, profile, patchedPrivacyByProfile]);

  // Main Navigation State
  const [activeTab, setActiveTab] = useState<MainTab>('share');
  const [subView, setSubView] = useState<ShareSubView>('configure');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Share Configuration State
  const [activePreset, setActivePreset] = useState<SharePresetKey | 'custom'>(
    draftPresetByProfile?.[activeProfile.id] || 'general'
  );
  const [activeTemplateId, setActiveTemplateId] = useState<string | undefined>('tpl-builtin-general');
  const [activeTemplateName, setActiveTemplateName] = useState<string>('General');

  const [selectedFields, setSelectedFields] = useState<string[]>(() => {
    const savedDraft = draftSelectionsByProfile?.[activeProfile.id];
    if (savedDraft && savedDraft.length > 0) return savedDraft;
    return getPresetFieldsForProfile(activeProfile, 'general');
  });
  const [confirmedPrivateFields, setConfirmedPrivateFields] = useState<string[]>([]);

  const [shareTitle, setShareTitle] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<ShareRecipientAssociation[]>([]);
  const [eventLabel, setEventLabel] = useState('');
  const [expiryOption, setExpiryOption] = useState<ShareExpiryOption>('never');

  // Interactive Helpers
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [safetyTarget, setSafetyTarget] = useState<SafetyCheckTarget | null>(null);
  const [generatedLink, setGeneratedLink] = useState<ShareLinkClientView | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [linksRefreshSignal, setLinksRefreshSignal] = useState(0);

  // Quick Save Template inside Share tab
  const [showQuickSaveTpl, setShowQuickSaveTpl] = useState(false);
  const [quickTplName, setQuickTplName] = useState('');
  const [isSavingQuickTpl, setIsSavingQuickTpl] = useState(false);

  // Recipients & Contact Tags fetched from /api/share/recipients
  const [recipientsList, setRecipientsList] = useState<ShareRecipientAssociation[]>([]);
  const [contactTags, setContactTags] = useState<ContactTagSummary[]>([]);
  const [activeContactTags, setActiveContactTags] = useState<string[]>([]);
  const [pastEventLabels, setPastEventLabels] = useState<string[]>([]);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [isAuthRequired, setIsAuthRequired] = useState(false);

  const markAuthRequired = useCallback(() => {
    setIsAuthRequired(true);
    onAuthRequired?.();
  }, [onAuthRequired]);

  useEffect(() => {
    if (!isOpen || isAuthRequired) return;
    if (userProfiles && userProfiles.length > 0) return;
    let active = true;
    fetch('/api/profile/list', { cache: 'no-store' })
      .then(async (res) => {
        if (!active) return;
        if (res.status === 401) {
          markAuthRequired();
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (active && data.profiles && Array.isArray(data.profiles) && data.profiles.length > 0) {
          setRoles(data.profiles);
        }
      })
      .catch(() => { });
    return () => {
      active = false;
    };
  }, [isOpen, isAuthRequired, userProfiles, markAuthRequired]);

  useEffect(() => {
    if (!isOpen || isAuthRequired) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) setIsLoadingRecipients(true);
    });
    fetch('/api/share/recipients', { cache: 'no-store' })
      .then((res) =>
        res
          .json()
          .catch(() => ({}))
          .then((data) => ({ ok: res.ok, status: res.status, data }))
      )
      .then(({ ok, status, data }) => {
        if (!active) return;
        if (status === 401) {
          markAuthRequired();
          return;
        }
        if (!ok) {
          throw new Error(data.error || 'Could not load contacts.');
        }
        if (Array.isArray(data.recipients)) setRecipientsList(data.recipients);
        if (Array.isArray(data.contactTags)) setContactTags(data.contactTags);
        if (Array.isArray(data.activeContactTags)) {
          setActiveContactTags(data.activeContactTags);
        } else if (Array.isArray(data.availableLabels)) {
          setActiveContactTags(data.availableLabels);
        }
        if (Array.isArray(data.eventLabels)) setPastEventLabels(data.eventLabels);
        setEmailConfigured(Boolean(data.emailConfigured));
      })
      .catch((err: unknown) => {
        if (active) {
          setStatusFeedback({
            type: 'error',
            text: err instanceof Error ? err.message : 'Could not load contacts.'
          });
        }
      })
      .finally(() => {
        if (active) setIsLoadingRecipients(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, isAuthRequired, markAuthRequired]);

  const updateSelectedFields = useCallback(
    (next: string[]) => {
      setSelectedFields(next);
      onUpdateDraftSelection?.(activeProfile.id, next);
      setGeneratedLink(null);
    },
    [activeProfile.id, onUpdateDraftSelection]
  );

  const handleSwitchProfile = (nextProfile: ProfileData) => {
    setSelectedRoleId(nextProfile.id);
    onSelectProfileId?.(nextProfile.id);
    setIsProfileMenuOpen(false);
    setGeneratedLink(null);
    setConfirmedPrivateFields([]);

    const savedFields = draftSelectionsByProfile?.[nextProfile.id];
    const savedPreset = draftPresetByProfile?.[nextProfile.id];
    if (savedFields && savedFields.length > 0) {
      setSelectedFields(savedFields);
      setActivePreset(savedPreset || 'custom');
    } else {
      const presetToUse = savedPreset && savedPreset !== 'custom' ? savedPreset : 'general';
      setActivePreset(presetToUse);
      setSelectedFields(getPresetFieldsForProfile(nextProfile, presetToUse));
    }
  };

  const handleSelectPreset = (presetKey: SharePresetKey) => {
    setActivePreset(presetKey);
    onUpdateDraftPreset?.(activeProfile.id, presetKey);
    setActiveTemplateId(`tpl-builtin-${presetKey}`);
    setActiveTemplateName(PRESET_DEFINITIONS[presetKey].name);
    setConfirmedPrivateFields([]);
    updateSelectedFields(getPresetFieldsForProfile(activeProfile, presetKey));
    setStatusFeedback(null);
  };

  const handleApplyTemplate = (tpl: ShareTemplateRecord) => {
    if (tpl.presetKey) {
      setActivePreset(tpl.presetKey);
      onUpdateDraftPreset?.(activeProfile.id, tpl.presetKey);
    } else {
      setActivePreset('custom');
      onUpdateDraftPreset?.(activeProfile.id, 'custom');
    }
    setActiveTemplateId(tpl.id);
    setActiveTemplateName(tpl.name);

    const allowed = tpl.selectedFields.filter(
      (f) =>
        getFieldPrivacyTier(activeProfile, f) !== 'never_share' &&
        !isFieldOwnerHidden(activeProfile, f)
    );
    updateSelectedFields(allowed);
    setActiveTab('share');
    setSubView('configure');
    setStatusFeedback({ type: 'success', text: `Applied "${tpl.name}" template.` });
  };

  const getFieldMaskedValue = (fieldKey: string): string => {
    if (fieldKey.startsWith('custom-field-')) {
      const id = fieldKey.replace('custom-field-', '');
      const cf = (activeProfile.customFields || []).find((c) => c.id === id);
      if (!cf) return 'Custom item';
      return getCustomFieldDisplay(cf, getFieldPrivacyTier(activeProfile, fieldKey));
    }
    switch (fieldKey) {
      case 'photo': return (activeProfile.avatar || (activeProfile as any).logoUrl) ? 'Profile headshot configured' : 'Not uploaded';
      case 'coverImage': return (activeProfile.coverImage || (activeProfile as any).coverUrl) ? 'Cover banner configured' : 'Default cover';
      case 'name': return activeProfile.name || 'Not set';
      case 'title': return activeProfile.designation || activeProfile.professionalTitle || 'Not set';
      case 'bio': return activeProfile.shortBio || activeProfile.about || 'Not set';
      case 'introductionMedia': return activeProfile.introductionMedia?.url ? 'Media intro added' : 'Not added';
      case 'email': return activeProfile.email || 'Not set';
      case 'phone': return activeProfile.phone || activeProfile.whatsapp || 'Not set';
      case 'website': return activeProfile.website || 'Not set';
      case 'location': return activeProfile.location || activeProfile.country || 'Not set';
      case 'socialLinks': return `${(activeProfile.socials || activeProfile.socialLinks || []).length} link(s)`;
      case 'birthday': return activeProfile.birthday ? `•••• ${activeProfile.birthday.slice(-4)}` : 'Not set';
      case 'pronouns': return activeProfile.pronouns || 'Not set';
      case 'skills': return `${(activeProfile.skills || []).length} skills`;
      case 'services': return `${(activeProfile.services || []).length} services`;
      case 'experience': return `${(activeProfile.experiences || activeProfile.experience || []).length} roles`;
      case 'education': return `${(activeProfile.education || []).length} entries`;
      case 'projects': return `${(activeProfile.projects || []).length} projects`;
      case 'certifications': return `${(activeProfile.certifications || []).length} certifications`;
      case 'resume': return activeProfile.resumeFileName || (activeProfile.resumeUrl ? 'Resume uploaded' : 'Generated CV summary');
      default: return hasFieldValue(activeProfile, fieldKey) ? 'Configured' : 'Empty';
    }
  };

  const handleToggleField = (fieldKey: string, label: string) => {
    const isCurrentlySelected = selectedFields.includes(fieldKey);
    const tier = getFieldPrivacyTier(activeProfile, fieldKey);
    const ownerHidden = isFieldOwnerHidden(activeProfile, fieldKey);

    if (ownerHidden) {
      setStatusFeedback({
        type: 'error',
        text: `"${label}" is hidden on your main profile. Unhide it in profile settings to allow sharing.`
      });
      return;
    }

    if (isCurrentlySelected) {
      setActivePreset('custom');
      onUpdateDraftPreset?.(activeProfile.id, 'custom');
      setActiveTemplateName('Custom selection');
      setConfirmedPrivateFields((prev) => prev.filter((k) => k !== fieldKey));
      updateSelectedFields(selectedFields.filter((k) => k !== fieldKey));
      return;
    }

    if (tier === 'never_share') {
      const cfLabel = fieldKey.startsWith('custom-field-')
        ? (activeProfile.customFields || []).find((c) => `custom-field-${c.id}` === fieldKey)?.label || label
        : label;
      setSafetyTarget({
        fieldKey,
        label: cfLabel,
        tier: 'never_share',
        maskedPreview: getFieldMaskedValue(fieldKey),
        isSystemLocked: isSensitiveNeverShareLabel(cfLabel)
      });
      return;
    }

    if (tier === 'private' && !confirmedPrivateFields.includes(fieldKey)) {
      setSafetyTarget({
        fieldKey,
        label,
        tier: 'private',
        maskedPreview: getFieldMaskedValue(fieldKey)
      });
      return;
    }

    setActivePreset('custom');
    onUpdateDraftPreset?.(activeProfile.id, 'custom');
    setActiveTemplateName('Custom selection');
    updateSelectedFields([...selectedFields, fieldKey]);
  };

  const handleConfirmPrivateField = (fieldKey: string) => {
    setConfirmedPrivateFields((prev) => Array.from(new Set([...prev, fieldKey])));
    if (!selectedFields.includes(fieldKey)) {
      setActivePreset('custom');
      onUpdateDraftPreset?.(activeProfile.id, 'custom');
      setActiveTemplateName('Custom selection');
      updateSelectedFields([...selectedFields, fieldKey]);
    }
  };

  const handleChangeFieldPrivacy = async (fieldKey: string, nextTier: PrivacyTier) => {
    const nextFieldPrivacy: Record<string, PrivacyTier> = {
      ...(activeProfile.fieldPrivacy || {}),
      [fieldKey]: nextTier
    };

    try {
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: activeProfile.id,
          updatedData: { fieldPrivacy: nextFieldPrivacy }
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        markAuthRequired();
        throw new Error(data.error || 'Your session has expired. Please sign in again.');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update privacy classification.');
      }
      const updated = data.profile || { ...activeProfile, fieldPrivacy: nextFieldPrivacy };
      setPatchedPrivacyByProfile((prev) => ({
        ...prev,
        [updated.id]: updated.fieldPrivacy || nextFieldPrivacy
      }));
      onUpdateProfile?.(updated);

      if (nextTier === 'never_share' || nextTier === 'private') {
        setConfirmedPrivateFields((prev) => prev.filter((k) => k !== fieldKey));
        if (nextTier === 'never_share') {
          updateSelectedFields(selectedFields.filter((k) => k !== fieldKey));
        }
      }
      const customLabel = activeProfile.customFields?.find(
        (cf) => `custom-field-${cf.id}` === fieldKey
      )?.label;
      setStatusFeedback({
        type: 'success',
        text: `Updated "${customLabel || SHAREABLE_FIELD_MAP[fieldKey]?.label || fieldKey}" classification to ${nextTier.replace('_', ' ')}.`
      });
    } catch (err: unknown) {
      setStatusFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update privacy setting.'
      });
    }
  };

  const mintShareLink = useCallback(
    async (channel: ShareChannel = 'link'): Promise<ShareLinkClientView | null> => {
      if (isAuthRequired) {
        setStatusFeedback({ type: 'error', text: 'Your session has expired. Please sign in again.' });
        return null;
      }
      if (selectedFields.length === 0) {
        setStatusFeedback({ type: 'error', text: 'Select at least one field before creating a share link.' });
        return null;
      }

      setIsGeneratingLink(true);
      setStatusFeedback(null);
      try {
        const res = await fetch('/api/share/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId: activeProfile.id,
            title: shareTitle.trim() || undefined,
            selectedFields,
            confirmedPrivateFields,
            templateId: activeTemplateId,
            templateName: activeTemplateName,
            recipients: selectedRecipients,
            eventLabel: eventLabel.trim() || undefined,
            shareChannel: channel,
            expiryOption
          })
        });

        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          markAuthRequired();
          throw new Error(data.error || 'Your session has expired. Please sign in again.');
        }
        if (!res.ok || !data.link) {
          throw new Error(data.error || 'Could not generate secure share link.');
        }

        setGeneratedLink(data.link);
        setLinksRefreshSignal((s) => s + 1);
        return data.link;
      } catch (err: unknown) {
        setStatusFeedback({
          type: 'error',
          text: err instanceof Error ? err.message : 'Failed to create share link.'
        });
        return null;
      } finally {
        setIsGeneratingLink(false);
      }
    },
    [
      activeProfile.id,
      activeTemplateId,
      activeTemplateName,
      confirmedPrivateFields,
      eventLabel,
      expiryOption,
      isAuthRequired,
      markAuthRequired,
      selectedFields,
      selectedRecipients,
      shareTitle
    ]
  );

  const handleGenerateAndCopy = async () => {
    const link = generatedLink || (await mintShareLink('link'));
    if (!link) return;
    const url =
      link.shareUrl ||
      (typeof window !== 'undefined' ? `${window.location.origin}${link.sharePath}` : link.sharePath);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedDirect(true);
      onCopySuccess?.();
      setStatusFeedback({ type: 'success', text: 'Secure share link created and copied!' });
      setTimeout(() => setCopiedDirect(false), 2400);
    } catch {
      setSubView('ready');
    }
  };

  const handleOpenQrReady = async () => {
    const link = generatedLink || (await mintShareLink('qr'));
    if (link) {
      setSubView('ready');
    }
  };

  const handleNativeSend = async () => {
    const link = generatedLink || (await mintShareLink('native'));
    if (!link) return;
    const url =
      link.shareUrl ||
      (typeof window !== 'undefined' ? `${window.location.origin}${link.sharePath}` : link.sharePath);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: link.title,
          url
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    setSubView('ready');
  };

  const handleSaveQuickTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthRequired) {
      setStatusFeedback({ type: 'error', text: 'Your session has expired. Please sign in again.' });
      return;
    }
    if (!quickTplName.trim()) return;
    setIsSavingQuickTpl(true);
    try {
      const res = await fetch('/api/share/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickTplName.trim(),
          selectedFields,
          profileId: activeProfile.id
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        markAuthRequired();
        throw new Error(data.error || 'Your session has expired. Please sign in again.');
      }
      if (!res.ok || !data.template) {
        throw new Error(data.error || 'Failed to save template.');
      }
      setActiveTemplateId(data.template.id);
      setActiveTemplateName(data.template.name);
      setShowQuickSaveTpl(false);
      setQuickTplName('');
      setStatusFeedback({ type: 'success', text: `Saved custom template "${data.template.name}".` });
    } catch (err: unknown) {
      setStatusFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save template.'
      });
    } finally {
      setIsSavingQuickTpl(false);
    }
  };

  const totalSharableCount = useMemo(() => {
    return getAllAvailableShareFieldKeys(activeProfile).length;
  }, [activeProfile]);

  const progressPct = totalSharableCount > 0
    ? Math.min(100, Math.round((selectedFields.length / totalSharableCount) * 100))
    : 0;

  if (!isOpen) return null;

  return (
    <div
      data-testid="unified-share-workspace"
      aria-label="Unified Profile Sharing"
      className="w-full flex-1 min-h-0 overflow-y-auto overscroll-contain bg-zinc-50 dark:bg-black text-zinc-950 dark:text-white animate-in fade-in duration-150 font-sans text-left"
    >
      {/* Top Persistent In-Page Header */}
      {subView === 'configure' && (
        <header className="sticky top-0 z-20 px-4 sm:px-6 pt-3.5 pb-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Row 1: Back & Title */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[38px] px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                aria-label="Back to Profile"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950 dark:text-white">
                {activeTab === 'share'
                  ? 'Share Profile'
                  : activeTab === 'links'
                    ? 'Shared Links'
                    : 'Share Templates'}
              </h1>

              <div className="w-[68px] shrink-0" aria-hidden="true" />
            </div>

            {/* Row 2: Active Profile Identity Card + Switcher */}
            <div className="relative">
              <div
                onClick={() => roles.length > 1 && setIsProfileMenuOpen((v) => !v)}
                className={`p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between gap-2.5 ${roles.length > 1 ? 'cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600' : ''
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {activeProfile.avatar ? (
                    <img
                      src={activeProfile.avatar}
                      alt={activeProfile.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-white/15 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {activeProfile.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white truncate">
                        {activeProfile.profileName || activeProfile.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-mono uppercase shrink-0">
                        {activeProfile.type === 'team' ? 'Team' : 'Individual'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {activeProfile.designation || activeProfile.professionalTitle || 'Digital Profile'}
                    </p>
                  </div>
                </div>

                {roles.length > 1 && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-900 dark:text-zinc-200 shrink-0 pr-1">
                    <span>Switch</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </div>
                )}
              </div>

              {isProfileMenuOpen && roles.length > 1 && (
                <div className="mt-1.5 rounded-2xl bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 shadow-lg p-1.5 space-y-1 max-h-52 overflow-y-auto">
                  {roles.map((r) => {
                    const isSel = r.id === activeProfile.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSwitchProfile(r)}
                        className={`w-full p-2 rounded-xl flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${isSel
                          ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white font-bold'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-200'
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                            {r.avatar ? (
                              <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" />
                            ) : (
                              r.name?.charAt(0)?.toUpperCase() || 'A'
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs truncate">{r.profileName || r.name}</div>
                            <div className="text-[10px] opacity-70 truncate">
                              {r.designation || r.type}
                            </div>
                          </div>
                        </div>
                        {isSel && <Check className="w-3.5 h-3.5 text-zinc-950 dark:text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Row 3: 3 Primary Tabs (Share | Shared Links | Templates) */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              {[
                { id: 'share' as const, label: 'Share', icon: Share2 },
                { id: 'links' as const, label: 'Shared Links', icon: Link2 },
                { id: 'templates' as const, label: 'Templates', icon: Layers }
              ].map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${active
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>
      )}

      {/* Main In-Page Content Body */}
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5">
        {isAuthRequired && (
          <div
            data-testid="share-auth-required-banner"
            role="alert"
            className="rounded-2xl border-2 border-zinc-900 dark:border-white bg-white dark:bg-[#111111] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-zinc-950 dark:text-white shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white">
                  Session expired — sign in required
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Please sign in again to load your contacts, shared links, and custom templates.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {onSwitchToPublicShare && (
                <button
                  type="button"
                  onClick={onSwitchToPublicShare}
                  className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                >
                  Public Share View
                </button>
              )}
              <Link
                href={`/login?returnUrl=${encodeURIComponent(
                  buildProfileUrlForMode(activeProfile.slug || activeProfile.id, 'share')
                )}`}
                className="px-3.5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Sign In Again
              </Link>
            </div>
          </div>
        )}

        {/* Inline Sub-Views (Recipients / Link & QR Ready / Tap Phones In-Person) */}
        {subView === 'recipients' && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden">
            <RecipientPickerModal
              contacts={recipientsList}
              contactTags={contactTags}
              activeContactTags={activeContactTags}
              eventLabels={pastEventLabels}
              selectedRecipients={selectedRecipients}
              selectedEventLabel={eventLabel}
              isLoading={isLoadingRecipients}
              onAuthRequired={markAuthRequired}
              onContactsDataChange={(payload) => {
                setRecipientsList(payload.recipients);
                setContactTags(payload.contactTags);
                setActiveContactTags(payload.activeContactTags);
                setPastEventLabels(payload.eventLabels);
                setSelectedRecipients((prev) =>
                  prev.map((sel) => payload.recipients.find((r) => r.id === sel.id) || sel)
                );
              }}
              onBack={() => setSubView('configure')}
              onSaveSelection={(recs, label) => {
                setSelectedRecipients(recs);
                setEventLabel(label);
                setGeneratedLink(null);
                setSubView('configure');
              }}
            />
          </div>
        )}

        {subView === 'ready' && generatedLink && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden">
            <LinkQrReadyPanel
              profile={activeProfile}
              link={generatedLink}
              emailConfigured={emailConfigured}
              isDark={isDark}
              onAuthRequired={markAuthRequired}
              onBack={() => setSubView('configure')}
              onUpdateLink={(updated) => {
                setGeneratedLink(updated);
                setLinksRefreshSignal((s) => s + 1);
              }}
              onEditRecipients={() => setSubView('recipients')}
            />
          </div>
        )}

        {subView === 'in_person' && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden">
            <InPersonShareView
              profile={activeProfile}
              activeLink={generatedLink}
              templateName={activeTemplateName}
              eventLabel={eventLabel}
              selectedFieldsCount={selectedFields.length}
              onEnsureShareLink={(channel) => mintShareLink(channel)}
              onBack={() => setSubView('configure')}
            />
          </div>
        )}

        {/* TAB 1: SHARE (CONFIGURE, INLINE SAFETY CHECK, PREVIEW, GENERATE & SEND) */}
        {subView === 'configure' && activeTab === 'share' && (
          <div className="space-y-4">
            {statusFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold border ${statusFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
                  }`}
              >
                {statusFeedback.text}
              </div>
            )}

            {/* Inline Sensitive Field Warning / Confirmation Panel */}
            <SafetyCheckPanel
              target={safetyTarget}
              onClose={() => setSafetyTarget(null)}
              onConfirmPrivateInclude={handleConfirmPrivateField}
              onChangeFieldPrivacy={handleChangeFieldPrivacy}
            />

            {/* Step 1: Preset */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                1 · Preset
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {(['everything', 'general', 'personal', 'embedded_jobs'] as const).map((pKey) => {
                  const active = activePreset === pKey;
                  const def = PRESET_DEFINITIONS[pKey];
                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => handleSelectPreset(pKey)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${active
                        ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-2xs'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                        }`}
                    >
                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{def.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Fields & Preview Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  Sharing {selectedFields.length} of {totalSharableCount} items
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowQuickSaveTpl((v) => !v)}
                    className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save Preset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLivePreview((v) => !v)}
                    className="text-xs font-bold text-zinc-900 dark:text-zinc-200 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showLivePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showLivePreview ? 'Hide Preview' : 'Preview'}</span>
                  </button>
                </div>
              </div>

              <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-black dark:bg-white rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Quick Save Custom Template Form */}
            {showQuickSaveTpl && (
              <form
                onSubmit={handleSaveQuickTemplate}
                className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] flex items-center gap-2"
              >
                <input
                  type="text"
                  required
                  value={quickTplName}
                  onChange={(e) => setQuickTplName(e.target.value)}
                  placeholder="Custom template name..."
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={isSavingQuickTpl}
                  className="px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold shrink-0 cursor-pointer"
                >
                  {isSavingQuickTpl ? 'Saving...' : 'Save'}
                </button>
              </form>
            )}

            {/* Inline Recipient Live Preview */}
            {showLivePreview && (
              <LiveSharePreview profile={activeProfile} selectedFields={selectedFields} />
            )}

            {/* Step 3-5: Link Title, Contacts, Event, Expiry & Actions */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] p-4 space-y-3 shadow-2xs">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                3 · Recipients, Expiry &amp; Actions
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Tag className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={shareTitle}
                    onChange={(e) => {
                      setShareTitle(e.target.value);
                      setGeneratedLink(null);
                    }}
                    placeholder="Add a title to your link before sharing"
                    className="w-full min-h-[40px] pl-8 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSubView('recipients')}
                  className="min-h-[40px] px-3 rounded-xl bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Select recipients and event labels"
                  aria-label="Select recipients"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden xs:inline">Contacts</span>
                  {selectedRecipients.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-white dark:bg-black text-black dark:text-white text-[10px] font-bold">
                      {selectedRecipients.length}
                    </span>
                  )}
                </button>
              </div>

              {(selectedRecipients.length > 0 || eventLabel) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedRecipients.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white text-[11px] font-semibold border border-zinc-200 dark:border-zinc-800"
                    >
                      <span>{r.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedRecipients((prev) => prev.filter((item) => item.id !== r.id))
                        }
                        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                        aria-label={`Remove ${r.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {eventLabel && (
                    <span className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black text-[11px] font-semibold">
                      <Tag className="w-2.5 h-2.5" />
                      <span>{eventLabel}</span>
                      <button
                        type="button"
                        onClick={() => setEventLabel('')}
                        className="opacity-75 hover:opacity-100 cursor-pointer"
                        aria-label="Clear event label"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expiry:
                </span>
                <div className="flex items-center gap-1">
                  {[
                    { k: 'never' as const, label: 'Never' },
                    { k: '7d' as const, label: '7 days' },
                    { k: '1_view' as const, label: '1 view' }
                  ].map((opt) => (
                    <button
                      key={opt.k}
                      type="button"
                      onClick={() => {
                        setExpiryOption(opt.k);
                        setGeneratedLink(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${expiryOption === opt.k
                        ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                        : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1.5 pt-1">
                <button
                  type="button"
                  disabled={isGeneratingLink}
                  onClick={handleOpenQrReady}
                  className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="w-10 h-10 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xs">
                    {isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-200">QR code</span>
                </button>

                <button
                  type="button"
                  disabled={isGeneratingLink}
                  onClick={handleGenerateAndCopy}
                  className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
                    {copiedDirect ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-200">
                    {copiedDirect ? 'Copied' : 'Copy link'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubView('in_person')}
                  className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <span className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-200">Tap phones</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const scoped = sanitizeProfileForShare(activeProfile, { selectedFields });
                    downloadVCard(scoped);
                    setStatusFeedback({ type: 'success', text: 'Scoped vCard downloaded (Never Share excluded).' });
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <span className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
                    <Contact className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-200">vCard</span>
                </button>

                <button
                  type="button"
                  disabled={isGeneratingLink}
                  onClick={handleNativeSend}
                  className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-200">Send via...</span>
                </button>
              </div>
            </div>

            {/* Grouped Individual Information Controls */}
            <div className="space-y-3 pb-6">
              {SHAREABLE_FIELD_GROUPS.map((group) => {
                if (group.id === 'custom') {
                  const customList = activeProfile.customFields || [];
                  if (customList.length === 0) return null;

                  return (
                    <div
                      key={group.id}
                      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden"
                    >
                      <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          {group.label}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {customList.length} item(s)
                        </span>
                      </div>

                      <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                        {customList.map((cf) => {
                          const cfKey = `custom-field-${cf.id}`;
                          const label = cf.label || (cf as any).title || 'Custom Field';
                          const tier = getFieldPrivacyTier(activeProfile, cfKey);
                          const hiddenOnProfile = isFieldOwnerHidden(activeProfile, cfKey);
                          const isOn = selectedFields.includes(cfKey) && tier !== 'never_share' && !hiddenOnProfile;
                          const isNeverShare = tier === 'never_share';
                          const isPrivate = tier === 'private';

                          return (
                            <div key={cfKey} className="px-4 py-2.5 flex items-center justify-between gap-2.5">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-semibold text-zinc-950 dark:text-white truncate">
                                    {label}
                                  </span>
                                  {isNeverShare && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold inline-flex items-center gap-0.5">
                                      <Lock className="w-2.5 h-2.5" />
                                      Never Share
                                    </span>
                                  )}
                                  {isPrivate && !isNeverShare && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                                      Private
                                    </span>
                                  )}
                                  {hiddenOnProfile && !isNeverShare && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-500 font-medium">
                                      Hidden on profile
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                  {getFieldMaskedValue(cfKey)}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {!isSensitiveNeverShareLabel(label) && (
                                  <select
                                    aria-label={`Privacy classification for ${label}`}
                                    value={tier}
                                    onChange={(e) =>
                                      handleChangeFieldPrivacy(cfKey, e.target.value as PrivacyTier)
                                    }
                                    className="text-[10px] px-1.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                                  >
                                    <option value="normal">Normal</option>
                                    <option value="private">Private</option>
                                    <option value="never_share">Never Share</option>
                                  </select>
                                )}

                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={isOn}
                                  aria-label={`Toggle ${label}`}
                                  onClick={() => handleToggleField(cfKey, label)}
                                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center ${isNeverShare || hiddenOnProfile
                                    ? 'bg-zinc-200 dark:bg-zinc-800 justify-start opacity-60'
                                    : isOn
                                      ? 'bg-black dark:bg-white justify-end'
                                      : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                                    }`}
                                >
                                  <span className="w-4.5 h-4.5 rounded-full bg-white dark:bg-black shadow-xs" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const groupFields = SHAREABLE_FIELDS.filter((f) => f.group === group.id);
                const allGroupKeys = groupFields
                  .filter(
                    (f) =>
                      getFieldPrivacyTier(activeProfile, f.key) === 'normal' &&
                      !isFieldOwnerHidden(activeProfile, f.key)
                  )
                  .map((f) => f.key);
                const isGroupAllOn =
                  allGroupKeys.length > 0 && allGroupKeys.every((k) => selectedFields.includes(k));

                return (
                  <div
                    key={group.id}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {group.label}
                      </span>

                      {allGroupKeys.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePreset('custom');
                            onUpdateDraftPreset?.(activeProfile.id, 'custom');
                            setActiveTemplateName('Custom selection');
                            if (isGroupAllOn) {
                              updateSelectedFields(selectedFields.filter((k) => !allGroupKeys.includes(k)));
                            } else {
                              updateSelectedFields(Array.from(new Set([...selectedFields, ...allGroupKeys])));
                            }
                          }}
                          className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-200 hover:underline cursor-pointer"
                        >
                          {isGroupAllOn ? 'Clear group' : 'Select all'}
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                      {groupFields.map((field) => {
                        const tier = getFieldPrivacyTier(activeProfile, field.key);
                        const ownerHidden = isFieldOwnerHidden(activeProfile, field.key);
                        const isOn =
                          selectedFields.includes(field.key) && tier !== 'never_share' && !ownerHidden;
                        const isNeverShare = tier === 'never_share';
                        const isPrivate = tier === 'private';

                        return (
                          <div
                            key={field.key}
                            className="px-4 py-2.5 flex items-center justify-between gap-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-semibold text-zinc-950 dark:text-white truncate">
                                  {field.label}
                                </span>
                                {isNeverShare && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold inline-flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" />
                                    Never Share
                                  </span>
                                )}
                                {isPrivate && !isNeverShare && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                                    Private
                                  </span>
                                )}
                                {ownerHidden && !isNeverShare && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-500 font-medium">
                                    Hidden on profile
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                {getFieldMaskedValue(field.key)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <select
                                aria-label={`Privacy tier for ${field.label}`}
                                value={tier}
                                onChange={(e) =>
                                  handleChangeFieldPrivacy(field.key, e.target.value as PrivacyTier)
                                }
                                className="text-[10px] px-1.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                              >
                                <option value="normal">Normal</option>
                                <option value="private">Private</option>
                                <option value="never_share">Never Share</option>
                              </select>

                              <button
                                type="button"
                                role="switch"
                                aria-checked={isOn}
                                aria-label={`Toggle ${field.label}`}
                                onClick={() => handleToggleField(field.key, field.label)}
                                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center ${isNeverShare || ownerHidden
                                  ? 'bg-zinc-200 dark:bg-zinc-800 justify-start opacity-60'
                                  : isOn
                                    ? 'bg-black dark:bg-white justify-end'
                                    : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                                  }`}
                              >
                                <span className="w-4.5 h-4.5 rounded-full bg-white dark:bg-black shadow-xs" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SHARED LINKS MANAGEMENT */}
        {subView === 'configure' && activeTab === 'links' && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden">
            <SharedLinksTab
              profile={activeProfile}
              allProfiles={roles}
              refreshSignal={linksRefreshSignal}
              isAuthRequired={isAuthRequired}
              onAuthRequired={markAuthRequired}
              onSelectLinkForQr={(link) => {
                setGeneratedLink(link);
                setSubView('ready');
              }}
            />
          </div>
        )}

        {/* TAB 3: SHARE TEMPLATES */}
        {subView === 'configure' && activeTab === 'templates' && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden">
            <ShareTemplatesTab
              profile={activeProfile}
              activeTemplateId={activeTemplateId}
              currentSelectedFields={selectedFields}
              isAuthRequired={isAuthRequired}
              onAuthRequired={markAuthRequired}
              onApplyTemplate={handleApplyTemplate}
              onQuickQrAction={handleOpenQrReady}
              onQuickDownloadCardPdf={async () => {
                const scoped = sanitizeProfileForShare(activeProfile, { selectedFields });
                const link = generatedLink || (await mintShareLink('qr'));
                if (link) {
                  const qrUrl = `${link.shareUrl || `${window.location.origin}${link.sharePath}`}?src=qr`;
                  await generateCardPdf(scoped, isDark, qrUrl);
                } else {
                  await generateCardPdf(scoped, isDark);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
