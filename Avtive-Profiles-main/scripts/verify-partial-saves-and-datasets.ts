import { 
  updateProfile, 
  getProfileByIdOrSlug, 
  createProfileForUser, 
  deleteProfile 
} from '../src/lib/db';
import { COUNTRIES } from '../src/data/countriesDataset';
import { POPULAR_SKILLS } from '../src/data/skillsDataset';
import { WORLD_LANGUAGES, LANGUAGE_PROFICIENCY_LEVELS } from '../src/data/languagesDataset';
import { ProfileData } from '../src/types/profile';

async function runVerification() {
  console.log('====================================================');
  console.log('AVTIVE PROFILES: PARTIAL SAVES & DATASETS VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // 1. Verify datasets
  console.log('[1] Verifying Static Searchable Datasets...');
  assert(Array.isArray(COUNTRIES) && COUNTRIES.length >= 190, `Countries dataset has ${COUNTRIES?.length} entries (>= 190)`);
  assert(COUNTRIES.some(c => c.value === 'United States' && c.badge === 'US'), 'Countries contains United States with badge US');
  assert(COUNTRIES.some(c => c.value === 'Pakistan' && c.badge === 'PK'), 'Countries contains Pakistan with badge PK');

  assert(Array.isArray(POPULAR_SKILLS) && POPULAR_SKILLS.length >= 300, `Skills dataset has ${POPULAR_SKILLS?.length} entries (>= 300)`);
  assert(POPULAR_SKILLS.some(s => s.value === 'Next.js' && s.sublabel === 'Frontend'), 'Skills contains Next.js in Frontend category');
  assert(POPULAR_SKILLS.some(s => s.value === 'TypeScript' && s.sublabel === 'Frontend'), 'Skills contains TypeScript');

  assert(Array.isArray(WORLD_LANGUAGES) && WORLD_LANGUAGES.length >= 100, `Languages dataset has ${WORLD_LANGUAGES?.length} entries (>= 100)`);
  assert(WORLD_LANGUAGES.some(l => l.value === 'English'), 'Languages contains English');
  assert(WORLD_LANGUAGES.some(l => l.value === 'Spanish'), 'Languages contains Spanish');
  assert(LANGUAGE_PROFICIENCY_LEVELS.length === 5, '5 standard proficiency levels available');

  // 2. Test Partial Save Behavior against DB
  console.log('\n[2] Testing Partial Save Isolation on Profile...');
  const testUserId = `test_partial_user_${Date.now()}`;
  const initial = await createProfileForUser(testUserId, {
    fullName: 'Alex Carter',
    firstName: 'Alex',
    secondName: 'Carter',
    professionalTitle: 'Lead Cloud Architect',
    location: 'Seattle, WA',
    country: 'United States',
    tagline: 'Architecting high-scale clouds',
    about: 'Experienced engineer with 10+ years in distributed systems.',
    skills: ['AWS', 'Kubernetes', 'Go', 'Terraform'],
    languages: [{ language: 'English', proficiency: 'Native / Bilingual' }],
    experience: [{
      id: 'exp-1',
      company: 'CloudCorp',
      role: 'Staff Architect',
      period: '2022 - Present',
      description: 'Scaling multi-region clusters'
    }],
    education: [{
      id: 'edu-1',
      institution: 'University of Washington',
      degree: 'B.S. Computer Science',
      period: '2014 - 2018'
    }],
    projects: [{
      id: 'proj-1',
      title: 'Terraform Automator',
      description: 'Infrastructure automation engine',
      tags: ['Go', 'Cloud']
    }]
  });

  const testProfileId = initial.id;
  assert(Boolean(testProfileId), 'Created baseline test profile');

  // Test Partial Save: Skills only
  console.log('\n[3] Testing Partial Save: Only Skills updated...');
  const updatedSkills = ['AWS', 'Kubernetes', 'Go', 'Terraform', 'Next.js', 'Rust'];
  const resSkills = await updateProfile(testProfileId, { skills: updatedSkills }, testUserId);
  assert(resSkills.success, 'Skills partial update succeeded');

  const reloaded1 = await getProfileByIdOrSlug(testProfileId);
  assert(reloaded1 !== null, 'Reloaded profile');
  if (reloaded1) {
    assert(JSON.stringify(reloaded1.skills) === JSON.stringify(updatedSkills), 'Skills field updated to new array');
    assert(reloaded1.location === 'Seattle, WA', 'Unrelated field location was preserved');
    assert(reloaded1.country === 'United States', 'Unrelated field country was preserved');
    assert(reloaded1.about === initial.about, 'Unrelated field about was preserved');
    assert(reloaded1.education?.length === 1, 'Unrelated field education was preserved');
    assert(reloaded1.projects?.length === 1, 'Unrelated field projects was preserved');
  }

  // Test Partial Save: Country & Location only
  console.log('\n[4] Testing Partial Save: Country & Location updated...');
  const resLocation = await updateProfile(testProfileId, { location: 'Austin, TX', country: 'United States' }, testUserId);
  assert(resLocation.success, 'Location & country partial update succeeded');

  const reloaded2 = await getProfileByIdOrSlug(testProfileId);
  if (reloaded2) {
    assert(reloaded2.location === 'Austin, TX', 'Location updated to Austin, TX');
    assert(reloaded2.country === 'United States', 'Country preserved/updated');
    assert(JSON.stringify(reloaded2.skills) === JSON.stringify(updatedSkills), 'Skills field preserved through location update');
  }

  // Test Partial Save: Languages only
  console.log('\n[5] Testing Partial Save: Languages updated...');
  const updatedLanguages = [
    { language: 'English', proficiency: 'Native / Bilingual' },
    { language: 'German', proficiency: 'Professional Working' }
  ];
  const resLangs = await updateProfile(testProfileId, { languages: updatedLanguages }, testUserId);
  assert(resLangs.success, 'Languages partial update succeeded');

  const reloaded3 = await getProfileByIdOrSlug(testProfileId);
  if (reloaded3) {
    assert(reloaded3.languages?.length === 2, 'Languages updated to 2 entries');
    assert(reloaded3.languages?.[1].language === 'German', 'Second language is German');
    assert(reloaded3.location === 'Austin, TX', 'Location preserved through language update');
  }

  // Cleanup
  console.log('\n[6] Cleanup test profile...');
  await deleteProfile(testProfileId, testUserId);
  const deletedCheck = await getProfileByIdOrSlug(testProfileId);
  assert(deletedCheck === null, 'Test profile successfully cleaned up');

  console.log('\n====================================================');
  console.log(`ALL VERIFICATION TESTS PASSED: ${passed}/${total} assertions successful.`);
  console.log('====================================================\n');
}

runVerification().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
