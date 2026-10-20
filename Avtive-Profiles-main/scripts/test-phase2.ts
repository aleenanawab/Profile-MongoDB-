import { 
  createUser, 
  getUserByEmail, 
  createProfileForUser, 
  getProfilesByUserId, 
  getProfileByIdOrSlug, 
  duplicateProfile, 
  deleteProfile, 
  sanitizeProfileForPublic 
} from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function runPhase2Tests() {
  console.log('--- Starting Phase 2 Multi-Profile Backend Tests ---');

  // 1. Create a test user
  const testEmail = `multi_profile_test_${Date.now()}@avtive.app`;
  const passwordHash = await hashPassword('TestPass@123');
  const { user } = await createUser({
    name: 'Test Multi-User',
    email: testEmail,
    passwordHash,
    createProfile: false
  });
  console.log(`✓ Test user created: ${user.id} (${user.email})`);

  // 2. Verify user starts with 0 profiles
  const initialProfiles = await getProfilesByUserId(user.id);
  if (initialProfiles.length !== 0) {
    throw new Error(`Expected 0 profiles initially, found ${initialProfiles.length}`);
  }
  console.log('✓ Verified user has 0 profiles initially.');

  // 3. Create Profile 1: Developer Profile (Cyber theme)
  const devProfile = await createProfileForUser(user.id, {
    profileName: 'Developer Profile',
    profession: 'Full-Stack Developer',
    theme: 'cyber',
    phone: '+1 555 0199',
    email: testEmail,
    experiences: [
      { id: 'exp-1', company: 'Tech Corp', role: 'Senior Engineer', period: '2022 - Present' }
    ],
    skills: [{ name: 'TypeScript' }, { name: 'Next.js' }],
    sharingSettings: {
      phone: false, // Phone is hidden
      experience: false, // Experience is hidden
      skills: true
    }
  });
  console.log(`✓ Profile 1 created: "${devProfile.profileName}" (Theme: ${devProfile.theme}, Slug: ${devProfile.slug})`);

  // 4. Create Profile 2: HR Profile (Editorial theme)
  const hrProfile = await createProfileForUser(user.id, {
    profileName: 'HR Profile',
    profession: 'Talent Acquisition Manager',
    theme: 'editorial',
    phone: '+1 555 0200',
    email: testEmail,
    skills: [{ name: 'Recruiting' }, { name: 'People Operations' }]
  });
  console.log(`✓ Profile 2 created: "${hrProfile.profileName}" (Theme: ${hrProfile.theme}, Slug: ${hrProfile.slug})`);

  // 5. Create Profile 3: UI/UX Designer Profile (Luxe theme)
  const designProfile = await createProfileForUser(user.id, {
    profileName: 'UI/UX Designer Profile',
    profession: 'Product Designer',
    theme: 'luxe',
    skills: [{ name: 'Figma' }, { name: 'Design Systems' }]
  });
  console.log(`✓ Profile 3 created: "${designProfile.profileName}" (Theme: ${designProfile.theme}, Slug: ${designProfile.slug})`);

  // 6. Verify getProfilesByUserId returns all 3 profiles with their distinct themes
  const userProfiles = await getProfilesByUserId(user.id);
  if (userProfiles.length !== 3) {
    throw new Error(`Expected 3 profiles, found ${userProfiles.length}`);
  }
  console.log(`✓ getProfilesByUserId confirmed: 3 profiles found for user.`);
  const themes = userProfiles.map(p => `${p.profileName} -> ${p.theme}`);
  console.log('  Themes:', themes.join(' | '));

  // 7. Verify security / sanitizeProfileForPublic for Developer Profile (Phone and Experience hidden)
  const publicDevView = sanitizeProfileForPublic(devProfile, false);
  if (publicDevView.phone !== '') {
    throw new Error(`Security breach: Phone should be stripped, but received: ${publicDevView.phone}`);
  }
  if (publicDevView.experiences?.length !== 0) {
    throw new Error(`Security breach: Experiences should be stripped, but received: ${JSON.stringify(publicDevView.experiences)}`);
  }
  if (publicDevView.skills?.length !== 2) {
    throw new Error(`Skills should remain visible, but received: ${JSON.stringify(publicDevView.skills)}`);
  }
  console.log('✓ Security Verified: Hidden fields (phone & experiences) are strictly stripped in public view!');

  // Owner view retains all fields
  const ownerDevView = sanitizeProfileForPublic(devProfile, true);
  if (ownerDevView.phone !== '+1 555 0199' || ownerDevView.experiences?.length !== 1) {
    throw new Error('Owner view should retain all data.');
  }
  console.log('✓ Owner Verification: Owner can see full data in owner view.');

  // 8. Test duplicateProfile
  const dupResult = await duplicateProfile(hrProfile.id, user.id);
  if (!dupResult.success || !dupResult.profile) {
    throw new Error(`Duplication failed: ${dupResult.error}`);
  }
  console.log(`✓ Duplication Verified: Cloned "${dupResult.profile.profileName}" (New ID: ${dupResult.profile.id})`);

  const afterDup = await getProfilesByUserId(user.id);
  if (afterDup.length !== 4) {
    throw new Error(`Expected 4 profiles after duplication, found ${afterDup.length}`);
  }

  // 9. Test deleteProfile
  const delResult = await deleteProfile(dupResult.profile.id, user.id);
  if (!delResult.success) {
    throw new Error(`Deletion failed: ${delResult.error}`);
  }
  const afterDel = await getProfilesByUserId(user.id);
  if (afterDel.length !== 3) {
    throw new Error(`Expected 3 profiles after deletion, found ${afterDel.length}`);
  }
  console.log('✓ Deletion Verified: Duplicated profile deleted cleanly.');

  // 10. Verify existing founder & team profiles remain intact
  const founder = await getProfileByIdOrSlug('mesum-raza');
  if (!founder || founder.name !== 'Syed Mesum Raza Shah') {
    throw new Error('Existing founder profile was corrupted!');
  }
  console.log('✓ Data Integrity Verified: Existing founder profile is intact.');

  console.log('\n>>> ALL PHASE 2 TESTS PASSED SUCCESSFULLY! <<<');
}

runPhase2Tests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
