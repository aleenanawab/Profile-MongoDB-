'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  ChevronDown, 
  Plus, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Share2, 
  Copy, 
  Trash2, 
  Check, 
  Home, 
  Users, 
  Settings, 
  Sun, 
  Moon, 
  LogOut, 
  Loader2, 
  AlertCircle,
  Sparkles,
  ExternalLink,
  Layers,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { ProfileData, UserSession, ProfileTheme } from '@/types/profile';
import { DualScreenWorkspace } from '@/components/layout/DualScreenWorkspace';

interface ProfileDashboardProps {
  initialProfiles: ProfileData[];
  user: UserSession;
}

export function ProfileDashboard({ initialProfiles, user }: ProfileDashboardProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileData[]>(initialProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string>(
    initialProfiles[0]?.id || ''
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isCurrentProfileDropdownOpen, setIsCurrentProfileDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || initialProfiles[0];

  useEffect(() => {
    // 1. Sync from localStorage cached profiles on mount if any updates or new profiles were saved
    try {
      const localProfiles: ProfileData[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('avtive_profile_') || key === 'avtive_last_saved_profile')) {
          try {
            const p = JSON.parse(localStorage.getItem(key) || '{}');
            if (p && (p.id || p.slug) && (p.name || p.profileName)) {
              if (!localProfiles.some((lp) => (lp.id && lp.id === p.id) || (lp.slug && lp.slug === p.slug))) {
                localProfiles.push(p);
              }
            }
          } catch {}
        }
      }

      setProfiles((prev) => {
        const combined = [...prev];
        localProfiles.forEach((lp) => {
          const idx = combined.findIndex((cp) => (cp.id && cp.id === lp.id) || (cp.slug && cp.slug === lp.slug));
          if (idx >= 0) {
            combined[idx] = { ...combined[idx], ...lp };
          } else {
            combined.push(lp);
          }
        });
        return combined;
      });
    } catch {}

    // 2. Fetch fresh list from server
    fetch('/api/profile/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.profiles && Array.isArray(data.profiles) && data.profiles.length > 0) {
          setProfiles((prev) => {
            const serverProfiles: ProfileData[] = data.profiles;
            const merged = [...serverProfiles];
            // Preserve any local profiles not yet returned by server
            prev.forEach((localP) => {
              if (!merged.some((sp) => sp.id === localP.id || sp.slug === localP.slug)) {
                merged.push(localP);
              }
            });
            return merged;
          });
        }
      })
      .catch(() => {});

    // 3. Listen for custom profile update events & storage events
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
            setProfiles((prev) => {
              const exists = prev.some((p) => p.id === updated.id || p.slug === updated.slug);
              if (exists) {
                return prev.map((p) => (p.id === updated.id || p.slug === updated.slug ? { ...p, ...updated } : p));
              }
              return [...prev, updated];
            });
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getThemeDisplay = (theme?: ProfileTheme | string) => {
    switch (theme) {
      case 'cyber':
      case 'developer':
        return 'Cyber Theme';
      case 'luxe':
        return 'Luxe Theme';
      case 'editorial':
      default:
        return 'Editorial Theme';
    }
  };

  const handleCopyLink = (profile: ProfileData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const identifier = profile.slug || profile.id;
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/profile/${identifier}`
      : `https://www.avtive.app/profile/${identifier}`;

    navigator.clipboard.writeText(url);
    showToast(`✓ Copied link for ${profile.profileName || profile.name}`);
    setOpenMenuId(null);
  };

  const handleDuplicate = async (profile: ProfileData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenMenuId(null);
    try {
      const res = await fetch('/api/profile/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id })
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfiles((prev) => [...prev, data.profile]);
        showToast(`✓ Duplicated profile "${data.profile.profileName}"`);
      } else {
        showToast(`Failed: ${data.error || 'Could not duplicate'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while duplicating.');
    }
  };

  const handleDeleteProfile = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/profile/${deletingId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProfiles((prev) => prev.filter((p) => p.id !== deletingId && p.slug !== deletingId));
        showToast('✓ Profile deleted successfully.');
        setDeletingId(null);
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.error || 'Could not delete'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // DESKTOP WORKING SCREEN REPRESENTATION
  // ──────────────────────────────────────────────────────────────────────────
  const desktopView = (
    <div className="w-full max-w-5xl mx-auto my-auto py-6 space-y-6 text-left">
      
      {/* Dashboard Top Stats & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <span>Workspaces Dashboard</span>
            <span>&middot;</span>
            <span>{profiles.length} Active Identity Passes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            My Profile Cards &amp; Workspaces
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your verified personas, launch profile editor studios, and share custom passes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/create-profile"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Profile</span>
          </Link>
        </div>
      </div>

      {/* Profiles Grid */}
      {profiles.length === 0 ? (
        <div className="p-10 text-center border border-slate-200 dark:border-white/10 rounded-3xl bg-white dark:bg-[#0E1528] space-y-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm">No profiles found in your workspace yet.</p>
          <Link
            href="/create-profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Your First Profile</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-5">
          {profiles.map((p) => {
          const isActive = p.id === activeProfile?.id;

          return (
            <div
              key={p.id}
              onClick={() => setActiveProfileId(p.id)}
              className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between cursor-pointer ${
                isActive
                  ? 'bg-cyan-50/60 dark:bg-cyan-950/20 border-cyan-500 dark:border-cyan-400 shadow-xl ring-1 ring-cyan-500/40'
                  : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-slate-800 shrink-0">
                      {p.avatar ? (
                        <img
                          src={p.avatar}
                          alt={p.name}
                          onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm bg-gradient-to-tr from-cyan-500/20 to-blue-500/20">
                          {(p.profileName || p.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {p.profileName || p.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{p.designation || 'Professional'}</p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500 dark:bg-cyan-400 text-white dark:text-slate-950 font-mono text-[10px] font-extrabold shrink-0">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 py-3 border-y border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Type</span>
                    <span className="font-semibold capitalize text-cyan-600 dark:text-cyan-300">{p.type || 'Individual'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Organization</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200 truncate ml-2">{p.company || 'Personal'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-2 flex items-center justify-between gap-1.5 sm:gap-2">
                <Link
                  href={`/profile/${encodeURIComponent(p.slug || p.id)}?edit=true`}
                  className="flex-1 min-w-0 min-h-[44px] py-2 px-2.5 sm:px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:hover:bg-cyan-500/30 dark:text-cyan-300 text-xs font-bold text-center border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center gap-1 sm:gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Edit Studio</span>
                </Link>

                <Link
                  href={`/profile/${p.slug || p.id}`}
                  className="min-h-[44px] py-2 px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-white/10 flex items-center justify-center gap-1 sm:gap-1.5 shrink-0"
                >
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Live Pass</span>
                </Link>

                <button
                  type="button"
                  onClick={(e) => handleCopyLink(p, e)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/10 cursor-pointer shrink-0 flex items-center justify-center"
                  title="Copy link"
                  aria-label="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
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
        <div className="flex items-center justify-between mb-3 text-slate-500 dark:text-slate-400">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">My Profiles ({profiles.length})</h2>
          <Link href="/create-profile" className="min-h-[44px] px-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 inline-flex items-center">
            + New
          </Link>
        </div>

        {/* Mobile Profiles List */}
        {profiles.length === 0 ? (
          <div className="p-6 text-center border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#0E1528] space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">No profile cards found.</p>
            <Link
              href="/create-profile"
              className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl text-xs font-bold bg-cyan-600 dark:bg-cyan-500 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Profile</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
            {profiles.map((p) => {
            const isActive = p.id === activeProfile?.id;
            return (
              <div
                key={p.id}
                onClick={() => setActiveProfileId(p.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isActive ? 'bg-cyan-50/60 dark:bg-[#151D30] border-cyan-500 dark:border-cyan-400 shadow-xs' : 'bg-white dark:bg-[#0E1528] border-slate-200 dark:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-slate-800 shrink-0">
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
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">{p.profileName || p.name}</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{p.designation}</p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-white/5">
                  <Link
                    href={`/profile/${encodeURIComponent(p.slug || p.id)}?edit=true`}
                    className="flex-1 min-h-[44px] py-1.5 text-xs font-bold text-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 flex items-center justify-center"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/profile/${p.slug || p.id}`}
                    className="flex-1 min-h-[44px] py-1.5 text-xs font-semibold text-center rounded-xl bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-200 flex items-center justify-center"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleCopyLink(p, e)}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                    aria-label="Copy link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between px-2 text-slate-500 dark:text-slate-400">
        <Link href="/" className="min-w-[44px] min-h-[44px] px-2 py-1 flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          <Home className="w-4 h-4" />
          <span className="text-[10px]">Home</span>
        </Link>
        <Link href="/dashboard" className="min-w-[44px] min-h-[44px] px-2 py-1 flex flex-col items-center justify-center gap-0.5 text-cyan-600 dark:text-cyan-400 font-bold">
          <Users className="w-4 h-4" />
          <span className="text-[10px]">Profiles</span>
        </Link>
        <Link href={`/profile/${activeProfile?.slug || activeProfile?.id || ''}/share`} className="min-w-[44px] min-h-[44px] px-2 py-1 flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          <Share2 className="w-4 h-4" />
          <span className="text-[10px]">Share</span>
        </Link>
      </div>
    </div>
  );

  return (
    <DualScreenWorkspace
      workflowTitle="Workspaces Dashboard"
      workflowSubtitle="Manage Multiple Digital Pass Identities"
      currentUrlPath="/dashboard"
      desktopContent={desktopView}
      mobileContent={mobileView}
    />
  );
}
