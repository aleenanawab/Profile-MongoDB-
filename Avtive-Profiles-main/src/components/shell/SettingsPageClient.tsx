'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SlidersHorizontal, Palette, Edit3, History, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { ProfileData, ProfileTheme, SharingSettings, UserSession } from '@/types/profile';
import { AvtivePlatformHeader } from '@/components/layout/AvtivePlatformHeader';
import { OwnerBottomNav } from '@/components/layout/OwnerBottomNav';
import { ProfileVisibilityCard } from '@/components/editor/ProfileVisibilityCard';
import { ConnectionPermissionsCard } from '@/components/editor/ConnectionPermissionsCard';

interface SettingsPageClientProps {
  profiles: ProfileData[];
  user: UserSession;
}

const APPEARANCE_OPTIONS: Array<{ id: ProfileTheme; label: string; description: string }> = [
  { id: 'editorial', label: 'Editorial B&W', description: 'Crisp high-contrast monochrome layout' },
  { id: 'luxe', label: 'Warm Cream & Burgundy', description: 'Editorial cream canvas with burgundy & muted gold' },
  { id: 'elegant', label: 'Champagne Gold', description: 'Warm cream surface with muted gold accents' },
  { id: 'minimal', label: 'Minimal Light', description: 'Soft clean slate surfaces' },
  { id: 'professional', label: 'Executive Slate', description: 'Clean executive corporate balance' },
  { id: 'modern', label: 'Emerald Craft', description: 'Fresh forest emerald highlights' },
  { id: 'dark', label: 'Obsidian Dark', description: 'Refined dark card mode' }
];

export function SettingsPageClient({ profiles: initialProfiles, user }: SettingsPageClientProps) {
  const [profiles, setProfiles] = useState<ProfileData[]>(initialProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialProfiles[0]?.id || '');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];
  const profileHref = activeProfile
    ? `/profile/${activeProfile.slug || activeProfile.id}`
    : '/dashboard';

  const persistPatch = async (label: string, patch: Partial<ProfileData>) => {
    if (!activeProfile) return;
    setSavingKey(label);
    setStatusMessage(null);

    setProfiles((prev) =>
      prev.map((p) => (p.id === activeProfile.id ? { ...p, ...patch } : p))
    );

    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: activeProfile.id,
          patch
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save setting');
      }
      if (json.profile) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === activeProfile.id ? json.profile : p))
        );
      }
      setStatusMessage({ type: 'success', text: `${label} saved.` });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save changes.'
      });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-24">
      <AvtivePlatformHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="avtive-serif-name text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white">
              Profile Settings & Privacy
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Manage profile visibility, connection permissions, and card appearance layers.
            </p>
          </div>

          {profiles.length > 1 && activeProfile && (
            <select
              value={activeProfile.id}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              aria-label="Select profile to configure"
              className="h-10 px-3 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.profileName || p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {statusMessage && (
          <div
            className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {activeProfile && (
          <>
            <ProfileVisibilityCard
              value={activeProfile.profileVisibility === 'private' ? 'private' : 'public'}
              onChange={(val) => void persistPatch('Profile visibility', { profileVisibility: val })}
            />

            <ConnectionPermissionsCard
              profile={activeProfile}
              defaultOpen
              onChangeConnectionSettings={(next: SharingSettings) =>
                void persistPatch('Connection permissions', { connectionSettings: next })
              }
            />

            <section className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#7A1C33] dark:text-amber-300" />
                    <span>Card Base Appearance</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Independent from any decorative image, video, or occasion background selected in Edit Mode.
                  </p>
                </div>
                {savingKey === 'Appearance' && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {APPEARANCE_OPTIONS.map((opt) => {
                  const selected = (activeProfile.theme || 'editorial') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => void persistPatch('Appearance', { theme: opt.id })}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#7A1C33] bg-[#7A1C33]/[0.06] dark:border-amber-400 dark:bg-amber-400/10'
                          : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold">{opt.label}</span>
                        {selected && <Check className="w-3.5 h-3.5 text-[#7A1C33] dark:text-amber-300" />}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#B88746]" />
                  <span>Quick Actions</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Edit sections, choose decorative backgrounds, or inspect full Share History.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`${profileHref}?edit=true`}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#7A1C33] hover:bg-[#64162A] text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Open Edit Mode</span>
                </Link>
                <Link
                  href={`${profileHref}?share=true`}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-[#FAF7F2] dark:bg-zinc-800 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Share History & Links</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="min-h-[40px] px-3.5 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>All Profiles</span>
                </Link>
              </div>
            </section>
          </>
        )}
      </main>

      <OwnerBottomNav profileHref={profileHref} />
    </div>
  );
}
