import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { CreateProfileClient } from './CreateProfileClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Create Your Profile | Avtive',
  description: 'Create your digital identity profile and pass card on Avtive.'
};

export default async function CreateProfilePage() {
  const session = await getSession();

  // If not authenticated, redirect to Login
  if (!session) {
    redirect('/login?returnUrl=/create-profile');
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#FAFAF9] dark:bg-[#09090B] text-slate-900 dark:text-white transition-colors font-sans">
      <Suspense fallback={<div className="p-8 text-center text-sm font-semibold">Loading profile setup...</div>}>
        <CreateProfileClient user={session} />
      </Suspense>
    </main>
  );
}
