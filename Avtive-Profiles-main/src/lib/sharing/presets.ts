import { CustomFieldItem, PrivacyTier, ProfileData, DEFAULT_SHARING_SETTINGS } from '@/types/profile';
import {
  ShareFieldDefinition,
  SharePresetKey,
  ShareTemplateRecord
} from '@/types/sharing';
import { isCanonicalSectionVisible, normalizeSectionKey } from '@/lib/sections';

/**
 * Never Share pattern detector for confidential financial details, government IDs,
 * private credentials, and confidential records.
 */
export const NEVER_SHARE_KEYWORD_PATTERN =
  /\b(bank|iban|swift|bic|routing|account\s*(?:no|num|number)|sort\s*code|credit\s*card|debit\s*card|cvv|ssn|social\s*security|passport|national\s*id|cnic|aadhaar|tin|tax\s*id|driver.?s?\s*licen[cs]e|pin\s*code|secret\s*key|private\s*key|api\s*key|recovery\s*code|password|confidential|salary)\b/i;

export const SYSTEM_NEVER_SHARE_INTERNAL_KEYS = new Set<string>([
  'passwordHash',
  'recoveryCodeHash',
  'resetToken',
  'googleSub',
  'userId',
  'avatarPublicId',
  'coverImagePublicId',
  'chipId',
  'nfcCard.chipId',
  'internalNotes'
]);

export function isSensitiveNeverShareLabel(label?: string): boolean {
  if (!label || typeof label !== 'string') return false;
  return NEVER_SHARE_KEYWORD_PATTERN.test(label);
}

export const SHAREABLE_FIELD_GROUPS: Array<{
  id: ShareFieldDefinition['group'];
  label: string;
}> = [
    { id: 'basics', label: 'Profile Basics' },
    { id: 'about', label: 'About & Media' },
    { id: 'contact', label: 'Contact & Personal Details' },
    { id: 'career', label: 'Career & Credentials' },
    { id: 'extended', label: 'Additional Sections' },
    { id: 'custom', label: 'Custom Fields' }
  ];

export const SHAREABLE_FIELDS: ShareFieldDefinition[] = [
  // Basics
  {
    key: 'photo',
    label: 'Profile Photo',
    group: 'basics',
    defaultPrivacy: 'normal',
    canonicalSection: 'profile',
    sharingSettingsKey: 'photo'
  },
  {
    key: 'coverImage',
    label: 'Cover Photo',
    group: 'basics',
    defaultPrivacy: 'normal',
    canonicalSection: 'profile',
    sharingSettingsKey: 'coverImage'
  },
  {
    key: 'name',
    label: 'Full Name',
    group: 'basics',
    defaultPrivacy: 'normal',
    canonicalSection: 'profile',
    sharingSettingsKey: 'nameAndTitle'
  },
  {
    key: 'title',
    label: 'Designation & Title',
    group: 'basics',
    defaultPrivacy: 'normal',
    canonicalSection: 'profile',
    sharingSettingsKey: 'nameAndTitle'
  },

  // About & Media
  {
    key: 'bio',
    label: 'Biography & Tagline',
    group: 'about',
    defaultPrivacy: 'normal',
    canonicalSection: 'personalDetails',
    sharingSettingsKey: 'bio'
  },
  {
    key: 'introductionMedia',
    label: 'Voice / Video Introduction',
    group: 'about',
    defaultPrivacy: 'normal',
    canonicalSection: 'personalDetails',
    sharingSettingsKey: 'introductionMedia'
  },

  // Contact & Personal
  {
    key: 'phone',
    label: 'Phone & WhatsApp',
    group: 'contact',
    defaultPrivacy: 'normal',
    canonicalSection: 'contactInfo',
    sharingSettingsKey: 'phone'
  },
  {
    key: 'email',
    label: 'Email Address',
    group: 'contact',
    defaultPrivacy: 'normal',
    canonicalSection: 'contactInfo',
    sharingSettingsKey: 'email'
  },
  {
    key: 'website',
    label: 'Website(s)',
    group: 'contact',
    defaultPrivacy: 'normal',
    canonicalSection: 'contactInfo',
    sharingSettingsKey: 'website'
  },
  {
    key: 'location',
    label: 'Location & Office Address',
    group: 'contact',
    defaultPrivacy: 'normal',
    canonicalSection: 'contactInfo',
    sharingSettingsKey: 'location'
  },
  {
    key: 'socialLinks',
    label: 'Social Links',
    group: 'contact',
    defaultPrivacy: 'normal',
    canonicalSection: 'socialLinks',
    sharingSettingsKey: 'socialLinks'
  },
  {
    key: 'pronouns',
    label: 'Pronouns',
    group: 'contact',
    defaultPrivacy: 'private',
    canonicalSection: 'profile',
    sharingSettingsKey: 'pronouns',
    description: 'Excluded by default unless explicitly confirmed'
  },
  {
    key: 'birthday',
    label: 'Birthday',
    group: 'contact',
    defaultPrivacy: 'private',
    canonicalSection: 'contactInfo',
    sharingSettingsKey: 'birthday',
    description: 'Private personal date — requires confirmation'
  },

  // Career & Credentials
  {
    key: 'experience',
    label: 'Work Experience',
    group: 'career',
    defaultPrivacy: 'normal',
    canonicalSection: 'experience',
    sharingSettingsKey: 'experience'
  },
  {
    key: 'education',
    label: 'Education',
    group: 'career',
    defaultPrivacy: 'normal',
    canonicalSection: 'education',
    sharingSettingsKey: 'education'
  },
  {
    key: 'skills',
    label: 'Skills',
    group: 'career',
    defaultPrivacy: 'normal',
    canonicalSection: 'skills',
    sharingSettingsKey: 'skills'
  },
  {
    key: 'services',
    label: 'Services',
    group: 'career',
    defaultPrivacy: 'normal',
    canonicalSection: 'services',
    sharingSettingsKey: 'services'
  },
  {
    key: 'projects',
    label: 'Projects & Portfolio',
    group: 'career',
    defaultPrivacy: 'normal',
    canonicalSection: 'projects',
    sharingSettingsKey: 'projects'
  },
  {
    key: 'certifications',
    label: 'Certifications',
    group: 'career',
    defaultPrivacy: 'normal',
    canonicalSection: 'certifications',
    sharingSettingsKey: 'certifications'
  },
  {
    key: 'resume',
    label: 'CV / Executive Resume',
    group: 'career',
    defaultPrivacy: 'normal',
    canonicalSection: 'personalDetails',
    sharingSettingsKey: 'resume'
  },

  // Extended
  {
    key: 'featured',
    label: 'Featured Links & Posts',
    group: 'extended',
    defaultPrivacy: 'normal',
    canonicalSection: 'featured',
    sharingSettingsKey: 'featured'
  },
  {
    key: 'languages',
    label: 'Languages',
    group: 'extended',
    defaultPrivacy: 'normal',
    canonicalSection: 'languages',
    sharingSettingsKey: 'languages'
  },
  {
    key: 'volunteer',
    label: 'Volunteer Experience',
    group: 'extended',
    defaultPrivacy: 'normal',
    canonicalSection: 'volunteer',
    sharingSettingsKey: 'volunteer'
  },
  {
    key: 'recommendations',
    label: 'Recommendations',
    group: 'extended',
    defaultPrivacy: 'normal',
    canonicalSection: 'recommendations',
    sharingSettingsKey: 'recommendations'
  },
  {
    key: 'honorsAwards',
    label: 'Honors & Awards',
    group: 'extended',
    defaultPrivacy: 'normal',
    canonicalSection: 'honorsAwards',
    sharingSettingsKey: 'honorsAwards'
  },
  {
    key: 'publications',
    label: 'Publications',
    group: 'extended',
    defaultPrivacy: 'normal',
    canonicalSection: 'publications',
    sharingSettingsKey: 'publications'
  },
  {
    key: 'patents',
    label: 'Patents',
    group: 'extended',
    defaultPrivacy: 'normal',
    canonicalSection: 'patents',
    sharingSettingsKey: 'patents'
  },
  {
    key: 'courses',
    label: 'Courses',
    group: 'extended',
    defaultPrivacy: 'normal',
    canonicalSection: 'courses',
    sharingSettingsKey: 'courses'
  },
  {
    key: 'testScores',
    label: 'Test Scores',
    group: 'extended',
    defaultPrivacy: 'normal',
    canonicalSection: 'testScores',
    sharingSettingsKey: 'testScores'
  },
  {
    key: 'organizations',
    label: 'Organizations',
    group: 'extended',
    defaultPrivacy: 'normal',
    canonicalSection: 'organizations',
    sharingSettingsKey: 'organizations'
  },
  {
    key: 'interests',
    label: 'Interests',
    group: 'extended',
    defaultPrivacy: 'normal',
    canonicalSection: 'interests',
    sharingSettingsKey: 'interests'
  },
  {
    key: 'companySection',
    label: 'Company & Team Details',
    group: 'extended',
    defaultPrivacy: 'normal',
    canonicalSection: 'companyInfo',
    sharingSettingsKey: 'companySection'
  },
  {
    key: 'nfcCard',
    label: 'Virtual Business Card',
    group: 'extended',
    defaultPrivacy: 'normal',
    canonicalSection: 'virtualCard',
    sharingSettingsKey: 'nfcCard'
  }
];

export const SHAREABLE_FIELD_MAP: Record<string, ShareFieldDefinition> = Object.fromEntries(
  SHAREABLE_FIELDS.map((f) => [f.key, f])
);

/**
 * Resolve effective PrivacyTier for any field or custom-field item on a profile.
 */
export function getFieldPrivacyTier(profile: ProfileData, fieldKey: string): PrivacyTier {
  if (SYSTEM_NEVER_SHARE_INTERNAL_KEYS.has(fieldKey)) {
    return 'never_share';
  }

  // Individual custom field check (`custom-field-<id>`)
  if (fieldKey.startsWith('custom-field-')) {
    const cfId = fieldKey.replace('custom-field-', '');
    const cf = (profile.customFields || []).find((c) => c.id === cfId);
    const label = cf?.label || (cf as any)?.title || '';
    if (isSensitiveNeverShareLabel(label)) {
      return 'never_share';
    }
    const explicit = profile.fieldPrivacy?.[fieldKey] || cf?.privacy;
    if (explicit) return explicit;
    return 'normal';
  }

  const explicit = profile.fieldPrivacy?.[fieldKey];
  if (explicit === 'never_share') return 'never_share';
  if (explicit === 'private') return 'private';
  if (explicit === 'normal') return 'normal';

  const def = SHAREABLE_FIELD_MAP[fieldKey];
  if (def) {
    return def.defaultPrivacy;
  }

  if (isSensitiveNeverShareLabel(fieldKey)) {
    return 'never_share';
  }

  return 'normal';
}

/**
 * Determine whether the owner has independently hidden a field/section on their main profile.
 * Note: default-private fields like `pronouns`/`birthday` (`DEFAULT_SHARING_SETTINGS.* === false`)
 * are NOT treated as globally hidden if the owner explicitly authorizes them in a targeted Share Link,
 * UNLESS their parent section was explicitly turned off in sectionVisibility or they are never_share.
 */
export function isFieldOwnerHidden(profile: ProfileData, fieldKey: string): boolean {
  const visibility = profile.sectionVisibility || {};
  const sharing = profile.sharingSettings || DEFAULT_SHARING_SETTINGS;

  if (fieldKey.startsWith('custom-field-')) {
    const cfId = fieldKey.replace('custom-field-', '');
    const cf = (profile.customFields || []).find((c) => c.id === cfId);
    if (!cf || cf.visible === false || (cf as any).isPublic === false) return true;
    return !isCanonicalSectionVisible(visibility, sharing, 'customFields');
  }

  const def = SHAREABLE_FIELD_MAP[fieldKey];
  if (!def) {
    if (fieldKey === 'customFields') {
      return !isCanonicalSectionVisible(visibility, sharing, 'customFields');
    }
    return false;
  }

  // Check section visibility override
  if (def.canonicalSection !== 'profile') {
    if (!isCanonicalSectionVisible(visibility, sharing, def.canonicalSection)) {
      return true;
    }
  } else if (fieldKey === 'photo' && (visibility.photo === false || sharing.photo === false)) {
    return true;
  } else if (
    fieldKey === 'coverImage' &&
    ((sharing as any).coverImage === false || visibility.coverImage === false || (visibility as any).cover === false)
  ) {
    return true;
  } else if ((fieldKey === 'name' || fieldKey === 'title') && sharing.nameAndTitle === false) {
    return true;
  }

  // Check field-level sharingSettings disable (except default-private pronouns/birthday which live in Permissible Private tier)
  if (
    def.sharingSettingsKey &&
    def.defaultPrivacy !== 'private' &&
    (sharing as Record<string, any>)[def.sharingSettingsKey] === false
  ) {
    return true;
  }

  return false;
}

/**
 * Inspect whether a field currently has data populated on the profile.
 */
export function hasFieldValue(profile: ProfileData, fieldKey: string): boolean {
  if (fieldKey.startsWith('custom-field-')) {
    const cfId = fieldKey.replace('custom-field-', '');
    const cf = (profile.customFields || []).find((c) => c.id === cfId);
    return Boolean(cf && (cf.value || (cf as any).content || cf.label));
  }

  switch (fieldKey) {
    case 'photo':
      return Boolean(
        (profile.avatar && profile.avatar.trim()) ||
        ((profile as any).logoUrl && String((profile as any).logoUrl).trim()) ||
        (profile.companyLogo && profile.companyLogo.trim())
      );
    case 'coverImage':
      return Boolean(
        (profile.coverImage && profile.coverImage.trim()) ||
        ((profile as any).coverUrl && String((profile as any).coverUrl).trim())
      );
    case 'name': return Boolean(profile.name);
    case 'title': return Boolean(profile.designation || profile.professionalTitle || profile.profession || profile.headline);
    case 'bio': return Boolean(profile.bio || profile.shortBio || profile.about || profile.fullBio || profile.tagline);
    case 'introductionMedia': return Boolean(profile.introductionMedia?.url);
    case 'phone': return Boolean(profile.phone || profile.whatsapp);
    case 'email': return Boolean(profile.email);
    case 'website': return Boolean(profile.website || (profile.websites && profile.websites.length > 0));
    case 'location': return Boolean(profile.location || profile.country || profile.officeAddress);
    case 'socialLinks': return Boolean((profile.socials && profile.socials.length > 0) || (profile.socialLinks && profile.socialLinks.length > 0));
    case 'pronouns': return Boolean(profile.pronouns);
    case 'birthday': return Boolean(profile.birthday);
    case 'experience': return Boolean((profile.experiences && profile.experiences.length > 0) || (profile.experience && profile.experience.length > 0));
    case 'education': return Boolean(profile.education && profile.education.length > 0);
    case 'skills': return Boolean(profile.skills && profile.skills.length > 0);
    case 'services': return Boolean(profile.services && profile.services.length > 0);
    case 'projects': return Boolean(profile.projects && profile.projects.length > 0);
    case 'certifications': return Boolean(profile.certifications && profile.certifications.length > 0);
    case 'resume': return Boolean(profile.resumeUrl || (profile.experiences && profile.experiences.length > 0) || profile.fullBio || profile.shortBio);
    case 'featured': return Boolean(profile.featured && profile.featured.length > 0);
    case 'languages': return Boolean(profile.languages && profile.languages.length > 0);
    case 'volunteer': return Boolean((profile.volunteer && profile.volunteer.length > 0) || (profile.volunteerExperiences && profile.volunteerExperiences.length > 0));
    case 'recommendations': return Boolean((profile.recommendations && profile.recommendations.length > 0) || (profile.testimonials && profile.testimonials.length > 0));
    case 'honorsAwards': return Boolean((profile.honorsAwards && profile.honorsAwards.length > 0) || (profile.honors && profile.honors.length > 0));
    case 'publications': return Boolean(profile.publications && profile.publications.length > 0);
    case 'patents': return Boolean(profile.patents && profile.patents.length > 0);
    case 'courses': return Boolean(profile.courses && profile.courses.length > 0);
    case 'testScores': return Boolean(profile.testScores && profile.testScores.length > 0);
    case 'organizations': return Boolean(profile.organizations && profile.organizations.length > 0);
    case 'interests': return Boolean(profile.interests && profile.interests.length > 0);
    case 'companySection': return Boolean(profile.companyInfo || (profile.teamMembers && profile.teamMembers.length > 0));
    case 'nfcCard': return true;
    case 'customFields': return Boolean(profile.customFields && profile.customFields.length > 0);
    default: return false;
  }
}

export function getCustomFieldDisplay(cf: CustomFieldItem, privacy: PrivacyTier): string {
  const val = cf.value || (cf as any).content || '';
  if (!val) return '';
  if (privacy === 'never_share' || privacy === 'private') {
    if (val.length <= 4) return '••••';
    return `${val.slice(0, 2)}••••${val.slice(-4)}`;
  }
  return val;
}

export const PRESET_DEFINITIONS: Record<
  SharePresetKey,
  {
    key: SharePresetKey;
    name: string;
    description: string;
    fields: string[];
  }
> = {
  everything: {
    key: 'everything',
    name: 'Everything',
    description: 'All sharable standard details on your profile. Private & Never Share items stay protected.',
    fields: SHAREABLE_FIELDS.filter((f) => f.defaultPrivacy === 'normal').map((f) => f.key)
  },
  general: {
    key: 'general',
    name: 'General',
    description: 'Default everyday card: photo, name, title, bio, email, phone, website, location, and social links.',
    fields: ['photo', 'name', 'title', 'bio', 'phone', 'email', 'website', 'location', 'socialLinks', 'nfcCard']
  },
  personal: {
    key: 'personal',
    name: 'Personal',
    description: 'Warm personal card: photo, cover, name, bio, intro media, direct phone, email, socials, languages, and interests.',
    fields: ['photo', 'coverImage', 'name', 'title', 'bio', 'introductionMedia', 'phone', 'email', 'socialLinks', 'languages', 'interests']
  },
  embedded_jobs: {
    key: 'embedded_jobs',
    name: 'Embedded Jobs',
    description: 'Tailored for hiring managers & recruiters: experience, skills, projects, education, certifications, and CV. Phone & address excluded.',
    fields: [
      'photo',
      'name',
      'title',
      'bio',
      'introductionMedia',
      'email',
      'website',
      'location',
      'socialLinks',
      'experience',
      'education',
      'skills',
      'projects',
      'certifications',
      'resume',
      'featured',
      'publications',
      'honorsAwards'
    ]
  }
};

export const BUILT_IN_TEMPLATES: ShareTemplateRecord[] = [
  {
    id: 'tpl-builtin-general',
    ownerUserId: 'system',
    name: 'General',
    description: PRESET_DEFINITIONS.general.description,
    isBuiltIn: true,
    presetKey: 'general',
    selectedFields: [...PRESET_DEFINITIONS.general.fields],
    selectedSections: ['profile', 'personalDetails', 'contactInfo', 'socialLinks', 'virtualCard'],
    lostAndFoundMode: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'tpl-builtin-personal',
    ownerUserId: 'system',
    name: 'Personal',
    description: PRESET_DEFINITIONS.personal.description,
    isBuiltIn: true,
    presetKey: 'personal',
    selectedFields: [...PRESET_DEFINITIONS.personal.fields],
    selectedSections: ['profile', 'personalDetails', 'contactInfo', 'socialLinks', 'languages', 'interests'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'tpl-builtin-embedded-jobs',
    ownerUserId: 'system',
    name: 'Embedded Jobs',
    description: PRESET_DEFINITIONS.embedded_jobs.description,
    isBuiltIn: true,
    presetKey: 'embedded_jobs',
    selectedFields: [...PRESET_DEFINITIONS.embedded_jobs.fields],
    selectedSections: [
      'profile',
      'personalDetails',
      'contactInfo',
      'socialLinks',
      'experience',
      'education',
      'skills',
      'projects',
      'certifications',
      'featured',
      'publications',
      'honorsAwards'
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

/**
 * Filter requested fields strictly against profile's Never Share & owner-hidden rules.
 * Used BOTH by UI preset application and authoritatively on the server during link/template creation.
 */
export function filterAuthorizedSelection(
  profile: ProfileData,
  requestedFields: string[],
  options?: { allowConfirmedPrivate?: boolean }
): {
  authorizedFields: string[];
  authorizedSections: string[];
  blockedNeverShare: string[];
  blockedHidden: string[];
} {
  const allowPrivate = options?.allowConfirmedPrivate !== false;
  const authorizedFields: string[] = [];
  const blockedNeverShare: string[] = [];
  const blockedHidden: string[] = [];
  const sectionSet = new Set<string>();

  const seen = new Set<string>();
  for (const field of requestedFields) {
    if (!field || typeof field !== 'string' || seen.has(field)) continue;
    seen.add(field);

    const privacy = getFieldPrivacyTier(profile, field);
    if (privacy === 'never_share') {
      blockedNeverShare.push(field);
      continue;
    }

    if (privacy === 'private' && !allowPrivate) {
      continue;
    }

    if (isFieldOwnerHidden(profile, field)) {
      blockedHidden.push(field);
      continue;
    }

    authorizedFields.push(field);

    if (field.startsWith('custom-field-')) {
      sectionSet.add('customFields');
      sectionSet.add(field);
    } else if (field === 'customFields') {
      sectionSet.add('customFields');
    } else {
      const def = SHAREABLE_FIELD_MAP[field];
      if (def?.canonicalSection) {
        sectionSet.add(normalizeSectionKey(def.canonicalSection));
      }
    }
  }

  return {
    authorizedFields,
    authorizedSections: Array.from(sectionSet),
    blockedNeverShare,
    blockedHidden
  };
}

/**
 * Compute initial permitted field selection for a preset on a given profile.
 * Never Share & Private & Hidden fields are strictly excluded from automatic presets.
 */
export function getPresetFieldsForProfile(
  profile: ProfileData,
  presetKey: SharePresetKey
): string[] {
  const candidateFields = [...PRESET_DEFINITIONS[presetKey].fields];

  if (presetKey === 'everything' && Array.isArray(profile.customFields)) {
    for (const cf of profile.customFields) {
      if (cf?.id) {
        candidateFields.push(`custom-field-${cf.id}`);
      }
    }
  }

  const { authorizedFields } = filterAuthorizedSelection(profile, candidateFields, {
    allowConfirmedPrivate: false
  });

  // For 'general' / 'personal' / 'embedded_jobs', keep fields even if profile has empty placeholder only when user wants them, OR prioritize populated fields:
  // Always keep core identity keys if authorized, plus any populated field in the preset
  return authorizedFields.filter((f) => {
    if (['photo', 'name', 'title', 'bio', 'email', 'phone', 'website', 'socialLinks', 'nfcCard'].includes(f)) {
      return true;
    }
    return hasFieldValue(profile, f) || presetKey !== 'everything';
  });
}

export function getAllAvailableShareFieldKeys(profile: ProfileData): string[] {
  const keys = SHAREABLE_FIELDS.map((f) => f.key);
  if (Array.isArray(profile.customFields)) {
    for (const cf of profile.customFields) {
      if (cf?.id) keys.push(`custom-field-${cf.id}`);
    }
  }
  return keys;
}
