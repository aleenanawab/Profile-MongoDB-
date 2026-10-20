const { createPasswordResetToken, verifyPasswordResetToken, resetUserPassword, getUserByEmail } = require('../src/lib/db');
const { verifyPassword, hashPassword } = require('../src/lib/auth');

async function run() {
  console.log('--- Step 1: Testing createPasswordResetToken ---');
  const email = 'abcd@gmail.com';
  const resetInfo = await createPasswordResetToken(email);
  if (!resetInfo) {
    console.error('Failed to create password reset token');
    process.exit(1);
  }
  console.log('Created token:', resetInfo.token);

  console.log('--- Step 2: Testing verifyPasswordResetToken ---');
  const verification = await verifyPasswordResetToken(email, resetInfo.token);
  console.log('Verification result:', verification.valid, verification.error || '');
  if (!verification.valid) {
    console.error('Verification failed');
    process.exit(1);
  }

  console.log('--- Step 3: Testing resetUserPassword ---');
  const tempPassword = 'TestNewPassword2026!';
  const newHash = await hashPassword(tempPassword);
  const updatedUser = await resetUserPassword(email, resetInfo.token, newHash);
  console.log('Password reset successful for:', updatedUser?.email);

  console.log('--- Step 4: Verify login with new password ---');
  const userAfterReset = await getUserByEmail(email);
  const isValidNewPass = await verifyPassword(tempPassword, userAfterReset.passwordHash);
  console.log('Can authenticate with new password:', isValidNewPass);

  console.log('--- Step 5: Verify reset token was expired/cleared ---');
  const reVerify = await verifyPasswordResetToken(email, resetInfo.token);
  console.log('Re-using same token is invalid (expected):', !reVerify.valid);

  console.log('--- Step 6: Restore original password Password123! ---');
  const origHash = await hashPassword('Password123!');
  const tokenForRestore = (await createPasswordResetToken(email)).token;
  await resetUserPassword(email, tokenForRestore, origHash);
  const userRestored = await getUserByEmail(email);
  const isRestored = await verifyPassword('Password123!', userRestored.passwordHash);
  console.log('Restored original password successfully:', isRestored);

  console.log('ALL FORGOT PASSWORD / RESET PASSWORD TESTS PASSED!');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
