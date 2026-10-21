import crypto from 'crypto';
import {
  ProfileData,
  ProfileType,
  ProfileTheme,
  DEFAULT_SHARING_SETTINGS,
  DEFAULT_SECTION_VISIBILITY,
  DEFAULT_SECTION_ORDER,
  normalizeProfileType
} from '@/types/profile';
import { getMongoDb, COLLECTIONS } from './client';
import { lazyEnsureIndexes } from './indexes';
import { slugify } from '../validation';

export function mapDocToProfileData(doc: any): ProfileData {
  const id = String(doc._id || doc.id);
  const slug = String(doc.slug || id);

  return {
    ...doc,
    id,
    _id: id,
    slug,
    userId: String(doc.userId || ''),
    name: doc.name || 'Professional',
    email: doc.email || '',
    designation: doc.designation || 'Professional',
    company: doc.company || '',
    location: doc.location || '',
    avatar: doc.avatar || doc.logoUrl || '',
    coverImage: doc.coverImage || doc.coverUrl || undefined,
    shortBio: doc.shortBio || doc.bio || '',
    fullBio: doc.fullBio || doc.about || '',
    bio: doc.bio || doc.shortBio || '',
    about: doc.about || doc.fullBio || '',
    tagline: doc.tagline || '',
    type: normalizeProfileType(doc.type),
    theme: doc.theme || 'editorial',
    skills: Array.isArray(doc.skills) ? doc.skills : [],
    socials: Array.isArray(doc.socials) ? doc.socials : [],
    services: Array.isArray(doc.services) ? doc.services : [],
    projects: Array.isArray(doc.projects) ? doc.projects : [],
    experiences: Array.isArray(doc.experiences) ? doc.experiences : (Array.isArray(doc.experience) ? doc.experience : []),
    education: Array.isArray(doc.education) ? doc.education : [],
    certifications: Array.isArray(doc.certifications) ? doc.certifications : [],
    recommendations: Array.isArray(doc.recommendations) ? doc.recommendations : [],
    languages: Array.isArray(doc.languages) ? doc.languages : [],
    customFields: Array.isArray(doc.customFields) ? doc.customFields : [],
    sharingSettings: doc.sharingSettings || { ...DEFAULT_SHARING_SETTINGS },
    sectionVisibility: doc.sectionVisibility || { ...DEFAULT_SECTION_VISIBILITY },
    sectionOrder: doc.sectionOrder || [...DEFAULT_SECTION_ORDER],
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : (doc.createdAt || new Date().toISOString()),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : (doc.updatedAt || new Date().toISOString())
  };
}

export function mapSupabaseProfileToProfileData(
  item: any,
  fallbackUserId?: string,
  fallbackRole?: ProfileType
): ProfileData {
  return mapDocToProfileData({
    ...item,
    userId: item.user_id || fallbackUserId,
    coverImage: item.cover_image || item.coverImage,
    shortBio: item.short_bio || item.shortBio,
    fullBio: item.full_bio || item.fullBio,
    type: item.type || fallbackRole || 'individual'
  });
}

export function setProfileResponseCookies(response: any, profile: ProfileData): void {
  // Safe helper kept for API response compatibility
  if (response && response.cookies && typeof response.cookies.set === 'function') {
    try {
      response.cookies.set('avtive_last_profile', profile.slug || profile.id, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      });
    } catch {}
  }
}

export function sanitizeProfileForPublic(profile: ProfileData, isOwner: boolean = false): ProfileData {
  if (isOwner) {
    return profile;
  }

  const settings = profile.sharingSettings || DEFAULT_SHARING_SETTINGS;
  const visibility = profile.sectionVisibility || DEFAULT_SECTION_VISIBILITY;
  const sanitized: ProfileData = { ...profile };

  if (settings.photo === false || visibility['photo'] === false) {
    sanitized.avatar = '';
    sanitized.coverImage = undefined;
  }

  if (settings.nameAndTitle === false) {
    sanitized.name = 'Professional';
    sanitized.designation = '';
    sanitized.tagline = '';
  }

  if (settings.bio === false || visibility['about'] === false) {
    sanitized.bio = '';
    sanitized.about = '';
    sanitized.shortBio = '';
    sanitized.fullBio = '';
  }

  if (settings.contactInfo === false || settings.phone === false || visibility['contact'] === false) {
    sanitized.phone = '';
    sanitized.whatsapp = '';
  }

  if (settings.contactInfo === false || settings.email === false || visibility['contact'] === false) {
    sanitized.email = '';
  }

  if (settings.socialLinks === false || visibility['social-links'] === false || visibility['socialLinks'] === false) {
    sanitized.socials = [];
    sanitized.socialLinks = [];
  } else {
    if (Array.isArray(sanitized.socialLinks)) {
      sanitized.socialLinks = sanitized.socialLinks.filter((s: any) => s && s.visible !== false);
    }
    if (Array.isArray(sanitized.socials)) {
      sanitized.socials = sanitized.socials.filter((s: any) => s && s.visible !== false);
    }
  }

  if (settings.skills === false || visibility['skills'] === false) sanitized.skills = [];
  if (settings.experience === false || visibility['experience'] === false) {
    sanitized.experiences = [];
    sanitized.experience = [];
  }
  if (settings.education === false || visibility['education'] === false) sanitized.education = [];
  if (settings.certifications === false || visibility['certifications'] === false) sanitized.certifications = [];
  if (settings.projects === false || visibility['projects'] === false) sanitized.projects = [];
  if (settings.services === false || visibility['services'] === false) sanitized.services = [];
  if (settings.recommendations === false || visibility['recommendations'] === false) {
    sanitized.recommendations = [];
    sanitized.testimonials = [];
  }
  if (settings.languages === false || visibility['languages'] === false) sanitized.languages = [];
  if (settings.companySection === false || visibility['company'] === false) {
    sanitized.companyInfo = undefined;
    sanitized.teamMembers = [];
  }
  if (settings.nfcCard === false || visibility['virtual-card'] === false) sanitized.nfcCard = undefined;

  if (visibility['custom-fields'] === false) {
    sanitized.customFields = [];
  } else if (Array.isArray(sanitized.customFields)) {
    sanitized.customFields = sanitized.customFields.filter((f) => f && f.visible !== false);
  }

  sanitized.username = profile.username || profile.slug;
  sanitized.sectionOrder = profile.sectionOrder || DEFAULT_SECTION_ORDER;
  sanitized.sectionVisibility = visibility;

  return sanitized;
}

export async function createProfileForUser(
  userId: string,
  data: Partial<ProfileData>
): Promise<ProfileData> {
  if (!userId) {
    throw new Error('User ID is required to create a profile.');
  }

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const profilesCol = db.collection(COLLECTIONS.PROFILES);

  const profileId = data.id || `prof-${crypto.randomUUID()}`;
  let baseSlug = data.slug || (data.name ? slugify(data.name) : 'profile');
  if (!baseSlug || baseSlug === 'profile') {
    baseSlug = `profile-${Math.random().toString(36).substring(2, 6)}`;
  }

  // Ensure unique slug
  let candidateSlug = baseSlug;
  let counter = 1;
  while (await profilesCol.findOne({ slug: candidateSlug })) {
    candidateSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const now = new Date().toISOString();
  const newProfileDoc: any = {
    ...data,
    _id: profileId,
    id: profileId,
    userId,
    slug: candidateSlug,
    name: data.name?.trim() || 'Professional',
    email: data.email?.toLowerCase().trim() || '',
    designation: data.designation?.trim() || 'Professional',
    company: data.company?.trim() || 'Avtive Network',
    location: data.location?.trim() || 'Global',
    avatar: data.avatar || '',
    coverImage: data.coverImage || undefined,
    shortBio: data.shortBio?.trim() || data.bio?.trim() || 'Welcome to my digital profile on Avtive.',
    fullBio: data.fullBio?.trim() || data.about?.trim() || 'Connect with me directly via phone, WhatsApp, or email.',
    type: normalizeProfileType(data.type),
    theme: data.theme || 'editorial',
    skills: data.skills || [],
    socials: data.socials || [],
    services: data.services || [],
    projects: data.projects || [],
    experiences: data.experiences || data.experience || [],
    education: data.education || [],
    certifications: data.certifications || [],
    recommendations: data.recommendations || [],
    languages: data.languages || [],
    customFields: data.customFields || [],
    sharingSettings: data.sharingSettings || { ...DEFAULT_SHARING_SETTINGS },
    sectionVisibility: data.sectionVisibility || { ...DEFAULT_SECTION_VISIBILITY },
    sectionOrder: data.sectionOrder || [...DEFAULT_SECTION_ORDER],
    createdAt: now,
    updatedAt: now
  };

  await profilesCol.insertOne(newProfileDoc);
  return mapDocToProfileData(newProfileDoc);
}

export async function getProfileByIdOrSlug(idOrSlug: string): Promise<ProfileData | null> {
  if (!idOrSlug || typeof idOrSlug !== 'string') return null;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const doc = await db.collection(COLLECTIONS.PROFILES).findOne({
    $or: [
      { _id: idOrSlug as any },
      { id: idOrSlug },
      { slug: idOrSlug }
    ]
  });

  if (!doc) return null;
  return mapDocToProfileData(doc);
}

export async function getProfileByUserId(
  userId: string,
  preferredType?: ProfileType
): Promise<ProfileData | null> {
  if (!userId || typeof userId !== 'string') return null;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  if (preferredType) {
    const doc = await db.collection(COLLECTIONS.PROFILES).findOne({ userId, type: preferredType });
    if (doc) return mapDocToProfileData(doc);
  }
  const doc = await db.collection(COLLECTIONS.PROFILES).findOne({ userId });
  if (!doc) return null;
  return mapDocToProfileData(doc);
}

export async function getProfilesByUserId(userId: string): Promise<ProfileData[]> {
  if (!userId || typeof userId !== 'string') return [];

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const docs = await db.collection(COLLECTIONS.PROFILES).find({ userId }).toArray();
  return docs.map(mapDocToProfileData);
}

export async function getAllProfiles(): Promise<ProfileData[]> {
  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const docs = await db.collection(COLLECTIONS.PROFILES).find({}).toArray();
  return docs.map(mapDocToProfileData);
}

export async function updateProfile(
  profileId: string,
  updatedData: Partial<ProfileData>,
  sessionUserId: string,
  _sessionUserEmail?: string
): Promise<{ success: boolean; profile?: ProfileData; error?: string; status: number }> {
  if (!sessionUserId) {
    return { success: false, error: 'Unauthorized: Session required.', status: 401 };
  }

  const existing = await getProfileByIdOrSlug(profileId);
  if (!existing) {
    return { success: false, error: 'Profile not found.', status: 404 };
  }

  // Authorization enforcement: User must be profile owner or company admin/owner
  if (existing.userId !== sessionUserId) {
    let allowed = false;
    if (existing.companyId) {
      const { getCompanyMemberByUser } = await import('./members');
      const member = await getCompanyMemberByUser(existing.companyId, sessionUserId);
      if (member && (member.role === 'OWNER' || member.role === 'ADMIN')) {
        allowed = true;
      }
    }
    if (!allowed) {
      return { success: false, error: 'Forbidden: You do not own this profile.', status: 403 };
    }
  }

  const db = await getMongoDb();
  const profilesCol = db.collection(COLLECTIONS.PROFILES);

  // If changing slug, verify unique
  if (updatedData.slug && updatedData.slug !== existing.slug) {
    const slugConflict = await profilesCol.findOne({
      slug: updatedData.slug,
      _id: { $ne: existing.id as any }
    });
    if (slugConflict) {
      return { success: false, error: 'This profile URL slug is already taken.', status: 409 };
    }
  }

  const now = new Date().toISOString();
  const safeUpdates = { ...updatedData, updatedAt: now };
  delete (safeUpdates as any)._id;
  delete (safeUpdates as any).id;
  delete (safeUpdates as any).userId; // Prevent transferring ownership via update

  // Never overwrite an existing saved image with an empty or missing value
  if (!safeUpdates.avatar && (existing.avatar || (existing as any).logoUrl)) {
    safeUpdates.avatar = existing.avatar || (existing as any).logoUrl;
  }
  if (!safeUpdates.coverImage && (existing.coverImage || (existing as any).coverUrl)) {
    safeUpdates.coverImage = existing.coverImage || (existing as any).coverUrl;
  }

  const res = await profilesCol.findOneAndUpdate(
    { _id: existing.id as any },
    { $set: safeUpdates },
    { returnDocument: 'after' }
  );

  if (!res) {
    return { success: false, error: 'Failed to update profile.', status: 500 };
  }

  return { success: true, profile: mapDocToProfileData(res), status: 200 };
}

export async function duplicateProfile(
  profileId: string,
  sessionUserId: string
): Promise<{ success: boolean; profile?: ProfileData; error?: string; status: number }> {
  if (!sessionUserId) {
    return { success: false, error: 'Unauthorized: Session required.', status: 401 };
  }

  const existing = await getProfileByIdOrSlug(profileId);
  if (!existing) {
    return { success: false, error: 'Profile not found.', status: 404 };
  }

  if (existing.userId !== sessionUserId) {
    return { success: false, error: 'Forbidden: You do not own this profile.', status: 403 };
  }

  const newSlug = `${existing.slug}-copy-${Math.random().toString(36).substring(2, 6)}`;
  const cloned = await createProfileForUser(sessionUserId, {
    ...existing,
    id: undefined,
    name: `${existing.name} (Copy)`,
    slug: newSlug
  });

  return { success: true, profile: cloned, status: 201 };
}

export async function deleteProfile(
  profileId: string,
  sessionUserId: string
): Promise<{ success: boolean; error?: string; status: number }> {
  if (!sessionUserId) {
    return { success: false, error: 'Unauthorized: Session required.', status: 401 };
  }

  const existing = await getProfileByIdOrSlug(profileId);
  if (!existing) {
    return { success: false, error: 'Profile not found.', status: 404 };
  }

  if (existing.userId !== sessionUserId) {
    return { success: false, error: 'Forbidden: You do not own this profile.', status: 403 };
  }

  const db = await getMongoDb();
  await db.collection(COLLECTIONS.PROFILES).deleteOne({ _id: existing.id as any });

  return { success: true, status: 200 };
}
