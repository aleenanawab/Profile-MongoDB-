import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

function cleanEnv(val?: string): string {
  if (!val) return '';
  let v = val.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

function isServiceRoleKey(key: string): boolean {
  if (!key) return false;
  const serviceKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (serviceKey && key === serviceKey) return true;
  if (key.startsWith('eyJ')) {
    try {
      const parts = key.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        return payload?.role === 'service_role';
      }
    } catch {}
  }
  return false;
}

export const supabaseUrl = (cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) || 'https://hprlnnbnzomgvscmyane.supabase.co').replace(/\/+$/, '');
const fallbackKey = 'sb_publishable_bNsqgK4UHrzGybL-a6hjJg_07aZL1_7';

const rawAnonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
// Protect against accidental exposure or usage of service_role key as anon key:
export const supabaseAnonKey = (rawAnonKey && !isServiceRoleKey(rawAnonKey)) ? rawAnonKey : fallbackKey;

export const supabaseServiceKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) || supabaseAnonKey;

export const SUPABASE_AUTH_STORAGE_KEY = 'sb-avtive-auth-token';

// Public client for browser / client-side operations using official @supabase/ssr
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Admin / Server client with elevated privileges for server route handlers
// Instantiated ONLY on the server to prevent duplicate GoTrueClient instances in the browser
export const supabaseAdmin = typeof window === 'undefined'
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        storageKey: 'sb-avtive-admin-token',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    })
  : (null as any);

export const PROFILES_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'profiles';
export const LINKS_STORAGE_BUCKET = process.env.SUPABASE_LINKS_BUCKET || 'links';
export const DEFAULT_STORAGE_BUCKET = PROFILES_STORAGE_BUCKET;
export const CANDIDATE_BUCKETS = ['profiles', 'links', 'avatars', 'media', 'uploads', 'public'];

/**
 * Get permanent Supabase Storage public CDN URL for an asset in any bucket
 */
export function getSupabasePublicUrl(bucket: string = PROFILES_STORAGE_BUCKET, filePath: string): string {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return filePath;
  }
  const cleanPath = filePath.replace(/^\/+/, '');
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

export function getSupabaseProfileAssetUrl(filename: string): string {
  return getSupabasePublicUrl(PROFILES_STORAGE_BUCKET, filename);
}

export function getSupabaseLinkAssetUrl(filename: string): string {
  return getSupabasePublicUrl(LINKS_STORAGE_BUCKET, filename);
}

export const SUPABASE_DEFAULT_AVATAR = `${supabaseUrl}/storage/v1/object/public/profiles/default-avatar.png`;
export const SUPABASE_DEFAULT_COVER = `${supabaseUrl}/storage/v1/object/public/profiles/default-cover.png`;
export const SUPABASE_DEFAULT_PROJECT_IMAGE = `${supabaseUrl}/storage/v1/object/public/profiles/default-project.png`;
export const SUPABASE_DEFAULT_LINK_ICON = `${supabaseUrl}/storage/v1/object/public/links/default-link.png`;

import {
  uploadToCloudinary,
  ensureCloudinaryAssetUrl as ensureStorageCloudinaryAssetUrl
} from './storage/cloudinary';

/**
 * Upload a file buffer directly to Cloudinary storage and return its public CDN URL
 */
export async function uploadToSupabaseStorage(
  buffer: Buffer,
  filename: string,
  contentType: string,
  preferredBucket: string = PROFILES_STORAGE_BUCKET
): Promise<{ success: boolean; url?: string; error?: string; bucket?: string }> {
  const result = await uploadToCloudinary(buffer, filename, contentType, preferredBucket);
  return {
    success: result.success,
    url: result.url,
    bucket: result.bucket || preferredBucket,
    error: result.error
  };
}

/**
 * Ensure any image asset (base64 Data URI or file buffer) is saved to Cloudinary Storage
 * and returned as a permanent public CDN URL.
 */
export async function ensureSupabaseAssetUrl(
  imageSource?: string | null,
  preferredBucket: string = PROFILES_STORAGE_BUCKET
): Promise<string> {
  return ensureStorageCloudinaryAssetUrl(imageSource, preferredBucket);
}

export const ensureCloudinaryAssetUrl = ensureStorageCloudinaryAssetUrl;


