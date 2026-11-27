import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProfilesByUserId } from '@/lib/db';
import { ContactsPageClient } from '@/components/shell/ContactsPageClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Contacts | Avtive',
  description: 'Manage your network connections and shared recipients.'
};

export default async function ContactsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?returnUrl=/contacts');
  }

  const profiles = await getProfilesByUserId(session.id);
  return <ContactsPageClient profiles={profiles || []} user={session} />;
}
