import crypto from 'crypto';
import { UserRecord } from '@/types/profile';
import { getMongoDb, COLLECTIONS } from './client';
import { getUserByEmail, getUserByEmailOrUsername, getUserById } from './users';
import { normalizeEmail } from '../validation';

export async function createPasswordResetToken(email: string): Promise<{ token: string; user: UserRecord } | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const user = await getUserByEmail(normalizedEmail);
  if (!user) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour validity

  const db = await getMongoDb();
  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: user.id as any },
    { $set: { resetToken: tokenHash, resetTokenExpires: expires, updatedAt: new Date().toISOString() } }
  );

  const updatedUser = await getUserById(user.id);
  if (!updatedUser) return null;

  return { token, user: updatedUser };
}

export async function verifyPasswordResetToken(
  email: string,
  token: string
): Promise<{ valid: boolean; error?: string; user?: UserRecord }> {
  if (!token || !token.trim()) {
    return { valid: false, error: 'Reset token is required.' };
  }

  const normalizedEmail = normalizeEmail(email);
  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  const db = await getMongoDb();
  const query: Record<string, any> = { resetToken: tokenHash };
  if (normalizedEmail) {
    query.email = normalizedEmail;
  }

  const doc = await db.collection(COLLECTIONS.USERS).findOne(query);
  if (!doc) {
    return { valid: false, error: 'Invalid or expired password reset link.' };
  }

  if (!doc.resetTokenExpires) {
    return { valid: false, error: 'Reset link does not contain an expiration timestamp.' };
  }

  const expiresDate = new Date(doc.resetTokenExpires);
  if (isNaN(expiresDate.getTime()) || expiresDate.getTime() < Date.now()) {
    return { valid: false, error: 'Password reset link has expired. Please request a new one.' };
  }

  const user = await getUserById(String(doc._id || doc.id));
  return { valid: true, user: user || undefined };
}

export async function resetUserPassword(
  email: string,
  token: string,
  newPasswordHash: string
): Promise<UserRecord | null> {
  const verification = await verifyPasswordResetToken(email, token);
  if (!verification.valid || !verification.user) {
    return null;
  }

  const db = await getMongoDb();
  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: verification.user.id as any },
    {
      $set: {
        passwordHash: newPasswordHash,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date().toISOString()
      }
    }
  );

  return getUserById(verification.user.id);
}

export async function verifyRecoveryCode(
  emailOrUsername: string,
  recoveryCode: string
): Promise<{ valid: boolean; user?: UserRecord; error?: string }> {
  const user = await getUserByEmailOrUsername(emailOrUsername);
  if (!user) {
    return { valid: false, error: 'Invalid email/username or recovery code.' };
  }

  if (!user.recoveryCodeHash) {
    return { valid: false, error: 'No recovery code configured for this account. Please contact support.' };
  }

  const cleanCode = recoveryCode.trim().toUpperCase();
  const hashedInput = crypto.createHash('sha256').update(cleanCode).digest('hex');

  if (user.recoveryCodeHash !== hashedInput) {
    return { valid: false, error: 'Invalid recovery code. Please check and try again.' };
  }

  return { valid: true, user };
}

export async function resetPasswordWithRecoveryCode(
  emailOrUsername: string,
  recoveryCode: string,
  newPasswordHash: string,
  newRecoveryCodeHash: string
): Promise<{ success: boolean; user?: UserRecord; error?: string }> {
  const check = await verifyRecoveryCode(emailOrUsername, recoveryCode);
  if (!check.valid || !check.user) {
    return { success: false, error: check.error || 'Invalid recovery code.' };
  }

  const db = await getMongoDb();
  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: check.user.id as any },
    {
      $set: {
        passwordHash: newPasswordHash,
        recoveryCodeHash: newRecoveryCodeHash,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date().toISOString()
      }
    }
  );

  const updatedUser = await getUserById(check.user.id);
  return { success: true, user: updatedUser || undefined };
}
