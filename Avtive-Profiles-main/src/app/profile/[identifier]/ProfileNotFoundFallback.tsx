'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserX, Loader2, LayoutDashboard } from 'lucide-react';
import { ProfileData, UserSession } from '@/types/profile';
import { PublicProfileClient } from './PublicProfileClient';

interface ProfileNotFoundFallbackProps {
  identifier: string;
  session: UserSession | null;
  initialIsEditing?: boolean;
}

export function ProfileNotFoundFallback({ identifier, session, initialIsEditing }: ProfileNotFoundFallbackProps) {
  const [cachedProfile, setCachedProfile] = useState<ProfileData | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkProfile() {
      try {
        // 1. Check exact slug or identifier match in localStorage
        const exactMatch = localStorage.getItem(`avtive_profile_${identifier}`);
        const lastSaved = localStorage.getItem('avtive_last_saved_profile');

        let candidate: ProfileData | null = null;
        if (exactMatch) {
          candidate = JSON.parse(exactMatch);
        } else if (lastSaved) {
          const parsed = JSON.parse(lastSaved);
          if (
            parsed &&
            (parsed.slug === identifier ||
              parsed.id === identifier ||
              identifier.toLowerCase().includes(parsed.slug?.toLowerCase()) ||
              parsed.slug?.toLowerCase().includes(identifier.toLowerCase()) ||
              (session?.id && parsed.userId === session.id))
          ) {
            candidate = parsed;
          }
        }

        // 2. Check all localStorage keys for any stored profile
        if (!candidate && typeof window !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('avtive_profile_') || key.includes('profile'))) {
              try {
                const item = JSON.parse(localStorage.getItem(key) || '{}');
                if (item && (item.slug === identifier || item.id === identifier || (session?.id && item.userId === session.id))) {
                  candidate = item;
                  break;
                }
              } catch {}
            }
          }
        }

        // 3. Fallback: Query /api/auth/me or /api/profile/list from client to recover user profile
        if (!candidate) {
          try {
            const res = await fetch('/api/profile/list');
            if (res.ok) {
              const data = await res.json();
              if (data.profiles && Array.isArray(data.profiles)) {
                const matched = data.profiles.find((p: any) => 
                  p.slug === identifier || 
                  p.id === identifier ||
                  (p.slug && identifier && p.slug.toLowerCase() === identifier.toLowerCase()) ||
                  (p.id && identifier && p.id.toLowerCase() === identifier.toLowerCase())
                );
                if (matched) {
                  candidate = matched;
                }
              }
            }
          } catch {}
        }

        if (candidate) {
          setCachedProfile(candidate);
          // Silently sync to server lambda so server DB has it
          fetch('/api/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profileId: candidate.id,
              profileSlug: candidate.slug,
              slug: candidate.slug,
              updatedData: candidate
            })
          }).catch(() => {});
        }
      } catch (e) {
        console.error('Failed to load cached profile:', e);
      } finally {
        setIsChecking(false);
      }
    }

    checkProfile();
  }, [identifier, session]);

  if (isChecking) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F8FAFC] dark:bg-[#09090B] text-slate-900 dark:text-white font-sans">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          <span className="text-xs text-slate-400">Loading profile...</span>
        </div>
      </main>
    );
  }

  if (cachedProfile) {
    const isOwner = Boolean(
      session?.id && (
        (cachedProfile.userId && session.id === cachedProfile.userId) ||
        (cachedProfile.email && session.email && cachedProfile.email.toLowerCase().trim() === session.email.toLowerCase().trim())
      )
    );

    return (
      <PublicProfileClient
        initialProfile={cachedProfile}
        session={session}
        isOwner={isOwner}
        initialIsEditing={Boolean(initialIsEditing && isOwner)}
      />
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F8FAFC] dark:bg-[#09090B] text-slate-900 dark:text-white font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 shadow-2xl p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/10 mx-auto flex items-center justify-center text-[#475569] dark:text-[#94A3B8]">
          <UserX className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Profile Not Found
          </h1>
          <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
            The profile &quot;{identifier}&quot; does not exist or has been moved.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-colors cursor-pointer shadow-md"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-900 dark:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
