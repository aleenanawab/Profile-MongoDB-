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

  // If user already completed onboarding or has an existing profile, redirect so setup is never shown again
  const { getProfileByUserId, getProfilesByUserId, getUserById } = await import('@/lib/db');
  const [user, profile] = await Promise.all([
    getUserById(session.id),
    getProfileByUserId(session.id)
  ]);
  const profiles = profile ? [profile] : await getProfilesByUserId(session.id);
  const activeProfile = profile || (profiles && profiles.length > 0 ? profiles[0] : null);

  if (user?.onboardingCompleted || activeProfile) {
    if (activeProfile?.slug) {
      redirect(`/profile/${encodeURIComponent(activeProfile.slug)}`);
    } else {
      redirect('/dashboard');
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-65px)] flex flex-col">
      {children}
    </div>
  );
}
