import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProfilesByUserId } from '@/lib/db';
import { SettingsPageClient } from '@/components/shell/SettingsPageClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Settings | Avtive',
  description: 'Configure profile visibility, connection permissions, and card appearance.'
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?returnUrl=/settings');
  }

  const profiles = await getProfilesByUserId(session.id);
  return <SettingsPageClient profiles={profiles || []} user={session} />;
}
