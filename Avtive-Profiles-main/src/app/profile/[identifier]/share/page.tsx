import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProfileByIdOrSlug } from '@/lib/db';

interface SharePageProps {
  params: Promise<{ identifier: string }>;
}

/**
 * Backward-compatible redirect from legacy `/profile/[identifier]/share`
 * directly to the unified in-page sharing drawer on `/profile/[identifier]?share=true`.
 */
export default async function SharePage({ params }: SharePageProps) {
  const { identifier } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/login?returnUrl=/profile/${encodeURIComponent(identifier)}/share`);
  }

  const profile = await getProfileByIdOrSlug(identifier);
  if (!profile) {
    notFound();
  }

  const isOwner = Boolean(
    profile.userId && profile.userId === session.id
  );

  if (!isOwner) {
    redirect(`/profile/${encodeURIComponent(profile.slug || profile.id)}`);
  }

  redirect(`/profile/${encodeURIComponent(profile.slug || profile.id)}?share=true`);
}
