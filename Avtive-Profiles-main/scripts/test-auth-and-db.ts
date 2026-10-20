/**
 * Test Suite: Auth, Data Layer, Indexes, and User A / User B Isolation
 * Runs verification against MongoDB on database 'avtive_test'
 */
import {
  getUserByEmail,
  getUserById,
  createUser,
  createProfileForUser,
  getProfileByIdOrSlug,
  updateProfile,
  createCompany,
  updateCompany,
  addCompanyMember,
  createPasswordResetToken,
  verifyPasswordResetToken,
  resetUserPassword,
  verifyRecoveryCode,
  resetPasswordWithRecoveryCode
} from '../src/lib/db';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../src/lib/auth';
import { getMongoDb, COLLECTIONS } from '../src/lib/db/client';

async function runTests() {
  console.log('====================================================');
  console.log('       TEST SUITE: MONGODB AUTH & DATA LAYER        ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    const db = await getMongoDb();
    console.log(`Target database: ${db.databaseName}`);

    // 1. Password Hashing & Verification
    const rawPw = 'SuperSecret123!';
    const hashed = await hashPassword(rawPw);
    const pwMatch = await verifyPassword(rawPw, hashed);
    const pwMismatch = await verifyPassword('WrongPassword!', hashed);
    assert(pwMatch && !pwMismatch, 'Password hashing and comparison (bcrypt)');

    // 2. User Registration (User A)
    const emailA = `test-user-a-${Date.now()}@example.com`;
    const userAData = await createUser({
      name: 'Alice User',
      email: emailA,
      passwordHash: hashed,
      role: 'individual',
      createProfile: true,
      recoveryCodeHash: 'dummy_hash_for_test'
    });
    assert(Boolean(userAData.user && userAData.user.id), 'Register new User A in MongoDB');
    assert(Boolean(userAData.profile && userAData.profile.slug), 'Auto-create profile for User A');

    // 3. Duplicate Registration Prevention
    let duplicateCaught = false;
    try {
      await createUser({
        name: 'Alice Duplicate',
        email: emailA,
        passwordHash: hashed
      });
    } catch {
      duplicateCaught = true;
    }
    assert(duplicateCaught, 'Duplicate email registration fails cleanly');

    // 4. User Retrieval by Email and ID
    const foundByEmail = await getUserByEmail(emailA);
    assert(foundByEmail?.id === userAData.user.id, 'Fetch user by normalized email');
    const foundById = await getUserById(userAData.user.id);
    assert(foundById?.email === emailA, 'Fetch user by string ID');

    // 5. User Registration (User B)
    const emailB = `test-user-b-${Date.now()}@example.com`;
    const userBData = await createUser({
      name: 'Bob User',
      email: emailB,
      passwordHash: hashed,
      role: 'individual',
      createProfile: true
    });
    assert(Boolean(userBData.user && userBData.user.id), 'Register new User B in MongoDB');

    // 6. Session Token Generation & Verification
    const sessionToken = createSessionToken({
      id: userAData.user.id,
      name: userAData.user.name,
      email: userAData.user.email
    });
    const verifiedSession = verifySessionToken(sessionToken);
    assert(verifiedSession?.id === userAData.user.id, 'Create and verify signed session token');

    // 7. Profile Isolation: User A modifies own profile (Allowed)
    const updateOwnProfile = await updateProfile(
      userAData.profile!.id,
      { designation: 'Lead Architect' },
      userAData.user.id
    );
    assert(updateOwnProfile.success && updateOwnProfile.profile?.designation === 'Lead Architect', 'User A can edit own profile');

    // 8. Profile Isolation: User B attempts to modify User A profile (Forbidden)
    const unauthorizedProfileUpdate = await updateProfile(
      userAData.profile!.id,
      { designation: 'Hacked Title' },
      userBData.user.id
    );
    assert(!unauthorizedProfileUpdate.success && unauthorizedProfileUpdate.status === 403, 'User B cannot edit User A profile (403 Forbidden)');

    // 9. Company Creation & Ownership
    const companyRes = await createCompany(userAData.user.id, {
      name: 'Alice Corp',
      tagline: 'Building the Future',
      industry: 'Technology'
    });
    assert(companyRes.company && companyRes.member.role === 'OWNER', 'User A creates company as OWNER');

    // 10. Company Isolation: User B attempts to edit User A company (Forbidden)
    const unauthorizedCompUpdate = await updateCompany(
      companyRes.company.id,
      { name: 'Comp Takeover' },
      userBData.user.id
    );
    assert(!unauthorizedCompUpdate.success && unauthorizedCompUpdate.status === 403, 'User B cannot edit User A company (403 Forbidden)');

    // 11. Company Member Invite Flow
    const inviteRes = await addCompanyMember(
      companyRes.company.id,
      { name: 'Bob Collaborator', email: emailB, role: 'MEMBER' },
      userAData.user.id
    );
    assert(inviteRes.success && Boolean(inviteRes.rawToken), 'User A invites User B to company');

    // 12. Password Reset Flow
    const resetReq = await createPasswordResetToken(emailA);
    assert(Boolean(resetReq && resetReq.token), 'Generate password reset token');

    const resetVerify = await verifyPasswordResetToken(emailA, resetReq!.token);
    assert(resetVerify.valid && resetVerify.user?.id === userAData.user.id, 'Verify valid reset token');

    const newPwHashed = await hashPassword('BrandNewPassword123!');
    const resetExec = await resetUserPassword(emailA, resetReq!.token, newPwHashed);
    assert(Boolean(resetExec), 'Execute password reset with valid token');

    const expiredTokenVerify = await verifyPasswordResetToken(emailA, resetReq!.token);
    assert(!expiredTokenVerify.valid, 'Reset token is cleared after use');

  } catch (err: any) {
    console.error('Unexpected error in test suite:', err.message);
    failed++;
  }

  console.log('\n----------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
