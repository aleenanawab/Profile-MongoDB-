import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getUserRoutingDestination } from '@/lib/auth/userStatus';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const session = await getSession();
  const destination = await getUserRoutingDestination(session);
  redirect(destination);
}


