import React, { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProfileByIdOrSlug } from '@/lib/db';
import { ShareFlowClient } from './ShareFlowClient';
import type { Metadata } from 'next';

interface SharePageProps {
  params: Promise<{ identifier: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { identifier } = await params;
  const profile = await getProfileByIdOrSlug(identifier);
  return {
    title: `Share ${profile?.profileName || profile?.name || 'Profile'} | Avtive`,
    description: 'Configure visibility and share your professional digital profile.'
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { identifier } = await params;
  const session = await getSession();

  // Must be authenticated to access owner sharing & privacy settings
  if (!session) {
    redirect(`/login?returnUrl=/profile/${encodeURIComponent(identifier)}/share`);
  }

  const profile = await getProfileByIdOrSlug(identifier);
  if (!profile) {
    notFound();
  }

  // Strict ownership verification: only owner can configure sharing & ordering
  if (!profile.userId || profile.userId !== session.id) {
    redirect(`/profile/${profile.slug || profile.id}`);
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#FAFAF9] dark:bg-[#09090B] text-slate-900 dark:text-white transition-colors font-sans">
      <Suspense fallback={<div className="p-8 text-center text-sm font-semibold">Loading share setup...</div>}>
        <ShareFlowClient initialProfile={profile} />
      </Suspense>
    </main>
  );
}
