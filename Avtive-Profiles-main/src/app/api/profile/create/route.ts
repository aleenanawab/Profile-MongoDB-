import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  getProfileByUserId, 
  createProfileForUser, 
  setProfileResponseCookies,
  getCompanyByOwnerUserId,
  createCompany
} from '@/lib/db';
import { ensureCloudinaryAssetUrl } from '@/lib/storage';
import { normalizeProfileType } from '@/types/profile';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to create a profile.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const profileName = (body.profileName || body.designation || '').trim();
    const name = (body.name || session.name || '').trim();
    const email = (body.email || session.email || '').trim();

    // Auto-upload base64 images to Cloudinary
    const avatar = await ensureCloudinaryAssetUrl(body.avatar || session.avatar, 'avatars');
    const coverImage = await ensureCloudinaryAssetUrl(body.coverImage, 'profiles');

    // Process projects images
    const projects = Array.isArray(body.projects) ? [...body.projects] : [];
    for (let i = 0; i < projects.length; i++) {
      if (projects[i] && projects[i].image) {
        projects[i].image = await ensureCloudinaryAssetUrl(projects[i].image, 'profiles');
      }
    }

    // Parse skills if string or array
    let skills: string[] = [];
    if (Array.isArray(body.skills)) {
      skills = body.skills.map((s: any) => String(s).trim()).filter(Boolean);
    } else if (typeof body.skills === 'string') {
      skills = body.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    // Build socials / website links
    const socials = Array.isArray(body.socials) ? [...body.socials] : [];
    if (body.website && !socials.some((s: any) => s.platform === 'website')) {
      socials.push({
        platform: 'website',
        url: body.website.startsWith('http') ? body.website : `https://${body.website}`,
        label: 'Website'
      });
    }

    const targetType = normalizeProfileType(body.type || session.role || 'individual');
    const targetTheme = (body.theme || session.preferredTheme || 'editorial') as import('@/types/profile').ProfileTheme;

    const profileData = {
      name,
      firstName: body.firstName || name.split(' ')[0] || '',
      secondName: body.secondName || body.lastName || name.split(' ').slice(1).join(' ') || '',
      lastName: body.lastName || body.secondName || name.split(' ').slice(1).join(' ') || '',
      type: targetType,
      profileName,
      profession: body.profession?.trim() || body.professionalTitle?.trim() || body.designation?.trim() || '',
      professionalTitle: body.professionalTitle?.trim() || body.designation?.trim() || body.profession?.trim() || '',
      email,
      designation: body.designation?.trim() || body.professionalTitle?.trim() || body.profession?.trim() || '',
      company: body.company?.trim() || '',
      location: body.location?.trim() || '',
      avatar: avatar || '',
      coverImage: coverImage,
      phone: body.phone?.trim() || '',
      whatsapp: body.whatsapp?.trim() || body.phone?.trim() || '',
      bio: body.bio?.trim() || body.shortBio?.trim() || '',
      about: body.about?.trim() || body.fullBio?.trim() || '',
      shortBio: body.shortBio?.trim() || body.bio?.trim() || '',
      fullBio: body.fullBio?.trim() || body.about?.trim() || '',
      tagline: body.tagline?.trim() || '',
      theme: targetTheme,
      skills,
      experience: body.experience || body.experiences || [],
      experiences: body.experiences || body.experience || [],
      education: body.education || [],
      projects: body.projects || [],
      services: body.services || [],
      certifications: body.certifications || [],
      socials,
      socialLinks: socials.map((s: any) => ({ platform: s.platform, url: s.url, label: s.label || s.platform })),
      sharingSettings: body.sharingSettings,
      sectionOrder: body.sectionOrder,
      sectionVisibility: body.sectionVisibility,
      username: body.username,
      customFields: body.customFields || [],
      dynamicSections: body.dynamicSections || []
    };

    // Find-first check to prevent duplicates: Keep individual and company (team) profiles separate
    const { updateProfile, completeUserOnboarding } = await import('@/lib/db');
    let targetProfile = await getProfileByUserId(session.id, targetType);
    if (targetProfile) {
      const updateResult = await updateProfile(
        targetProfile.id,
        profileData,
        session.id,
        session.email
      );
      if (updateResult.profile) {
        targetProfile = updateResult.profile;
      }
    } else {
      targetProfile = await createProfileForUser(session.id, profileData);
    }

    if (targetProfile.type === 'team') {
      try {
        const existingComp = await getCompanyByOwnerUserId(session.id);
        if (!existingComp) {
          await createCompany(session.id, {
            name: targetProfile.name || body.company || `${session.name}'s Company`,
            slug: targetProfile.slug,
            theme: targetProfile.theme,
            tagline: targetProfile.tagline || targetProfile.designation || '',
            description: targetProfile.about || targetProfile.bio || '',
            location: targetProfile.location || '',
            website: body.website || '',
            logoUrl: targetProfile.avatar || '',
            coverUrl: targetProfile.coverImage || ''
          });
        }
      } catch (compErr) {
        console.error('Error auto-creating company entity for team profile:', compErr);
      }
    }

    // Complete onboarding for user
    await completeUserOnboarding(session.id, targetType, targetTheme);

    const { setSessionCookie } = await import('@/lib/auth');
    const updatedSession: import('@/types/profile').UserSession = {
      id: session.id,
      name: session.name,
      email: session.email,
      onboardingCompleted: true,
      role: targetType,
      preferredTheme: targetTheme
    };

    const response = NextResponse.json(
      {
        success: true,
        message: 'Profile created successfully.',
        profile: targetProfile,
        user: updatedSession
      },
      { status: 201 }
    );

    await setSessionCookie(updatedSession, response);
    setProfileResponseCookies(response, targetProfile);
    return response;

  } catch (error) {
    console.error('Create Profile API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating profile.' },
      { status: 500 }
    );
  }
}
