import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProfileByIdOrSlug } from '@/lib/db';

interface ProfileIdentifierEditProps {
  params: Promise<{ identifier: string }>;
}

export default async function ProfileIdentifierEditPage({ params }: ProfileIdentifierEditProps) {
  const { identifier } = await params;
  const session = await getSession();

  // 1. Unauthenticated users hitting protected routes go to login with a valid returnUrl
  if (!session) {
    redirect(`/login?returnUrl=${encodeURIComponent(`/profile/${identifier}/edit`)}`);
  }

  const profile = await getProfileByIdOrSlug(identifier);
  if (!profile) {
    redirect(`/profile/${encodeURIComponent(identifier)}`);
  }

  // 2. Strict owner verification: Authenticated users who do not own the profile cannot access its editor
  const isOwner = Boolean(
    session.id && (
      (profile.userId && session.id === profile.userId) ||
      (profile.email && session.email && profile.email.toLowerCase().trim() === session.email.toLowerCase().trim())
    )
  );

  if (!isOwner) {
    // Non-owner is redirected to the read-only public profile view
    redirect(`/profile/${encodeURIComponent(identifier)}`);
  }

  // Authorized owner opens editor
  redirect(`/profile/${encodeURIComponent(identifier)}?edit=true`);
}
