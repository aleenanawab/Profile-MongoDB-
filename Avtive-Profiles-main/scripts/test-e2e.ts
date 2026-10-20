import { 
  createUser, 
  getUserByEmail, 
  getProfilesByUserId, 
  createProfileForUser, 
  duplicateProfile, 
  deleteProfile, 
  getProfileByIdOrSlug, 
  updateProfile, 
  sanitizeProfileForPublic,
  DEFAULT_SHARING_SETTINGS
} from '../src/lib/db';
import { PROFILE_THEMES, getThemeConfig } from '../src/components/themeStyles';

async function runE2ETests() {
  console.log('====================================================');
  console.log('END-TO-END MULTI-PROFILE PLATFORM VALIDATION');
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

  // SCENARIO 1: User Account & Multiple Profiles Setup
  console.log('[SCENARIO 1] Notion-Style Multiple Workspace Profiles for Single User');
  const userEmail = `e2e_user_${Date.now()}@avtive.app`;
  const { user } = await createUser({
    name: 'Alex Vance',
    email: userEmail,
    passwordHash: 'hash-test-pass'
  });
  assert(Boolean(user.id), `User created: ${user.name} (${user.email})`);

  // Profile 1: Developer Profile (Theme: cyber)
  const devProfile = await createProfileForUser(user.id, {
    name: 'Alex Vance',
    profileName: 'Developer Terminal',
    profession: 'Full-Stack Systems Engineer',
    designation: 'Senior Cloud & Systems Architect',
    theme: 'cyber',
    phone: '+1 555 0199',
    email: userEmail,
    skills: [{ name: 'Rust' }, { name: 'Next.js' }, { name: 'Kubernetes' }],
    projects: [{ id: 'p1', title: 'Decentralized Cache', description: 'Distributed consensus cache', category: 'Systems' }],
    experiences: [{ id: 'e1', company: 'Global Cloud Systems', role: 'Principal Architect' }],
    sharingSettings: {
      ...DEFAULT_SHARING_SETTINGS,
      phone: false, // Phone HIDDEN for developer profile
      projects: true
    },
    sectionOrder: ['hero', 'projects', 'services', 'experience', 'about']
  });
  assert(Boolean(devProfile.id), 'Developer Profile created with cyber theme');

  // Profile 2: HR Profile (Theme: editorial)
  const hrProfile = await createProfileForUser(user.id, {
    name: 'Alex Vance',
    profileName: 'HR & People Operations',
    profession: 'Talent Acquisition Director',
    designation: 'Head of Global People Ops',
    theme: 'editorial',
    phone: '+1 555 0199',
    email: userEmail,
    skills: [{ name: 'Executive Search' }, { name: 'Organizational Culture' }],
    projects: [{ id: 'p2', title: 'Talent Expansion Framework', description: 'Scaled team from 20 to 200', category: 'HR' }],
    experiences: [{ id: 'e2', company: 'Apex People Group', role: 'VP People' }],
    sharingSettings: {
      ...DEFAULT_SHARING_SETTINGS,
      phone: true, // Phone SHARED for HR profile
      projects: false // Projects HIDDEN for HR profile
    },
    sectionOrder: ['hero', 'about', 'experience', 'services']
  });
  assert(Boolean(hrProfile.id), 'HR Profile created with editorial theme');

  // Profile 3: Creative Designer Profile (Theme: luxe)
  const designerProfile = await createProfileForUser(user.id, {
    name: 'Alex Vance',
    profileName: 'UI/UX Brand Architect',
    profession: 'Creative Design Lead',
    designation: 'Staff Product Designer',
    theme: 'luxe',
    phone: '+1 555 0199',
    email: userEmail,
    skills: [{ name: 'Figma' }, { name: 'Design Systems' }, { name: 'Motion' }],
    sharingSettings: {
      ...DEFAULT_SHARING_SETTINGS,
      phone: true,
      projects: true
    }
  });
  assert(Boolean(designerProfile.id), 'Designer Profile created with luxe theme');

  // Verify list retrieval
  const userProfiles = await getProfilesByUserId(user.id);
  assert(userProfiles.length === 3, 'User accurately owns exactly 3 distinct workspaces/profiles');

  // SCENARIO 2: Theme Isolation Verification
  console.log('\n[SCENARIO 2] Verifying 100% Theme Isolation Across Profiles');
  assert(userProfiles.find((p) => p.id === devProfile.id)?.theme === 'cyber', 'Dev Profile isolated theme: cyber');
  assert(userProfiles.find((p) => p.id === hrProfile.id)?.theme === 'editorial', 'HR Profile isolated theme: editorial');
  assert(userProfiles.find((p) => p.id === designerProfile.id)?.theme === 'luxe', 'Designer Profile isolated theme: luxe');

  // Modify dev profile theme to 'minimal' and verify HR & Designer themes remain untouched
  await updateProfile(devProfile.id, { theme: 'minimal' }, user.id);
  const reloadedDev = await getProfileByIdOrSlug(devProfile.id);
  const reloadedHR = await getProfileByIdOrSlug(hrProfile.id);
  const reloadedDesigner = await getProfileByIdOrSlug(designerProfile.id);

  assert(reloadedDev?.theme === 'minimal', 'Dev profile updated to minimal');
  assert(reloadedHR?.theme === 'editorial', 'HR profile remains editorial (unaffected)');
  assert(reloadedDesigner?.theme === 'luxe', 'Designer profile remains luxe (unaffected)');

  // Revert dev profile theme back to cyber
  await updateProfile(devProfile.id, { theme: 'cyber' }, user.id);

  // SCENARIO 3: Zero-Tolerance Public Security Projection
  console.log('\n[SCENARIO 3] Zero-Tolerance Server-Side Public Filtering (No data leaks)');
  
  // Public viewer accessing Developer profile:
  const devPublicView = sanitizeProfileForPublic(devProfile, false);
  assert(devPublicView.phone === '', 'Public caller CANNOT see developer profile phone (phone is empty string)');
  assert(devPublicView.whatsapp === '', 'Public caller CANNOT see developer profile whatsapp');
  assert(devPublicView.projects?.length === 1, 'Public caller CAN see developer profile projects');

  // Public viewer accessing HR profile:
  const hrPublicView = sanitizeProfileForPublic(hrProfile, false);
  assert(hrPublicView.phone === '+1 555 0199', 'Public caller CAN see HR profile phone (explicitly shared)');
  assert(hrPublicView.projects?.length === 0, 'Public caller CANNOT see HR profile projects (projects array is empty)');

  // Owner accessing Developer profile:
  const devOwnerView = sanitizeProfileForPublic(devProfile, true);
  assert(devOwnerView.phone === '+1 555 0199', 'Owner retains full visibility of phone number');
  assert(devOwnerView.projects?.length === 1, 'Owner retains full visibility of projects');

  // SCENARIO 4: Duplication & Cloned Customizations
  console.log('\n[SCENARIO 4] Profile Duplication & Independence');
  const dupResult = await duplicateProfile(hrProfile.id, user.id);
  assert(dupResult.success, 'HR Profile duplicated successfully');
  const clonedProfile = dupResult.profile!;
  assert(clonedProfile.theme === 'editorial', 'Cloned profile inherited editorial theme');
  assert(clonedProfile.sharingSettings?.projects === false, 'Cloned profile inherited sharingSettings');
  assert(clonedProfile.id !== hrProfile.id, 'Cloned profile has its own distinct unique ID');
  assert(clonedProfile.slug !== hrProfile.slug, 'Cloned profile has its own distinct URL slug');

  // Clean up cloned profile
  const deleteCloned = await deleteProfile(clonedProfile.id, user.id);
  assert(deleteCloned.success, 'Cloned profile removed cleanly');

  // SCENARIO 5: Section Ordering Customization
  console.log('\n[SCENARIO 5] Section Ordering Customization');
  const customOrder = ['virtual-card', 'experience', 'projects', 'services', 'about'];
  const orderUpdate = await updateProfile(devProfile.id, { sectionOrder: customOrder }, user.id);
  assert(orderUpdate.success, 'Section order updated');
  assert(orderUpdate.profile?.sectionOrder?.[0] === 'virtual-card', 'Virtual card moved to the top');

  // SCENARIO 6: Clean Up Test Profiles & User
  console.log('\n[SCENARIO 6] Cleanup Test Workspaces');
  await deleteProfile(devProfile.id, user.id);
  await deleteProfile(hrProfile.id, user.id);
  await deleteProfile(designerProfile.id, user.id);
  const remainingProfiles = await getProfilesByUserId(user.id);
  assert(remainingProfiles.length === 0, 'All test profiles removed cleanly without residue');

  console.log('\n====================================================');
  console.log(`ALL E2E VALIDATION TESTS PASSED: ${passed}/${total} assertions successful.`);
  console.log('====================================================\n');
}

runE2ETests().catch((err) => {
  console.error('E2E Validation Failed:', err);
  process.exit(1);
});
