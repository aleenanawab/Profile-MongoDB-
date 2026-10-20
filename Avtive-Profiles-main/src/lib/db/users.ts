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
    preferredTheme: doc.preferredTheme || undefined
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

  const userDoc = {
    _id: userId as any,
    id: userId,
    name: data.name.trim(),
    email: normalizedEmail,
    passwordHash: data.passwordHash || '',
    avatar: data.avatar || undefined,
    role: data.role ? normalizeProfileType(data.role) : undefined,
    onboardingCompleted: data.onboardingCompleted !== undefined ? data.onboardingCompleted : (data.createProfile ? true : false),
    recoveryCodeHash: data.recoveryCodeHash || undefined,
    preferredTheme: data.preferredTheme || undefined,
    createdAt: now,
    updatedAt: now
  };

  try {
    await usersCol.insertOne(userDoc);
  } catch (err: any) {
    if (err.code === 11000) {
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
