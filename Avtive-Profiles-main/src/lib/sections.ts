/**
 * Canonical Section Map and Aliases
 * ---------------------------------
 * Single source of truth for canonical section keys, aliases, and role-based defaults.
 */

export const CANONICAL_SECTION_ALIASES: Record<string, string> = {
  about: 'personalDetails',
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
  enhanceProfile: 'virtualCard'
};

export function normalizeSectionKey(key: string): string {
  if (!key) return '';
  if (key.startsWith('custom-field-')) return key;
  return CANONICAL_SECTION_ALIASES[key] || key;
}

export const INDIVIDUAL_DEFAULT_SECTION_ORDER: string[] = [
  'personalDetails',
  'contactInfo',
  'skills',
  'projects',
  'customFields',
  'experience',
  'education',
  'certifications',
  'languages',
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
      if (rawKey === 'recommendations') continue;
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
