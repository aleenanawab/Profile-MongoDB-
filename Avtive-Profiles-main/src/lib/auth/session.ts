import crypto from 'crypto';
import { cookies } from 'next/headers';
import { UserSession } from '@/types/profile';
import { getMongoDb, COLLECTIONS } from '@/lib/db/client';

export const SESSION_COOKIE_NAME = 'avtive_session';
export const RETURNING_USER_COOKIE_NAME = 'avtive_returning_user';
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'avtive-super-secret-key-prod-2026-secure-session-auth';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function setReturningUserCookie(response?: any): void {
  if (response && response.cookies) {
    try {
      response.cookies.set(RETURNING_USER_COOKIE_NAME, 'true', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      });
    } catch {}
  }
}

/**
 * Generate signed session token: base64(payload).signature
 */
export function createSessionToken(user: UserSession): string {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * Verify and decode signed session token
 */
export function verifySessionToken(token: string): UserSession | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadBase64)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    if (!payload || !payload.id || !payload.exp) return null;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      avatar: payload.avatar
    };
  } catch {
    return null;
  }
}

/**
 * Read the current authenticated user session server-side
 */
export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }
    return verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Set session cookie and record session in MongoDB
 */
export async function setSessionCookie(user: UserSession, response?: any): Promise<string> {
  const token = createSessionToken(user);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DURATION_SECONDS
  };

  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, cookieOptions);
  } catch {}

  if (response && response.cookies) {
    try {
      response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions);
    } catch {}
  }

  // Persist session to MongoDB
  try {
    const db = await getMongoDb();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_SECONDS * 1000);

    await db.collection(COLLECTIONS.SESSIONS).insertOne({
      userId: user.id,
      email: user.email,
      tokenHash,
      createdAt: now,
      expiresAt
    });
  } catch (err) {
    console.warn('[setSessionCookie] Warning saving session to MongoDB:', err);
  }

  return token;
}

/**
 * Clear session cookie and invalidate session in MongoDB on logout
 */
export async function clearSessionCookie(response?: any): Promise<void> {
  let token: string | undefined;

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    token = sessionCookie?.value;

    cookieStore.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    });
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {}

  if (response && response.cookies) {
    try {
      response.cookies.set(SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0)
      });
      response.cookies.delete(SESSION_COOKIE_NAME);
    } catch {}
  }

  if (token) {
    try {
      const db = await getMongoDb();
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await db.collection(COLLECTIONS.SESSIONS).deleteMany({ tokenHash });
    } catch {}
  }
}
