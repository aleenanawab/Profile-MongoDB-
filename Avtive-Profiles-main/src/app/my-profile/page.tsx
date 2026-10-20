import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MyProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?returnUrl=/my-profile');
  }

  const { getProfileByUserId, getProfilesByUserId } = await import('@/lib/db');
  const profile = await getProfileByUserId(session.id);
  const profiles = profile ? [profile] : await getProfilesByUserId(session.id);
  if (!profile && (!profiles || profiles.length === 0)) {
    redirect('/onboarding/role');
  }

  const targetSlug = profile?.slug || profile?.id || profiles?.[0]?.slug || profiles?.[0]?.id || session.id;
  redirect(`/profile/${targetSlug}`);
}
