import { ProfileData } from '@/types/profile';

/**
 * Canonical getters for profile fields with overlapping aliases.
 * Provides a single source of truth across all renderers.
 */

export function getTitle(profile?: Partial<ProfileData> | null): string {
  if (!profile) return '';
  return (
    profile.professionalTitle ||
    profile.designation ||
    profile.profession ||
    ''
  ).trim();
}

export function getShortBio(profile?: Partial<ProfileData> | null): string {
  if (!profile) return '';
  return (
    profile.shortBio ||
    profile.bio ||
    ''
  ).trim();
}

export function getAbout(profile?: Partial<ProfileData> | null): string {
  if (!profile) return '';
  return (
    profile.about ||
    profile.fullBio ||
    ''
  ).trim();
}
