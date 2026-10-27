import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { 
  updateProfile, 
  getProfileByIdOrSlug, 
  getProfileByUserId, 
  setProfileResponseCookies,
  getCompanyByOwnerUserId,
  getCompanyBySlug,
  updateCompany,
  completeUserOnboarding,
  createProfileForUser
} from '@/lib/db';
import { ensureCloudinaryAssetUrl } from '@/lib/storage';
import { getCanonicalSectionOrder } from '@/lib/sections';
import { FIELD_CLASSIFICATIONS } from '@/lib/profileDiff';

const IMMUTABLE_FIELDS = new Set(['_id', 'userId', 'createdAt', 'role']);
const VALID_TOP_KEYS = new Set([
  ...Object.keys(FIELD_CLASSIFICATIONS),
  'id',
  'updatedAt'
]);

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
    const clearFields: string[] = Array.isArray(body.clearFields) ? [...body.clearFields] : [];

    let rawData: Record<string, any>;
    const isPatch = Boolean(body.patch);
    if (isPatch && body.patch && typeof body.patch === 'object') {
      rawData = { ...body.patch };
    } else if (body.updatedData && typeof body.updatedData === 'object') {
      rawData = { ...body.updatedData };
    } else {
      rawData = { ...body };
      delete rawData.profileId;
      delete rawData.id;
      delete rawData.profileSlug;
      delete rawData.clearFields;
      delete rawData.patch;
      delete rawData.updatedData;
    }

    // 2. Strip immutable server fields so payloads containing existing profile fields are safely accepted
    for (const imm of IMMUTABLE_FIELDS) {
      delete rawData[imm];
    }
    delete rawData.id;
    delete rawData.__v;

    // Auto-detect cleared fields for intentional user clear operations
    for (const [k, v] of Object.entries(rawData)) {
      if (v === '' || (Array.isArray(v) && v.length === 0)) {
        if (!clearFields.includes(k)) {
          clearFields.push(k);
        }
      }
    }

    const attemptedKeys = Object.keys(rawData);
    const unknown = attemptedKeys.filter((k) => {
      const topKey = k.split('.')[0];
      return !VALID_TOP_KEYS.has(topKey);
    });
    if (unknown.length > 0) {
      return NextResponse.json(
        { error: `Invalid profile field(s): ${unknown.join(', ')}` },
        { status: 400 }
      );
    }

    let identifier = profileId || body.profileSlug || body.slug;
    if (!identifier) {
      let userProfile = await getProfileByUserId(session.id);
      if (!userProfile) {
        userProfile = await createProfileForUser(session.id, {
          name: rawData.name || session.name || 'User Profile',
          email: session.email,
          type: rawData.type || 'individual',
          theme: rawData.theme || 'editorial'
        });
      }
      identifier = userProfile?.id;
    }

    if (!identifier && Object.keys(rawData).length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: profile identifier and update data are required.' },
        { status: 400 }
      );
    }

    // Never erase existing saved images with an empty/null or local blob: URL value on unrelated saves
    if (
      rawData.avatar === '' ||
      rawData.avatar === null ||
      (typeof rawData.avatar === 'string' && rawData.avatar.startsWith('blob:'))
    ) {
      if (!clearFields.includes('avatar')) {
        delete rawData.avatar;
      }
    }
    if (
      rawData.coverImage === '' ||
      rawData.coverImage === null ||
      (typeof rawData.coverImage === 'string' && rawData.coverImage.startsWith('blob:'))
    ) {
      if (!clearFields.includes('coverImage')) {
        delete rawData.coverImage;
      }
    }

    // Process and auto-upload any base64 images to Cloudinary
    if (rawData.avatar && typeof rawData.avatar === 'string' && rawData.avatar.startsWith('data:')) {
      rawData.avatar = await ensureCloudinaryAssetUrl(rawData.avatar, 'avatars');
    }
    if (rawData.coverImage && typeof rawData.coverImage === 'string' && rawData.coverImage.startsWith('data:')) {
      rawData.coverImage = await ensureCloudinaryAssetUrl(rawData.coverImage, 'profiles');
    }
    if (Array.isArray(rawData.projects)) {
      const processedProjects = [...rawData.projects];
      for (let i = 0; i < processedProjects.length; i++) {
        if (
          processedProjects[i] &&
          processedProjects[i].image &&
          typeof processedProjects[i].image === 'string' &&
          processedProjects[i].image.startsWith('data:')
        ) {
          processedProjects[i].image = await ensureCloudinaryAssetUrl(
            processedProjects[i].image,
            'profiles'
          );
        }
      }
      rawData.projects = processedProjects;
    }

    // Deduplicate dynamicSections by key/id
    if (Array.isArray(rawData.dynamicSections)) {
      const seenSectionKeys = new Set<string>();
      rawData.dynamicSections = rawData.dynamicSections.filter((section: any) => {
        const key = section?.key || section?.id;
        if (!key || seenSectionKeys.has(key)) return false;
        seenSectionKeys.add(key);
        return true;
      });
    }

    // Canonicalize and deduplicate sectionOrder entries
    if (Array.isArray(rawData.sectionOrder)) {
      rawData.sectionOrder = getCanonicalSectionOrder(
        rawData.sectionOrder,
        rawData.type || session.role
      );
    }

    // 3. Perform update with automatic upsert fallback for serverless persistence
    const effectiveSlug = body.profileSlug || body.slug || rawData.slug;
    const result = await updateProfile(
      identifier || `prof-${Date.now()}`,
      {
        ...rawData,
        ...(effectiveSlug ? { slug: effectiveSlug } : {})
      },
      session.id,
      session.email,
      { clearFields, isPatch }
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

    // Revalidate public profile paths so ISR/CDN caches never serve stale data
    try {
      if (result.profile.slug) {
        revalidatePath(`/profile/${result.profile.slug}`);
      }
      if (result.profile.id && result.profile.id !== result.profile.slug) {
        revalidatePath(`/profile/${result.profile.id}`);
      }
    } catch (revalidateErr) {
      console.warn('Profile cache revalidation notice:', revalidateErr);
    }

    const response = NextResponse.json({
      success: true,
      authorized: true,
      message: 'Profile updated successfully.',
      profile: result.profile,
      updatedProfile: result.profile,
      appliedKeys: result.appliedKeys || []
    }, { status: 200 });

    // 4. Set cookie for serverless cross-lambda persistence (chunked)
    setProfileResponseCookies(response, result.profile);

    // 5. Update session cookie so onboardingCompleted is immediately true
    try {
      const { setSessionCookie } = await import('@/lib/auth');
      await setSessionCookie(
        {
          ...session,
          onboardingCompleted: true,
          role: result.profile.type || session.role,
          preferredTheme: result.profile.theme || session.preferredTheme
        },
        response
      );
    } catch {}

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
