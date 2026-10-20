import { 
  getProfileByIdOrSlug, 
  sanitizeProfileForPublic, 
  updateProfile, 
  createProfileForUser, 
  deleteProfile,
  DEFAULT_SHARING_SETTINGS,
  DEFAULT_SECTION_ORDER
} from '../src/lib/db';
import { PROFILE_THEMES, getThemeConfig } from '../src/components/themeStyles';
import fs from 'fs';
import path from 'path';

async function runPhase8Tests() {
  console.log('====================================================');
  console.log('PHASE 8 AUTOMATED VALIDATION SUITE');
  console.log('Testing CSS Variable Theme Engine & Sharing System');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // TEST 1: CSS Theme definitions & configuration
  console.log('[1] Validating Theme Configs & Palettes...');
  assert(Boolean(PROFILE_THEMES.editorial), 'Editorial Minimal theme exists in PROFILE_THEMES');
  assert(Boolean(PROFILE_THEMES.cyber), 'Developer Terminal theme exists in PROFILE_THEMES');
  assert(Boolean(PROFILE_THEMES.luxe), 'Luxe Velvet theme exists in PROFILE_THEMES');

  const editorialConfig = getThemeConfig('editorial');
  assert(editorialConfig.accentText.includes('#C2410C'), 'Editorial theme has terracotta accent #C2410C');
  assert(editorialConfig.fontFamily.includes('font-sans') || editorialConfig.fontFamily.includes('font-serif'), 'Editorial theme uses valid typography');

  const cyberConfig = getThemeConfig('cyber');
  assert(cyberConfig.accentText.includes('#10B981'), 'Cyber theme has emerald accent #10B981');
  assert(cyberConfig.fontFamily.includes('font-mono') || cyberConfig.fontFamily.includes('font-sans'), 'Cyber theme uses valid typography');

  const luxeConfig = getThemeConfig('luxe');
  assert(luxeConfig.accentText.includes('#FB7185'), 'Luxe theme has rose/burgundy velvet accent');

  // TEST 2: Check globals.css defines [data-theme] custom properties
  console.log('\n[2] Validating globals.css CSS Variables...');
  const globalsCssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
  const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');
  assert(globalsCss.includes('[data-theme="editorial"]'), 'globals.css defines [data-theme="editorial"]');
  assert(globalsCss.includes('[data-theme="cyber"]'), 'globals.css defines [data-theme="cyber"]');
  assert(globalsCss.includes('[data-theme="luxe"]'), 'globals.css defines [data-theme="luxe"]');
  assert(globalsCss.includes('--theme-accent: #C2410C'), 'globals.css defines terracotta variable for editorial');
  assert(globalsCss.includes('--theme-accent: #10B981'), 'globals.css defines emerald variable for cyber');
  assert(globalsCss.includes('--theme-accent: #E11D48'), 'globals.css defines rose variable for luxe');

  // TEST 3: Zero-Tolerance Server-Side Security Sanitization
  console.log('\n[3] Validating Server-Side Sanitization Security...');
  const testUserId = 'test-user-phase8';
  const newProfile = await createProfileForUser(testUserId, {
    name: 'Security Test Profile',
    profileName: 'Privacy & Sharing Pass',
    theme: 'cyber',
    phone: '+92 300 1234567',
    whatsapp: '+923001234567',
    email: 'private@testdomain.com',
    shortBio: 'Sensitive public summary',
    fullBio: 'Full confidential story',
    skills: [{ name: 'TypeScript' }, { name: 'Rust' }],
    services: [{ id: 's1', title: 'Consulting' }],
    experiences: [{ id: 'e1', company: 'Top Secret Corp', role: 'Staff Eng' }],
    projects: [{ id: 'p1', title: 'Proprietary Project', description: 'Internal tool', category: 'Tech' }],
    certifications: [{ id: 'c1', name: 'Security Pro', issuer: 'ISO', issued: '2026' }],
    volunteerExperiences: [{ id: 'v1', role: 'Mentor', organization: 'Code Camp', period: '2025' }],
    languages: [{ language: 'English', proficiency: 'Native' }],
    recommendations: [{ id: 'r1', author: 'Jane Boss', summary: 'Exceptional engineer' }],
    companyInfo: { id: 'c1', name: 'Secret Inc', tagline: 'Stealth', logo: '', industry: 'Tech', location: 'Remote', website: '', profileId: 'c1' },
    nfcCard: { cardNumber: '4500-XXXX-0001', chipId: 'CHIP-01', finish: 'emerald' }
  });

  assert(Boolean(newProfile.id), 'Test profile created with full private data');

  // Case 3A: Owner access -> No fields stripped
  const ownerView = sanitizeProfileForPublic(newProfile, true);
  assert(ownerView.phone === '+92 300 1234567', 'Owner can view phone number');
  assert(ownerView.email === 'private@testdomain.com', 'Owner can view email');
  assert((ownerView.experiences?.length || 0) === 1, 'Owner can view experience');
  assert(Boolean(ownerView.nfcCard), 'Owner can view NFC card');

  // Case 3B: Public viewer with default settings -> All public fields visible
  const defaultPublicView = sanitizeProfileForPublic(newProfile, false);
  assert(defaultPublicView.phone === '+92 300 1234567', 'Default settings allow phone');
  assert(defaultPublicView.email === 'private@testdomain.com', 'Default settings allow email');

  // Case 3C: Public viewer with restricted settings -> Strictly stripped server-side
  const restrictedProfile = {
    ...newProfile,
    sharingSettings: {
      phone: false,
      email: false,
      bio: false,
      skills: false,
      services: false,
      experience: false,
      projects: false,
      certifications: false,
      volunteer: false,
      languages: false,
      recommendations: false,
      companySection: false,
      nfcCard: false
    }
  };

  const sanitizedPublic = sanitizeProfileForPublic(restrictedProfile, false);
  assert(sanitizedPublic.phone === '', 'Restricted phone is stripped to empty string');
  assert(sanitizedPublic.whatsapp === '', 'Restricted whatsapp is stripped to empty string');
  assert(sanitizedPublic.email === '', 'Restricted email is stripped to empty string');
  assert(sanitizedPublic.shortBio === '', 'Restricted shortBio is stripped to empty string');
  assert(sanitizedPublic.fullBio === '', 'Restricted fullBio is stripped to empty string');
  assert(sanitizedPublic.skills?.length === 0, 'Restricted skills array is empty');
  assert(sanitizedPublic.services?.length === 0, 'Restricted services array is empty');
  assert(sanitizedPublic.experiences?.length === 0, 'Restricted experiences array is empty');
  assert(sanitizedPublic.projects?.length === 0, 'Restricted projects array is empty');
  assert(sanitizedPublic.certifications?.length === 0, 'Restricted certifications array is empty');
  assert(sanitizedPublic.volunteerExperiences?.length === 0, 'Restricted volunteer experiences array is empty');
  assert(sanitizedPublic.languages?.length === 0, 'Restricted languages array is empty');
  assert(sanitizedPublic.recommendations?.length === 0, 'Restricted recommendations array is empty');
  assert(sanitizedPublic.companyInfo === undefined, 'Restricted companyInfo is stripped to undefined');
  assert(sanitizedPublic.nfcCard === undefined, 'Restricted nfcCard is stripped to undefined');

  // TEST 4: Updating Sharing Settings & Section Ordering via DB
  console.log('\n[4] Testing Sharing Settings & Section Order Persistence...');
  const customOrder = ['virtual-card', 'projects', 'about', 'services', 'experience'];
  const updateResult = await updateProfile(
    newProfile.id,
    {
      sharingSettings: {
        ...DEFAULT_SHARING_SETTINGS,
        phone: false,
        experience: false
      },
      sectionOrder: customOrder
    },
    testUserId
  );

  assert(updateResult.success, 'Profile updated with custom sharingSettings and sectionOrder');
  assert(updateResult.profile?.sharingSettings?.phone === false, 'Updated profile has phone disabled');
  assert(updateResult.profile?.sharingSettings?.experience === false, 'Updated profile has experience disabled');
  assert(JSON.stringify(updateResult.profile?.sectionOrder) === JSON.stringify(customOrder), 'Custom sectionOrder stored correctly');

  // Verify DB query returns matching data
  const reloaded = await getProfileByIdOrSlug(newProfile.id);
  assert(Boolean(reloaded), 'Profile reloaded from database');
  assert(reloaded?.sharingSettings?.phone === false, 'Persisted phone setting is false');
  assert(reloaded?.sharingSettings?.experience === false, 'Persisted experience setting is false');
  assert(reloaded?.sectionOrder?.[0] === 'virtual-card', 'First section is virtual-card in persisted order');

  // TEST 5: Clean Up
  console.log('\n[5] Cleaning up test profile...');
  const deleteRes = await deleteProfile(newProfile.id, testUserId);
  assert(deleteRes.success, 'Test profile cleanly deleted');

  console.log(`\n====================================================`);
  console.log(`ALL TESTS PASSED: ${passed}/${total} assertions successful.`);
  console.log(`====================================================\n`);
}

runPhase8Tests().catch((err) => {
  console.error('Test Suite Failure:', err);
  process.exit(1);
});
