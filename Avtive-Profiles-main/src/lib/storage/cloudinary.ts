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

export function normalizeMimeType(mimeType: string = 'image/jpeg'): string {
  const base = (mimeType || 'image/jpeg').split(';')[0].trim().toLowerCase();
  if (!base || !base.includes('/')) return 'image/jpeg';
  return base === 'image/jpg' ? 'image/jpeg' : base;
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
    const normalizedMime = normalizeMimeType(mimeType);
    const cleanPublicId = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

    const isAudioOrVideo = normalizedMime.startsWith('audio/') || normalizedMime.startsWith('video/');
    const isRawDoc = normalizedMime === 'application/pdf';
    const resType = isAudioOrVideo ? 'video' : isRawDoc ? 'raw' : 'auto';

    // Stream raw binary bytes directly rather than encoding data URIs (avoids Cloudinary "Unsupported source URL" on parameterized MIME types like audio/webm;codecs=opus)
    const result = await new Promise<{
      secure_url?: string;
      url?: string;
      public_id?: string;
      bytes?: number;
      format?: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `avtive/${folder}`,
          public_id: cleanPublicId,
          resource_type: resType,
          overwrite: true
        },
        (error, res) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(res || {});
        }
      );
      uploadStream.end(buffer);
    });

    if (result && (result.secure_url || result.url)) {
      const resolvedMime = isAudioOrVideo || isRawDoc
        ? normalizedMime
        : result.format && normalizedMime.startsWith('image/')
          ? `image/${result.format}`
          : normalizedMime;

      return {
        success: true,
        url: result.secure_url || result.url,
        filename,
        publicId: result.public_id,
        bucket: folder,
        storage: 'cloudinary',
        size: result.bytes || buffer.length,
        mimeType: resolvedMime
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

  // Base64 Data URI (handles parameterized MIME types like audio/webm;codecs=opus)
  if (imageSource.startsWith('data:')) {
    const matches = imageSource.match(/^data:([^;,]+)(?:;[^,]*)?;base64,(.+)$/);
    if (matches && matches[2]) {
      const mimeType = normalizeMimeType(matches[1] || 'image/jpeg');
      const buffer = Buffer.from(matches[2], 'base64');
      const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : mimeType.includes('webm') ? '.webm' : '.jpg';
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

/**
 * Remove an existing asset from Cloudinary by its public ID.
 * Returns true if destroyed or not found, false on failure.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> {
  if (!publicId || typeof publicId !== 'string') return true;

  const cName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || cloudName;
  const aKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY || apiKey;
  const aSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET || apiSecret;

  if (!cName || !aKey || !aSecret) return false;

  cloudinary.config({
    cloud_name: cName,
    api_key: aKey,
    api_secret: aSecret,
    secure: true
  });

  try {
    const res = await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: resourceType });
    return res?.result === 'ok' || res?.result === 'not found';
  } catch (err: unknown) {
    console.warn('[Cloudinary Delete Warning]:', err instanceof Error ? err.message : String(err));
    return false;
  }
}
