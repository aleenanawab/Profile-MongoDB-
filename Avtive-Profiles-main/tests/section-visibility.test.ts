import assert from 'node:assert';
import {
  normalizeSectionKey,
  isCanonicalSectionVisible,
  reconcileSectionVisibility,
  toggleCanonicalSectionVisibility,
  CANONICAL_SECTION_ALIASES
} from '../src/lib/sections';

console.log('--- Running section visibility & alias reconciliation tests ---');

// 1. Alias normalization tests
assert.strictEqual(normalizeSectionKey('about'), 'personalDetails', 'about must normalize to personalDetails');
assert.strictEqual(normalizeSectionKey('personalDetails'), 'personalDetails', 'personalDetails must normalize to personalDetails');
assert.strictEqual(normalizeSectionKey('personal'), 'personalDetails', 'personal must normalize to personalDetails');
assert.strictEqual(normalizeSectionKey('contact'), 'contactInfo', 'contact must normalize to contactInfo');
assert.strictEqual(normalizeSectionKey('contactInfo'), 'contactInfo', 'contactInfo must normalize to contactInfo');
assert.strictEqual(normalizeSectionKey('custom-fields'), 'customFields', 'custom-fields must normalize to customFields');
assert.strictEqual(normalizeSectionKey('customFields'), 'customFields', 'customFields must normalize to customFields');
assert.strictEqual(normalizeSectionKey('enhanceProfile'), 'customFields', 'enhanceProfile must normalize to customFields');
assert.strictEqual(normalizeSectionKey('services'), 'skills', 'services must normalize to skills');
assert.strictEqual(normalizeSectionKey('skills'), 'skills', 'skills must normalize to skills');
assert.strictEqual(normalizeSectionKey('portfolio'), 'projects', 'portfolio must normalize to projects');
assert.strictEqual(normalizeSectionKey('projects'), 'projects', 'projects must normalize to projects');
assert.strictEqual(normalizeSectionKey('socials'), 'socialLinks', 'socials must normalize to socialLinks');
assert.strictEqual(normalizeSectionKey('socialLinks'), 'socialLinks', 'socialLinks must normalize to socialLinks');
assert.strictEqual(normalizeSectionKey('certificates'), 'certifications', 'certificates must normalize to certifications');
assert.strictEqual(normalizeSectionKey('certifications'), 'certifications', 'certifications must normalize to certifications');
assert.strictEqual(normalizeSectionKey('virtual-card'), 'virtualCard', 'virtual-card must normalize to virtualCard');
assert.strictEqual(normalizeSectionKey('virtualCard'), 'virtualCard', 'virtualCard must normalize to virtualCard');
assert.strictEqual(normalizeSectionKey('nfcCard'), 'virtualCard', 'nfcCard must normalize to virtualCard');
assert.strictEqual(normalizeSectionKey('company'), 'companyInfo', 'company must normalize to companyInfo');
assert.strictEqual(normalizeSectionKey('team'), 'teamMembers', 'teamMembers must normalize to teamMembers');
console.log('  [PASS] All section aliases normalize to canonical keys');

// 2. Single toggle producing exactly ONE change
// Test personalDetails toggle (previously had cancellation bug with 'about')
let visibility: Record<string, boolean> = { personalDetails: true, about: true };
const res1 = toggleCanonicalSectionVisibility(visibility, 'personalDetails');
assert.strictEqual(res1.nextValue, false, 'First toggle of personalDetails should be false');
assert.strictEqual(res1.nextVisibility.personalDetails, false, 'canonical personalDetails must be false');
assert.strictEqual(res1.nextVisibility.about, false, 'mirrored alias about must also be false');
assert.strictEqual(res1.nextSharingPatch.bio, false, 'sharingSettings bio must be false');

// Toggle again -> back to true
const res2 = toggleCanonicalSectionVisibility(res1.nextVisibility, 'personalDetails');
assert.strictEqual(res2.nextValue, true, 'Second toggle of personalDetails should restore to true');
assert.strictEqual(res2.nextVisibility.personalDetails, true, 'canonical personalDetails must be true');
assert.strictEqual(res2.nextVisibility.about, true, 'mirrored alias about must be true');

// Toggling with alias key 'about' directly produces the exact same single toggle
const resFromAlias = toggleCanonicalSectionVisibility(visibility, 'about');
assert.strictEqual(resFromAlias.nextValue, false, 'Toggling alias about directly must toggle to false');
assert.strictEqual(resFromAlias.nextVisibility.personalDetails, false, 'canonical key must be set to false');
assert.strictEqual(resFromAlias.nextVisibility.about, false, 'alias key must be set to false');

// Test contact / contactInfo single toggle
visibility = { contactInfo: true, contact: true };
const resContact = toggleCanonicalSectionVisibility(visibility, 'contactInfo');
assert.strictEqual(resContact.nextValue, false, 'Toggling contactInfo must result in false');
assert.strictEqual(resContact.nextVisibility.contactInfo, false, 'contactInfo must be false');
assert.strictEqual(resContact.nextVisibility.contact, false, 'alias contact must be false');
assert.strictEqual(resContact.nextSharingPatch.contactInfo, false, 'sharingSettings contactInfo must be false');

// Test customFields / custom-fields single toggle
visibility = { customFields: true, 'custom-fields': true };
const resCustom = toggleCanonicalSectionVisibility(visibility, 'customFields');
assert.strictEqual(resCustom.nextValue, false, 'Toggling customFields must result in false');
assert.strictEqual(resCustom.nextVisibility.customFields, false, 'customFields must be false');
assert.strictEqual(resCustom.nextVisibility['custom-fields'], false, 'custom-fields must be false');
console.log('  [PASS] Single toggle produces exactly one change without duplicate cancellation');

// 3. Load-time reconciliation of conflicting alias data
// Scenario A: Canonical key wins when both canonical and alias are present
const conflictingDataA: Record<string, boolean> = {
  personalDetails: true,
  about: false // conflicting alias
};
const reconciledA = reconcileSectionVisibility(conflictingDataA);
assert.strictEqual(reconciledA.personalDetails, true, 'Canonical personalDetails: true must win over about: false');
assert.strictEqual(reconciledA.about, true, 'Alias about must be synchronized to canonical true');

// Scenario B: Alias value used when canonical key is absent
const legacyDataB: Record<string, boolean> = {
  about: false, // only alias present
  contact: false
};
const reconciledB = reconcileSectionVisibility(legacyDataB);
assert.strictEqual(reconciledB.personalDetails, false, 'Absence of canonical personalDetails must resolve from alias about: false');
assert.strictEqual(reconciledB.about, false, 'Alias about must remain false');
assert.strictEqual(reconciledB.contactInfo, false, 'Absence of canonical contactInfo must resolve from alias contact: false');
assert.strictEqual(reconciledB.contact, false, 'Alias contact must remain false');

// Scenario C: Neither present -> falls back to sharingSettings
const legacySharingOnly = reconcileSectionVisibility({}, { bio: false, nfcCard: false });
assert.strictEqual(legacySharingOnly.personalDetails, false, 'Resolved from sharingSettings.bio: false');
assert.strictEqual(legacySharingOnly.virtualCard, false, 'Resolved from sharingSettings.nfcCard: false');
assert.strictEqual(legacySharingOnly.skills, true, 'Defaults to visible when not specified');

console.log('  [PASS] Load-time reconciliation handles legacy, conflicting, and missing alias data deterministically');

// 4. isCanonicalSectionVisible selector tests
assert.strictEqual(
  isCanonicalSectionVisible({ personalDetails: false, about: false }, undefined, 'personalDetails'),
  false,
  'Hidden personalDetails must return false'
);
assert.strictEqual(
  isCanonicalSectionVisible({ personalDetails: false, about: false }, undefined, 'about'),
  false,
  'Querying alias about must return false'
);
assert.strictEqual(
  isCanonicalSectionVisible({ skills: true }, undefined, 'skills'),
  true,
  'Visible skills must return true'
);
assert.strictEqual(
  isCanonicalSectionVisible({ skills: true }, undefined, 'services'),
  true,
  'Querying alias services must return true'
);
console.log('  [PASS] isCanonicalSectionVisible selector cleanly maps all keys and aliases');

console.log('✓ All section visibility unit tests passed successfully!\n');
