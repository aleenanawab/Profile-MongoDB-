import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfileRootPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?returnUrl=/profile');
  }

  const { getProfileByUserId, getProfilesByUserId } = await import('@/lib/db');
  const { isUserOnboarded } = await import('@/lib/auth/userStatus');

  const profile = await getProfileByUserId(session.id, session.role as any);
  const profiles = profile ? [profile] : await getProfilesByUserId(session.id);
  const targetProfile = profile || profiles?.[0] || null;

  if (!targetProfile) {
    redirect('/onboarding/role');
  }

  const targetSlug = targetProfile.slug || targetProfile.id || session.id;
  const onboarded = isUserOnboarded(session, targetProfile);

  if (!onboarded) {
    redirect(`/profile/${encodeURIComponent(targetSlug)}?edit=true`);
  }

  redirect(`/profile/${encodeURIComponent(targetSlug)}`);
}
