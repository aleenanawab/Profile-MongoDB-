import crypto from 'crypto';
import { getSessionSecret } from '@/lib/auth/session';

function getShareEncryptionKey(): Buffer {
  return crypto.createHash('sha256').update(`avtive-share-key:${getSessionSecret()}`).digest();
}

/**
 * Generates a high-entropy URL-safe cryptographic random token (192 bits).
 */
export function generateShareToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

/**
 * One-way SHA-256 hash stored and indexed in MongoDB `share_links`.
 */
export function hashShareToken(rawToken: string): string {
  return crypto.createHash('sha256').update(String(rawToken || '')).digest('hex');
}

/**
 * Masks token for display hint without revealing the full secret.
 */
export function buildTokenHint(rawToken: string): string {
  if (!rawToken || rawToken.length < 10) return '••••';
  return `${rawToken.slice(0, 4)}…${rawToken.slice(-4)}`;
}

/**
 * Authenticated AES-256-GCM encryption so only the verified owner API
 * can re-derive the share URL for Copy / QR display across sessions/devices.
 */
export function encryptShareToken(rawToken: string): string {
  const key = getShareEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(rawToken, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptShareToken(payload?: string): string | null {
  if (!payload || typeof payload !== 'string') return null;
  try {
    const parts = payload.split('.');
    if (parts.length !== 3) return null;
    const [ivB64, tagB64, encB64] = parts;
    const key = getShareEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encB64, 'base64url')),
      decipher.final()
    ]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Build non-reversible deduplication hash for rapid multi-view event suppression.
 * Stores no raw IP addresses or personal identifiers.
 */
export function buildEventDedupKey(
  shareLinkId: string,
  channel: string,
  clientSignature: string,
  windowSeconds: number = 15
): string {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  return crypto
    .createHmac('sha256', getShareEncryptionKey())
    .update(`${shareLinkId}:${channel}:${clientSignature}:${bucket}`)
    .digest('hex');
}
