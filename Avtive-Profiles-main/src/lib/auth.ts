import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { UserSession } from '@/types/profile';

const SESSION_COOKIE_NAME = 'avtive_session';
export const RETURNING_USER_COOKIE_NAME = 'avtive_returning_user';
export const DUMMY_BCRYPT_HASH = '$2a$10$wN1Q/X8Oa6xG/G9x0.GzOuq8Z9y2j4yJz/uVl3IqNfO1.tJ5bI5Ki';
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'avtive-super-secret-key-prod-2026-secure-session-auth';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

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
 * Hash plain-text password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify plain-text password against stored bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a signed session token: base64(payload).signature
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
 * Verify and decode a signed session token
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
 * Server-side helper to read the current authenticated user session
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
 * Server-side helper to set session cookie on response
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

  return token;
}

/**
 * Server-side helper to clear session cookie and all profile cached cookies on logout
 */
export async function clearSessionCookie(response?: any): Promise<void> {
  const cookiesToClear = [
    SESSION_COOKIE_NAME,
    'avtive_user_cache',
    'avtive_last_profile',
    'avtive_prof_count'
  ];

  for (let i = 0; i <= 20; i++) {
    cookiesToClear.push(`avtive_prof_${i}`);
  }

  try {
    const cookieStore = await cookies();
    for (const cookieName of cookiesToClear) {
      cookieStore.set(cookieName, '', {
        httpOnly: cookieName === SESSION_COOKIE_NAME || cookieName === 'avtive_user_cache',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0)
      });
      cookieStore.delete(cookieName);
    }
  } catch {}

  if (response && response.cookies) {
    try {
      for (const cookieName of cookiesToClear) {
        response.cookies.set(cookieName, '', {
          httpOnly: cookieName === SESSION_COOKIE_NAME || cookieName === 'avtive_user_cache',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
          expires: new Date(0)
        });
        response.cookies.delete(cookieName);
      }
    } catch {}
  }
}

export { sanitizeReturnUrl, resolveReturnUrlForExistingUser } from './utils';



