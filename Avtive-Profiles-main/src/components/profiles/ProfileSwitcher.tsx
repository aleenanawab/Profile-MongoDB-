'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronDown, 
  Check, 
  Plus, 
  LayoutGrid, 
  Sparkles, 
  Terminal, 
  Gem, 
  ExternalLink,
  Briefcase,
  X,
  Loader2,
  AlertCircle,
  Building2,
  User,
  Users
} from 'lucide-react';
import { ProfileData, ProfileTheme, ProfileType } from '@/types/profile';

interface ProfileSwitcherProps {
  currentProfileIdOrSlug?: string;
  initialProfiles?: ProfileData[];
  onSelectProfile?: (profile: ProfileData) => void;
  className?: string;
}

function setLastProfileCookie(p: { id: string; slug?: string; type?: string; userId?: string }) {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `avtive_last_profile=${encodeURIComponent(JSON.stringify(p))}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

export function ProfileSwitcher({
  currentProfileIdOrSlug,
  initialProfiles,
  onSelectProfile,
  className = ''
}: ProfileSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [profiles, setProfiles] = useState<ProfileData[]>(initialProfiles || []);
  const [loading, setLoading] = useState(!initialProfiles);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Inline Create Form State (strictly in-component, zero popups)
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileTitle, setNewProfileTitle] = useState('');
  const [newProfileType, setNewProfileType] = useState<ProfileType>('individual');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Sync with initialProfiles prop and localStorage cache
  useEffect(() => {
    try {
      setProfiles((prev) => {
        const base = initialProfiles && initialProfiles.length > 0 ? initialProfiles : prev;
        return base.map((p) => {
          const cached = localStorage.getItem(`avtive_profile_${p.slug}`) || localStorage.getItem(`avtive_profile_${p.id}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed && (parsed.id === p.id || parsed.slug === p.slug)) {
                return { ...p, ...parsed };
              }
            } catch {}
          }
          return p;
        });
      });
      if (initialProfiles && initialProfiles.length > 0) {
        setLoading(false);
      }
    } catch {}
  }, [initialProfiles]);

  // Fetch profiles & listen for real-time updates
  useEffect(() => {
    fetch('/api/profile/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.profiles && Array.isArray(data.profiles) && data.profiles.length > 0) {
          setProfiles(data.profiles);
        }
      })
      .catch((err) => console.error('Failed to load profiles for switcher', err))
      .finally(() => setLoading(false));

    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ProfileData>;
      if (customEvent.detail) {
        const updated = customEvent.detail;
        setProfiles((prev) => {
          const exists = prev.some((p) => p.id === updated.id || p.slug === updated.slug);
          if (exists) {
            return prev.map((p) => (p.id === updated.id || p.slug === updated.slug ? { ...p, ...updated } : p));
          }
          return [...prev, updated];
        });
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('avtive_profile_') && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (updated && (updated.id || updated.slug)) {
            setProfiles((prev) =>
              prev.map((p) => (p.id === updated.id || p.slug === updated.slug ? { ...p, ...updated } : p))
            );
          }
        } catch {}
      }
    };

    window.addEventListener('avtive_profile_updated', handleProfileUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('avtive_profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreatingInline(false);
        setCreateError(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active profile
  const activeProfile = profiles.find(
    (p) => p.id === currentProfileIdOrSlug || p.slug === currentProfileIdOrSlug
  ) || profiles[0] || null;

  const getTypeBadge = (type?: string) => {
    const isTeam = type === 'team' || type === 'company';
    return {
      label: isTeam ? 'Team' : 'Personal',
      bg: isTeam 
        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
        : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      icon: isTeam ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />
    };
  };

  const handleSwitch = (profile: ProfileData) => {
    setIsOpen(false);
    setIsCreatingInline(false);
    setLastProfileCookie({ id: profile.id, slug: profile.slug, type: profile.type, userId: profile.userId });
    if (onSelectProfile) {
      onSelectProfile(profile);
    } else {
      router.push(`/profile/${profile.slug || profile.id}`);
    }
  };

  // Inline Create Handler: Saves directly via API and switches in-place (ZERO POPUPS)
  const handleCreateInline = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newProfileName.trim();
    if (!trimmedName) return;

    setIsSubmittingNew(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/profile/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          profileName: trimmedName,
          designation: newProfileTitle.trim() || 'Professional',
          profession: newProfileTitle.trim() || 'Professional',
          type: newProfileType
        })
      });

      const data = await res.json();
      if (!res.ok || !data.profile) {
        setCreateError(data.error || 'Failed to create profile.');
        setIsSubmittingNew(false);
        return;
      }

      const created: ProfileData = data.profile;
      setLastProfileCookie({ id: created.id, slug: created.slug, type: created.type, userId: created.userId });
      setProfiles((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
      setIsCreatingInline(false);
      setNewProfileName('');
      setNewProfileTitle('');
      setIsOpen(false);

      if (onSelectProfile) {
        onSelectProfile(created);
      } else {
        router.push(`/profile/${encodeURIComponent(created.slug || created.id)}?edit=true`);
      }
    } catch (err: any) {
      console.error('Error creating profile inline:', err);
      setCreateError('Network error while creating profile.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const activeTypeBadge = getTypeBadge(activeProfile?.type);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/15 transition-all text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-2xs group cursor-pointer"
        aria-expanded={isOpen}
        title="Switch active professional profile or create new"
      >
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal hidden md:inline">
          Profile:
        </span>
        <span className="font-bold truncate max-w-[130px] sm:max-w-[180px]">
          {activeProfile?.profileName || activeProfile?.name || 'Profiles'}
        </span>
        {activeTypeBadge && (
          <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-md border font-mono ${activeTypeBadge.bg}`}>
            {activeTypeBadge.label}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-84 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
          {/* Menu Header */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800/80 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
              Switch Profile
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-mono">
              {profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'}
            </span>
          </div>

          {/* Profile List */}
          <div className="max-h-56 overflow-y-auto space-y-1 py-1">
            {profiles.length === 0 ? (
              <div className="text-center py-3 text-xs text-slate-400 dark:text-zinc-500">
                No profiles yet. Create your first profile below!
              </div>
            ) : (
              profiles.map((p) => {
                const isSelected = p.id === activeProfile?.id || p.slug === activeProfile?.slug;
                const badge = getTypeBadge(p.type);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSwitch(p)}
                    className={`w-full flex items-center justify-between gap-2.5 p-2 rounded-xl transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-zinc-800/90 text-slate-900 dark:text-white font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 shrink-0 bg-slate-200 dark:bg-zinc-800">
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt={p.name}
                            onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs bg-gradient-to-tr from-cyan-500/20 to-blue-500/20">
                            {(p.profileName || p.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs truncate font-bold leading-snug">
                          {p.profileName || p.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          {p.designation || p.profession || 'Professional'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border font-mono ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Action Footer: Inline Create New Profile (Zero Popups) */}
          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-zinc-800/80 space-y-1.5">
            {isCreatingInline ? (
              <form onSubmit={handleCreateInline} className="p-3 bg-slate-50 dark:bg-zinc-900/90 rounded-xl space-y-2.5 border border-slate-200 dark:border-zinc-700 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-zinc-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-500" />
                    New Profile
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingInline(false);
                      setCreateError(null);
                    }}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {createError && (
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    required
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Profile Name (e.g. Aleena Freelance)"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 font-semibold"
                    autoFocus
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={newProfileTitle}
                    onChange={(e) => setNewProfileTitle(e.target.value)}
                    placeholder="Title / Designation (e.g. UI/UX Designer)"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                {/* Profile Type Toggle */}
                <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-200/70 dark:bg-zinc-800 border border-slate-300/60 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setNewProfileType('individual')}
                    className={`py-1 text-[10px] font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
                      newProfileType === 'individual'
                        ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>Individual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProfileType('team')}
                    className={`py-1 text-[10px] font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
                      newProfileType === 'team'
                        ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    <span>Team</span>
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingInline(false);
                      setCreateError(null);
                    }}
                    className="px-2.5 py-1 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNew}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isSubmittingNew ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Create Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsCreatingInline(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Create New Profile</span>
                </button>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>All Profiles Dashboard</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
