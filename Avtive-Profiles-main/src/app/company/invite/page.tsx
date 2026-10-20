import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { InviteAcceptClient } from './InviteAcceptClient';

export const metadata: Metadata = {
  title: 'Accept Company Invitation | Avtive',
  description: 'Join your organization digital identity pass on Avtive.'
};

interface InvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function CompanyInvitePage({ searchParams }: InvitePageProps) {
  const { token } = await searchParams;
  const session = await getSession();

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading invitation...</div>}>
      <InviteAcceptClient initialToken={token || ''} session={session} />
    </Suspense>
  );
}
