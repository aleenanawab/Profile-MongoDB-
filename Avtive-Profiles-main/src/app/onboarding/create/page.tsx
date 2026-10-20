'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Camera, 
  Loader2, 
  AlertCircle, 
  Plus, 
  X, 
  Globe, 
  Mail, 
  Phone, 
  FolderGit2, 
  Trash2,
  Check,
  Sparkles,
  Save,
  ArrowRight,
  Upload
} from 'lucide-react';
import { ProfileType, ProfileTheme, ProjectItem, normalizeProfileType } from '@/types/profile';
import { GithubIcon, LinkedInIcon, TwitterXIcon } from '@/components/BrandIcons';
import { DualScreenWorkspace } from '@/components/layout/DualScreenWorkspace';

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop'
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop'
];

function CreateProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = (searchParams.get('theme') as ProfileTheme) || 'editorial';
  const role = normalizeProfileType(searchParams.get('role') || 'individual');

  useEffect(() => {
    window.location.href = `/edit-profile?role=${encodeURIComponent(role)}&theme=${encodeURIComponent(theme)}`;
  }, [role, theme]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Shared Identity State
  const [profileName, setProfileName] = useState(
    role === 'team' ? 'Team Profile' : 'Personal Profile'
  );
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');

  // Media
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0]);

  // Skills chips
  const [skills, setSkills] = useState<string[]>(['TypeScript', 'Next.js', 'React', 'Tailwind CSS']);
  const [skillInput, setSkillInput] = useState('');

  // Projects
  const [projects, setProjects] = useState<ProjectItem[]>([
    {
      id: 'proj-1',
      title: 'Digital Portfolio Architecture',
      description: 'Clean, modern digital profile UI architecture with responsive cards.',
      link: 'https://github.com',
      image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=800&auto=format&fit=crop'
    }
  ]);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectLink, setNewProjectLink] = useState('');

  // Socials
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [portfolio, setPortfolio] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prepopulate from session if available
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          const names = data.user.name ? data.user.name.trim().split(/\s+/) : [];
          if (!firstName && names.length > 0) setFirstName(names[0]);
          if (!secondName && names.length > 1) setSecondName(names.slice(1).join(' '));
          if (data.user.avatar) {
            setAvatar(data.user.avatar);
          }
          if (!professionalTitle) {
            setProfessionalTitle(role === 'team' ? 'Lead Organization' : 'Full Stack Developer');
          }
          if (!company) {
            setCompany(role === 'team' ? 'Avtive Inc.' : 'Avtive');
          }
          if (!bio) {
            setBio('Passionate developer delivering intuitive digital experiences with modern web technology.');
          }
        }
      })
      .catch(() => {});
  }, [role, firstName, secondName, professionalTitle, company, bio]);

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (item: string) => {
    setSkills(skills.filter((s) => s !== item));
  };

  const handleAddProject = () => {
    if (newProjectTitle.trim()) {
      setProjects([
        ...projects,
        {
          id: `proj-${Date.now()}`,
          title: newProjectTitle.trim(),
          description: newProjectDesc.trim() || 'Verified project showcase.',
          link: newProjectLink.trim() || 'https://github.com',
          image: PRESET_COVERS[1]
        }
      ]);
      setNewProjectTitle('');
      setNewProjectDesc('');
      setNewProjectLink('');
    }
  };

  const handleRemoveProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const fullName = [firstName.trim(), secondName.trim()].filter(Boolean).join(' ') || 'Aleena Nawab';

    setIsLoading(true);

    try {
      const res = await fetch('/api/profile/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          profileName: profileName.trim() || (role === 'team' ? 'Team Profile' : 'Personal Profile'),
          profession: professionalTitle.trim() || 'Software Engineer',
          designation: professionalTitle.trim() || 'Software Engineer',
          company: company.trim() || 'Avtive',
          shortBio: bio.trim(),
          fullBio: bio.trim(),
          avatar,
          coverImage,
          theme,
          type: role,
          skills,
          projects,
          socialLinks: [
            ...(linkedin ? [{ id: 'soc-li', platform: 'linkedin', url: linkedin }] : []),
            ...(github ? [{ id: 'soc-gh', platform: 'github', url: github }] : []),
            ...(twitter ? [{ id: 'soc-tw', platform: 'twitter', url: twitter }] : []),
            ...(portfolio ? [{ id: 'soc-po', platform: 'portfolio', url: portfolio }] : [])
          ]
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to save profile. Please verify your inputs.');
        setIsLoading(false);
        return;
      }

      const targetSlug = data.profile?.slug || data.profile?.id || data.slug || data.id;
      if (targetSlug) {
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
        window.location.href = `/profile/${encodeURIComponent(targetSlug)}`;
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error creating profile.');
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // DESKTOP WORKING SCREEN REPRESENTATION
  // ──────────────────────────────────────────────────────────────────────────
  const desktopView = (
    <div className="w-full max-w-5xl mx-auto my-auto py-6 space-y-6 text-left">
      
      {/* Hidden file inputs */}
      <input type="file" ref={avatarInputRef} onChange={handleAvatarFile} accept="image/*" className="hidden" />
      <input type="file" ref={coverInputRef} onChange={handleCoverFile} accept="image/*" className="hidden" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <span>Onboarding Flow</span>
            <span>&middot;</span>
            <span>Step 3 of 3</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Create Your Profile Identity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure your personal pass, upload branding imagery, and assemble projects.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => router.push(`/onboarding/theme?role=${role}&theme=${theme}`)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save &amp; View Live Card</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Desktop Profile Studio Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Media & Identity (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Cover & Avatar Header Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Cover &amp; Profile Photo</span>
            </h3>

            {/* Cover Image */}
            <div className="relative h-32 w-full rounded-2xl overflow-hidden group border border-slate-200 dark:border-white/10">
              <img src={coverImage} alt="Cover Banner" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-xs font-bold text-white transition-opacity cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Change Banner</span>
              </button>
            </div>

            {/* Avatar & Persona Name Row */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-500 dark:border-cyan-400 group shrink-0">
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Profile Persona Title</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. MERN Developer"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Identity Fields Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 space-y-3.5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Identity Details</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Aleena"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Second Name</label>
                <input
                  type="text"
                  value={secondName}
                  onChange={(e) => setSecondName(e.target.value)}
                  placeholder="Nawab"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Professional Title</label>
                <input
                  type="text"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  placeholder="Senior Systems Architect"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Organization / Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Avtive Inc."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Short Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A brief summary of your expertise and what drives your work..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          </div>

        </div>

        {/* Right: Skills, Projects & Socials (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Skills Management */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Skills &amp; Expertise</h3>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                placeholder="Add skill tag (e.g. Next.js)"
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400 dark:hover:bg-cyan-500/30 border border-cyan-200 dark:border-cyan-500/30 text-xs font-bold transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {skills.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>{s}</span>
                  <button type="button" onClick={() => handleRemoveSkill(s)} className="text-slate-400 hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Social Links Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0E1528] border border-slate-200 dark:border-white/10 space-y-2.5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Social &amp; Contact Links</h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10">
                <LinkedInIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10">
                <GithubIcon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-300 dark:border-white/10">
                <TwitterXIcon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://x.com/username"
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // MOBILE WORKING SCREEN REPRESENTATION
  // ──────────────────────────────────────────────────────────────────────────
  const mobileView = (
    <div className="w-full flex-1 flex flex-col justify-between py-1 text-left overflow-hidden min-h-0">
      
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Mobile Cover Banner */}
        <div className="relative h-24 w-full rounded-2xl bg-slate-900 overflow-hidden border border-white/10 mb-3 group">
          <img src={coverImage} alt="Banner" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 text-white text-[10px] flex items-center gap-1 cursor-pointer"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>

        {/* Mobile Avatar & Header */}
        <div className="relative px-2 -mt-8 flex items-center justify-between mb-3">
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md group">
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button type="button" className="figma-pill-secondary py-1 px-3 text-[10px]">
              Share
            </button>
            <button type="button" className="figma-pill-primary py-1 px-3 text-[10px]">
              Connect
            </button>
          </div>
        </div>

        {/* Mobile Form Fields (100% Synchronized State with Desktop) */}
        <div className="flex-1 min-h-0 space-y-2 text-xs max-h-[380px] overflow-y-auto pr-0.5 scrollbar-thin">
          {/* Profile Persona Title */}
          <div className="space-y-0.5">
            <label className="text-[10px] text-slate-400">Persona Title</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. Personal Profile"
              className="figma-input w-full px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="figma-input w-full px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400">Second Name</label>
              <input
                type="text"
                value={secondName}
                onChange={(e) => setSecondName(e.target.value)}
                placeholder="Second Name"
                className="figma-input w-full px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400">Professional Title</label>
              <input
                type="text"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                placeholder="e.g. Full Stack Developer"
                className="figma-input w-full px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-slate-400">Organization / Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Avtive"
                className="figma-input w-full px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-[10px] text-slate-400">Bio</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio description..."
              className="figma-input w-full px-2.5 py-1 text-xs text-white resize-none"
            />
          </div>

          {/* Skills summary & tag input */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-slate-400">Skills ({skills.length})</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                  placeholder="Add skill..."
                  className="w-24 px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[9px] text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
              {skills.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-slate-200 flex items-center gap-1">
                  <span>{s}</span>
                  <button type="button" onClick={() => handleRemoveSkill(s)} className="text-slate-400 hover:text-rose-400 text-[9px]">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Social & Contact Links */}
          <div className="space-y-1 pt-1">
            <label className="text-[10px] text-slate-400">Social Links</label>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/10">
                <LinkedInIcon className="w-3 h-3 text-blue-400 shrink-0" />
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="LinkedIn URL..."
                  className="w-full bg-transparent text-[10px] text-white focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/10">
                <GithubIcon className="w-3 h-3 text-slate-300 shrink-0" />
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="GitHub URL..."
                  className="w-full bg-transparent text-[10px] text-white focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/10">
                <TwitterXIcon className="w-3 h-3 text-slate-300 shrink-0" />
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="X / Twitter URL..."
                  className="w-full bg-transparent text-[10px] text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Action Button */}
      <div className="pt-2 shrink-0">
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

    </div>
  );

  return (
    <DualScreenWorkspace
      workflowTitle="5. Create Profile"
      workflowSubtitle="Onboarding Step 3 of 3"
      currentUrlPath={`/onboarding/create?theme=${theme}&role=${role}`}
      desktopContent={desktopView}
      mobileContent={mobileView}
    />
  );
}

export default function OnboardingCreatePage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-sm">Loading profile creator...</div>}>
      <CreateProfileContent />
    </Suspense>
  );
}
