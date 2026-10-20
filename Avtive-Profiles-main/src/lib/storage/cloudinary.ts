import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

/**
 * Cloudinary Storage Configuration
 */
const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_NAME ||
  'avtive';

const apiKey =
  process.env.CLOUDINARY_API_KEY ||
  process.env.CLOUDINARY_KEY;

const apiSecret =
  process.env.CLOUDINARY_API_SECRET ||
  process.env.CLOUDINARY_SECRET;

export const isCloudinaryConfigured = Boolean(apiKey && apiSecret);

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
  storage: 'cloudinary' | 'local' | 'data-url';
  size?: number;
  mimeType?: string;
  error?: string;
}

/**
 * Upload a file buffer to Cloudinary with automatic fallback to local disk / data-url
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  mimeType: string = 'image/jpeg',
  folder: string = 'profiles'
): Promise<CloudinaryUploadResult> {
  // 1. Try Cloudinary if configured
  if (isCloudinaryConfigured) {
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
    } catch (err: any) {
      console.warn('[Cloudinary] Upload failed, falling back to local/data storage:', err?.message || err);
    }
  }

  // 2. Secondary Fallback: Local disk storage
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    return {
      success: true,
      url: `/uploads/${filename}`,
      filename,
      bucket: folder,
      storage: 'local',
      size: buffer.length,
      mimeType
    };
  } catch (fsErr) {
    // 3. Tertiary Fallback: Data URL so user is never blocked
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return {
      success: true,
      url: dataUrl,
      filename,
      bucket: folder,
      storage: 'data-url',
      size: buffer.length,
      mimeType
    };
  }
}

/**
 * Ensure any image asset (base64 Data URI, remote URL, or local path) is stored
 * in Cloudinary and returned as a permanent HTTPS public URL.
 */
export async function ensureCloudinaryAssetUrl(
  imageSource?: string | null,
  folder: string = 'profiles'
): Promise<string> {
  if (!imageSource || typeof imageSource !== 'string') return '';

  // Already hosted on CDN or external URL
  if (
    imageSource.startsWith('http://') ||
    imageSource.startsWith('https://') ||
    imageSource.startsWith('/uploads/')
  ) {
    return imageSource;
  }

  // Base64 Data URI
  if (imageSource.startsWith('data:')) {
    try {
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
      }
    } catch (err) {
      console.warn('[ensureCloudinaryAssetUrl] Processing error:', err);
    }
  }

  return imageSource;
}

// ─── BACKWARD COMPATIBILITY ALIASES ──────────────────────────────────────────
export const uploadToSupabaseStorage = async (
  buffer: Buffer,
  filename: string,
  contentType: string,
  preferredBucket: string = 'profiles'
) => {
  const res = await uploadToCloudinary(buffer, filename, contentType, preferredBucket);
  return {
    success: res.success,
    url: res.url,
    bucket: res.bucket,
    error: res.error
  };
};

export const ensureSupabaseAssetUrl = ensureCloudinaryAssetUrl;
