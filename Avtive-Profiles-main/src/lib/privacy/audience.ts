import {
  DEFAULT_SECTION_ORDER,
  DEFAULT_SECTION_VISIBILITY,
  DEFAULT_SHARING_SETTINGS,
  ProfileData,
  SharingSettings
} from '@/types/profile';
import { isCanonicalSectionVisible, isFieldShared, normalizeSectionKey, SECTION_TO_SHARING_KEY } from '@/lib/sections';

export type ProfileAudience = 'owner' | 'public' | 'connection';

const NEVER_SHARE_CUSTOM_PATTERN =
  /\b(bank|iban|swift|bic|routing|account\s*(?:no|num|number)|sort\s*code|credit\s*card|debit\s*card|cvv|ssn|social\s*security|passport|national\s*id|cnic|aadhaar|tin|tax\s*id|driver.?s?\s*licen[cs]e|pin\s*code|secret\s*key|private\s*key|api\s*key|recovery\s*code|password|confidential|salary)\b/i;

export function filterVisibleItems<T>(items: T[] | undefined): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => {
    if (!item || typeof item !== 'object') return Boolean(item);
    return (item as { visible?: boolean }).visible !== false;
  });
}

function isAllowedForAudience(
  profile: ProfileData,
  audience: 'public' | 'connection',
  canonicalSection: string,
  sharingKey?: keyof SharingSettings
): boolean {
  const settings = profile.sharingSettings || DEFAULT_SHARING_SETTINGS;
  const visibility = profile.sectionVisibility || DEFAULT_SECTION_VISIBILITY;
  const conn = profile.connectionSettings || {};
  const fieldPrivacy = profile.fieldPrivacy || {};

  const effectiveKey = (sharingKey || SECTION_TO_SHARING_KEY[canonicalSection]) as keyof SharingSettings | undefined;
  if (effectiveKey) {
    const fp = fieldPrivacy[String(effectiveKey)];
    if (fp === 'never_share' || fp === 'private') {
      return false;
    }
  }

  if (audience === 'connection' && effectiveKey && typeof conn[effectiveKey] === 'boolean') {
    return conn[effectiveKey] === true;
  }

  if (canonicalSection && canonicalSection !== 'profile') {
    const secVisible = isCanonicalSectionVisible(visibility, settings, canonicalSection);
    if (!secVisible) return false;
  }

  if (effectiveKey && typeof settings[effectiveKey] === 'boolean') {
    return settings[effectiveKey] !== false;
  }

  return true;
}

/**
 * Single centralized privacy & audience sanitization engine.
 * Used identically by:
 *   - Server profile route (`src/app/profile/[identifier]/page.tsx` & `/api/profile/[id]`)
 *   - Owner P2 live audience preview (`Public` vs `Connection`) in `PublicProfileClient.tsx`
 */
export function sanitizeProfileForAudience(
  profile: ProfileData,
  audience: ProfileAudience = 'public'
): ProfileData {
  if (audience === 'owner') {
    return profile;
  }

  const sanitized: ProfileData = JSON.parse(JSON.stringify(profile));

  // Enforce Private profile visibility: non-owners (public & connections) see ONLY basic display name
  if (profile.profileVisibility === 'private') {
    return {
      id: sanitized.id,
      _id: sanitized._id,
      slug: sanitized.slug,
      type: sanitized.type,
      name: sanitized.name || 'Private Profile',
      firstName: sanitized.firstName || undefined,
      lastName: sanitized.lastName || undefined,
      profileVisibility: 'private',
      theme: sanitized.theme || 'editorial',
      backgroundType: 'default',
      activeBackgroundThemeId: '',
      customBackgroundImage: '',
      customBackgroundVideo: '',
      savedBackgroundThemeIds: [],
      avatar: '',
      coverImage: undefined,
      designation: '',
      professionalTitle: '',
      headline: '',
      tagline: '',
      company: '',
      location: '',
      country: '',
      officeAddress: '',
      bio: '',
      about: '',
      shortBio: '',
      fullBio: '',
      email: '',
      phone: '',
      whatsapp: '',
      website: '',
      websites: [],
      customContacts: [],
      skills: [],
      services: [],
      projects: [],
      experiences: [],
      experience: [],
      education: [],
      certifications: [],
      recommendations: [],
      languages: [],
      customFields: [],
      dynamicSections: [],
      featured: [],
      honorsAwards: [],
      publications: [],
      patents: [],
      courses: [],
      testScores: [],
      organizations: [],
      interests: [],
      volunteerExperiences: [],
      volunteer: [],
      teamMembers: [],
      socials: [],
      socialLinks: [],
      introductionMedia: null,
      resumeUrl: '',
      resumeFileName: '',
      openToWork: undefined,
      companyInfo: undefined,
      fieldPrivacy: {},
      sharingSettings: { ...DEFAULT_SHARING_SETTINGS },
      sectionVisibility: { ...DEFAULT_SECTION_VISIBILITY },
      sectionOrder: []
    };
  }

  const settings = profile.sharingSettings || DEFAULT_SHARING_SETTINGS;
  const visibility = profile.sectionVisibility || DEFAULT_SECTION_VISIBILITY;
  const conn = profile.connectionSettings || {};
  const fieldPrivacy = profile.fieldPrivacy || {};

  const checkField = (key: keyof SharingSettings, defaultVal: boolean = true): boolean => {
    const fp = fieldPrivacy[String(key)];
    if (fp === 'never_share' || fp === 'private') return false;
    if (audience === 'connection' && typeof conn[key] === 'boolean') {
      return conn[key] === true;
    }
    if (typeof settings[key] === 'boolean') {
      return settings[key] !== false;
    }
    return defaultVal;
  };

  // Profile hero fields
  const profileSectionHidden = !isCanonicalSectionVisible(visibility, settings, 'profile');
  if (
    profileSectionHidden ||
    visibility['photo'] === false ||
    !checkField('photo', true)
  ) {
    sanitized.avatar = '';
    delete (sanitized as any).logoUrl;
    sanitized.companyLogo = '';
  }
  if (
    profileSectionHidden ||
    visibility['coverImage'] === false ||
    !checkField('coverImage', true)
  ) {
    sanitized.coverImage = undefined;
    delete (sanitized as any).coverUrl;
  }

  if (settings.nameAndTitle === false && !(audience === 'connection' && conn.nameAndTitle === true)) {
    sanitized.name = 'Professional';
    sanitized.designation = '';
    sanitized.professionalTitle = '';
    sanitized.profession = '';
    sanitized.headline = '';
    sanitized.tagline = '';
  }

  // About / Bio
  const aboutAllowed = isAllowedForAudience(profile, audience, 'personalDetails', 'bio');
  if (!aboutAllowed) {
    sanitized.bio = '';
    sanitized.about = '';
    sanitized.shortBio = '';
    sanitized.fullBio = '';
    sanitized.tagline = '';
  }

  // Pronouns & Birthday: default private unless explicitly enabled (and never private/never_share)
  if (
    fieldPrivacy.pronouns === 'never_share' ||
    fieldPrivacy.pronouns === 'private' ||
    !(audience === 'connection' ? (typeof conn.pronouns === 'boolean' ? conn.pronouns : settings.pronouns === true) : settings.pronouns === true)
  ) {
    sanitized.pronouns = undefined;
  }
  if (
    fieldPrivacy.birthday === 'never_share' ||
    fieldPrivacy.birthday === 'private' ||
    !(audience === 'connection' ? (typeof conn.birthday === 'boolean' ? conn.birthday : settings.birthday === true) : settings.birthday === true)
  ) {
    sanitized.birthday = undefined;
  }

  // Contact Info & Individual Contact Channels
  const isContactVisible = isAllowedForAudience(profile, audience, 'contactInfo', 'contactInfo');
  const emailAllowed =
    isContactVisible &&
    (audience === 'connection' && typeof conn.email === 'boolean'
      ? conn.email === true && fieldPrivacy.email !== 'never_share' && fieldPrivacy.email !== 'private'
      : isFieldShared(profile, 'email') && fieldPrivacy.email !== 'never_share' && fieldPrivacy.email !== 'private');

  const phoneAllowed =
    isContactVisible &&
    (audience === 'connection' && typeof conn.phone === 'boolean'
      ? conn.phone === true && fieldPrivacy.phone !== 'never_share' && fieldPrivacy.phone !== 'private'
      : isFieldShared(profile, 'phone') && fieldPrivacy.phone !== 'never_share' && fieldPrivacy.phone !== 'private');

  const websiteAllowed = isContactVisible && checkField('website', true);
  const locationAllowed = isContactVisible && checkField('location', true);

  if (!phoneAllowed) {
    sanitized.phone = '';
    sanitized.whatsapp = '';
    sanitized.phoneType = '';
  }
  if (!emailAllowed) {
    sanitized.email = '';
  }
  if (!websiteAllowed) {
    sanitized.website = '';
    sanitized.websites = [];
  }
  if (!locationAllowed) {
    sanitized.location = '';
    sanitized.country = '';
    sanitized.officeAddress = '';
    sanitized.googleMapsUrl = '';
  }
  if (!isContactVisible) {
    sanitized.customContacts = [];
  } else {
    sanitized.customContacts = filterVisibleItems(sanitized.customContacts).filter((c) => {
      if (!phoneAllowed && (c.type === 'phone' || c.type === 'whatsapp')) return false;
      if (!emailAllowed && c.type === 'email') return false;
      if (!websiteAllowed && c.type === 'website') return false;
      if (!locationAllowed && c.type === 'location') return false;
      return true;
    });
  }

  // Social Links
  if (!isAllowedForAudience(profile, audience, 'socialLinks', 'socialLinks')) {
    sanitized.socials = [];
    sanitized.socialLinks = [];
  } else {
    sanitized.socials = filterVisibleItems(sanitized.socials);
    sanitized.socialLinks = filterVisibleItems(sanitized.socialLinks);
  }

  // Career & Extended Sections (filter individual visible !== false items!)
  if (!isAllowedForAudience(profile, audience, 'skills', 'skills')) {
    sanitized.skills = [];
  } else {
    sanitized.skills = filterVisibleItems(sanitized.skills);
  }

  if (!isAllowedForAudience(profile, audience, 'experience', 'experience')) {
    sanitized.experiences = [];
    sanitized.experience = [];
  } else {
    sanitized.experiences = filterVisibleItems(sanitized.experiences);
    sanitized.experience = filterVisibleItems(sanitized.experience);
  }

  if (!isAllowedForAudience(profile, audience, 'education', 'education')) {
    sanitized.education = [];
  } else {
    sanitized.education = filterVisibleItems(sanitized.education);
  }

  if (!isAllowedForAudience(profile, audience, 'certifications', 'certifications')) {
    sanitized.certifications = [];
  } else {
    sanitized.certifications = filterVisibleItems(sanitized.certifications);
  }

  if (!isAllowedForAudience(profile, audience, 'projects', 'projects')) {
    sanitized.projects = [];
  } else {
    sanitized.projects = filterVisibleItems(sanitized.projects);
  }

  if (!isAllowedForAudience(profile, audience, 'services', 'services')) {
    sanitized.services = [];
  } else {
    sanitized.services = filterVisibleItems(sanitized.services);
  }

  if (!isAllowedForAudience(profile, audience, 'recommendations', 'recommendations')) {
    sanitized.recommendations = [];
    sanitized.testimonials = [];
  } else {
    sanitized.recommendations = filterVisibleItems(sanitized.recommendations);
    sanitized.testimonials = filterVisibleItems(sanitized.testimonials);
  }

  if (!isAllowedForAudience(profile, audience, 'languages', 'languages')) {
    sanitized.languages = [];
  } else {
    sanitized.languages = filterVisibleItems(sanitized.languages);
  }

  if (!isAllowedForAudience(profile, audience, 'volunteer', 'volunteer')) {
    sanitized.volunteerExperiences = [];
    sanitized.volunteer = [];
  } else {
    sanitized.volunteerExperiences = filterVisibleItems(sanitized.volunteerExperiences);
    sanitized.volunteer = filterVisibleItems(sanitized.volunteer);
  }

  if (!isAllowedForAudience(profile, audience, 'featured', 'featured')) {
    sanitized.featured = [];
  } else {
    sanitized.featured = filterVisibleItems(sanitized.featured);
  }

  if (!isAllowedForAudience(profile, audience, 'honorsAwards', 'honorsAwards')) {
    sanitized.honorsAwards = [];
    sanitized.honors = [];
  } else {
    sanitized.honorsAwards = filterVisibleItems(sanitized.honorsAwards);
    sanitized.honors = filterVisibleItems(sanitized.honors);
  }

  if (!isAllowedForAudience(profile, audience, 'publications', 'publications')) {
    sanitized.publications = [];
  } else {
    sanitized.publications = filterVisibleItems(sanitized.publications);
  }

  if (!isAllowedForAudience(profile, audience, 'patents', 'patents')) {
    sanitized.patents = [];
  } else {
    sanitized.patents = filterVisibleItems(sanitized.patents);
  }

  if (!isAllowedForAudience(profile, audience, 'courses', 'courses')) {
    sanitized.courses = [];
  } else {
    sanitized.courses = filterVisibleItems(sanitized.courses);
  }

  if (!isAllowedForAudience(profile, audience, 'testScores', 'testScores')) {
    sanitized.testScores = [];
  } else {
    sanitized.testScores = filterVisibleItems(sanitized.testScores);
  }

  if (!isAllowedForAudience(profile, audience, 'organizations', 'organizations')) {
    sanitized.organizations = [];
  } else {
    sanitized.organizations = filterVisibleItems(sanitized.organizations);
  }

  if (!isAllowedForAudience(profile, audience, 'interests', 'interests')) {
    sanitized.interests = [];
  } else {
    sanitized.interests = filterVisibleItems(sanitized.interests);
  }

  // Introduction media
  const introAllowed =
    checkField('introductionMedia', true) &&
    visibility.introductionMedia !== false &&
    aboutAllowed;
  if (!introAllowed) {
    sanitized.introductionMedia = null;
  }

  // Resume
  if (!checkField('resume', true)) {
    sanitized.resumeUrl = undefined;
    sanitized.resumeFileName = undefined;
  }

  // Company & Team & Virtual Card
  if (!isAllowedForAudience(profile, audience, 'companyInfo', 'companySection')) {
    sanitized.companyInfo = undefined;
  }
  if (!isAllowedForAudience(profile, audience, 'teamMembers', 'companySection')) {
    sanitized.teamMembers = [];
  }
  if (!isAllowedForAudience(profile, audience, 'virtualCard', 'nfcCard')) {
    sanitized.nfcCard = undefined;
  }

  // Custom fields
  if (!isAllowedForAudience(profile, audience, 'customFields', 'customFields')) {
    sanitized.customFields = [];
  } else if (Array.isArray(sanitized.customFields)) {
    sanitized.customFields = sanitized.customFields.filter((f) => {
      if (!f || f.visible === false || (f as any).isPublic === false) return false;
      const cfKey = `custom-field-${f.id}`;
      const fp = fieldPrivacy[cfKey];
      if (f.privacy === 'never_share' || fp === 'never_share' || f.privacy === 'private' || fp === 'private') {
        return false;
      }
      if (NEVER_SHARE_CUSTOM_PATTERN.test(f.label || (f as any).title || '')) return false;
      return true;
    });
  }

  // Dynamic custom sections
  if (Array.isArray(sanitized.dynamicSections)) {
    sanitized.dynamicSections = sanitized.dynamicSections
      .filter((sec) => sec && sec.visible !== false && isAllowedForAudience(profile, audience, sec.key || sec.id))
      .map((sec) => ({
        ...sec,
        customFields: filterVisibleItems(sec.customFields)
      }));
  }

  // Strip internal hardware/account fields
  if (sanitized.nfcCard) {
    sanitized.nfcCard = {
      cardNumber: sanitized.nfcCard.cardNumber,
      chipId: '',
      finish: sanitized.nfcCard.finish
    };
  }
  delete sanitized.avatarPublicId;
  delete sanitized.coverImagePublicId;
  delete sanitized.connectionSettings;
  delete sanitized.fieldPrivacy;

  // Build effective sharingSettings & sectionVisibility so downstream UI components render consistently
  sanitized.sharingSettings = {
    ...settings,
    photo: Boolean(sanitized.avatar),
    coverImage: Boolean(sanitized.coverImage),
    bio: aboutAllowed,
    introductionMedia: introAllowed,
    email: emailAllowed,
    phone: phoneAllowed,
    website: websiteAllowed,
    location: locationAllowed,
    contactInfo: isContactVisible,
    socialLinks: isAllowedForAudience(profile, audience, 'socialLinks', 'socialLinks'),
    skills: isAllowedForAudience(profile, audience, 'skills', 'skills'),
    services: isAllowedForAudience(profile, audience, 'services', 'services'),
    experience: isAllowedForAudience(profile, audience, 'experience', 'experience'),
    education: isAllowedForAudience(profile, audience, 'education', 'education'),
    projects: isAllowedForAudience(profile, audience, 'projects', 'projects'),
    certifications: isAllowedForAudience(profile, audience, 'certifications', 'certifications'),
    recommendations: isAllowedForAudience(profile, audience, 'recommendations', 'recommendations'),
    languages: isAllowedForAudience(profile, audience, 'languages', 'languages'),
    volunteer: isAllowedForAudience(profile, audience, 'volunteer', 'volunteer'),
    featured: isAllowedForAudience(profile, audience, 'featured', 'featured'),
    honorsAwards: isAllowedForAudience(profile, audience, 'honorsAwards', 'honorsAwards'),
    publications: isAllowedForAudience(profile, audience, 'publications', 'publications'),
    patents: isAllowedForAudience(profile, audience, 'patents', 'patents'),
    courses: isAllowedForAudience(profile, audience, 'courses', 'courses'),
    testScores: isAllowedForAudience(profile, audience, 'testScores', 'testScores'),
    organizations: isAllowedForAudience(profile, audience, 'organizations', 'organizations'),
    interests: isAllowedForAudience(profile, audience, 'interests', 'interests'),
    resume: checkField('resume', true),
    customFields: isAllowedForAudience(profile, audience, 'customFields', 'customFields'),
    nfcCard: isAllowedForAudience(profile, audience, 'virtualCard', 'nfcCard')
  };

  const effectiveVisibility: Record<string, boolean> = { ...visibility };
  for (const [canonKey, sKey] of Object.entries(SECTION_TO_SHARING_KEY)) {
    const allowed = isAllowedForAudience(profile, audience, canonKey, sKey as keyof SharingSettings);
    effectiveVisibility[canonKey] = allowed;
  }
  effectiveVisibility.about = effectiveVisibility.personalDetails;
  effectiveVisibility.contact = effectiveVisibility.contactInfo;
  effectiveVisibility.socials = effectiveVisibility.socialLinks;
  effectiveVisibility.portfolio = effectiveVisibility.projects;
  effectiveVisibility['custom-fields'] = effectiveVisibility.customFields;
  effectiveVisibility['virtual-card'] = effectiveVisibility.virtualCard;
  effectiveVisibility.volunteerExperiences = effectiveVisibility.volunteer;
  effectiveVisibility.honors = effectiveVisibility.honorsAwards;
  effectiveVisibility.company = effectiveVisibility.companyInfo;
  effectiveVisibility.team = effectiveVisibility.teamMembers;

  sanitized.username = profile.username || profile.slug;
  sanitized.sectionOrder = profile.sectionOrder || DEFAULT_SECTION_ORDER;
  sanitized.sectionVisibility = effectiveVisibility;

  return sanitized;
}
