/**
 * Canonical Section Map and Aliases
 * ---------------------------------
 * Single source of truth for canonical section keys, aliases, and role-based defaults.
 */

export const CANONICAL_SECTION_ALIASES: Record<string, string> = {
  about: 'personalDetails',
  personal: 'personalDetails',
  personalDetails: 'personalDetails',
  contact: 'contactInfo',
  contactInfo: 'contactInfo',
  'custom-fields': 'customFields',
  customFields: 'customFields',
  services: 'skills',
  skills: 'skills',
  portfolio: 'projects',
  projects: 'projects',
  socials: 'socialLinks',
  socialLinks: 'socialLinks',
  certificates: 'certifications',
  certifications: 'certifications',
  company: 'companyInfo',
  companyInfo: 'companyInfo',
  team: 'teamMembers',
  teamMembers: 'teamMembers',
  'virtual-card': 'virtualCard',
  virtualCard: 'virtualCard',
  nfc: 'virtualCard',
  nfcCard: 'virtualCard',
  enhanceProfile: 'customFields',
  expertise: 'skills',
  languages: 'languages',
  experience: 'experience',
  education: 'education',
  hero: 'profile',
  profile: 'profile',
  volunteer: 'volunteer',
  volunteerExperiences: 'volunteer',
  recommendations: 'recommendations',
  featured: 'featured',
  honorsAwards: 'honorsAwards',
  honors: 'honorsAwards',
  awards: 'honorsAwards',
  publications: 'publications',
  patents: 'patents',
  courses: 'courses',
  testScores: 'testScores',
  scores: 'testScores',
  organizations: 'organizations',
  interests: 'interests'
};

export const CANONICAL_TO_PRIMARY_ALIASES: Record<string, string[]> = {
  personalDetails: ['about', 'personal'],
  contactInfo: ['contact'],
  customFields: ['custom-fields', 'enhanceProfile'],
  skills: ['services', 'expertise'],
  projects: ['portfolio'],
  socialLinks: ['socials'],
  certifications: ['certificates'],
  companyInfo: ['company'],
  teamMembers: ['team'],
  virtualCard: ['virtual-card', 'nfc', 'nfcCard'],
  volunteer: ['volunteerExperiences'],
  honorsAwards: ['honors', 'awards'],
  testScores: ['scores']
};

export const SECTION_TO_SHARING_KEY: Record<string, string> = {
  personalDetails: 'bio',
  contactInfo: 'contactInfo',
  skills: 'skills',
  projects: 'projects',
  experience: 'experience',
  education: 'education',
  certifications: 'certifications',
  languages: 'languages',
  socialLinks: 'socialLinks',
  customFields: 'customFields',
  virtualCard: 'nfcCard',
  companyInfo: 'companySection',
  teamMembers: 'companySection',
  volunteer: 'volunteer',
  recommendations: 'recommendations',
  featured: 'featured',
  honorsAwards: 'honorsAwards',
  publications: 'publications',
  patents: 'patents',
  courses: 'courses',
  testScores: 'testScores',
  organizations: 'organizations',
  interests: 'interests'
};

export function normalizeSectionKey(key: string): string {
  if (!key) return '';
  if (key.startsWith('custom-field-')) return key;
  return CANONICAL_SECTION_ALIASES[key] || key;
}

export function isCanonicalSectionVisible(
  visibility: Record<string, boolean> | undefined,
  sharing: any | undefined,
  rawKey: string
): boolean {
  if (!rawKey) return true;
  const canonical = normalizeSectionKey(rawKey);

  if (visibility && typeof visibility[canonical] === 'boolean') {
    return visibility[canonical];
  }

  if (visibility && typeof visibility[rawKey] === 'boolean') {
    return visibility[rawKey];
  }

  const aliases = CANONICAL_TO_PRIMARY_ALIASES[canonical];
  if (visibility && aliases) {
    for (const alias of aliases) {
      if (typeof visibility[alias] === 'boolean') {
        return visibility[alias];
      }
    }
  }

  const sharingKey = SECTION_TO_SHARING_KEY[canonical];
  if (sharing && sharingKey && typeof sharing[sharingKey] === 'boolean') {
    return sharing[sharingKey];
  }

  return true;
}

export function reconcileSectionVisibility(
  rawVisibility?: Record<string, boolean>,
  sharing?: any
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  const allCanonical = [
    'personalDetails',
    'contactInfo',
    'featured',
    'skills',
    'projects',
    'experience',
    'education',
    'certifications',
    'volunteer',
    'honorsAwards',
    'publications',
    'patents',
    'courses',
    'testScores',
    'organizations',
    'languages',
    'recommendations',
    'interests',
    'customFields',
    'socialLinks',
    'virtualCard',
    'companyInfo',
    'teamMembers'
  ];

  for (const canon of allCanonical) {
    const isVisible = isCanonicalSectionVisible(rawVisibility, sharing, canon);
    result[canon] = isVisible;
    const aliases = CANONICAL_TO_PRIMARY_ALIASES[canon];
    if (aliases) {
      for (const alias of aliases) {
        result[alias] = isVisible;
      }
    }
  }

  // Preserve any custom field keys
  if (rawVisibility) {
    for (const [key, val] of Object.entries(rawVisibility)) {
      if (key.startsWith('custom-field-')) {
        result[key] = val;
      }
    }
  }

  return result;
}

export function toggleCanonicalSectionVisibility(
  currentVisibility: Record<string, boolean>,
  sectionKey: string
): {
  nextVisibility: Record<string, boolean>;
  nextSharingPatch: Record<string, boolean>;
  canonicalKey: string;
  nextValue: boolean;
} {
  const canonical = normalizeSectionKey(sectionKey);
  const current = currentVisibility[canonical] !== false && currentVisibility[sectionKey] !== false;
  const nextVal = !current;

  const nextVisibility: Record<string, boolean> = {
    ...currentVisibility,
    [canonical]: nextVal,
    [sectionKey]: nextVal
  };

  const aliases = CANONICAL_TO_PRIMARY_ALIASES[canonical];
  if (aliases) {
    for (const alias of aliases) {
      nextVisibility[alias] = nextVal;
    }
  }

  const sharingKey = SECTION_TO_SHARING_KEY[canonical];
  const nextSharingPatch: Record<string, boolean> = {};
  if (sharingKey) {
    nextSharingPatch[sharingKey] = nextVal;
  }
  if (canonical === 'skills') {
    nextSharingPatch.services = nextVal;
  }

  return {
    nextVisibility,
    nextSharingPatch,
    canonicalKey: canonical,
    nextValue: nextVal
  };
}

export const INDIVIDUAL_DEFAULT_SECTION_ORDER: string[] = [
  'personalDetails',
  'contactInfo',
  'featured',
  'skills',
  'projects',
  'experience',
  'education',
  'certifications',
  'volunteer',
  'honorsAwards',
  'publications',
  'patents',
  'courses',
  'testScores',
  'organizations',
  'languages',
  'recommendations',
  'interests',
  'customFields',
  'socialLinks',
  'virtualCard'
];

export const COMPANY_DEFAULT_SECTION_ORDER: string[] = [
  'companyInfo',
  'teamMembers',
  'contactInfo',
  'skills',
  'projects',
  'customFields',
  'socialLinks',
  'virtualCard'
];

export function getCanonicalSectionOrder(
  existingOrder?: string[],
  profileType: 'individual' | 'team' | string = 'individual',
  extraKeys?: string[]
): string[] {
  const isCompany = profileType === 'team';
  const defaults = isCompany ? COMPANY_DEFAULT_SECTION_ORDER : INDIVIDUAL_DEFAULT_SECTION_ORDER;
  const result: string[] = [];
  const seen = new Set<string>();

  if (Array.isArray(existingOrder)) {
    for (const rawKey of existingOrder) {
      if (!rawKey || typeof rawKey !== 'string') continue;
      if (rawKey === 'hero' || rawKey === 'profile') continue;
      const key = normalizeSectionKey(rawKey);
      if (!isCompany && (key === 'companyInfo' || key === 'teamMembers')) continue;
      if (isCompany && (key === 'personalDetails' || key === 'experience' || key === 'education' || key === 'certifications' || key === 'languages')) continue;

      if (!seen.has(key)) {
        seen.add(key);
        result.push(key);
      }
    }
  }

  for (const defaultKey of defaults) {
    if (!seen.has(defaultKey)) {
      seen.add(defaultKey);
      result.push(defaultKey);
    }
  }

  if (Array.isArray(extraKeys)) {
    for (const extraKey of extraKeys) {
      if (!extraKey || typeof extraKey !== 'string') continue;
      const key = normalizeSectionKey(extraKey);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(key);
      }
    }
  }

  return result;
}

/**
 * Single canonical sharing helper for contact and profile fields.
 * Used across the editor toggle, owner preview, public Contact component, and sanitizeProfileForPublic.
 * - Explicit false strictly marks the field private.
 * - Unset (undefined/null) defaults to true for email and phone (matching DEFAULT_SHARING_SETTINGS).
 * - Honors overall contact section visibility.
 */
export function isFieldShared(
  profile?: { sharingSettings?: any; sectionVisibility?: Record<string, boolean> } | null,
  field: 'phone' | 'email' | 'whatsapp' | 'website' | 'location' | 'officeAddress' | string = 'phone'
): boolean {
  if (!profile) return true;
  const isContactVisible = isCanonicalSectionVisible(profile.sectionVisibility, profile.sharingSettings, 'contactInfo');
  if (!isContactVisible) return false;

  const sharing = profile.sharingSettings || {};
  if (field === 'phone' || field === 'whatsapp') {
    return sharing.phone !== false;
  }
  if (field === 'email') {
    return sharing.email !== false;
  }
  if (field === 'birthday' || field === 'pronouns') {
    return sharing[field] === true;
  }
  return true;
}

