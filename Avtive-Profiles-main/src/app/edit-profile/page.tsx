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

    let targetProfile = null;
    if (id) {
      try {
        targetProfile = await getProfileByIdOrSlug(id);
      } catch {}
    }

    // Fallback to user's first profile if no id specified or not found
    if (!targetProfile || targetProfile.userId !== session.id) {
      try {
        const userProfiles = await getProfilesByUserId(session.id);
        if (userProfiles.length > 0) {
          targetProfile = userProfiles[0];
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
          await completeUserOnboarding(
            session.id,
            targetProfile.type,
            targetProfile.theme
          );
        } else {
          const selectedRole = normalizeProfileType(role || 'individual');
          const selectedTheme = (theme && theme !== 'default' ? theme : 'editorial') as ProfileTheme;
          targetProfile = await createProfileForUser(session.id, {
            name: session.name,
            email: session.email,
            profileName: selectedRole === 'team' ? 'Company Profile' : 'Primary Profile',
            designation: 'Professional',
            type: selectedRole,
            theme: selectedTheme
          });
          await completeUserOnboarding(session.id, selectedRole, selectedTheme);
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
