/**
 * Legacy Supabase Asset URLs and CDN Path Helpers
 * ------------------------------------------------
 * Note: Database, Auth, and new Uploads have been completely migrated to MongoDB,
 * native authentication, and Cloudinary.
 * This file retains existing static asset CDN URL constants to ensure existing profile
 * avatar and cover image references remain displayable without breaking client renders.
 */

export const supabaseUrl = 'https://hprlnnbnzomgvscmyane.supabase.co';

export const PROFILES_STORAGE_BUCKET = 'profiles';
export const LINKS_STORAGE_BUCKET = 'links';
export const DEFAULT_STORAGE_BUCKET = PROFILES_STORAGE_BUCKET;
export const CANDIDATE_BUCKETS = ['profiles', 'links', 'avatars', 'media', 'uploads', 'public'];

/**
 * Retains permanent Supabase Storage public CDN URL for an existing asset in any bucket
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

export const SUPABASE_DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%236366f1'/%3E%3Cpath d='M64 28a24 24 0 1 0 0 48 24 24 0 0 0 0-48zm0 56c-26.7 0-48 16-48 32v4h96v-4c0-16-21.3-32-48-32z' fill='%23ffffff' opacity='0.9'/%3E%3C/svg%3E";
export const SUPABASE_DEFAULT_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231e1b4b'/%3E%3Cstop offset='50%25' stop-color='%23312e81'/%3E%3Cstop offset='100%25' stop-color='%230f172a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='400' fill='url(%23g)'/%3E%3Ccircle cx='200' cy='100' r='180' fill='%234338ca' opacity='0.25'/%3E%3Ccircle cx='1000' cy='300' r='220' fill='%2306b6d4' opacity='0.15'/%3E%3C/svg%3E";
export const SUPABASE_DEFAULT_PROJECT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%2318181b'/%3E%3Crect x='160' y='110' width='80' height='80' rx='12' fill='%2327272a' stroke='%233f3f46' stroke-width='2'/%3E%3Cpath d='M190 140h20M200 130v20' stroke='%23a1a1aa' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E";
export const SUPABASE_DEFAULT_LINK_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='28' fill='%2327272a'/%3E%3Cpath d='M24 32a8 8 0 0 1 8-8h6a8 8 0 0 1 0 16h-6' fill='none' stroke='%23a1a1aa' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E";

