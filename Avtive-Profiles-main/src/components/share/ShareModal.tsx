'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Loader2, 
  User, 
  FileText, 
  Code, 
  Briefcase, 
  GraduationCap, 
  FolderGit2, 
  Phone, 
  Link2, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Download,
  Building2,
  Crown
} from 'lucide-react';
import { ProfileData, SharingSettings, ProfileType } from '@/types/profile';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicSectionGroups, ALL_PROFILE_SECTIONS } from '@/components/profile-sections/DynamicSectionGroups';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  userProfiles?: ProfileData[];
  onCopySuccess?: () => void;
  isOwner?: boolean;
  onUpdateProfile?: (updatedProfile: ProfileData) => void;
}

const VISIBILITY_MODULES = ALL_PROFILE_SECTIONS;

export function ShareModal({
  isOpen,
  onClose,
  profile,
  userProfiles,
  onCopySuccess,
  isOwner = true,
  onUpdateProfile
}: ShareModalProps) {
  // Step 1 = Choose Role to Share
  // Step 2 = Visibility & Limitation Selection
  // Step 3 = Reorder Sections
  // Step 4 = Share Link Generation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Available Personas / Roles for the user
  const [roles, setRoles] = useState<ProfileData[]>(userProfiles || [profile]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileData>(profile);

  // Visibility Toggles
  const [sharingSettings, setSharingSettings] = useState<SharingSettings>({
    photo: profile.sharingSettings?.photo ?? true,
    nameAndTitle: profile.sharingSettings?.nameAndTitle ?? true,
    bio: profile.sharingSettings?.bio ?? true,
    skills: profile.sharingSettings?.skills ?? true,
    projects: profile.sharingSettings?.projects ?? true,
    experience: profile.sharingSettings?.experience ?? true,
    education: profile.sharingSettings?.education ?? true,
    contactInfo: profile.sharingSettings?.contactInfo ?? true,
    socialLinks: profile.sharingSettings?.socialLinks ?? true,
    email: profile.sharingSettings?.email ?? true,
    phone: profile.sharingSettings?.phone ?? true,
    certifications: profile.sharingSettings?.certifications ?? true,
    nfcCard: profile.sharingSettings?.nfcCard ?? true
  });

  // Section Order
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const existing = profile.sectionOrder || [];
    const valid = VISIBILITY_MODULES.map((m) => m.id);
    const filtered = existing.filter((id) => valid.includes(id));
    valid.forEach((id) => {
      if (!filtered.includes(id)) filtered.push(id);
    });
    return filtered;
  });

  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all user profiles for Step 1 if not passed
  useEffect(() => {
    if (isOpen && (!userProfiles || userProfiles.length <= 1)) {
      fetch('/api/profile/list')
        .then((res) => res.json())
        .then((data) => {
          if (data.profiles && data.profiles.length > 0) {
            setRoles(data.profiles);
            // If current profile is in list, keep it; otherwise set first
            const found = data.profiles.find((p: ProfileData) => p.id === profile.id || p.slug === profile.slug);
            if (found) {
              setSelectedProfile(found);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, profile, userProfiles]);

  // Sync state when selected profile changes
  useEffect(() => {
    if (selectedProfile) {
      if (selectedProfile.sharingSettings) {
        setSharingSettings((prev) => ({
          ...prev,
          ...selectedProfile.sharingSettings
        }));
      }
      if (selectedProfile.sectionOrder && selectedProfile.sectionOrder.length > 0) {
        const valid = VISIBILITY_MODULES.map((m) => m.id);
        const filtered = selectedProfile.sectionOrder.filter((id) => valid.includes(id));
        valid.forEach((id) => {
          if (!filtered.includes(id)) filtered.push(id);
        });
        setSectionOrder(filtered);
      }
    }
  }, [selectedProfile]);

  // Generate public link and QR code
  const identifier = selectedProfile.slug || selectedProfile.id;
  const canonicalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/profile/${identifier}`
    : `https://www.avtive.app/profile/${identifier}`;
  const displayUrl = `avtive.profiles/${identifier}`;

  useEffect(() => {
    if (isOpen && currentStep === 4) {
      QRCode.toDataURL(canonicalUrl, {
        width: 320,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      })
        .then(setQrDataUrl)
        .catch((err) => console.error('QR generation error', err));
    }
  }, [isOpen, currentStep, canonicalUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(canonicalUrl);
    setCopied(true);
    if (onCopySuccess) onCopySuccess();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggle = (key: keyof SharingSettings) => {
    setSharingSettings((prev) => ({
      ...prev,
      [key]: prev[key] === false ? true : false
    }));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return;
    const next = [...sectionOrder];
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    setSectionOrder(next);
  };

  const handleSaveAndShare = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile/share-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          sharingSettings,
          sectionOrder: ['hero', ...sectionOrder]
        })
      });

      const data = await res.json();
      if (data.profile && onUpdateProfile) {
        onUpdateProfile(data.profile);
      }
      onClose();
    } catch (err) {
      console.error(err);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Derive visible and hidden sections for Step 3
  const visibleSections = sectionOrder.filter((id) => {
    const mod = VISIBILITY_MODULES.find((m) => m.id === id);
    return mod ? sharingSettings[mod.key] !== false : true;
  });

  const hiddenSections = sectionOrder.filter((id) => {
    const mod = VISIBILITY_MODULES.find((m) => m.id === id);
    return mod ? sharingSettings[mod.key] === false : false;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-left font-sans">
      <div className="relative w-full max-w-lg max-h-[85dvh] flex flex-col rounded-3xl bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl overflow-hidden">
        
        {/* Modal Header & Progress Stepper */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black font-bold text-xs flex items-center justify-center">
                {currentStep}
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-white/80">
                Step {currentStep} of 4: {
                  currentStep === 1 ? 'Choose Role' :
                  currentStep === 2 ? 'Visibility Controls' :
                  currentStep === 3 ? 'Reorder Sections' : 'Share Pass'
                }
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/60 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Dots Bar */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s <= currentStep ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-white/15'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          <AnimatePresence mode="wait">

            {/* STEP 1: CHOOSE ROLE TO SHARE */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Which role profile you want to share?
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    Select the active persona or profile pass you wish to export and configure.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {roles.map((r) => {
                    const isSelected = (selectedProfile.id === r.id) || (selectedProfile.slug === r.slug);
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedProfile(r)}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-cyan-50 dark:bg-white/10 border-cyan-500 dark:border-white ring-1 ring-cyan-500/30 dark:ring-white/30 shadow-md'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-white/[0.07]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={r.avatar || ''}
                            alt={r.name}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';
                            }}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/15 shrink-0 bg-slate-200 dark:bg-white/10"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {r.profileName || r.name}
                              </h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80 font-mono">
                                {r.type || 'role'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-white/60 truncate">
                              {r.profession || r.designation || 'Professional Profile'}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-black'
                              : 'border-slate-300 dark:border-white/30 bg-white dark:bg-black/20'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: VISIBILITY & LIMITATION SELECTION */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    What do you want to show?
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    Itemized privacy toggles for every module on &ldquo;{selectedProfile.profileName || selectedProfile.name}&rdquo;.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  {VISIBILITY_MODULES.map((mod) => {
                    const isVisible = sharingSettings[mod.key] !== false;
                    const Icon = mod.icon;

                    return (
                      <div
                        key={mod.id}
                        className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isVisible ? 'bg-cyan-100 text-cyan-700 dark:bg-white/15 dark:text-white' : 'bg-slate-200 text-slate-400 dark:bg-white/5 dark:text-white/30'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {mod.label}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-white/50 truncate">
                              {mod.description}
                            </p>
                          </div>
                        </div>

                        {/* Switch Component */}
                        <button
                          type="button"
                          onClick={() => handleToggle(mod.key)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isVisible ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-[#2A2E39]'
                          }`}
                          role="switch"
                          aria-checked={isVisible}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
                              isVisible
                                ? 'translate-x-5 bg-white'
                                : 'translate-x-0 bg-white/70 dark:bg-white/50'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 3: REORDER SECTIONS */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Reorder Sections
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    Arrange the visual sequence of active sections for your public pass.
                  </p>
                </div>

                {/* Visible Sections List */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-white/40 uppercase tracking-wider">
                    Visible Sections ({visibleSections.length})
                  </div>

                  {visibleSections.map((id, index) => {
                    const mod = VISIBILITY_MODULES.find((m) => m.id === id);
                    if (!mod) return null;
                    const Icon = mod.icon;

                    return (
                      <div
                        key={id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-white/10 border border-slate-200 dark:border-white/15 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/15 text-[11px] font-mono flex items-center justify-center text-slate-700 dark:text-white/70">
                            {index + 1}
                          </span>
                          <Icon className="w-4 h-4 text-slate-700 dark:text-white/80" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{mod.label}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMove(sectionOrder.indexOf(id), 'up')}
                            disabled={index === 0}
                            className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(sectionOrder.indexOf(id), 'down')}
                            disabled={index === visibleSections.length - 1}
                            className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hidden Sections List */}
                {hiddenSections.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                    <div className="text-[11px] font-mono text-slate-400 dark:text-white/40 uppercase tracking-wider">
                      Hidden Sections ({hiddenSections.length})
                    </div>
                    {hiddenSections.map((id) => {
                      const mod = VISIBILITY_MODULES.find((m) => m.id === id);
                      if (!mod) return null;
                      return (
                        <div
                          key={id}
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 flex items-center justify-between text-slate-500 dark:text-white/40 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>{mod.label}</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono">Toggled Off</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: SHARE LINK GENERATION */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Share Link Generation
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    Your customized digital pass is generated and ready to share.
                  </p>
                </div>

                {/* Preview Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/10 border border-slate-200 dark:border-white/15 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedProfile.avatar || ''}
                      alt={selectedProfile.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-white/20 shrink-0 bg-slate-200 dark:bg-white/10"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {selectedProfile.name}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/15 font-mono text-slate-700 dark:text-white/90">
                          {selectedProfile.profileName || selectedProfile.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-white/60 truncate">
                        {selectedProfile.profession || selectedProfile.designation || 'Professional'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-white/60 font-mono">
                    <span>Active Modules: {visibleSections.length}</span>
                    <span>Theme: {selectedProfile.theme || 'editorial'}</span>
                  </div>
                </div>

                {/* Generated Unique Public Profile Link */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-white/70">
                    <span>Public Profile URL</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[10px]">avtive.profiles/{identifier}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15">
                    <span className="text-xs text-slate-900 dark:text-white font-mono truncate flex-1 select-all">
                      {canonicalUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* QR Code Action Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-5 h-5 text-slate-700 dark:text-white/80" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">QR Code Pass</h4>
                      <p className="text-[11px] text-slate-500 dark:text-white/50">Instant scan for mobile cards</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    {showQrCode ? 'Hide QR' : 'Show QR'}
                  </button>
                </div>

                {/* QR Code Display Modal / Box */}
                {showQrCode && qrDataUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-white border border-slate-200 dark:border-transparent flex flex-col items-center justify-center gap-3 text-center shadow-lg"
                  >
                    <img src={qrDataUrl} alt="Public Profile QR Code" className="w-48 h-48 rounded-xl" />
                    <a
                      href={qrDataUrl}
                      download={`${selectedProfile.slug || 'profile'}-qr.png`}
                      className="text-xs text-zinc-800 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR PNG</span>
                    </a>
                  </motion.div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Modal Action Controls Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 shrink-0 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] py-2.5 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/15 font-medium text-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] py-2.5 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/70 font-medium text-xs transition-all cursor-pointer flex items-center justify-center"
            >
              Cancel
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-6 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-bold text-xs transition-all active:scale-[0.98] shadow-md cursor-pointer"
            >
              <span>{currentStep === 1 ? 'Next: Visibility' : currentStep === 2 ? 'Next: Reorder' : 'Next: Share Link'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveAndShare}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-6 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-bold text-xs transition-all active:scale-[0.98] shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save &amp; Finish</span>
                  <Check className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
