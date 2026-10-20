'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { 
  ArrowLeft, 
  ArrowRight,
  GripVertical, 
  Copy, 
  QrCode, 
  Check, 
  Share2, 
  Loader2, 
  User, 
  FileText, 
  Phone, 
  Link2, 
  Code, 
  Briefcase, 
  GraduationCap, 
  FolderGit2, 
  Award,
  Eye, 
  EyeOff, 
  Sparkles, 
  Download,
  ShieldCheck,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { ProfileData, SharingSettings } from '@/types/profile';
import { GithubIcon, LinkedInIcon, TwitterXIcon } from '@/components/BrandIcons';
import { ALL_PROFILE_SECTIONS } from '@/components/sections/DynamicSectionGroups';
import { DualScreenWorkspace } from '@/components/layout/DualScreenWorkspace';

interface ShareFlowClientProps {
  initialProfile: ProfileData;
}

const SECTION_DEFINITIONS = ALL_PROFILE_SECTIONS;

export function ShareFlowClient({ initialProfile }: ShareFlowClientProps) {
  const router = useRouter();

  // Shared step state: 1. Role Selection | 2. Privacy Limits | 3. Reorder | 4. Share & QR
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [roles, setRoles] = useState<ProfileData[]>([initialProfile]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileData>(initialProfile);

  // Fetch all user profiles for Step 1
  useEffect(() => {
    fetch('/api/profile/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.profiles && data.profiles.length > 0) {
          setRoles(data.profiles);
          const found = data.profiles.find((p: ProfileData) => p.id === initialProfile.id || p.slug === initialProfile.slug);
          if (found) setSelectedProfile(found);
        }
      })
      .catch(() => {});
  }, [initialProfile]);

  // Shared Sharing Settings
  const [sharingSettings, setSharingSettings] = useState<SharingSettings>({
    photo: initialProfile.sharingSettings?.photo ?? true,
    nameAndTitle: initialProfile.sharingSettings?.nameAndTitle ?? true,
    bio: initialProfile.sharingSettings?.bio ?? true,
    contactInfo: initialProfile.sharingSettings?.contactInfo ?? true,
    socialLinks: initialProfile.sharingSettings?.socialLinks ?? true,
    skills: initialProfile.sharingSettings?.skills ?? true,
    experience: initialProfile.sharingSettings?.experience ?? true,
    education: initialProfile.sharingSettings?.education ?? true,
    projects: initialProfile.sharingSettings?.projects ?? true,
    certifications: initialProfile.sharingSettings?.certifications ?? true
  });

  // Reorder State
  const [visibleOrder, setVisibleOrder] = useState<string[]>(() => {
    const existingOrder = initialProfile.sectionOrder || [];
    const validKeys = SECTION_DEFINITIONS.map((s) => s.id);
    const filtered = existingOrder.filter((id) => validKeys.includes(id));
    SECTION_DEFINITIONS.forEach((s) => {
      if (!filtered.includes(s.id)) filtered.push(s.id);
    });
    return filtered;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const activeSections = visibleOrder.filter((id) => {
    switch (id) {
      case 'about': return sharingSettings.bio;
      case 'contact': return sharingSettings.contactInfo;
      case 'socialLinks': return sharingSettings.socialLinks;
      case 'skills': return sharingSettings.skills;
      case 'experience': return sharingSettings.experience;
      case 'education': return sharingSettings.education;
      case 'projects': return sharingSettings.projects;
      case 'certifications': return sharingSettings.certifications;
      default: return true;
    }
  });

  const hiddenSections = visibleOrder.filter((id) => !activeSections.includes(id));

  const targetIdentifier = selectedProfile.slug || selectedProfile.id;
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/profile/${targetIdentifier}`
    : `https://avtive-profiles-d267.vercel.app/profile/${targetIdentifier}`;

  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
      .then(setQrCodeDataUrl)
      .catch((err) => console.error('QR generation error:', err));
  }, [publicUrl]);

  const toggleSetting = (key: keyof SharingSettings) => {
    setSharingSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= visibleOrder.length) return;
    const newOrder = [...visibleOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setVisibleOrder(newOrder);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile/share-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          sharingSettings,
          sectionOrder: visibleOrder
        })
      });
      if (res.ok) {
        if (currentStep < 4) {
          setCurrentStep((s) => (s + 1) as any);
        } else {
          router.push(`/profile/${targetIdentifier}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // DESKTOP WORKING SCREEN REPRESENTATION
  // ──────────────────────────────────────────────────────────────────────────
  const desktopView = (
    <div className="w-full max-w-5xl mx-auto my-auto py-6 space-y-6 text-left">
      
      {/* Desktop Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <span>Privacy &amp; Sharing Studio</span>
            <span>&middot;</span>
            <span>Step {currentStep} of 4</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {currentStep === 1 && 'Select Profile Persona to Share'}
            {currentStep === 2 && 'Privacy Limits & Section Visibility'}
            {currentStep === 3 && 'Reorder Profile Sections'}
            {currentStep === 4 && 'Generate Share Link & QR Code'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {currentStep === 1 && 'Pick which persona pass you are configuring for sharing.'}
            {currentStep === 2 && 'Toggle off sensitive information to make it strictly private.'}
            {currentStep === 3 && 'Arrange the display order of your public portfolio sections.'}
            {currentStep === 4 && 'Your protected digital pass is ready for one-tap sharing.'}
          </p>
        </div>

        {/* Step Navigation Actions */}
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => (s - 1) as any)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-300 transition-colors"
            >
              Back
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save &amp; Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              href={`/profile/${targetIdentifier}`}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 flex items-center gap-2"
            >
              <span>View Live Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* STEP 1 DESKTOP: ROLE SELECTION */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => {
            const isSel = selectedProfile.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedProfile(r)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSel ? 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-500 shadow-lg ring-1 ring-cyan-500/40' : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={r.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'} alt={r.name} className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-white/10" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{r.profileName || r.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{r.designation || 'Professional'}</p>
                  </div>
                </div>
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase">{r.type || 'Individual'}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSel ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 dark:border-white/20'}`}>
                    {isSel && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STEP 2 DESKTOP: PRIVACY TOGGLES */}
      {currentStep === 2 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'photo', label: 'Profile Photo', desc: 'Display avatar image on public card' },
              { key: 'nameAndTitle', label: 'Name & Professional Title', desc: 'Show your name and designation' },
              { key: 'bio', label: 'Bio / About', desc: 'Display introductory personal narrative' },
              { key: 'contactInfo', label: 'Direct Contact Info', desc: 'Email and phone number channels' },
              { key: 'socialLinks', label: 'Social Media Profiles', desc: 'LinkedIn, GitHub, Twitter links' },
              { key: 'skills', label: 'Skills & Tech Stack', desc: 'Highlighted capability badges' },
              { key: 'projects', label: 'Project Portfolio', desc: 'Verified public project cards' },
              { key: 'experience', label: 'Work Experience', desc: 'Career history and roles' },
              { key: 'education', label: 'Education Credentials', desc: 'Degrees, schools, and majors' },
              { key: 'certifications', label: 'Certifications & Honors', desc: 'Accredited certificates' }
            ].map((item) => {
              const isOn = sharingSettings[item.key as keyof SharingSettings] !== false;
              return (
                <div key={item.key} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSetting(item.key as keyof SharingSettings)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${isOn ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3 DESKTOP: REORDER SECTIONS */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>Visible Sections ({activeSections.length})</span>
            </h3>
            <div className="space-y-2">
              {activeSections.map((secId, idx) => {
                const def = SECTION_DEFINITIONS.find((s) => s.id === secId);
                return (
                  <div key={secId} className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-slate-400 dark:text-slate-500 text-[10px] w-4">{idx + 1}.</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{def?.label || secId}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(visibleOrder.indexOf(secId), 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(visibleOrder.indexOf(secId), 'down')}
                        disabled={idx === activeSections.length - 1}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <EyeOff className="w-4 h-4" />
              <span>Hidden / Protected Sections ({hiddenSections.length})</span>
            </h3>
            <div className="space-y-2">
              {hiddenSections.map((secId) => {
                const def = SECTION_DEFINITIONS.find((s) => s.id === secId);
                return (
                  <div key={secId} className="p-3 rounded-xl bg-slate-50/50 dark:bg-[#070D18]/50 border border-slate-200/50 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>{def?.label || secId}</span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Private</span>
                  </div>
                );
              })}
              {hiddenSections.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">All sections are currently set to public.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 DESKTOP: SHARE & QR */}
      {currentStep === 4 && (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-white text-slate-900 shadow-xl border border-slate-200 dark:border-white/10">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 rounded-lg mb-3" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg mb-3">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            )}
            <span className="text-xs font-bold text-slate-900">{selectedProfile.name}</span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">Scan to view protected profile</span>
          </div>

          <div className="md:col-span-7 space-y-5 text-left">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Shareable Link is Ready</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Share this link directly or download your digital QR card.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-300 truncate">{publicUrl}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-500/20 dark:hover:bg-cyan-500/30 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href={`/profile/${targetIdentifier}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-black dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition-colors"
              >
                Open Live Profile Page
              </Link>
              {qrCodeDataUrl && (
                <a
                  href={qrCodeDataUrl}
                  download={`avtive-qr-${targetIdentifier}.png`}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // MOBILE WORKING SCREEN REPRESENTATION
  // ──────────────────────────────────────────────────────────────────────────
  const mobileView = (
    <div className="w-full flex-1 flex flex-col justify-between py-1 text-left">
      <div>
        <div className="flex items-center justify-between text-slate-400 mb-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => (s - 1) as any)}
              className="p-1 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : <div />}
          <span className="text-xs font-mono font-medium tracking-wider text-slate-500 dark:text-slate-400">
            {currentStep}/4
          </span>
        </div>

        {/* STEP 1 MOBILE */}
        {currentStep === 1 && (
          <div className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Which profile to share?</h2>
            <div className="space-y-2">
              {roles.map((r) => {
                const isSel = selectedProfile.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedProfile(r)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSel ? 'bg-cyan-50 dark:bg-[#151D30] border-cyan-500 dark:border-cyan-400 shadow-xs' : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{r.profileName || r.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{r.designation}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSel ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 dark:border-zinc-700'}`}>
                      {isSel && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2 MOBILE */}
        {currentStep === 2 && (
          <div className="space-y-2 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">What to show?</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Customize private information:</p>
            <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-white/5 max-h-[380px] overflow-y-auto">
              {[
                { key: 'photo', label: 'Profile Photo' },
                { key: 'nameAndTitle', label: 'Name & Title' },
                { key: 'bio', label: 'Bio' },
                { key: 'contactInfo', label: 'Contact Info' },
                { key: 'socialLinks', label: 'Social Links' },
                { key: 'skills', label: 'Skills' },
                { key: 'projects', label: 'Projects' },
                { key: 'experience', label: 'Experience' },
                { key: 'education', label: 'Education' }
              ].map((item) => {
                const isOn = sharingSettings[item.key as keyof SharingSettings] !== false;
                return (
                  <div key={item.key} className="pt-1.5 flex items-center justify-between">
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => toggleSetting(item.key as keyof SharingSettings)}
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isOn ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isOn ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3 MOBILE */}
        {currentStep === 3 && (
          <div className="space-y-2 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Reorder Sections</h2>
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
              {activeSections.map((secId, idx) => {
                const def = SECTION_DEFINITIONS.find((s) => s.id === secId);
                return (
                  <div key={secId} className="p-2 rounded-lg bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-900 dark:text-white">
                    <span>{def?.label || secId}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveSection(visibleOrder.indexOf(secId), 'up')} disabled={idx === 0} className="p-0.5 disabled:opacity-20 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => moveSection(visibleOrder.indexOf(secId), 'down')} disabled={idx === activeSections.length - 1} className="p-0.5 disabled:opacity-20 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4 MOBILE */}
        {currentStep === 4 && (
          <div className="space-y-3 text-center">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Ready to Share!</h2>
            {qrCodeDataUrl && (
              <div className="p-3 bg-slate-50 dark:bg-white rounded-2xl inline-block mx-auto shadow-md border border-slate-200 dark:border-white/10">
                <img src={qrCodeDataUrl} alt="QR" className="w-36 h-36" />
              </div>
            )}
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 text-[10px] font-mono text-cyan-600 dark:text-cyan-300 truncate">
              {publicUrl}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="figma-pill-secondary py-2 text-[11px] flex items-center justify-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
              <Link
                href={`/profile/${targetIdentifier}`}
                className="figma-pill-primary py-2 text-[11px] font-bold block text-center"
              >
                View Card
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Action Pill */}
      <div className="pt-3">
        {currentStep < 4 ? (
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="figma-pill-primary w-full py-3 px-5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Next</span>
          </button>
        ) : (
          <Link
            href={`/profile/${targetIdentifier}`}
            className="figma-pill-primary w-full py-3 px-5 text-xs font-bold block text-center"
          >
            Finish &amp; Close
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <DualScreenWorkspace
      workflowTitle="7. Privacy & Sharing"
      workflowSubtitle="Granular Privacy & QR Sharing Flow"
      currentUrlPath={`/profile/${targetIdentifier}/share`}
      desktopContent={desktopView}
      mobileContent={mobileView}
    />
  );
}
