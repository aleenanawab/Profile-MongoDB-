import { 
  createUser, 
  createProfileForUser, 
  getProfilesByUserId, 
  duplicateProfile, 
  deleteProfile 
} from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function runPhase3Tests() {
  console.log('--- Starting Phase 3 Profile Dashboard / Switcher Tests ---');

  // 1. Create a dashboard test user
  const email = `dashboard_user_${Date.now()}@avtive.app`;
  const passwordHash = await hashPassword('SecurePass@123');
  const { user } = await createUser({
    name: 'Dashboard Tester',
    email,
    passwordHash,
    createProfile: false
  });
  console.log(`✓ Test user created: ${user.id}`);

  // 2. Add Developer Profile (Cyber)
  const devProfile = await createProfileForUser(user.id, {
    profileName: 'Developer Profile',
    profession: 'Senior MERN Developer',
    theme: 'cyber',
    shortBio: 'Building scalable systems with TypeScript and Node.'
  });

  // 3. Add HR Profile (Editorial)
  const hrProfile = await createProfileForUser(user.id, {
    profileName: 'HR Professional',
    profession: 'Director of People Operations',
    theme: 'editorial',
    shortBio: 'Connecting top tech talent with ambitious organizations.'
  });

  // 4. Add UI/UX Designer Profile (Luxe)
  const designerProfile = await createProfileForUser(user.id, {
    profileName: 'UI/UX Designer',
    profession: 'Lead Product Designer',
    theme: 'luxe',
    shortBio: 'Crafting bespoke luxury design experiences.'
  });

  // 5. Test getProfilesByUserId (what /dashboard displays)
  const dashboardProfiles = await getProfilesByUserId(user.id);
  if (dashboardProfiles.length !== 3) {
    throw new Error(`Expected 3 profiles on dashboard, found ${dashboardProfiles.length}`);
  }
  console.log(`✓ Dashboard data verified: 3 distinct profile cards ready.`);
  dashboardProfiles.forEach(p => {
    console.log(`  - [${p.profileName}] ${p.profession} | Theme: ${p.theme} | Public URL: /profile/${p.slug}`);
  });

  // 6. Test Dashboard duplication action
  const dup = await duplicateProfile(devProfile.id, user.id);
  if (!dup.success || !dup.profile) {
    throw new Error('Duplication action failed');
  }
  console.log(`✓ Duplicate action verified: "${dup.profile.profileName}" created with slug ${dup.profile.slug}`);

  const afterDup = await getProfilesByUserId(user.id);
  if (afterDup.length !== 4) {
    throw new Error(`Expected 4 profiles after duplication, found ${afterDup.length}`);
  }

  // 7. Test Dashboard delete action
  const del = await deleteProfile(dup.profile.id, user.id);
  if (!del.success) {
    throw new Error('Delete action failed');
  }
  console.log('✓ Delete action verified: Cloned profile removed cleanly.');

  const afterDel = await getProfilesByUserId(user.id);
  if (afterDel.length !== 3) {
    throw new Error(`Expected 3 profiles after deletion, found ${afterDel.length}`);
  }

  console.log('\n>>> ALL PHASE 3 TESTS PASSED SUCCESSFULLY! <<<');
}

runPhase3Tests().catch((err) => {
  console.error('Phase 3 test failed:', err);
  process.exit(1);
});
