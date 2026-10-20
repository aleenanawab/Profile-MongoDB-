import bcrypt from 'bcryptjs';

export const DUMMY_BCRYPT_HASH = '$2a$10$wN1Q/X8Oa6xG/G9x0.GzOuq8Z9y2j4yJz/uVl3IqNfO1.tJ5bI5Ki';

/**
 * Hash plain-text password using bcryptjs (10 salt rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify plain-text password against stored bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}
