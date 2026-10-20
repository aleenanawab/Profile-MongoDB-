import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  updateProfile, 
  getProfileByIdOrSlug, 
  getProfileByUserId, 
  setProfileResponseCookies,
  getCompanyByOwnerUserId,
  getCompanyBySlug,
  updateCompany,
  completeUserOnboarding
} from '@/lib/db';
import { ensureSupabaseAssetUrl } from '@/lib/supabase';
import { ProfileData } from '@/types/profile';

async function handleProfileUpdate(request: NextRequest) {
  try {
    // 1. Server-Side Guardrail: Extract caller's session on the server
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { 
          error: 'Unauthorized: You must be logged in to modify a profile.',
          authorized: false 
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const profileId = body.profileId || body.id || body.slug || body.profileSlug;
    const rawUpdatedData = body.updatedData || { ...body };
    if (!body.updatedData) {
      delete rawUpdatedData.profileId;
      delete rawUpdatedData.id;
    }
    const updatedData = { ...rawUpdatedData };

    const identifier = profileId || body.profileSlug || body.slug;
    if (!identifier && !updatedData) {
      return NextResponse.json(
        { error: 'Invalid request: profile identifier and updatedData are required.' },
        { status: 400 }
      );
    }

    // Process and auto-upload any base64 images to Supabase Storage
    if (updatedData.avatar) {
      updatedData.avatar = await ensureSupabaseAssetUrl(updatedData.avatar, 'avatars');
    }
    if (updatedData.coverImage) {
      updatedData.coverImage = await ensureSupabaseAssetUrl(updatedData.coverImage, 'profiles');
    }
    if (Array.isArray(updatedData.projects)) {
      const processedProjects = [...updatedData.projects];
      for (let i = 0; i < processedProjects.length; i++) {
        if (processedProjects[i] && processedProjects[i].image) {
          processedProjects[i].image = await ensureSupabaseAssetUrl(processedProjects[i].image, 'profiles');
        }
      }
      updatedData.projects = processedProjects;
    }

    // 2. Perform update with automatic upsert fallback for serverless persistence
    const effectiveSlug = body.profileSlug || body.slug || updatedData.slug;
    const result = await updateProfile(
      identifier || `prof-${Date.now()}`,
      {
        ...updatedData,
        ...(effectiveSlug ? { slug: effectiveSlug } : {})
      },
      session.id,
      session.email
    );

    if (!result.success || !result.profile) {
      return NextResponse.json(
        { error: result.error || 'Failed to update profile.' },
        { status: result.status || 500 }
      );
    }

    // Persist onboarding completed status upon successful profile save
    await completeUserOnboarding(session.id, result.profile.type, result.profile.theme);

    // If updating a team profile, keep CompanyRecord in sync
    if (result.profile.type === 'team') {
      try {
        const existingComp = 
          (await getCompanyByOwnerUserId(session.id)) || 
          (result.profile.slug ? await getCompanyBySlug(result.profile.slug) : null);

        if (existingComp) {
          await updateCompany(
            existingComp.id,
            {
              name: result.profile.name || existingComp.name,
              tagline: result.profile.tagline || result.profile.designation || existingComp.tagline,
              description: result.profile.about || result.profile.bio || existingComp.description,
              theme: result.profile.theme || existingComp.theme,
              logoUrl: result.profile.avatar || existingComp.logoUrl,
              coverUrl: result.profile.coverImage || existingComp.coverUrl,
              location: result.profile.location || existingComp.location,
              website: result.profile.website || existingComp.website,
              visibility: (result.profile.sectionVisibility as Record<string, boolean>) || existingComp.visibility
            },
            session.id
          );
        }
      } catch (syncErr) {
        console.error('Error synchronizing company record on profile update:', syncErr);
      }
    }

    const response = NextResponse.json({
      success: true,
      authorized: true,
      message: 'Profile updated successfully.',
      profile: result.profile,
      updatedProfile: result.profile
    }, { status: 200 });

    // 3. Set cookie for serverless cross-lambda persistence (chunked)
    setProfileResponseCookies(response, result.profile);

    return response;

  } catch (error) {
    console.error('Error updating profile in API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while saving profile.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleProfileUpdate(request);
}

export async function PUT(request: NextRequest) {
  return handleProfileUpdate(request);
}

export async function PATCH(request: NextRequest) {
  return handleProfileUpdate(request);
}
