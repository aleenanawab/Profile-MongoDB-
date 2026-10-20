export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

export function normalizeEmail(email?: string | null): string {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
}

export function isValidEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function isUuidString(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

export function isValidImageMime(mimeType: string, originalName?: string): boolean {
  if (ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) return true;
  if (originalName) {
    const ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
    if (ALLOWED_IMAGE_EXTENSIONS.includes(ext)) return true;
  }
  return false;
}
