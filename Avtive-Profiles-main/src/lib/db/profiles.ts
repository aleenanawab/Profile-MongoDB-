import crypto from 'crypto';
import { ObjectId } from 'mongodb';
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
import { deleteFromCloudinary } from '@/lib/storage';
import { isCanonicalSectionVisible, isFieldShared } from '@/lib/sections';

export function mapDocToProfileData(doc: any): ProfileData {
  const id = String(doc._id || doc.id);
  const slug = String(doc.slug || id);

  const socials = Array.isArray(doc.socials) ? doc.socials : (Array.isArray(doc.socialLinks) ? doc.socialLinks : []);
  const experiences = Array.isArray(doc.experiences) ? doc.experiences : (Array.isArray(doc.experience) ? doc.experience : []);

  return {
    ...doc,
    id,
    _id: id,
    slug,
    userId: String(doc.userId || doc.user_id || ''),
    name: doc.name || 'Professional',
    email: doc.email || '',
    designation: doc.designation || 'Professional',
    company: doc.company || '',
    location: doc.location || '',
    phone: doc.phone || '',
    whatsapp: doc.whatsapp || '',
    website: doc.website || '',
    country: doc.country || '',
    officeAddress: doc.officeAddress || '',
    customContacts: Array.isArray(doc.customContacts) ? doc.customContacts : [],
    contactOrder: Array.isArray(doc.contactOrder) ? doc.contactOrder : [],
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
    socials,
    socialLinks: socials,
    services: Array.isArray(doc.services) ? doc.services : [],
    projects: Array.isArray(doc.projects) ? doc.projects : [],
    experiences,
    experience: experiences,
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
  // Deep clone to ensure purity so caller's object is never mutated in-place
  const sanitized: ProfileData = JSON.parse(JSON.stringify(profile));

  if (settings.photo === false || !isCanonicalSectionVisible(visibility, settings, 'profile') || visibility['photo'] === false) {
    sanitized.avatar = '';
    sanitized.coverImage = undefined;
  }

  if (settings.nameAndTitle === false) {
    sanitized.name = 'Professional';
    sanitized.designation = '';
    sanitized.tagline = '';
  }

  if (!isCanonicalSectionVisible(visibility, settings, 'personalDetails')) {
    sanitized.bio = '';
    sanitized.about = '';
    sanitized.shortBio = '';
    sanitized.fullBio = '';
  }

  const isContactVisible = isCanonicalSectionVisible(visibility, settings, 'contactInfo');
  if (!isContactVisible || !isFieldShared(profile, 'phone')) {
    sanitized.phone = '';
    sanitized.whatsapp = '';
  }

  if (!isContactVisible || !isFieldShared(profile, 'email')) {
    sanitized.email = '';
  }

  if (!isContactVisible) {
    sanitized.website = '';
    sanitized.officeAddress = '';
    sanitized.googleMapsUrl = '';
    sanitized.customContacts = [];
  }

  if (!isCanonicalSectionVisible(visibility, settings, 'socialLinks')) {
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

  if (!isCanonicalSectionVisible(visibility, settings, 'skills')) sanitized.skills = [];
  if (!isCanonicalSectionVisible(visibility, settings, 'experience')) {
    sanitized.experiences = [];
    sanitized.experience = [];
  }
  if (!isCanonicalSectionVisible(visibility, settings, 'education')) sanitized.education = [];
  if (!isCanonicalSectionVisible(visibility, settings, 'certifications')) sanitized.certifications = [];
  if (!isCanonicalSectionVisible(visibility, settings, 'projects')) sanitized.projects = [];
  if (!isCanonicalSectionVisible(visibility, settings, 'services')) sanitized.services = [];
  if (!isCanonicalSectionVisible(visibility, settings, 'recommendations')) {
    sanitized.recommendations = [];
    sanitized.testimonials = [];
  }
  if (!isCanonicalSectionVisible(visibility, settings, 'languages')) sanitized.languages = [];
  if (!isCanonicalSectionVisible(visibility, settings, 'companyInfo')) {
    sanitized.companyInfo = undefined;
  }
  if (!isCanonicalSectionVisible(visibility, settings, 'teamMembers')) {
    sanitized.teamMembers = [];
  }
  if (!isCanonicalSectionVisible(visibility, settings, 'virtualCard')) sanitized.nfcCard = undefined;

  if (!isCanonicalSectionVisible(visibility, settings, 'customFields')) {
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
  const rawSocials = data.socials || data.socialLinks || [];
  const rawExperiences = data.experiences || data.experience || [];

  const newProfileDoc: any = {
    ...data,
    _id: profileId,
    id: profileId,
    userId,
    slug: candidateSlug,
    name: data.name?.trim() || '',
    email: data.email?.toLowerCase().trim() || '',
    designation: data.designation?.trim() || '',
    company: data.company?.trim() || '',
    location: data.location?.trim() || '',
    phone: data.phone?.trim() || '',
    whatsapp: data.whatsapp?.trim() || '',
    website: data.website?.trim() || '',
    country: data.country?.trim() || '',
    officeAddress: data.officeAddress?.trim() || '',
    customContacts: Array.isArray(data.customContacts) ? data.customContacts : [],
    contactOrder: Array.isArray(data.contactOrder) ? data.contactOrder : [],
    avatar: data.avatar || '',
    coverImage: data.coverImage || undefined,
    shortBio: data.shortBio?.trim() || data.bio?.trim() || '',
    fullBio: data.fullBio?.trim() || data.about?.trim() || '',
    bio: data.bio?.trim() || data.shortBio?.trim() || '',
    about: data.about?.trim() || data.fullBio?.trim() || '',
    type: normalizeProfileType(data.type),
    theme: data.theme || 'editorial',
    skills: data.skills || [],
    socials: rawSocials,
    socialLinks: rawSocials,
    services: data.services || [],
    projects: data.projects || [],
    experiences: rawExperiences,
    experience: rawExperiences,
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
  const orConditions: any[] = [
    { id: idOrSlug },
    { slug: idOrSlug },
    { _id: idOrSlug as any }
  ];
  if (ObjectId.isValid(idOrSlug)) {
    orConditions.push({ _id: new ObjectId(idOrSlug) });
  }

  const doc = await db.collection(COLLECTIONS.PROFILES).findOne({ $or: orConditions });
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
  const userOrConditions: any[] = [
    { userId },
    { user_id: userId }
  ];
  if (ObjectId.isValid(userId)) {
    userOrConditions.push({ userId: new ObjectId(userId) });
    userOrConditions.push({ user_id: new ObjectId(userId) });
  }

  if (preferredType) {
    const doc = await db.collection(COLLECTIONS.PROFILES).findOne({
      $or: userOrConditions,
      type: preferredType
    });
    if (doc) return mapDocToProfileData(doc);
  }
  const doc = await db.collection(COLLECTIONS.PROFILES).findOne({ $or: userOrConditions });
  if (!doc) return null;
  return mapDocToProfileData(doc);
}

export async function getProfilesByUserId(userId: string): Promise<ProfileData[]> {
  if (!userId || typeof userId !== 'string') return [];

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const userOrConditions: any[] = [
    { userId },
    { user_id: userId }
  ];
  if (ObjectId.isValid(userId)) {
    userOrConditions.push({ userId: new ObjectId(userId) });
    userOrConditions.push({ user_id: new ObjectId(userId) });
  }

  const docs = await db.collection(COLLECTIONS.PROFILES).find({ $or: userOrConditions }).toArray();
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
  updatedData: Record<string, any>,
  sessionUserId: string,
  _sessionUserEmail?: string,
  options?: { clearFields?: string[]; isPatch?: boolean }
): Promise<{ success: boolean; profile?: ProfileData; appliedKeys?: string[]; error?: string; status: number }> {
  if (!sessionUserId) {
    return { success: false, error: 'Unauthorized: Session required.', status: 401 };
  }

  const existing = await getProfileByIdOrSlug(profileId);
  if (!existing) {
    return { success: false, error: 'Profile not found.', status: 404 };
  }

  // Authorization enforcement: User must be profile owner or company admin/owner
  const isDirectOwner =
    existing.userId === sessionUserId ||
    (existing as any).user_id === sessionUserId ||
    (ObjectId.isValid(sessionUserId) && (String(existing.userId) === sessionUserId || String((existing as any).user_id) === sessionUserId));

  if (!isDirectOwner) {
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
  const $set: Record<string, any> = { updatedAt: now };
  const clearFieldsSet = new Set<string>(options?.clearFields || []);

  // Track old Cloudinary public IDs for safe post-save cleanup
  let oldAvatarPublicId: string | null = null;
  let oldCoverPublicId: string | null = null;

  const NESTED_PLAIN_KEYS = new Set([
    'companyInfo',
    'sectionVisibility',
    'sharingSettings',
    'customThemeColors',
    'customCta',
    'nfcCard'
  ]);

  for (const [key, value] of Object.entries(updatedData)) {
    // 1. Guard immutable fields
    if (key === '_id' || key === 'id' || key === 'userId' || key === 'createdAt' || key === 'role') {
      continue;
    }

    // 2. Reject blob: or data: URLs in avatar/coverImage
    if ((key === 'avatar' || key === 'coverImage') && typeof value === 'string') {
      if (value.startsWith('blob:') || value.startsWith('data:')) {
        continue;
      }
    }

    // 3. Accidental wipe guard for arrays and objects:
    // If setting to empty array or empty string, ensure explicit intent via clearFields
    const topLevelKey = key.split('.')[0];
    const existingVal = (existing as any)[topLevelKey];
    const isWipingArray = Array.isArray(existingVal) && existingVal.length > 0 && Array.isArray(value) && value.length === 0;
    const isWipingString = typeof existingVal === 'string' && existingVal.trim().length > 0 && value === '';

    if ((isWipingArray || isWipingString) && !clearFieldsSet.has(topLevelKey) && !clearFieldsSet.has(key)) {
      console.warn(`[updateProfile] Rejected unintended wipe of non-empty field: "${key}" (not in clearFields)`);
      continue;
    }

    // 4. Image cleanup tracking
    if (key === 'avatar') {
      if (value && value !== existing.avatar && (existing as any).avatarPublicId) {
        oldAvatarPublicId = (existing as any).avatarPublicId;
      }
      if (value === '' && (existing as any).avatarPublicId) {
        $set['avatarPublicId'] = '';
      }
    }
    if (key === 'coverImage') {
      if (value && value !== existing.coverImage && (existing as any).coverImagePublicId) {
        oldCoverPublicId = (existing as any).coverImagePublicId;
      }
      if (value === '' && (existing as any).coverImagePublicId) {
        $set['coverImagePublicId'] = '';
      }
    }

    // 5. Expand nested plain objects to preserve sibling keys in MongoDB
    if (NESTED_PLAIN_KEYS.has(key) && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const [subK, subV] of Object.entries(value)) {
        $set[`${key}.${subK}`] = subV;
      }
      continue;
    }

    // 6. Add to $set and handle legacy aliases
    $set[key] = value;
    if (key === 'experiences') $set['experience'] = value;
    if (key === 'experience') $set['experiences'] = value;
    if (key === 'socials') $set['socialLinks'] = value;
    if (key === 'socialLinks') $set['socials'] = value;
    if (key === 'bio') $set['shortBio'] = value;
    if (key === 'shortBio') $set['bio'] = value;
    if (key === 'about') $set['fullBio'] = value;
    if (key === 'fullBio') $set['about'] = value;
  }

  const matchCriteria: any[] = [
    { id: existing.id },
    { slug: existing.slug },
    { _id: existing.id as any }
  ];
  if (ObjectId.isValid(existing.id)) {
    matchCriteria.push({ _id: new ObjectId(existing.id) });
  }

  const res = await profilesCol.findOneAndUpdate(
    { $or: matchCriteria },
    { $set },
    { returnDocument: 'after' }
  );

  if (!res) {
    return { success: false, error: 'Failed to update profile.', status: 500 };
  }

  // Delete old files from storage ONLY after the new profile document is safely saved
  if (oldAvatarPublicId) {
    deleteFromCloudinary(oldAvatarPublicId).catch((err) => console.warn('Failed to delete old avatar:', err));
  }
  if (oldCoverPublicId) {
    deleteFromCloudinary(oldCoverPublicId).catch((err) => console.warn('Failed to delete old cover:', err));
  }

  return {
    success: true,
    profile: mapDocToProfileData(res),
    appliedKeys: Object.keys($set).filter((k) => k !== 'updatedAt'),
    status: 200
  };
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
  const matchCriteria: any[] = [
    { id: existing.id },
    { slug: existing.slug },
    { _id: existing.id as any }
  ];
  if (ObjectId.isValid(existing.id)) {
    matchCriteria.push({ _id: new ObjectId(existing.id) });
  }

  await db.collection(COLLECTIONS.PROFILES).deleteOne({ $or: matchCriteria });

  return { success: true, status: 200 };
}
