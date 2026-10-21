import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import RegisterClient from './RegisterClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Register | Avtive',
  description: 'Create your digital identity profile on Avtive.'
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session && session.id) {
    const { getUserRoutingDestination } = await import('@/lib/auth/userStatus');
    const destination = await getUserRoutingDestination(session);
    if (destination && destination !== '/login') {
      redirect(destination);
    }
  }
  return <RegisterClient />;
}
