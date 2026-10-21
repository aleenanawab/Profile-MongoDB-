import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfileRootPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?returnUrl=/profile');
  }

  const { getUserRoutingDestination } = await import('@/lib/auth/userStatus');
  const destination = await getUserRoutingDestination(session);
  redirect(destination);
}
