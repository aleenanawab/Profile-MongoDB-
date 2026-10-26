import { ProfileData } from '@/types/profile';
import { normalizeSectionKey } from '@/lib/sections';

export type FieldKind = 'primitive' | 'nested_object' | 'array' | 'server_only';

export const FIELD_CLASSIFICATIONS = {
  // Server-only / Identifiers (never compared for user edit dirtiness)
  id: 'server_only',
  userId: 'server_only',
  createdAt: 'server_only',
  updatedAt: 'server_only',
  companyId: 'server_only',
  companyName: 'server_only',

  // Primitives & Text fields
  name: 'primitive',
  firstName: 'primitive',
  secondName: 'primitive',
  lastName: 'primitive',
  designation: 'primitive',
  professionalTitle: 'primitive',
  profession: 'primitive',
  department: 'primitive',
  company: 'primitive',
  companyLogo: 'primitive',
  tagline: 'primitive',
  coverSlogan: 'primitive',
  avatar: 'primitive',
  avatarPublicId: 'primitive',
  coverImage: 'primitive',
  coverImagePublicId: 'primitive',
  verified: 'primitive',
  pronouns: 'primitive',
  birthday: 'primitive',
  location: 'primitive',
  country: 'primitive',
  bio: 'primitive',
  about: 'primitive',
  shortBio: 'primitive',
  fullBio: 'primitive',
  statusBadge: 'primitive',
  phone: 'primitive',
  whatsapp: 'primitive',
  email: 'primitive',
  website: 'primitive',
  officeAddress: 'primitive',
  googleMapsUrl: 'primitive',
  resumeUrl: 'primitive',
  resumeFileName: 'primitive',
  profileName: 'primitive',
  slug: 'primitive',
  username: 'primitive',
  type: 'primitive',
  profileType: 'primitive',
  theme: 'primitive',
  buttonRadius: 'primitive',
  buttonStyle: 'primitive',
  followersCount: 'primitive',
  connectionsCount: 'primitive',

  // Nested Plain Objects (diffed with dot-paths)
  customThemeColors: 'nested_object',
  customCta: 'nested_object',
  companyInfo: 'nested_object',
  nfcCard: 'nested_object',
  sharingSettings: 'nested_object',
  sectionVisibility: 'nested_object',

  // Arrays (diffed by normalized content)
  skills: 'array',
  services: 'array',
  projects: 'array',
  experience: 'array',
  experiences: 'array',
  education: 'array',
  certifications: 'array',
  languages: 'array',
  socials: 'array',
  socialLinks: 'array',
  customFields: 'array',
  dynamicSections: 'array',
  sectionOrder: 'array',
  highlights: 'array',
  volunteerExperiences: 'array',
  recommendations: 'array',
  testimonials: 'array',
  teamMembers: 'array',
  links: 'array',
  contactOrder: 'array',
  customContacts: 'array'
} as const satisfies Record<keyof ProfileData, FieldKind>;

/**
 * Normalizes a string for comparison: trim, treat null/undefined/"" identically.
 */
export function normStr(v: any): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

/**
 * Normalizes a primitive value (boolean, string, number).
 */
export function arePrimitivesEqual(a: any, b: any): boolean {
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return Boolean(a) === Boolean(b);
  }
  if (typeof a === 'number' || typeof b === 'number') {
    if (isNaN(a) && isNaN(b)) return true;
    return a === b;
  }
  return normStr(a) === normStr(b);
}

/**
 * Normalize skills into a uniform array of trimmed strings.
 */
export function normalizeSkills(skills: any): string[] {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((s) => (typeof s === 'string' ? s.trim() : s?.name?.trim() || ''))
    .filter(Boolean);
}

/**
 * Deep normalize an item for order-sensitive array comparison.
 * Strips server metadata, trims strings, normalizes null/undefined.
 */
export function normalizeArrayItem(item: any): any {
  if (item === null || item === undefined) return null;
  if (typeof item === 'string') return item.trim();
  if (typeof item === 'number' || typeof item === 'boolean') return item;
  if (Array.isArray(item)) {
    return item.map(normalizeArrayItem);
  }
  if (typeof item === 'object') {
    const cleaned: Record<string, any> = {};
    const itemCopy = { ...item };
    if (itemCopy.title || itemCopy.label) {
      const unifiedTitle = normStr(itemCopy.title || itemCopy.label);
      itemCopy.title = unifiedTitle;
      itemCopy.label = unifiedTitle;
    }
    const keys = Object.keys(itemCopy).sort();
    for (const k of keys) {
      if (k === '_id' || k === '__v' || k === 'createdAt' || k === 'updatedAt') continue;
      const v = itemCopy[k];
      if (v === null || v === undefined || v === '') continue;
      cleaned[k] = normalizeArrayItem(v);
    }
    return cleaned;
  }
  return item;
}

export function areArraysEqual(arrA: any, arrB: any): boolean {
  const a = Array.isArray(arrA) ? arrA : [];
  const b = Array.isArray(arrB) ? arrB : [];
  if (a.length !== b.length) return false;
  const normA = a.map(normalizeArrayItem);
  const normB = b.map(normalizeArrayItem);
  return JSON.stringify(normA) === JSON.stringify(normB);
}

export function areSectionOrdersEqual(a: any, b: any): boolean {
  const listA = (Array.isArray(a) ? a : []).map(normalizeSectionKey).filter(Boolean);
  const listB = (Array.isArray(b) ? b : []).map(normalizeSectionKey).filter(Boolean);
  if (listA.length !== listB.length) return false;
  for (let i = 0; i < listA.length; i++) {
    if (listA[i] !== listB[i]) return false;
  }
  return true;
}

export interface ProfileDiffResult {
  hasChanges: boolean;
  patch: Record<string, any>;
  clearFields: string[];
  changedKeys: string[];
}

/**
 * Computes a fine-grained, normalized diff between baseline and draft.
 * - Primitive fields produce top-level patch keys (`{ name: 'New Name' }`).
 * - Nested objects produce dot-notation paths (`{ 'companyInfo.name': 'New' }`) to preserve siblings.
 * - Arrays produce full array replacements only when their contents changed.
 * - Tracks `clearFields` for server-side wipe guard validation.
 */
export function diffProfile(
  baseline: Partial<ProfileData> | null | undefined,
  draft: Partial<ProfileData> | null | undefined
): ProfileDiffResult {
  const patch: Record<string, any> = {};
  const clearFields: string[] = [];
  const changedKeys: string[] = [];

  if (!draft && !baseline) {
    return { hasChanges: false, patch: {}, clearFields: [], changedKeys: [] };
  }

  const base: Partial<ProfileData> = baseline || {};
  const cur: Partial<ProfileData> = draft || {};

  const allKeys = Array.from(
    new Set([...Object.keys(FIELD_CLASSIFICationsClean(base)), ...Object.keys(FIELD_CLASSIFICationsClean(cur))])
  ) as (keyof ProfileData)[];

  for (const key of allKeys) {
    const kind = FIELD_CLASSIFICATIONS[key] || 'primitive';

    if (kind === 'server_only') {
      continue;
    }

    if (kind === 'primitive') {
      const valBase = (base as any)[key];
      const valDraft = (cur as any)[key];

      if (!arePrimitivesEqual(valBase, valDraft)) {
        const nextVal = valDraft !== undefined ? valDraft : '';
        patch[key] = nextVal;
        changedKeys.push(key);
        if (normStr(valBase) !== '' && normStr(nextVal) === '') {
          clearFields.push(key);
        }
      }
      continue;
    }

    if (kind === 'nested_object') {
      const objBase = (base as any)[key] || {};
      const objDraft = (cur as any)[key] || {};

      const subKeys = Array.from(new Set([...Object.keys(objBase), ...Object.keys(objDraft)]));
      for (const subKey of subKeys) {
        if (subKey === '_id' || subKey === '__v' || subKey === 'createdAt' || subKey === 'updatedAt') continue;

        const valBase = objBase[subKey];
        let valDraft = objDraft[subKey];

        // Normalization for sectionVisibility and sharingSettings
        if (key === 'sectionVisibility') {
          const canonicalKey = normalizeSectionKey(subKey);
          if (canonicalKey !== subKey && typeof objDraft[canonicalKey] === 'boolean') {
            valDraft = objDraft[canonicalKey];
          }
        }

        if (!arePrimitivesEqual(valBase, valDraft)) {
          const dotPath = `${key}.${subKey}`;
          patch[dotPath] = valDraft;
          changedKeys.push(dotPath);
        }
      }
      continue;
    }

    if (kind === 'array') {
      let arrBase = (base as any)[key];
      let arrDraft = (cur as any)[key];

      // Handle aliases between socialLinks / socials and experience / experiences
      if (key === 'socialLinks' && arrBase === undefined && (base as any).socials !== undefined) {
        arrBase = (base as any).socials;
      } else if (key === 'socials' && arrBase === undefined && (base as any).socialLinks !== undefined) {
        arrBase = (base as any).socialLinks;
      }
      if (key === 'socialLinks' && arrDraft === undefined && (cur as any).socials !== undefined) {
        arrDraft = (cur as any).socials;
      } else if (key === 'socials' && arrDraft === undefined && (cur as any).socialLinks !== undefined) {
        arrDraft = (cur as any).socialLinks;
      }

      if (key === 'experience' && arrBase === undefined && (base as any).experiences !== undefined) {
        arrBase = (base as any).experiences;
      } else if (key === 'experiences' && arrBase === undefined && (base as any).experience !== undefined) {
        arrBase = (base as any).experience;
      }
      if (key === 'experience' && arrDraft === undefined && (cur as any).experiences !== undefined) {
        arrDraft = (cur as any).experiences;
      } else if (key === 'experiences' && arrDraft === undefined && (cur as any).experience !== undefined) {
        arrDraft = (cur as any).experience;
      }

      let changed = false;

      if (key === 'skills') {
        const normBase = normalizeSkills(arrBase);
        const normDraft = normalizeSkills(arrDraft);
        if (!areArraysEqual(normBase, normDraft)) {
          changed = true;
          patch[key] = normDraft;
        }
      } else if (key === 'sectionOrder') {
        if (!areSectionOrdersEqual(arrBase, arrDraft)) {
          changed = true;
          patch[key] = (Array.isArray(arrDraft) ? arrDraft : []).map(normalizeSectionKey);
        }
      } else {
        if (!areArraysEqual(arrBase, arrDraft)) {
          changed = true;
          patch[key] = Array.isArray(arrDraft) ? arrDraft : [];
        }
      }

      if (changed) {
        changedKeys.push(key);
        const baseLen = Array.isArray(arrBase) ? arrBase.length : 0;
        const draftLen = Array.isArray(patch[key]) ? patch[key].length : 0;
        if (baseLen > 0 && draftLen === 0) {
          clearFields.push(key);
        }
      }
    }
  }

  return {
    hasChanges: changedKeys.length > 0,
    patch,
    clearFields,
    changedKeys
  };
}

function FIELD_CLASSIFICationsClean(obj: any): Record<string, any> {
  const res: Record<string, any> = {};
  for (const k of Object.keys(obj)) {
    if (k in FIELD_CLASSIFICATIONS && (FIELD_CLASSIFICATIONS as any)[k] !== 'server_only') {
      res[k] = obj[k];
    }
  }
  return res;
}

/**
 * Checks whether two profile objects have any meaningful differences.
 * Uses diffProfile as the single source of truth for dirtiness.
 */
export function isProfileDirty(
  draft: Partial<ProfileData> | null | undefined,
  baseline: Partial<ProfileData> | null | undefined
): boolean {
  return diffProfile(baseline, draft).hasChanges;
}
