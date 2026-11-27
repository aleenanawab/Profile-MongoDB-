import { ProfileData, SharingSettings, DEFAULT_SECTION_ORDER } from '@/types/profile';
import {
  getFieldPrivacyTier,
  isFieldOwnerHidden,
  isSensitiveNeverShareLabel,
  SHAREABLE_FIELDS
} from './presets';
import { normalizeSectionKey } from '@/lib/sections';
import { filterVisibleItems } from '@/lib/privacy/audience';

export interface ShareSanitizeOptions {
  selectedFields: string[];
  selectedSections?: string[];
}

/**
 * Strictly sanitizes a profile for a specific Share Configuration or Live Preview.
 * Applies the security intersection of:
 *   1. Platform & owner Never Share exclusions (always excluded)
 *   2. Owner profile-level sectionVisibility / hidden fields
 *   3. Share-specific field/section whitelist (`selectedFields`)
 */
export function sanitizeProfileForShare(
  profile: ProfileData,
  options: ShareSanitizeOptions
): ProfileData {
  const cloned: ProfileData = JSON.parse(JSON.stringify(profile));
  const requestedSet = new Set<string>(options.selectedFields || []);

  // Determine effective allowed fields (must satisfy Never Share + Owner Hidden + Requested)
  const isAllowed = (fieldKey: string): boolean => {
    if (!requestedSet.has(fieldKey)) return false;
    if (getFieldPrivacyTier(profile, fieldKey) === 'never_share') return false;
    if (isFieldOwnerHidden(profile, fieldKey)) return false;
    return true;
  };

  // Strip internal / hardware secrets universally
  delete cloned.avatarPublicId;
  delete cloned.coverImagePublicId;
  delete cloned.fieldPrivacy;
  delete (cloned as any).passwordHash;
  delete (cloned as any).recoveryCodeHash;
  delete (cloned as any).resetToken;
  delete (cloned as any).googleSub;

  const nextSharing: SharingSettings = {
    photo: isAllowed('photo'),
    coverImage: isAllowed('coverImage'),
    nameAndTitle: isAllowed('name') || isAllowed('title'),
    name: isAllowed('name'),
    title: isAllowed('title'),
    bio: isAllowed('bio'),
    introductionMedia: isAllowed('introductionMedia'),
    phone: isAllowed('phone'),
    email: isAllowed('email'),
    website: isAllowed('website'),
    location: isAllowed('location'),
    contactInfo:
      isAllowed('phone') ||
      isAllowed('email') ||
      isAllowed('website') ||
      isAllowed('location') ||
      isAllowed('birthday'),
    socialLinks: isAllowed('socialLinks'),
    links: isAllowed('socialLinks'),
    experience: isAllowed('experience'),
    education: isAllowed('education'),
    skills: isAllowed('skills'),
    services: isAllowed('services'),
    projects: isAllowed('projects'),
    certifications: isAllowed('certifications'),
    resume: isAllowed('resume'),
    featured: isAllowed('featured'),
    languages: isAllowed('languages'),
    volunteer: isAllowed('volunteer'),
    recommendations: isAllowed('recommendations'),
    honorsAwards: isAllowed('honorsAwards'),
    publications: isAllowed('publications'),
    patents: isAllowed('patents'),
    courses: isAllowed('courses'),
    testScores: isAllowed('testScores'),
    organizations: isAllowed('organizations'),
    interests: isAllowed('interests'),
    companySection: isAllowed('companySection'),
    nfcCard: isAllowed('nfcCard'),
    customFields: false,
    pronouns: isAllowed('pronouns'),
    birthday: isAllowed('birthday')
  };

  // Basics (preserve & normalize legacy logoUrl/coverUrl when permitted; strip completely when disallowed)
  const resolvedAvatar =
    (typeof cloned.avatar === 'string' && cloned.avatar.trim()) ||
    (typeof (profile as any).logoUrl === 'string' && (profile as any).logoUrl.trim()) ||
    (typeof cloned.companyLogo === 'string' && cloned.companyLogo.trim()) ||
    '';
  const resolvedCover =
    (typeof cloned.coverImage === 'string' && cloned.coverImage.trim()) ||
    (typeof (profile as any).coverUrl === 'string' && (profile as any).coverUrl.trim()) ||
    undefined;

  if (!nextSharing.photo) {
    cloned.avatar = '';
    cloned.companyLogo = undefined;
    delete (cloned as any).logoUrl;
    if (cloned.companyInfo && typeof cloned.companyInfo === 'object') {
      cloned.companyInfo = { ...cloned.companyInfo, logo: '' };
    }
  } else {
    cloned.avatar = resolvedAvatar;
  }
  if (!nextSharing.coverImage) {
    cloned.coverImage = undefined;
    delete (cloned as any).coverUrl;
  } else {
    cloned.coverImage = resolvedCover;
  }
  if (!nextSharing.name) {
    cloned.name = isAllowed('title') ? (profile.designation || 'Shared Profile') : 'Shared Profile';
    cloned.firstName = '';
    cloned.secondName = '';
    cloned.lastName = '';
    cloned.username = '';
    cloned.profileName = undefined;
  }
  if (!nextSharing.title) {
    cloned.designation = '';
    cloned.professionalTitle = '';
    cloned.profession = '';
    cloned.headline = '';
    cloned.department = '';
    cloned.industry = '';
    cloned.openToWork = { enabled: false, roles: [] };
    if (!nextSharing.name) {
      cloned.profileName = undefined;
    }
  }
  if (!nextSharing.pronouns) {
    cloned.pronouns = undefined;
  }

  // About & Intro media
  if (!nextSharing.bio) {
    cloned.bio = '';
    cloned.shortBio = '';
    cloned.about = '';
    cloned.fullBio = '';
    cloned.tagline = '';
  }
  if (!nextSharing.introductionMedia) {
    cloned.introductionMedia = null;
  }

  // Contact fields
  if (!nextSharing.phone) {
    cloned.phone = '';
    cloned.whatsapp = '';
    cloned.phoneType = '';
  }
  if (!nextSharing.email) {
    cloned.email = '';
  }
  if (!nextSharing.website) {
    cloned.website = '';
    cloned.websites = [];
  }
  if (!nextSharing.location) {
    cloned.location = '';
    cloned.country = '';
    cloned.officeAddress = '';
    cloned.googleMapsUrl = '';
  }
  if (!nextSharing.birthday) {
    cloned.birthday = undefined;
  }
  if (!nextSharing.contactInfo) {
    cloned.customContacts = [];
  } else if (Array.isArray(cloned.customContacts)) {
    cloned.customContacts = filterVisibleItems(cloned.customContacts).filter((c) => {
      if (!nextSharing.phone && (c.type === 'phone' || c.type === 'whatsapp')) return false;
      if (!nextSharing.email && c.type === 'email') return false;
      if (!nextSharing.website && c.type === 'website') return false;
      if (!nextSharing.location && c.type === 'location') return false;
      return true;
    });
  }

  // Social links
  if (!nextSharing.socialLinks) {
    cloned.socials = [];
    cloned.socialLinks = [];
    cloned.links = [];
  } else {
    cloned.socials = filterVisibleItems(cloned.socials);
    cloned.socialLinks = filterVisibleItems(cloned.socialLinks);
  }

  // Career & extended sections (filter individual visible !== false items consistently)
  cloned.skills = nextSharing.skills ? filterVisibleItems(cloned.skills) : [];
  cloned.services = nextSharing.services ? filterVisibleItems(cloned.services) : [];
  if (!nextSharing.experience) {
    cloned.experiences = [];
    cloned.experience = [];
  } else {
    cloned.experiences = filterVisibleItems(cloned.experiences);
    cloned.experience = filterVisibleItems(cloned.experience);
  }
  cloned.education = nextSharing.education ? filterVisibleItems(cloned.education) : [];
  cloned.projects = nextSharing.projects ? filterVisibleItems(cloned.projects) : [];
  cloned.certifications = nextSharing.certifications ? filterVisibleItems(cloned.certifications) : [];
  if (!nextSharing.resume) {
    cloned.resumeUrl = undefined;
    cloned.resumeFileName = undefined;
  }
  cloned.featured = nextSharing.featured ? filterVisibleItems(cloned.featured) : [];
  cloned.languages = nextSharing.languages ? filterVisibleItems(cloned.languages) : [];
  if (!nextSharing.volunteer) {
    cloned.volunteer = [];
    cloned.volunteerExperiences = [];
  } else {
    cloned.volunteer = filterVisibleItems(cloned.volunteer);
    cloned.volunteerExperiences = filterVisibleItems(cloned.volunteerExperiences);
  }
  if (!nextSharing.recommendations) {
    cloned.recommendations = [];
    cloned.testimonials = [];
  } else {
    cloned.recommendations = filterVisibleItems(cloned.recommendations);
    cloned.testimonials = filterVisibleItems(cloned.testimonials);
  }
  if (!nextSharing.honorsAwards) {
    cloned.honors = [];
    cloned.honorsAwards = [];
  } else {
    cloned.honors = filterVisibleItems(cloned.honors);
    cloned.honorsAwards = filterVisibleItems(cloned.honorsAwards);
  }
  cloned.publications = nextSharing.publications ? filterVisibleItems(cloned.publications) : [];
  cloned.patents = nextSharing.patents ? filterVisibleItems(cloned.patents) : [];
  cloned.courses = nextSharing.courses ? filterVisibleItems(cloned.courses) : [];
  cloned.testScores = nextSharing.testScores ? filterVisibleItems(cloned.testScores) : [];
  cloned.organizations = nextSharing.organizations ? filterVisibleItems(cloned.organizations) : [];
  cloned.interests = nextSharing.interests ? filterVisibleItems(cloned.interests) : [];
  if (!nextSharing.companySection) {
    cloned.companyInfo = undefined;
    cloned.teamMembers = [];
  }
  if (!nextSharing.nfcCard) {
    cloned.nfcCard = undefined;
  } else if (cloned.nfcCard) {
    cloned.nfcCard = {
      cardNumber: cloned.nfcCard.cardNumber,
      chipId: '',
      finish: cloned.nfcCard.finish
    };
  }

  // Custom fields: evaluate each custom field individually (or generic customFields if present without specific ids)
  const hasAnyExplicitCustomKey = Array.from(requestedSet).some((k) => k.startsWith('custom-field-'));
  const allowAllSafeCustomFields = requestedSet.has('customFields') && !hasAnyExplicitCustomKey;

  if (Array.isArray(cloned.customFields)) {
    cloned.customFields = cloned.customFields.filter((cf) => {
      if (!cf || cf.visible === false || (cf as any).isPublic === false) return false;
      const cfKey = `custom-field-${cf.id}`;
      const label = cf.label || (cf as any).title || '';
      if (isSensitiveNeverShareLabel(label)) return false;
      const privacy = getFieldPrivacyTier(profile, cfKey);
      if (privacy === 'never_share') return false;
      if (isFieldOwnerHidden(profile, cfKey)) return false;

      if (hasAnyExplicitCustomKey) {
        return requestedSet.has(cfKey);
      }
      if (allowAllSafeCustomFields) {
        return privacy === 'normal';
      }
      return false;
    });
    nextSharing.customFields = cloned.customFields.length > 0;
  } else {
    cloned.customFields = [];
    nextSharing.customFields = false;
  }

  // Build strict sectionVisibility map matching authorized fields
  const nextVisibility: Record<string, boolean> = {
    hero: true,
    profile: Boolean(nextSharing.photo || nextSharing.coverImage || nextSharing.nameAndTitle),
    about: Boolean(nextSharing.bio || nextSharing.introductionMedia),
    personalDetails: Boolean(nextSharing.bio || nextSharing.introductionMedia),
    contact: Boolean(nextSharing.contactInfo),
    contactInfo: Boolean(nextSharing.contactInfo),
    skills: Boolean(nextSharing.skills),
    services: Boolean(nextSharing.services),
    projects: Boolean(nextSharing.projects),
    portfolio: Boolean(nextSharing.projects),
    experience: Boolean(nextSharing.experience),
    education: Boolean(nextSharing.education),
    certifications: Boolean(nextSharing.certifications),
    certificates: Boolean(nextSharing.certifications),
    languages: Boolean(nextSharing.languages),
    socialLinks: Boolean(nextSharing.socialLinks),
    socials: Boolean(nextSharing.socialLinks),
    featured: Boolean(nextSharing.featured),
    volunteer: Boolean(nextSharing.volunteer),
    volunteerExperiences: Boolean(nextSharing.volunteer),
    recommendations: Boolean(nextSharing.recommendations),
    honorsAwards: Boolean(nextSharing.honorsAwards),
    honors: Boolean(nextSharing.honorsAwards),
    publications: Boolean(nextSharing.publications),
    patents: Boolean(nextSharing.patents),
    courses: Boolean(nextSharing.courses),
    testScores: Boolean(nextSharing.testScores),
    organizations: Boolean(nextSharing.organizations),
    interests: Boolean(nextSharing.interests),
    company: Boolean(nextSharing.companySection),
    companyInfo: Boolean(nextSharing.companySection),
    team: Boolean(nextSharing.companySection),
    teamMembers: Boolean(nextSharing.companySection),
    'virtual-card': Boolean(nextSharing.nfcCard),
    virtualCard: Boolean(nextSharing.nfcCard),
    'custom-fields': Boolean(nextSharing.customFields),
    customFields: Boolean(nextSharing.customFields),
    introductionMedia: Boolean(nextSharing.introductionMedia),
    backgrounds: false
  };

  for (const cf of cloned.customFields) {
    nextVisibility[`custom-field-${cf.id}`] = true;
  }

  cloned.sharingSettings = nextSharing;
  cloned.sectionVisibility = nextVisibility;
  cloned.sectionOrder = (profile.sectionOrder || DEFAULT_SECTION_ORDER).filter((sec) => {
    const canon = normalizeSectionKey(sec);
    return nextVisibility[canon] !== false;
  });

  // Never keep private dynamicSections unless customFields enabled
  if (!nextSharing.customFields && !nextSharing.bio) {
    cloned.dynamicSections = [];
  }

  return cloned;
}

/**
 * Helper summarizing items excluded due to privacy or template selection (for UI messages like SH4).
 */
export function summarizeShareExclusions(
  profile: ProfileData,
  selectedFields: string[]
): {
  includedCount: number;
  neverShareFields: string[];
  excludedNormalLabels: string[];
} {
  const selectedSet = new Set(selectedFields);
  const neverShareFields: string[] = [];
  const excludedNormalLabels: string[] = [];

  for (const f of SHAREABLE_FIELDS) {
    const privacy = getFieldPrivacyTier(profile, f.key);
    if (privacy === 'never_share') {
      neverShareFields.push(f.label);
    } else if (!selectedSet.has(f.key)) {
      excludedNormalLabels.push(f.label);
    }
  }

  if (Array.isArray(profile.customFields)) {
    for (const cf of profile.customFields) {
      const cfKey = `custom-field-${cf.id}`;
      const label = cf.label || (cf as any).title || 'Custom field';
      if (getFieldPrivacyTier(profile, cfKey) === 'never_share') {
        neverShareFields.push(label);
      }
    }
  }

  return {
    includedCount: selectedFields.length,
    neverShareFields,
    excludedNormalLabels
  };
}
