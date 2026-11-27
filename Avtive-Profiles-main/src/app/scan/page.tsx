import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProfilesByUserId } from '@/lib/db';
import { ScanPageClient } from '@/components/shell/ScanPageClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Scan & QR | Avtive',
  description: 'Share your live QR card or open another Avtive profile.'
};

export default async function ScanPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?returnUrl=/scan');
  }

  const profiles = await getProfilesByUserId(session.id);
  return <ScanPageClient profiles={profiles || []} user={session} />;
}
