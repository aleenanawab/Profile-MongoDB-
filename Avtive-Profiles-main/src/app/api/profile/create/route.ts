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
    const profileName = (body.profileName || body.designation || 'Professional Profile').trim();
    const name = (body.name || session.name || 'Professional').trim();
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
    if (skills.length === 0) {
      skills = ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'];
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

    const newProfile = await createProfileForUser(session.id, {
      name,
      firstName: body.firstName || name.split(' ')[0] || '',
      secondName: body.secondName || body.lastName || name.split(' ').slice(1).join(' ') || '',
      lastName: body.lastName || body.secondName || name.split(' ').slice(1).join(' ') || '',
      type: normalizeProfileType(body.type || 'individual'),
      profileName,
      profession: body.profession?.trim() || body.professionalTitle?.trim() || body.designation?.trim() || 'Professional',
      professionalTitle: body.professionalTitle?.trim() || body.designation?.trim() || body.profession?.trim() || 'Professional',
      email,
      designation: body.designation?.trim() || body.professionalTitle?.trim() || body.profession?.trim() || 'Professional',
      company: body.company?.trim() || 'Avtive Network',
      location: body.location?.trim() || 'Global',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
      coverImage: coverImage,
      phone: body.phone?.trim() || '',
      whatsapp: body.whatsapp?.trim() || body.phone?.trim() || '',
      bio: body.bio?.trim() || body.shortBio?.trim() || 'Welcome to my digital profile on Avtive.',
      about: body.about?.trim() || body.fullBio?.trim() || 'Passionate professional delivering intuitive digital experiences with modern technology and clean architecture.',
      shortBio: body.shortBio?.trim() || body.bio?.trim() || 'Welcome to my digital profile on Avtive.',
      fullBio: body.fullBio?.trim() || body.about?.trim() || 'Connect with me directly via phone, WhatsApp, or email.',
      tagline: body.tagline?.trim() || '',
      theme: body.theme || 'editorial',
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
    });

    if (newProfile.type === 'team') {
      try {
        const existingComp = await getCompanyByOwnerUserId(session.id);
        if (!existingComp) {
          await createCompany(session.id, {
            name: newProfile.name || body.company || `${session.name}'s Company`,
            slug: newProfile.slug,
            theme: newProfile.theme,
            tagline: newProfile.tagline || newProfile.designation || '',
            description: newProfile.about || newProfile.bio || '',
            location: newProfile.location || '',
            website: body.website || '',
            logoUrl: newProfile.avatar || '',
            coverUrl: newProfile.coverImage || ''
          });
        }
      } catch (compErr) {
        console.error('Error auto-creating company entity for team profile:', compErr);
      }
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Profile created successfully.',
        profile: newProfile
      },
      { status: 201 }
    );

    setProfileResponseCookies(response, newProfile);
    return response;

  } catch (error) {
    console.error('Create Profile API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating profile.' },
      { status: 500 }
    );
  }
}
