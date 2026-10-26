import { ProfileData } from '@/types/profile';

/**
 * Normalizes a string for comparison: trim, treat null/undefined/"" identically.
 */
export function normStr(v: any): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

/**
 * Deep compare two arrays of primitive items (e.g. string[]).
 */
export function areStringArraysEqual(a: any, b: any): boolean {
  const arrA = Array.isArray(a) ? a.map(normStr).filter(Boolean) : [];
  const arrB = Array.isArray(b) ? b.map(normStr).filter(Boolean) : [];
  if (arrA.length !== arrB.length) return false;
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i] !== arrB[i]) return false;
  }
  return true;
}

/**
 * Normalize skills which could be string[] or { name: string }[]
 */
export function extractSkillsList(skills: any): string[] {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((s) => (typeof s === 'string' ? s.trim() : s?.name?.trim() || ''))
    .filter(Boolean);
}

/**
 * Checks whether two profile objects have any meaningful differences.
 * Normalizes strings, handles undefined vs empty strings vs null,
 * and ignores identity differences of arrays/objects.
 */
export function isProfileDirty(
  draft: Partial<ProfileData> | null | undefined,
  baseline: Partial<ProfileData> | null | undefined
): boolean {
  if (!draft && !baseline) return false;
  if (!draft || !baseline) return true;

  // 1. Primitive and text fields
  const textFields: (keyof ProfileData)[] = [
    'name',
    'firstName',
    'secondName',
    'lastName',
    'username',
    'slug',
    'type',
    'professionalTitle',
    'designation',
    'profession',
    'bio',
    'shortBio',
    'about',
    'fullBio',
    'tagline',
    'company',
    'location',
    'country',
    'email',
    'phone',
    'whatsapp',
    'website',
    'theme',
    'avatar',
    'coverImage',
  ];

  for (const field of textFields) {
    if (normStr(draft[field]) !== normStr(baseline[field])) {
      return true;
    }
  }

  // 2. Skills
  const draftSkills = extractSkillsList(draft.skills);
  const baseSkills = extractSkillsList(baseline.skills);
  if (!areStringArraysEqual(draftSkills, baseSkills)) {
    return true;
  }

  // 3. Social links / socials
  const draftSocials = Array.isArray(draft.socialLinks)
    ? draft.socialLinks
    : Array.isArray(draft.socials)
    ? draft.socials
    : [];
  const baseSocials = Array.isArray(baseline.socialLinks)
    ? baseline.socialLinks
    : Array.isArray(baseline.socials)
    ? baseline.socials
    : [];

  const cleanDraftSocials = draftSocials.map((s: any) => ({
    platform: normStr(s?.platform),
    url: normStr(s?.url),
    title: normStr(s?.title || s?.label),
    visible: s?.visible !== false,
  }));

  const cleanBaseSocials = baseSocials.map((s: any) => ({
    platform: normStr(s?.platform),
    url: normStr(s?.url),
    title: normStr(s?.title || s?.label),
    visible: s?.visible !== false,
  }));

  if (JSON.stringify(cleanDraftSocials) !== JSON.stringify(cleanBaseSocials)) {
    return true;
  }

  // 4. Projects
  const draftProjects = (Array.isArray(draft.projects) ? draft.projects : []).map((p: any) => ({
    id: normStr(p?.id),
    title: normStr(p?.title),
    description: normStr(p?.description),
    link: normStr(p?.link || p?.projectUrl),
    role: normStr(p?.role),
    featured: Boolean(p?.featured),
  }));
  const baseProjects = (Array.isArray(baseline.projects) ? baseline.projects : []).map((p: any) => ({
    id: normStr(p?.id),
    title: normStr(p?.title),
    description: normStr(p?.description),
    link: normStr(p?.link || p?.projectUrl),
    role: normStr(p?.role),
    featured: Boolean(p?.featured),
  }));
  if (JSON.stringify(draftProjects) !== JSON.stringify(baseProjects)) {
    return true;
  }

  // 5. Experiences
  const draftExpArr = draft.experiences || (draft as any).experience;
  const draftExp = (Array.isArray(draftExpArr) ? draftExpArr : []).map((e: any) => ({
    id: normStr(e?.id),
    company: normStr(e?.company),
    position: normStr(e?.position),
    startDate: normStr(e?.startDate),
    endDate: normStr(e?.endDate),
    current: Boolean(e?.current),
    description: normStr(e?.description),
  }));
  const baseExpArr = baseline.experiences || (baseline as any).experience;
  const baseExp = (Array.isArray(baseExpArr) ? baseExpArr : []).map((e: any) => ({
    id: normStr(e?.id),
    company: normStr(e?.company),
    position: normStr(e?.position),
    startDate: normStr(e?.startDate),
    endDate: normStr(e?.endDate),
    current: Boolean(e?.current),
    description: normStr(e?.description),
  }));
  if (JSON.stringify(draftExp) !== JSON.stringify(baseExp)) {
    return true;
  }

  // 6. Education
  const draftEdu = (Array.isArray(draft.education) ? draft.education : []).map((ed: any) => ({
    id: normStr(ed?.id),
    institution: normStr(ed?.institution),
    degree: normStr(ed?.degree),
    fieldOfStudy: normStr(ed?.fieldOfStudy),
    startDate: normStr(ed?.startDate),
    endDate: normStr(ed?.endDate),
  }));
  const baseEdu = (Array.isArray(baseline.education) ? baseline.education : []).map((ed: any) => ({
    id: normStr(ed?.id),
    institution: normStr(ed?.institution),
    degree: normStr(ed?.degree),
    fieldOfStudy: normStr(ed?.fieldOfStudy),
    startDate: normStr(ed?.startDate),
    endDate: normStr(ed?.endDate),
  }));
  if (JSON.stringify(draftEdu) !== JSON.stringify(baseEdu)) {
    return true;
  }

  // 7. Certifications
  const draftCerts = (Array.isArray(draft.certifications) ? draft.certifications : []).map((c: any) => ({
    id: normStr(c?.id),
    title: normStr(c?.title || c?.name),
    issuer: normStr(c?.issuer),
    date: normStr(c?.date),
    credentialId: normStr(c?.credentialId),
  }));
  const baseCerts = (Array.isArray(baseline.certifications) ? baseline.certifications : []).map((c: any) => ({
    id: normStr(c?.id),
    title: normStr(c?.title || c?.name),
    issuer: normStr(c?.issuer),
    date: normStr(c?.date),
    credentialId: normStr(c?.credentialId),
  }));
  if (JSON.stringify(draftCerts) !== JSON.stringify(baseCerts)) {
    return true;
  }

  // 8. Custom Fields
  const draftCf = (Array.isArray(draft.customFields) ? draft.customFields : []).map((cf: any) => ({
    id: normStr(cf?.id),
    label: normStr(cf?.label || cf?.title),
    value: normStr(cf?.value || cf?.content),
    visible: cf?.visible !== false,
  }));
  const baseCf = (Array.isArray(baseline.customFields) ? baseline.customFields : []).map((cf: any) => ({
    id: normStr(cf?.id),
    label: normStr(cf?.label || cf?.title),
    value: normStr(cf?.value || cf?.content),
    visible: cf?.visible !== false,
  }));
  if (JSON.stringify(draftCf) !== JSON.stringify(baseCf)) {
    return true;
  }

  // 9. Section Visibility & Sharing Settings
  const draftVis = draft.sectionVisibility || {};
  const baseVis = baseline.sectionVisibility || {};
  const visKeys = Array.from(new Set([...Object.keys(draftVis), ...Object.keys(baseVis)]));
  for (const k of visKeys) {
    if (Boolean(draftVis[k]) !== Boolean(baseVis[k])) return true;
  }

  const draftSharing = draft.sharingSettings || {};
  const baseSharing = baseline.sharingSettings || {};
  const sharingKeys = Array.from(new Set([...Object.keys(draftSharing), ...Object.keys(baseSharing)]));
  for (const k of sharingKeys) {
    if (Boolean((draftSharing as any)[k]) !== Boolean((baseSharing as any)[k])) return true;
  }

  // 10. Company info
  if (draft.companyInfo || baseline.companyInfo) {
    const dComp: any = draft.companyInfo || {};
    const bComp: any = baseline.companyInfo || {};
    if (
      normStr(dComp.name) !== normStr(bComp.name) ||
      normStr(dComp.tagline) !== normStr(bComp.tagline) ||
      normStr(dComp.website) !== normStr(bComp.website) ||
      normStr(dComp.description) !== normStr(bComp.description) ||
      normStr(dComp.location) !== normStr(bComp.location)
    ) {
      return true;
    }
  }

  return false;
}
