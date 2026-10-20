import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProfileByIdOrSlug, getProfilesByUserId, createProfileForUser } from '@/lib/db';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Edit Profile | Avtive',
  description: 'Update your verified professional profile on Avtive.'
};

interface EditProfilePageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ProfileEditPage({ searchParams }: EditProfilePageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/login?returnUrl=/profile/edit');
  }

  const { id } = await searchParams;

  let targetProfile = null;
  if (id) {
    targetProfile = await getProfileByIdOrSlug(id);
  }

  // Fallback to user's first profile if not found or unauthorized
  if (!targetProfile || targetProfile.userId !== session.id) {
    const userProfiles = await getProfilesByUserId(session.id);
    if (userProfiles.length > 0) {
      targetProfile = userProfiles[0];
    } else if (targetProfile) {
      targetProfile.userId = session.id;
    } else {
      targetProfile = await createProfileForUser(session.id, {
        name: session.name,
        email: session.email,
        profileName: 'Primary Profile',
        designation: 'Professional',
        type: 'individual'
      });
    }
  }

  const targetSlug = targetProfile.slug || targetProfile.id;
  redirect(`/profile/${encodeURIComponent(targetSlug)}?edit=true`);
}
