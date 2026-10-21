import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Setup Your Avtive Profile | Onboarding',
  description: 'Sequential onboarding flow to set up your verified Avtive digital identity profile.'
};

export default async function OnboardingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login?returnUrl=/onboarding/role');
  }

  // If user already completed onboarding and has a saved profile, redirect to their profile VIEW page
  const { getProfileByUserId, getProfilesByUserId, getUserById } = await import('@/lib/db');
  const { hasRealSavedProfileData } = await import('@/lib/auth/userStatus');
  const [user, profile] = await Promise.all([
    getUserById(session.id),
    getProfileByUserId(session.id, session.role)
  ]);
  const profiles = profile ? [profile] : await getProfilesByUserId(session.id);
  const activeProfile = profile || (profiles && profiles.length > 0 ? profiles[0] : null);

  const hasProfile = Boolean(activeProfile && hasRealSavedProfileData(activeProfile));
  const isCompleted = Boolean(user?.onboardingCompleted && hasProfile);

  if (isCompleted && activeProfile) {
    const slug = activeProfile.slug || activeProfile.id;
    if (slug) {
      redirect(`/profile/${encodeURIComponent(slug)}`);
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-65px)] flex flex-col">
      {children}
    </div>
  );
}
