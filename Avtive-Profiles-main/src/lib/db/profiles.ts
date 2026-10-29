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

export function syncProfileAliases(data: Record<string, any>): Record<string, any> {
  const synced = { ...data };

  // bio <-> shortBio
  if ('bio' in synced && !('shortBio' in synced)) synced.shortBio = synced.bio;
  else if ('shortBio' in synced && !('bio' in synced)) synced.bio = synced.shortBio;
  else if ('bio' in synced && 'shortBio' in synced) synced.shortBio = synced.bio;

  // about <-> fullBio
  if ('about' in synced && !('fullBio' in synced)) synced.fullBio = synced.about;
  else if ('fullBio' in synced && !('about' in synced)) synced.about = synced.fullBio;
  else if ('about' in synced && 'fullBio' in synced) synced.fullBio = synced.about;

  // professionalTitle <-> designation <-> profession
  const hasTitle = 'professionalTitle' in synced || 'designation' in synced || 'profession' in synced;
  if (hasTitle) {
    const titleVal = synced.professionalTitle !== undefined ? synced.professionalTitle : (synced.designation !== undefined ? synced.designation : synced.profession);
    synced.professionalTitle = titleVal;
    synced.designation = titleVal;
    synced.profession = titleVal;
  }

  // secondName <-> lastName
  const hasSecond = 'secondName' in synced || 'lastName' in synced;
  if (hasSecond) {
    const secondVal = synced.secondName !== undefined ? synced.secondName : synced.lastName;
    synced.secondName = secondVal;
    synced.lastName = secondVal;
  }

  // socials <-> socialLinks
  if ('socials' in synced && !('socialLinks' in synced)) synced.socialLinks = synced.socials;
  else if ('socialLinks' in synced && !('socials' in synced)) synced.socials = synced.socialLinks;
  else if ('socials' in synced && 'socialLinks' in synced) synced.socialLinks = synced.socials;

  // experiences <-> experience
  if ('experiences' in synced && !('experience' in synced)) synced.experience = synced.experiences;
  else if ('experience' in synced && !('experiences' in synced)) synced.experiences = synced.experience;
  else if ('experiences' in synced && 'experience' in synced) synced.experience = synced.experiences;

  // volunteer <-> volunteerExperiences
  if ('volunteer' in synced && !('volunteerExperiences' in synced)) synced.volunteerExperiences = synced.volunteer;
  else if ('volunteerExperiences' in synced && !('volunteer' in synced)) synced.volunteer = synced.volunteerExperiences;
  else if ('volunteer' in synced && 'volunteerExperiences' in synced) synced.volunteerExperiences = synced.volunteer;

  // honors <-> honorsAwards
  if ('honors' in synced && !('honorsAwards' in synced)) synced.honorsAwards = synced.honors;
  else if ('honorsAwards' in synced && !('honors' in synced)) synced.honors = synced.honorsAwards;
  else if ('honors' in synced && 'honorsAwards' in synced) synced.honorsAwards = synced.honors;

  return synced;
}

export function mapDocToProfileData(doc: any): ProfileData {
  const id = String(doc._id || doc.id);
  const slug = String(doc.slug || id);

  const socials = Array.isArray(doc.socials) ? doc.socials : (Array.isArray(doc.socialLinks) ? doc.socialLinks : []);
  const rawExperiences = Array.isArray(doc.experiences) ? doc.experiences : (Array.isArray(doc.experience) ? doc.experience : []);
  const experiences = rawExperiences.map((exp: any) => {
    let period = exp.period || '';
    if (!period && (exp.startDate || exp.endDate || exp.current)) {
      const start = exp.startDate || '';
      const end = exp.current ? 'Present' : (exp.endDate || '');
      period = start && end ? `${start} - ${end}` : (start || end);
    }
    return {
      ...exp,
      role: exp.role || exp.title || '',
      company: exp.company || '',
      period,
      location: exp.location || '',
      description: exp.description || '',
      employmentType: exp.employmentType || '',
      locationType: exp.locationType || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      current: !!exp.current,
      skills: Array.isArray(exp.skills) ? exp.skills : []
    };
  });

  const rawVolunteer = Array.isArray(doc.volunteerExperiences)
    ? doc.volunteerExperiences
    : (Array.isArray(doc.volunteer) ? doc.volunteer : []);
  const volunteer = rawVolunteer.map((v: any) => {
    let period = v.period || '';
    if (!period && (v.startDate || v.endDate || v.current)) {
      const start = v.startDate || '';
      const end = v.current ? 'Present' : (v.endDate || '');
      period = start && end ? `${start} - ${end}` : (start || end);
    }
    return {
      ...v,
      role: v.role || v.title || '',
      organization: v.organization || v.company || '',
      cause: v.cause || '',
      startDate: v.startDate || '',
      endDate: v.endDate || '',
      current: !!v.current,
      period,
      description: v.description || ''
    };
  });

  const rawSkills = Array.isArray(doc.skills) ? doc.skills : [];
  const skills = rawSkills.map((s: any) => {
    if (typeof s === 'string') {
      return { name: s, category: 'Technical Skills', level: 'Intermediate', pinned: false };
    }
    if (s && typeof s === 'object') {
      return {
        name: s.name || '',
        category: s.category || 'Technical Skills',
        level: s.level || 'Intermediate',
        pinned: !!s.pinned
      };
    }
    return { name: String(s || ''), category: 'Technical Skills', level: 'Intermediate', pinned: false };
  }).filter((s: any) => s.name.trim().length > 0);

  const titleVal = doc.professionalTitle ?? doc.designation ?? doc.profession ?? '';
  const secondVal = doc.secondName ?? doc.lastName ?? '';

  return {
    ...doc,
    id,
    _id: id,
    slug,
    userId: String(doc.userId || doc.user_id || ''),
    name: doc.name ?? '',
    firstName: doc.firstName ?? '',
    secondName: secondVal,
    lastName: secondVal,
    email: doc.email ?? '',
    designation: titleVal,
    professionalTitle: titleVal,
    profession: titleVal,
    company: doc.company ?? '',
    location: doc.location ?? '',
    phone: doc.phone ?? '',
    whatsapp: doc.whatsapp ?? '',
    website: doc.website ?? '',
    country: doc.country ?? '',
    officeAddress: doc.officeAddress ?? '',
    customContacts: Array.isArray(doc.customContacts) ? doc.customContacts : [],
    contactOrder: Array.isArray(doc.contactOrder) ? doc.contactOrder : [],
    avatar: doc.avatar ?? doc.logoUrl ?? '',
    coverImage: doc.coverImage ?? doc.coverUrl ?? undefined,
    shortBio: doc.shortBio ?? doc.bio ?? '',
    fullBio: doc.fullBio ?? doc.about ?? '',
    bio: doc.bio ?? doc.shortBio ?? '',
    about: doc.about ?? doc.fullBio ?? '',
    tagline: doc.tagline ?? '',
    type: normalizeProfileType(doc.type),
    theme: doc.theme || 'editorial',
    skills,
    socials,
    socialLinks: socials,
    services: Array.isArray(doc.services) ? doc.services : [],
    projects: Array.isArray(doc.projects) ? doc.projects : [],
    experiences,
    experience: experiences,
    education: Array.isArray(doc.education) ? doc.education : [],
    certifications: Array.isArray(doc.certifications) ? doc.certifications : [],
    recommendations: Array.isArray(doc.recommendations) ? doc.recommendations : (Array.isArray(doc.testimonials) ? doc.testimonials : []),
    languages: Array.isArray(doc.languages) ? doc.languages : [],
    customFields: Array.isArray(doc.customFields) ? doc.customFields : [],
    industry: doc.industry ?? '',
    headline: doc.headline ?? '',
    openToWork: doc.openToWork ? {
      enabled: !!doc.openToWork.enabled,
      roles: Array.isArray(doc.openToWork.roles) ? doc.openToWork.roles : []
    } : { enabled: false, roles: [] },
    phoneType: doc.phoneType ?? '',
    websites: Array.isArray(doc.websites) ? doc.websites : [],
    featured: Array.isArray(doc.featured) ? doc.featured : [],
    honorsAwards: Array.isArray(doc.honorsAwards) ? doc.honorsAwards : (Array.isArray(doc.honors) ? doc.honors : []),
    publications: Array.isArray(doc.publications) ? doc.publications : [],
    patents: Array.isArray(doc.patents) ? doc.patents : [],
    courses: Array.isArray(doc.courses) ? doc.courses : [],
    testScores: Array.isArray(doc.testScores) ? doc.testScores : [],
    organizations: Array.isArray(doc.organizations) ? doc.organizations : [],
    interests: Array.isArray(doc.interests) ? doc.interests : [],
    volunteerExperiences: volunteer,
    volunteer,
    sharingSettings: doc.sharingSettings || { ...DEFAULT_SHARING_SETTINGS },
    sectionVisibility: doc.sectionVisibility || { ...DEFAULT_SECTION_VISIBILITY },
    sectionOrder: doc.sectionOrder || [...DEFAULT_SECTION_ORDER],
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : (doc.createdAt || new Date().toISOString()),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : (doc.updatedAt || new Date().toISOString())
  };
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

  // Pronouns and birthday default to private for non-owners unless explicitly opted in
  if (settings.pronouns !== true) {
    sanitized.pronouns = undefined;
  }
  if (settings.birthday !== true) {
    sanitized.birthday = undefined;
  }

  const isContactVisible = isCanonicalSectionVisible(visibility, settings, 'contactInfo');
  if (!isContactVisible || !isFieldShared(profile, 'phone')) {
    sanitized.phone = '';
    sanitized.whatsapp = '';
    sanitized.phoneType = '';
  }

  if (!isContactVisible || !isFieldShared(profile, 'email')) {
    sanitized.email = '';
  }

  if (!isContactVisible) {
    sanitized.website = '';
    sanitized.websites = [];
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
  } else if (Array.isArray(sanitized.recommendations)) {
    sanitized.recommendations = sanitized.recommendations.filter((r: any) => r && r.visible !== false);
  }
  if (!isCanonicalSectionVisible(visibility, settings, 'languages')) sanitized.languages = [];
  if (!isCanonicalSectionVisible(visibility, settings, 'volunteer')) {
    sanitized.volunteerExperiences = [];
    sanitized.volunteer = [];
  }
  if (!isCanonicalSectionVisible(visibility, settings, 'featured')) {
    sanitized.featured = [];
  } else if (Array.isArray(sanitized.featured)) {
    sanitized.featured = sanitized.featured.filter((f: any) => f && f.visible !== false);
  }
  if (!isCanonicalSectionVisible(visibility, settings, 'honorsAwards')) sanitized.honorsAwards = [];
  if (!isCanonicalSectionVisible(visibility, settings, 'publications')) sanitized.publications = [];
  if (!isCanonicalSectionVisible(visibility, settings, 'patents')) sanitized.patents = [];
  if (!isCanonicalSectionVisible(visibility, settings, 'courses')) sanitized.courses = [];
  if (!isCanonicalSectionVisible(visibility, settings, 'testScores')) sanitized.testScores = [];
  if (!isCanonicalSectionVisible(visibility, settings, 'organizations')) sanitized.organizations = [];
  if (!isCanonicalSectionVisible(visibility, settings, 'interests')) sanitized.interests = [];

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
    industry: data.industry?.trim() || '',
    headline: data.headline?.trim() || '',
    openToWork: data.openToWork || { enabled: false, roles: [] },
    phoneType: data.phoneType || '',
    websites: Array.isArray(data.websites) ? data.websites : [],
    featured: Array.isArray(data.featured) ? data.featured : [],
    honorsAwards: Array.isArray(data.honorsAwards) ? data.honorsAwards : (Array.isArray((data as any).honors) ? (data as any).honors : []),
    publications: Array.isArray(data.publications) ? data.publications : [],
    patents: Array.isArray(data.patents) ? data.patents : [],
    courses: Array.isArray(data.courses) ? data.courses : [],
    testScores: Array.isArray(data.testScores) ? data.testScores : [],
    organizations: Array.isArray(data.organizations) ? data.organizations : [],
    interests: Array.isArray(data.interests) ? data.interests : [],
    volunteerExperiences: data.volunteerExperiences || (data as any).volunteer || [],
    volunteer: data.volunteerExperiences || (data as any).volunteer || [],
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
): Promise<{ success: boolean; profile?: ProfileData; appliedKeys?: string[]; skippedKeys?: string[]; error?: string; status: number }> {
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
  const skippedKeys: string[] = [];

  // Expand clearFieldsSet with aliases
  if (clearFieldsSet.has('professionalTitle') || clearFieldsSet.has('designation') || clearFieldsSet.has('profession')) {
    clearFieldsSet.add('professionalTitle');
    clearFieldsSet.add('designation');
    clearFieldsSet.add('profession');
  }
  if (clearFieldsSet.has('secondName') || clearFieldsSet.has('lastName')) {
    clearFieldsSet.add('secondName');
    clearFieldsSet.add('lastName');
  }
  if (clearFieldsSet.has('bio') || clearFieldsSet.has('shortBio')) {
    clearFieldsSet.add('bio');
    clearFieldsSet.add('shortBio');
  }
  if (clearFieldsSet.has('about') || clearFieldsSet.has('fullBio')) {
    clearFieldsSet.add('about');
    clearFieldsSet.add('fullBio');
  }
  if (clearFieldsSet.has('socials') || clearFieldsSet.has('socialLinks')) {
    clearFieldsSet.add('socials');
    clearFieldsSet.add('socialLinks');
  }
  if (clearFieldsSet.has('experiences') || clearFieldsSet.has('experience')) {
    clearFieldsSet.add('experiences');
    clearFieldsSet.add('experience');
  }
  if (clearFieldsSet.has('volunteer') || clearFieldsSet.has('volunteerExperiences')) {
    clearFieldsSet.add('volunteer');
    clearFieldsSet.add('volunteerExperiences');
  }
  if (clearFieldsSet.has('honors') || clearFieldsSet.has('honorsAwards')) {
    clearFieldsSet.add('honors');
    clearFieldsSet.add('honorsAwards');
  }
  if (clearFieldsSet.has('testimonials') || clearFieldsSet.has('recommendations')) {
    clearFieldsSet.add('testimonials');
    clearFieldsSet.add('recommendations');
  }

  // Track old Cloudinary public IDs for safe post-save cleanup
  let oldAvatarPublicId: string | null = null;
  let oldCoverPublicId: string | null = null;

  const NESTED_PLAIN_KEYS = new Set([
    'companyInfo',
    'sectionVisibility',
    'sharingSettings',
    'customThemeColors',
    'customCta',
    'nfcCard',
    'openToWork'
  ]);

  const normalizedInput = syncProfileAliases(updatedData);

  for (const [key, value] of Object.entries(normalizedInput)) {
    // 1. Guard immutable fields
    if (key === '_id' || key === 'id' || key === 'userId' || key === 'createdAt' || key === 'role') {
      continue;
    }

    // 2. Reject blob: or data: URLs in avatar/coverImage
    if ((key === 'avatar' || key === 'coverImage') && typeof value === 'string') {
      if (value.startsWith('blob:') || value.startsWith('data:')) {
        skippedKeys.push(key);
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
      skippedKeys.push(key);
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

    // 6. Add to $set
    $set[key] = value;
  }

  // Ensure explicit clearFields are populated in $set
  for (const clearKey of clearFieldsSet) {
    if (!(clearKey in $set)) {
      const existingVal = (existing as any)[clearKey];
      if (Array.isArray(existingVal)) {
        $set[clearKey] = [];
      } else {
        $set[clearKey] = '';
      }
    }
  }

  // Synchronize all aliases across $set
  const syncedSet = syncProfileAliases($set);
  Object.assign($set, syncedSet);

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
    skippedKeys,
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
