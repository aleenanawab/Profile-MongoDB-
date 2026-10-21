import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getProfileByIdOrSlug, sanitizeProfileForPublic } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { PublicProfileClient } from './PublicProfileClient';
import { ProfileNotFoundFallback } from './ProfileNotFoundFallback';

interface PageProps {
  params: Promise<{ identifier: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { identifier } = await params;
    const profile = await getProfileByIdOrSlug(identifier);

    if (!profile) {
      return {
        title: 'Profile Not Found | Avtive',
        description: 'The requested digital identity profile could not be found.'
      };
    }

    return {
      title: `${profile.name} | Avtive Digital Profile`,
      description: profile.shortBio || `${profile.name} - ${profile.designation || 'Professional Profile'} on Avtive`,
      openGraph: {
        title: `${profile.name} | Avtive Digital Profile`,
        description: profile.shortBio || 'View verified digital card and identity pass.',
        images: profile.avatar ? [{ url: profile.avatar }] : []
      }
    };
  } catch (err) {
    return {
      title: 'Profile | Avtive Digital Identity',
      description: 'View verified digital card and identity pass.'
    };
  }
}

export default async function ProfilePage({ params, searchParams }: PageProps) {
  const { identifier } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isInitialEdit = resolvedSearchParams?.edit === 'true' || resolvedSearchParams?.edit === '1';

  let session: any = null;
  try {
    session = await getSession();
  } catch {}

  let profile: any = null;
  try {
    profile = await getProfileByIdOrSlug(identifier);
  } catch (err) {
    console.error(`[ProfilePage] Database lookup error for "${identifier}":`, err);
  }

  // 1. If Profile was not found on server or DB error, use ProfileNotFoundFallback
  if (!profile) {
    return (
      <ProfileNotFoundFallback 
        identifier={identifier} 
        session={session} 
        initialIsEditing={isInitialEdit}
      />
    );
  }

  // 2. Strict Owner Verification: Caller's session ID === targetProfile.userId
  const isOwner = Boolean(
    session?.id && (
      (profile.userId && session.id === profile.userId) ||
      (profile.email && session.email && profile.email.toLowerCase().trim() === session.email.toLowerCase().trim())
    )
  );

  // 3. ZERO TOLERANCE SERVER-SIDE FILTERING:
  // If caller is NOT the owner, sanitize the profile data server-side
  // so hidden contact info, experience, etc. are strictly omitted before sending to client
  const servedProfile = sanitizeProfileForPublic(profile, isOwner);

  // 4. Fetch all user profiles for the switcher if owner
  const { getProfilesByUserId } = await import('@/lib/db');
  const { isUserOnboarded } = await import('@/lib/auth/userStatus');
  const userProfiles = (isOwner && session?.id) ? await getProfilesByUserId(session.id) : [];

  const onboarded = isUserOnboarded(session, profile);
  const shouldOpenInEdit = Boolean(isOwner && isInitialEdit);

  return (
    <PublicProfileClient
      initialProfile={servedProfile}
      session={session}
      isOwner={isOwner}
      initialIsEditing={shouldOpenInEdit}
      userProfiles={userProfiles}
    />
  );
}
