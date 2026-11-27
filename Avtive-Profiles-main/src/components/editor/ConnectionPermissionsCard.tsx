'use client';

import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp, Lock, ShieldCheck } from 'lucide-react';
import { DEFAULT_SHARING_SETTINGS, ProfileData, SharingSettings } from '@/types/profile';

interface ConnectionPermissionsCardProps {
  profile: ProfileData;
  onChangeConnectionSettings: (next: SharingSettings) => void;
  defaultOpen?: boolean;
}

const CONNECTION_PERMISSION_FIELDS: Array<{
  key: keyof SharingSettings;
  label: string;
  hint: string;
}> = [
  { key: 'email', label: 'Email address', hint: 'Contact email for connected peers' },
  { key: 'phone', label: 'Phone / WhatsApp', hint: 'Direct phone and messaging number' },
  { key: 'location', label: 'Location & office address', hint: 'City, country, and office location' },
  { key: 'website', label: 'Website & links', hint: 'Personal website URL' },
  { key: 'bio', label: 'About & bio', hint: 'Summary and career narrative' },
  { key: 'introductionMedia', label: 'Voice & video intro', hint: 'Audio and video introductions' },
  { key: 'experience', label: 'Work experience', hint: 'Career roles and history' },
  { key: 'education', label: 'Education', hint: 'Degrees and institutions' },
  { key: 'skills', label: 'Skills & services', hint: 'Technical skills and offerings' },
  { key: 'projects', label: 'Portfolio & projects', hint: 'Case studies and work samples' },
  { key: 'socialLinks', label: 'Social links', hint: 'Connected social networks' },
  { key: 'resume', label: 'CV / Resume', hint: 'Downloadable resume attachment' },
  { key: 'customFields', label: 'Custom fields', hint: 'Additional non-sensitive attributes' },
];

export function ConnectionPermissionsCard({
  profile,
  onChangeConnectionSettings,
  defaultOpen = false
}: ConnectionPermissionsCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const publicSettings = profile.sharingSettings || DEFAULT_SHARING_SETTINGS;
  const connSettings = profile.connectionSettings || {};
  const fieldPrivacy = profile.fieldPrivacy || {};

  const getEffectiveConnValue = (key: keyof SharingSettings): boolean => {
    const fp = fieldPrivacy[String(key)];
    if (fp === 'never_share' || fp === 'private') return false;
    if (typeof connSettings[key] === 'boolean') return Boolean(connSettings[key]);
    return publicSettings[key] !== false;
  };

  const handleToggle = (key: keyof SharingSettings) => {
    const fp = fieldPrivacy[String(key)];
    if (fp === 'never_share' || fp === 'private') return;
    const current = getEffectiveConnValue(key);
    const base: SharingSettings = {
      ...DEFAULT_SHARING_SETTINGS,
      ...publicSettings,
      ...connSettings,
    };
    onChangeConnectionSettings({
      ...base,
      [key]: !current,
    });
  };

  const allowedCount = CONNECTION_PERMISSION_FIELDS.filter((f) => getEffectiveConnValue(f.key)).length;

  return (
    <section
      aria-label="Connection audience permissions"
      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
      >
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#7A1C33] dark:text-amber-300 shrink-0" />
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
              Connection audience permissions
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {allowedCount}/{CONNECTION_PERMISSION_FIELDS.length} visible
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Choose what accepted connections can see (Private / Never Share fields stay locked)
          </p>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-2.5">
          {profile.profileVisibility === 'private' && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Your profile is currently <strong>Private</strong>. Non-owners (including connections) only see your display name until set to Public.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CONNECTION_PERMISSION_FIELDS.map((item) => {
              const fp = fieldPrivacy[String(item.key)];
              const isLocked = fp === 'never_share' || fp === 'private';
              const isEnabled = getEffectiveConnValue(item.key);

              return (
                <button
                  key={String(item.key)}
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleToggle(item.key)}
                  aria-pressed={isEnabled}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-left transition-colors ${
                    isLocked
                      ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 opacity-65 cursor-not-allowed'
                      : isEnabled
                        ? 'border-[#7A1C33]/35 bg-[#7A1C33]/[0.04] dark:bg-amber-500/10 dark:border-amber-500/30 cursor-pointer'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {item.label}
                      </span>
                      {isLocked && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <Lock className="w-2.5 h-2.5" />
                          Locked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {item.hint}
                    </p>
                  </div>

                  <span
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                      isLocked
                        ? 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                        : isEnabled
                          ? 'bg-[#7A1C33] dark:bg-amber-400 justify-end'
                          : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white dark:bg-zinc-950 shadow-xs" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
