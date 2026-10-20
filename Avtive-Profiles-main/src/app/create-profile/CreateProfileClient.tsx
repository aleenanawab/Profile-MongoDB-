'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  Check, 
  Camera, 
  ArrowRight,
  User,
  Users,
  Save,
  Sparkles,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Globe,
  Palette,
  Eye,
  Edit3,
  Plus,
  X
} from 'lucide-react';
import { ProfileTheme, UserSession, ProfileType, ProfileData } from '@/types/profile';
import { DualScreenWorkspace } from '@/components/layout/DualScreenWorkspace';
import { PhonePreview } from '@/components/PhonePreview';
import { AvtiveDigitalCard } from '@/components/AvtiveDigitalCard';

interface CreateProfileClientProps {
  user: UserSession;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop'
];

const SUGGESTED_SKILLS = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS', 
  'MongoDB', 'UI/UX Design', 'Python', 'GraphQL', 'AWS', 'Product Strategy'
];

const THEME_OPTIONS: { id: ProfileTheme; label: string; description: string; previewClass: string }[] = [
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'Clean modern typography with balanced contrast & executive feel',
    previewClass: 'bg-white dark:bg-[#0E1528] border-cyan-500'
  },
  {
    id: 'cyber',
    label: 'Cyberpunk',
    description: 'Futuristic matrix neon styling for developers & technologists',
    previewClass: 'bg-[#050B14] border-emerald-500 text-emerald-400'
  },
  {
    id: 'luxe',
    label: 'Obsidian Luxe',
    description: 'Ultra-luxe dark palette with shimmering gold & amber highlights',
    previewClass: 'bg-[#0A0A0A] border-amber-500 text-amber-300'
  },
  {
    id: 'minimal',
    label: 'Minimalist',
    description: 'Crisp, distraction-free monochrome aesthetic with fine borders',
    previewClass: 'bg-slate-50 dark:bg-[#121216] border-slate-400'
  }
];

export function CreateProfileClient({ user }: CreateProfileClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2-step setup wizard
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [profileType, setProfileType] = useState<ProfileType>('individual');
  const [profileName, setProfileName] = useState('MERN Developer');
  const [fullName, setFullName] = useState(user.name || 'Aleena Nawab');
  const [professionalTitle, setProfessionalTitle] = useState('Full Stack Developer');
  const [company, setCompany] = useState('Avtive Network');
  const [location, setLocation] = useState('San Francisco, CA');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [whatsapp, setWhatsapp] = useState('+1 (555) 234-5678');
  const [email, setEmail] = useState(user.email || 'aleena@avtive.app');
  const [website, setWebsite] = useState('https://avtive.app');
  const [bio, setBio] = useState('Passionate developer with a love for building modern web applications with clean code and intuitive user experiences.');
  const [about, setAbout] = useState('Experienced in full-stack architecture, high-performance APIs, and reactive responsive interfaces.');
  const [skillsList, setSkillsList] = useState<string[]>(['React', 'Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS', 'MongoDB']);
  const [skillInput, setSkillInput] = useState('');
  const [theme, setTheme] = useState<ProfileTheme>('editorial');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop');

  const [activeMobileViewTab, setActiveMobileViewTab] = useState<'form' | 'preview'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList((prev) => [...prev, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Construct Live Profile representation for real-time visual twin preview
  const livePreviewProfile: ProfileData = useMemo(() => {
    const socialsArray = [];
    if (website) {
      socialsArray.push({
        platform: 'website' as const,
        url: website.startsWith('http') ? website : `https://${website}`,
        label: 'Website'
      });
    }

    return {
      id: 'preview-new-profile-id',
      userId: user.id,
      slug: 'new-profile-preview',
      name: fullName || 'Your Full Name',
      profileName: profileName || 'Profile Persona',
      designation: professionalTitle || 'Professional Role',
      profession: professionalTitle || 'Professional Role',
      professionalTitle: professionalTitle || 'Professional Role',
      company: company || 'Avtive Network',
      location: location || 'Global',
      avatar: avatar || PRESET_AVATARS[0],
      email: email || user.email || '',
      phone: phone || '',
      whatsapp: whatsapp || phone || '',
      bio: bio || 'Welcome to my digital profile on Avtive.',
      shortBio: bio || 'Welcome to my digital profile on Avtive.',
      about: about || bio || 'Passionate professional delivering clean code and intuitive experiences.',
      fullBio: about || bio || 'Connect with me directly via phone, WhatsApp, or email.',
      skills: skillsList.length > 0 ? skillsList : ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
      theme: theme || 'editorial',
      type: profileType,
      socials: socialsArray,
      socialLinks: socialsArray.map((s) => ({ platform: s.platform, url: s.url, label: s.label })),
      experience: [
        {
          id: 'exp-1',
          title: professionalTitle || 'Lead Engineer',
          company: company || 'Avtive Network',
          period: '2022 - Present',
          current: true,
          description: 'Building modern reactive applications with cloud architecture and intuitive design systems.'
        }
      ],
      education: [
        {
          id: 'edu-1',
          degree: 'Bachelor of Science in Computer Science',
          institution: 'University of Technology',
          year: '2021'
        }
      ],
      projects: [],
      services: [],
      certifications: []
    };
  }, [
    user.id,
    user.email,
    fullName,
    profileName,
    professionalTitle,
    company,
    location,
    avatar,
    email,
    phone,
    whatsapp,
    bio,
    about,
    skillsList,
    theme,
    profileType,
    website
  ]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!profileName.trim() || !fullName.trim()) {
      setErrorMessage('Please fill in both your profile persona name and your full name.');
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
          professionalTitle: professionalTitle.trim(),
          designation: professionalTitle.trim(),
          company: company.trim(),
          location: location.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          email: email.trim() || user.email,
          website: website.trim(),
          bio: bio.trim(),
          shortBio: bio.trim(),
          about: about.trim() || bio.trim(),
          fullBio: about.trim() || bio.trim(),
          skills: skillsList,
          avatar,
          theme,
          type: profileType
        })
      });

      const data = await res.json();

      if (!res.ok || !data.profile) {
        setErrorMessage(data.error || 'Failed to create profile.');
        setIsLoading(false);
        return;
      }

      const createdProfile: ProfileData = data.profile;
      const targetSlug = createdProfile.slug || createdProfile.id;

      // Instantly cache in localStorage & notify all listeners so data is immediately visible
      try {
        localStorage.setItem(`avtive_profile_${createdProfile.slug}`, JSON.stringify(createdProfile));
        localStorage.setItem(`avtive_profile_${createdProfile.id}`, JSON.stringify(createdProfile));
        localStorage.setItem('avtive_last_saved_profile', JSON.stringify(createdProfile));
        window.dispatchEvent(new CustomEvent('avtive_profile_updated', { detail: createdProfile }));
      } catch {}

      // Navigate directly to the newly created profile view
      router.push(`/profile/${targetSlug}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Network error creating profile. Please try again.');
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // DESKTOP WIZARD STAGE (Left Screen)
  // ──────────────────────────────────────────────────────────────────────────
  const desktopView = (
    <div className="w-full max-w-5xl mx-auto my-auto py-6 space-y-6 text-left">
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

      {/* Header & Step Tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Profile Studio</span>
            <span>&middot;</span>
            <span>Step {step} of 2</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {step === 1 && 'Profile Type & Theme Aesthetics'}
            {step === 2 && 'Complete Profile Pass Details'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {step === 1 && 'Choose between individual digital identity or team organization pass and select your visual theme.'}
            {step === 2 && 'Provide your name, designation, contact info, bio, and skills to populate your brand new live pass.'}
          </p>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Back
            </button>
          )}

          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>Continue to Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Finish &amp; View Pass</span>
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: TYPE & THEME */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Identity Pass Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono mb-3">
              1. Choose Profile Pass Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setProfileType('individual')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  profileType === 'individual'
                    ? 'bg-cyan-50/60 dark:bg-cyan-950/20 border-cyan-500 dark:border-cyan-400 shadow-lg ring-1 ring-cyan-500/40'
                    : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-xs'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-3">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Individual Profile</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Personal verified portfolio and identity card for professionals, developers, and creators.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-white/10 flex justify-end">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    profileType === 'individual'
                      ? 'border-cyan-500 bg-cyan-500 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950'
                      : 'border-slate-300 dark:border-white/20'
                  }`}>
                    {profileType === 'individual' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>

              <div
                onClick={() => setProfileType('team')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  profileType === 'team'
                    ? 'bg-cyan-50/60 dark:bg-cyan-950/20 border-cyan-500 dark:border-cyan-400 shadow-lg ring-1 ring-cyan-500/40'
                    : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-xs'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Team / Organization</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Collaborative team pass, organizational roster, shared services, and company showcase.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-white/10 flex justify-end">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    profileType === 'team'
                      ? 'border-cyan-500 bg-cyan-500 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950'
                      : 'border-slate-300 dark:border-white/20'
                  }`}>
                    {profileType === 'team' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Palette Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono mb-3">
              2. Select Visual Theme &amp; Atmosphere
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {THEME_OPTIONS.map((th) => {
                const isSelected = theme === th.id;
                return (
                  <div
                    key={th.id}
                    onClick={() => setTheme(th.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-500 dark:border-cyan-400 shadow-md ring-1 ring-cyan-500/30'
                        : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{th.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 pr-2">{th.description}</p>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950'
                        : 'border-slate-300 dark:border-white/20'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PROFILE DETAILS FORM */}
      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Avatar Photo Picker */}
          <div className="md:col-span-4 p-5 rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-cyan-500 dark:border-cyan-400 group shadow-lg">
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity"
              >
                <Camera className="w-6 h-6" />
                <span className="text-[10px] font-bold mt-1">Upload</span>
              </button>
            </div>

            <div className="space-y-2 w-full">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-200 cursor-pointer transition-colors"
              >
                Upload Custom Photo
              </button>

              <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                  Or pick a preset:
                </span>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {PRESET_AVATARS.map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(presetUrl)}
                      className={`w-8 h-8 rounded-full overflow-hidden border transition-all cursor-pointer ${
                        avatar === presetUrl ? 'ring-2 ring-cyan-500 border-white' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={presetUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="md:col-span-8 p-6 rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 space-y-4 shadow-xs">
            {/* Identity Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Profile Persona Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. MERN Developer, Product Lead"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aleena Nawab"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 font-semibold"
                />
              </div>
            </div>

            {/* Role, Company, Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-cyan-500" />
                  <span>Role / Designation</span>
                </label>
                <input
                  type="text"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  placeholder="e.g. Full Stack Developer"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>Organization</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Avtive Network"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-500" />
                  <span>Location</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Contact & Social Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-cyan-500" />
                  <span>Phone / WhatsApp</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (!whatsapp) setWhatsapp(e.target.value);
                  }}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-cyan-500" />
                  <span>Contact Email</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@avtive.app"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-500" />
                  <span>Website / Portfolio</span>
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://myportfolio.dev"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Short Bio / Persona Headline
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A brief engaging headline for your pass card..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            {/* Skills & Quick Suggestions */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Core Skills &amp; Competencies
              </label>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(skillInput);
                    }
                  }}
                  placeholder="Type a skill &amp; press Enter..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(skillInput)}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Selected Skills Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-medium"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Suggested Skills Pill suggestions */}
              <div className="pt-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Quick add:
                </span>
                <div className="flex flex-wrap gap-1">
                  {SUGGESTED_SKILLS.filter((s) => !skillsList.includes(s)).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleAddSkill(skill)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 cursor-pointer transition-colors"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // MOBILE SCREEN REPRESENTATION (Synchronized Twin Preview & Wizard)
  // ──────────────────────────────────────────────────────────────────────────
  const mobileView = (
    <div className="w-full flex-1 flex flex-col justify-between py-1 text-left overflow-y-auto">
      {/* Mobile Top View Switcher */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveMobileViewTab('form')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeMobileViewTab === 'form'
                ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Edit3 className="w-3 h-3 inline mr-1" />
            <span>Setup</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileViewTab('preview')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeMobileViewTab === 'preview'
                ? 'bg-cyan-500 text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Eye className="w-3 h-3 inline mr-1" />
            <span>Live Pass</span>
          </button>
        </div>

        <span className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
          Step {step} of 2
        </span>
      </div>

      {/* Mode A: Live Card Preview Mode */}
      {activeMobileViewTab === 'preview' ? (
        <div className="flex-1 w-full overflow-y-auto">
          <AvtiveDigitalCard
            profile={livePreviewProfile}
            canEdit={false}
            isEditing={false}
            isConnected={false}
            onOpenEdit={() => {}}
            onCancelEdit={() => {}}
            onSaveEdits={async () => {}}
            onSaveContact={() => {}}
            onOpenShare={() => {}}
            onOpenConnect={() => {}}
            onOpenQRModal={() => {}}
            onOpenResumeModal={() => {}}
            onSelectProject={() => {}}
            onSelectTeamMember={() => {}}
            onViewCompany={() => {}}
            isDark={false}
            viewMode="standard"
          />
        </div>
      ) : (
        /* Mode B: Mobile Wizard Form Inputs */
        <div className="flex-1 space-y-3.5 overflow-y-auto pr-1">
          {/* Mobile Step 1 */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Profile Pass Type</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Select individual identity or team organization</p>
              </div>

              <div className="space-y-2">
                <div
                  onClick={() => setProfileType('individual')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    profileType === 'individual'
                      ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-500 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-cyan-500" />
                    <div>
                      <div className="text-xs font-bold">Individual Pass</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Personal identity &amp; portfolio</div>
                    </div>
                  </div>
                  {profileType === 'individual' && <Check className="w-4 h-4 text-cyan-500 stroke-[3]" />}
                </div>

                <div
                  onClick={() => setProfileType('team')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    profileType === 'team'
                      ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-500 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="text-xs font-bold">Team / Organization</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Company &amp; team showcase</div>
                    </div>
                  </div>
                  {profileType === 'team' && <Check className="w-4 h-4 text-purple-500 stroke-[3]" />}
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono mb-2">
                  Theme Palette
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_OPTIONS.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setTheme(th.id)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        theme === th.id
                          ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500'
                          : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{th.label}</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{th.id}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mobile Step 2 */}
          {step === 2 && (
            <div className="space-y-3">
              {/* Photo Avatar Row */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10">
                <div
                  className="relative group cursor-pointer w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500 shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{fullName || 'Your Name'}</div>
                  <div className="text-[10px] text-cyan-600 dark:text-cyan-400 truncate">{professionalTitle || 'Role Title'}</div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-medium"
                  >
                    Change photo
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Persona Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. MERN Developer"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Role / Title</label>
                <input
                  type="text"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  placeholder="e.g. Full Stack Developer"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Organization"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Short Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief summary..."
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Footer Actions */}
      <div className="pt-2 mt-2 border-t border-slate-200 dark:border-white/10 shrink-0">
        {step < 2 ? (
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Continue to Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
        )}
      </div>
    </div>
  );

  return (
    <DualScreenWorkspace
      workflowTitle="Create Profile Studio"
      workflowSubtitle="Step-by-Step Live Profile Pass Generator"
      currentUrlPath="/create-profile"
      desktopContent={desktopView}
      mobileContent={mobileView}
    />
  );
}
