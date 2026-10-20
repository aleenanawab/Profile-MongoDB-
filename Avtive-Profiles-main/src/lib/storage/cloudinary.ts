import { v2 as cloudinary } from 'cloudinary';

/**
 * Server-Only Cloudinary Storage Configuration
 */
const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_NAME ||
  '';

const apiKey =
  process.env.CLOUDINARY_API_KEY ||
  process.env.CLOUDINARY_KEY ||
  '';

const apiSecret =
  process.env.CLOUDINARY_API_SECRET ||
  process.env.CLOUDINARY_SECRET ||
  '';

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
}

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  publicId?: string;
  bucket?: string;
  storage: 'cloudinary';
  size?: number;
  mimeType?: string;
  error?: string;
}

/**
 * Upload a file buffer to Cloudinary with strict validation and no local/data-URL fallback
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  mimeType: string = 'image/jpeg',
  folder: string = 'profiles'
): Promise<CloudinaryUploadResult> {
  const cName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || cloudName;
  const aKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY || apiKey;
  const aSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET || apiSecret;

  if (!cName || !aKey || !aSecret) {
    return {
      success: false,
      storage: 'cloudinary',
      error: 'Cloudinary storage is not configured (missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET).'
    };
  }

  cloudinary.config({
    cloud_name: cName,
    api_key: aKey,
    api_secret: aSecret,
    secure: true
  });

  try {
    const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const cleanPublicId = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `avtive/${folder}`,
      public_id: cleanPublicId,
      resource_type: 'auto',
      overwrite: true
    });

    if (result && (result.secure_url || result.url)) {
      return {
        success: true,
        url: result.secure_url || result.url,
        filename,
        publicId: result.public_id,
        bucket: folder,
        storage: 'cloudinary',
        size: result.bytes || buffer.length,
        mimeType: result.format ? `image/${result.format}` : mimeType
      };
    }

    return {
      success: false,
      storage: 'cloudinary',
      error: 'Cloudinary upload succeeded but did not return a valid secure URL.'
    };
  } catch (err: unknown) {
    const errorMsg = (err && typeof err === 'object' && 'message' in err)
      ? String((err as { message: unknown }).message)
      : (err instanceof Error ? err.message : String(err));
    console.error('[Cloudinary Upload Error]:', errorMsg);
    return {
      success: false,
      storage: 'cloudinary',
      error: `Cloudinary upload failed: ${errorMsg}`
    };
  }
}

/**
 * Ensure any image asset (base64 Data URI or remote URL) is stored in Cloudinary
 * and returned as a permanent HTTPS public URL.
 * Throws an error on upload failure — NO silent fallback to local-disk or base64 data URI.
 */
export async function ensureCloudinaryAssetUrl(
  imageSource?: string | null,
  folder: string = 'profiles'
): Promise<string> {
  if (!imageSource || typeof imageSource !== 'string') return '';

  // Already hosted on a public CDN or remote URL (Cloudinary, Supabase, Unsplash, etc.)
  if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
    return imageSource;
  }

  // Base64 Data URI
  if (imageSource.startsWith('data:')) {
    const matches = imageSource.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
    if (matches && matches[2]) {
      const mimeType = matches[1] || 'image/jpeg';
      const buffer = Buffer.from(matches[2], 'base64');
      const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
      const filename = `${folder}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

      const uploadRes = await uploadToCloudinary(buffer, filename, mimeType, folder);
      if (uploadRes.success && uploadRes.url) {
        return uploadRes.url;
      }
      throw new Error(uploadRes.error || 'Failed to upload image to Cloudinary.');
    }
  }

  return imageSource;
}

// ─── BACKWARD COMPATIBILITY ALIASES ──────────────────────────────────────────
export const uploadToSupabaseStorage = uploadToCloudinary;
export const ensureSupabaseAssetUrl = ensureCloudinaryAssetUrl;
