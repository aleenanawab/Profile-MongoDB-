'use client';

import React from 'react';
import { Globe, Lock } from 'lucide-react';

interface ProfileVisibilityCardProps {
  value: 'public' | 'private';
  onChange: (next: 'public' | 'private') => void;
}

export function ProfileVisibilityCard({ value, onChange }: ProfileVisibilityCardProps) {
  const isPrivate = value === 'private';

  return (
    <section
      aria-label="Profile visibility"
      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] p-4 flex items-center justify-between gap-3"
    >
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          {isPrivate ? (
            <Lock className="w-4 h-4 text-zinc-900 dark:text-white shrink-0" />
          ) : (
            <Globe className="w-4 h-4 text-zinc-900 dark:text-white shrink-0" />
          )}
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
            Profile visibility
          </h3>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Private shows your name only
        </p>
      </div>

      <div
        role="group"
        aria-label="Choose profile visibility"
        className="inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0"
      >
        <button
          type="button"
          onClick={() => onChange('public')}
          aria-pressed={!isPrivate}
          className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            !isPrivate
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          Public
        </button>
        <button
          type="button"
          onClick={() => onChange('private')}
          aria-pressed={isPrivate}
          className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isPrivate
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          Private
        </button>
      </div>
    </section>
  );
}
