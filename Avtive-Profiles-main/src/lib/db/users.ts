import crypto from 'crypto';
import { UserRecord, ProfileData, ProfileType, ProfileTheme, normalizeProfileType } from '@/types/profile';
import { getMongoDb, COLLECTIONS } from './client';
import { lazyEnsureIndexes } from './indexes';
import { normalizeEmail } from '../validation';
import { createProfileForUser } from './profiles';

function mapDocToUserRecord(doc: any): UserRecord {
  return {
    id: String(doc._id || doc.id),
    name: doc.name || '',
    email: doc.email || '',
    passwordHash: doc.passwordHash || '',
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : (doc.createdAt || new Date().toISOString()),
    role: doc.role ? normalizeProfileType(doc.role) : undefined,
    avatar: doc.avatar || undefined,
    resetToken: doc.resetToken || undefined,
    resetTokenExpires: doc.resetTokenExpires instanceof Date ? doc.resetTokenExpires.toISOString() : (doc.resetTokenExpires || undefined),
    onboardingCompleted: Boolean(doc.onboardingCompleted),
    recoveryCodeHash: doc.recoveryCodeHash || undefined,
    preferredTheme: doc.preferredTheme || undefined,
    googleSub: doc.googleSub || undefined
  };
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const doc = await db.collection(COLLECTIONS.USERS).findOne({ email: normalized });
  if (!doc) return null;
  return mapDocToUserRecord(doc);
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  if (!id || typeof id !== 'string') return null;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const doc = await db.collection(COLLECTIONS.USERS).findOne({
    $or: [{ _id: id as any }, { id: id }]
  });
  if (!doc) return null;
  return mapDocToUserRecord(doc);
}

export async function getUserByEmailOrUsername(identifier: string): Promise<UserRecord | null> {
  if (!identifier || typeof identifier !== 'string') return null;
  const normalized = identifier.toLowerCase().trim();

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const doc = await db.collection(COLLECTIONS.USERS).findOne({
    $or: [
      { email: normalized },
      { username: normalized },
      { id: identifier },
      { _id: identifier as any }
    ]
  });
  if (!doc) return null;
  return mapDocToUserRecord(doc);
}

export async function getUserByGoogleSub(googleSub: string): Promise<UserRecord | null> {
  if (!googleSub || typeof googleSub !== 'string') return null;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const doc = await db.collection(COLLECTIONS.USERS).findOne({ googleSub: googleSub.trim() });
  if (!doc) return null;
  return mapDocToUserRecord(doc);
}

export async function linkUserGoogleSub(userId: string, googleSub: string): Promise<boolean> {
  if (!userId || !googleSub) return false;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const res = await db.collection(COLLECTIONS.USERS).updateOne(
    { $or: [{ _id: userId as any }, { id: userId }] },
    { $set: { googleSub: googleSub.trim(), updatedAt: new Date().toISOString() } }
  );
  return res.modifiedCount > 0;
}

export async function createUser(data: {
  id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  role?: ProfileType;
  createProfile?: boolean;
  recoveryCodeHash?: string;
  onboardingCompleted?: boolean;
  preferredTheme?: ProfileTheme;
  googleSub?: string;
}): Promise<{ user: UserRecord; profile?: ProfileData }> {
  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const usersCol = db.collection(COLLECTIONS.USERS);

  const normalizedEmail = normalizeEmail(data.email);
  if (!normalizedEmail) {
    throw new Error('Valid email address is required.');
  }

  // Check if existing user with same email already in DB
  const existingUser = await usersCol.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new Error('An account with this email address already exists.');
  }

  const userId = data.id || `usr-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const userDoc: Record<string, any> = {
    _id: userId,
    id: userId,
    name: data.name.trim(),
    email: normalizedEmail,
    passwordHash: data.passwordHash || '',
    createdAt: now,
    updatedAt: now
  };

  if (data.avatar) userDoc.avatar = data.avatar;
  if (data.role) userDoc.role = normalizeProfileType(data.role);
  if (data.onboardingCompleted !== undefined) {
    userDoc.onboardingCompleted = data.onboardingCompleted;
  } else if (data.createProfile) {
    userDoc.onboardingCompleted = true;
  } else {
    userDoc.onboardingCompleted = false;
  }
  if (data.recoveryCodeHash) userDoc.recoveryCodeHash = data.recoveryCodeHash;
  if (data.preferredTheme) userDoc.preferredTheme = data.preferredTheme;
  if (data.googleSub && typeof data.googleSub === 'string' && data.googleSub.trim()) {
    userDoc.googleSub = data.googleSub.trim();
  }

  try {
    await usersCol.insertOne(userDoc);
  } catch (err: any) {
    if (err.code === 11000) {
      if (err.keyPattern?.googleSub || err.message?.includes('googleSub')) {
        throw new Error('This Google account is already linked to another user.');
      }
      throw new Error('An account with this email address already exists.');
    }
    throw err;
  }

  const savedUser = mapDocToUserRecord(userDoc);

  let profile: ProfileData | undefined;
  if (data.createProfile) {
    try {
      profile = await createProfileForUser(userId, {
        name: savedUser.name,
        email: savedUser.email,
        type: savedUser.role || 'individual',
        theme: savedUser.preferredTheme || 'editorial'
      });
    } catch (profErr) {
      console.warn('[createUser] Warning creating default profile:', profErr);
    }
  }

  return { user: savedUser, profile };
}

export async function completeUserOnboarding(
  userId: string,
  role?: ProfileType,
  theme?: ProfileTheme
): Promise<{ success: boolean; user?: UserRecord }> {
  if (!userId) return { success: false };

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const usersCol = db.collection(COLLECTIONS.USERS);

  const updates: Record<string, any> = {
    onboardingCompleted: true,
    updatedAt: new Date().toISOString()
  };
  if (role) updates.role = normalizeProfileType(role);
  if (theme) updates.preferredTheme = theme;

  const result = await usersCol.findOneAndUpdate(
    { $or: [{ _id: userId as any }, { id: userId }] },
    { $set: updates },
    { returnDocument: 'after' }
  );

  if (!result) return { success: false };
  return { success: true, user: mapDocToUserRecord(result) };
}
