import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { 
  getProfileByIdOrSlug, 
  getProfilesByUserId, 
  createProfileForUser, 
  updateProfile,
  getCompanyByOwnerUserId,
  createCompany,
  completeUserOnboarding 
} from '@/lib/db';
import { normalizeProfileType, ProfileTheme } from '@/types/profile';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Edit Profile | Avtive',
  description: 'Update your professional digital profile and identity on Avtive.'
};

interface EditProfilePageProps {
  searchParams: Promise<{ id?: string; role?: string; theme?: string; edit?: string }>;
}

export default async function EditProfilePage({ searchParams }: EditProfilePageProps) {
  try {
    const session = await getSession();
    if (!session) {
      redirect('/login?returnUrl=/edit-profile');
    }

    const { id, role, theme, edit } = await searchParams;

    const { getUserById } = await import('@/lib/db');
    const dbUser = await getUserById(session.id);
    const userRole = role || dbUser?.role || session.role;
    const userTheme = theme || dbUser?.preferredTheme || session.preferredTheme;

    // Direct access guards: if role or theme missing, redirect to proper step
    if (!userRole) {
      redirect('/onboarding/role');
    }
    if (!userTheme) {
      redirect(`/onboarding/theme?role=${encodeURIComponent(userRole)}`);
    }

    let targetProfile = null;
    if (id) {
      try {
        targetProfile = await getProfileByIdOrSlug(id);
      } catch {}
    }

    // Fallback to user's profiles matching userRole or first profile
    if (!targetProfile || targetProfile.userId !== session.id) {
      try {
        const userProfiles = await getProfilesByUserId(session.id);
        const matchingProfile = userProfiles.find(p => p.type === normalizeProfileType(userRole)) || userProfiles[0];
        if (matchingProfile) {
          targetProfile = matchingProfile;
          if (role || theme) {
            const updateRes = await updateProfile(
              targetProfile.id,
              {
                ...(role ? { type: normalizeProfileType(role) } : {}),
                ...(theme ? { theme: theme as ProfileTheme } : {})
              },
              session.id,
              session.email
            );
            if (updateRes.profile) {
              targetProfile = updateRes.profile;
            }
          }
        } else {
          // Brand new user: create initial empty profile for existing builder without marking complete prematurely
          targetProfile = await createProfileForUser(session.id, {
            name: session.name || '',
            email: session.email || '',
            type: normalizeProfileType(userRole),
            theme: (userTheme as ProfileTheme) || 'editorial'
          });
        }
      } catch (profErr) {
        console.error('Error in profile lookup/creation in edit-profile:', profErr);
      }
    }

    // If profile type is 'team', ensure CompanyRecord and Owner membership exist
    if (targetProfile && targetProfile.type === 'team') {
      try {
        const existingComp = await getCompanyByOwnerUserId(session.id);
        if (!existingComp) {
          await createCompany(session.id, {
            name: targetProfile.name || session.name,
            slug: targetProfile.slug,
            theme: targetProfile.theme,
            tagline: targetProfile.tagline || '',
            description: targetProfile.bio || targetProfile.about || '',
            location: targetProfile.location || '',
            logoUrl: targetProfile.avatar || '',
            coverUrl: targetProfile.coverImage || ''
          });
        }
      } catch (compErr) {
        console.error('Error auto-creating company in edit-profile:', compErr);
      }
    }

    const targetSlug = targetProfile?.slug || targetProfile?.id;
    if (targetSlug) {
      const editSuffix = edit !== 'false' ? '?edit=true' : '';
      redirect(`/profile/${encodeURIComponent(targetSlug)}${editSuffix}`);
    } else {
      redirect('/dashboard');
    }
  } catch (error: any) {
    // Next.js redirect() throws an internal NEXT_REDIRECT error which must be rethrown
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Unhandled server exception in EditProfilePage:', error);
    redirect('/dashboard');
  }
}
