'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Camera, 
  Loader2, 
  AlertCircle, 
  Save, 
  User, 
  Tag, 
  Briefcase, 
  Building2, 
  FileText 
} from 'lucide-react';
import { ProfileType, ProfileTheme, normalizeProfileType } from '@/types/profile';
import { DualScreenWorkspace } from '@/components/layout/DualScreenWorkspace';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop'
];

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop';

function DetailsStepContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = (searchParams.get('theme') as ProfileTheme) || 'editorial';
  const role = normalizeProfileType(searchParams.get('role') || 'individual');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [profileName, setProfileName] = useState('');
  const [fullName, setFullName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.onboardingCompleted && data.hasProfile) {
          const targetSlug = data.profileSlug || data.profiles?.[0]?.slug || data.profile?.slug || data.profile?.id || data.user.id;
          if (targetSlug) {
            router.replace(`/profile/${targetSlug}`);
            return;
          }
        }
        if (data.user?.name && !fullName) {
          setFullName(data.user.name);
        }
        if (data.user?.avatar) {
          setAvatar(data.user.avatar);
        }
      })
      .catch(() => {});
  }, [fullName, router]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setAvatar(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setCoverImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBack = () => {
    router.push(`/onboarding/theme?role=${encodeURIComponent(role)}&theme=${encodeURIComponent(theme)}`);
  };

  const handleCreateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!profileName.trim()) {
      setErrorMessage('Please provide a profile persona name.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/profile/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          profileName: profileName.trim(),
          profession: professionalTitle.trim(),
          designation: professionalTitle.trim(),
          company: company.trim(),
          shortBio: bio.trim(),
          fullBio: bio.trim(),
          avatar,
          coverImage,
          theme,
          type: role
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to create profile. Please try again.');
        setIsLoading(false);
        return;
      }

      const targetId = data.profile?.slug || data.profile?.id;
      if (targetId) {
        try {
          if (data.profile) {
            localStorage.setItem('avtive_last_saved_profile', JSON.stringify(data.profile));
            if (data.profile.slug) {
              localStorage.setItem(`avtive_profile_${data.profile.slug}`, JSON.stringify(data.profile));
            }
            if (data.profile.id) {
              localStorage.setItem(`avtive_profile_${data.profile.id}`, JSON.stringify(data.profile));
            }
          }
          localStorage.setItem('avtive_returning_user', 'true');
        } catch {}
        window.location.href = `/profile/${encodeURIComponent(targetId)}`;
      } else {
        window.location.href = '/my-profile';
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error creating profile.');
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // DESKTOP WORKING SCREEN REPRESENTATION (Minimalist, Clean Window)
  // ──────────────────────────────────────────────────────────────────────────
  const desktopView = (
    <div className="w-full flex-1 flex flex-col text-left">
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
      <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />

      {/* FULL-WIDTH COVER PHOTO AT TOP OF WINDOW */}
      <div className="relative w-full h-44 sm:h-52 overflow-hidden shrink-0 group bg-slate-900">
        {coverImage ? (
          <img
            src={coverImage}
            alt="Cover Photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A101E] via-transparent to-black/20" />
        
        {/* Minimalist Cover Photo Edit Button */}
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          aria-label="Change Cover Photo"
          title="Change Cover Photo"
          className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 shadow-md transition-all cursor-pointer hover:scale-105"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* MAIN CONTENT CANVAS WITH GENEROUS WHITESPACE */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-6 sm:px-10 pb-8 space-y-6">
        
        {/* Profile Identity Bar */}
        <div className="flex items-end justify-between gap-4 -mt-12 sm:-mt-14 relative z-10">
          
          <div className="flex items-end gap-4">
            {/* Avatar with Camera Icon Overlay */}
            <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-full overflow-hidden border-4 border-white dark:border-[#070D1A] bg-slate-100 dark:bg-slate-800 shadow-xl shrink-0 group">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <User className="w-8 h-8" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload Photo"
                title="Upload Photo"
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="pb-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {fullName || 'Your Name'}
              </h2>
              <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">{professionalTitle}</p>
            </div>
          </div>

          {/* Action Buttons (Icons Replacing Excessive Text) */}
          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back"
              title="Back"
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:text-slate-400 dark:hover:text-white dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleCreateProfile()}
              disabled={isLoading}
              aria-label="Save Profile"
              title="Save Profile"
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </button>
          </div>

        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Minimalist Details Form Fields */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 space-y-4 shadow-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Tag className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Persona</span>
              </div>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g. MERN Developer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <User className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Full Name</span>
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Briefcase className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Title</span>
              </div>
              <input
                type="text"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                placeholder="Lead Systems Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Company</span>
              </div>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company Name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Bio</span>
            </div>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none transition-colors"
            />
          </div>

        </div>

      </div>

    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // MOBILE WORKING SCREEN REPRESENTATION (Minimalist, Clean Chassis)
  // ──────────────────────────────────────────────────────────────────────────
  const mobileView = (
    <div className="w-full flex-1 flex flex-col justify-between text-left">
      <div>
        
        {/* Full-width Cover Photo at top of mobile screen */}
        <div className="relative w-full h-24 overflow-hidden bg-slate-900">
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050913] via-transparent to-black/20" />
          
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            title="Back"
            className="absolute top-2 left-2 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Avatar Overlap */}
        <div className="px-4 -mt-8 flex items-end justify-between mb-3">
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#050913] bg-slate-800 shadow-md">
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload Photo"
            title="Upload Photo"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>

        <div className="px-4 space-y-2 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Persona Title</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. MERN Developer"
              className="figma-input w-full px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="figma-input w-full px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Title</label>
              <input
                type="text"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                placeholder="Title"
                className="figma-input w-full px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company"
                className="figma-input w-full px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Bio</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Bio..."
              className="figma-input w-full px-2.5 py-1 text-xs text-white resize-none"
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        <button
          type="button"
          onClick={() => handleCreateProfile()}
          disabled={isLoading}
          aria-label="Create Profile"
          title="Create Profile"
          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Creating Profile...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Finish &amp; View Pass</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <DualScreenWorkspace
      workflowTitle="3. Profile Details"
      workflowSubtitle="Onboarding Step 3 of 3"
      currentUrlPath={`/onboarding/details?theme=${theme}&role=${role}`}
      desktopContent={desktopView}
      mobileContent={mobileView}
    />
  );
}

export default function OnboardingDetailsPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-sm">Loading profile details...</div>}>
      <DetailsStepContent />
    </Suspense>
  );
}
