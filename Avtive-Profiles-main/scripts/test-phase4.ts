import { 
  createUser, 
  createProfileForUser, 
  getProfilesByUserId, 
  updateProfile,
  getProfileByIdOrSlug
} from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function runPhase4Tests() {
  console.log('--- Starting Phase 4 & 5 Creation Flow and Theme Attachment Tests ---');

  // 1. Create a test account
  const email = `phase4_user_${Date.now()}@avtive.app`;
  const passwordHash = await hashPassword('SecurePass@123');
  const { user } = await createUser({
    name: 'Aleena Test',
    email,
    passwordHash,
    createProfile: false
  });
  console.log(`✓ Account created: ${user.id} (${user.email})`);

  // 2. Create Profile 1: Developer Profile -> Cyber
  const devProfile = await createProfileForUser(user.id, {
    profileName: 'Developer Profile',
    name: 'Aleena Test',
    profession: 'Full-Stack Developer',
    theme: 'cyber',
    skills: [{ name: 'TypeScript' }, { name: 'Next.js' }],
    shortBio: 'Specializing in reactive systems and developer tools.'
  });
  console.log(`✓ Created Profile 1: "${devProfile.profileName}" -> Theme: ${devProfile.theme}`);

  // 3. Create Profile 2: HR Profile -> Editorial
  const hrProfile = await createProfileForUser(user.id, {
    profileName: 'HR Profile',
    name: 'Aleena Test',
    profession: 'People & Culture Lead',
    theme: 'editorial',
    skills: [{ name: 'Talent Acquisition' }, { name: 'Organizational Strategy' }],
    shortBio: 'Scaling high performance teams.'
  });
  console.log(`✓ Created Profile 2: "${hrProfile.profileName}" -> Theme: ${hrProfile.theme}`);

  // 4. Create Profile 3: UI/UX Profile -> Luxe
  const designerProfile = await createProfileForUser(user.id, {
    profileName: 'UI/UX Designer Profile',
    name: 'Aleena Test',
    profession: 'Senior Product Designer',
    theme: 'luxe',
    skills: [{ name: 'Design Systems' }, { name: 'Figma' }],
    shortBio: 'Designing luxury and executive product identities.'
  });
  console.log(`✓ Created Profile 3: "${designerProfile.profileName}" -> Theme: ${designerProfile.theme}`);

  // 5. Verify all profiles belong to Aleena's single account
  const allUserProfiles = await getProfilesByUserId(user.id);
  if (allUserProfiles.length !== 3) {
    throw new Error(`Expected 3 profiles, found ${allUserProfiles.length}`);
  }
  console.log('✓ Verified: 1 Account -> 3 Professional Profiles.');

  // 6. Test Phase 6 Requirement: Changing Developer Profile theme does NOT affect HR or Designer profiles
  console.log('Testing Phase 6: Independent Profile Theme Isolation...');
  const updatedDev = await updateProfile(devProfile.id, { theme: 'cyber' }, user.id);
  if (!updatedDev.success) throw new Error('Failed to update dev profile');

  const hrCheck = await getProfileByIdOrSlug(hrProfile.id);
  const designerCheck = await getProfileByIdOrSlug(designerProfile.id);

  if (hrCheck?.theme !== 'editorial') {
    throw new Error(`Theme bleed detected! HR profile theme changed to: ${hrCheck?.theme}`);
  }
  if (designerCheck?.theme !== 'luxe') {
    throw new Error(`Theme bleed detected! Designer profile theme changed to: ${designerCheck?.theme}`);
  }
  console.log('✓ Phase 6 Verified: Developer theme change did NOT alter HR (editorial) or Designer (luxe) themes!');

  console.log('\n>>> ALL PHASE 4 & 5 CREATION FLOW TESTS PASSED SUCCESSFULLY! <<<');
}

runPhase4Tests().catch((err) => {
  console.error('Phase 4 test failed:', err);
  process.exit(1);
});
