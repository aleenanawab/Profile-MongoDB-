import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProfilesByUserId } from '@/lib/db';
import { EventsPageClient } from '@/components/shell/EventsPageClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Events | Avtive',
  description: 'Review event-tagged shares and follow-up engagement.'
};

export default async function EventsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?returnUrl=/events');
  }

  const profiles = await getProfilesByUserId(session.id);
  return <EventsPageClient profiles={profiles || []} user={session} />;
}
