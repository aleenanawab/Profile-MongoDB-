import { ProfileData, UserRecord, UserSession } from '@/types/profile';

/**
 * Checks whether a profile has real user-saved data beyond default placeholders.
 */
export function hasRealSavedProfileData(profile?: ProfileData | null): boolean {
  if (!profile) return false;

  const hasNonDefaultDesignation = Boolean(
    profile.designation && 
    profile.designation.trim() !== '' && 
    profile.designation.trim().toLowerCase() !== 'professional'
  );

  const hasSkills = Array.isArray(profile.skills) && profile.skills.length > 0;
  const hasExperience = (Array.isArray(profile.experience) && profile.experience.length > 0) ||
    (Array.isArray(profile.experiences) && profile.experiences.length > 0);
  const hasProjects = Array.isArray(profile.projects) && profile.projects.length > 0;
  const hasServices = Array.isArray(profile.services) && profile.services.length > 0;
  const hasCustomFields = Array.isArray(profile.customFields) && profile.customFields.length > 0;
  const hasCertifications = Array.isArray(profile.certifications) && profile.certifications.length > 0;
  const hasEducation = Array.isArray(profile.education) && profile.education.length > 0;

  const hasNonDefaultBio = Boolean(
    profile.shortBio && 
    profile.shortBio.trim() !== '' && 
    !profile.shortBio.includes('Welcome to my digital profile on Avtive.')
  );

  return (
    hasNonDefaultDesignation ||
    hasSkills ||
    hasExperience ||
    hasProjects ||
    hasServices ||
    hasCustomFields ||
    hasCertifications ||
    hasEducation ||
    hasNonDefaultBio
  );
}

/**
 * Single source of truth for "first-time vs returning saved user".
 *
 * Rule:
 * 1. If user.onboardingCompleted is true, user has saved and is returning.
 * 2. If user has real saved profile data (legacy accounts or background saves), user is returning.
 * 3. First-time user whose profile has never been saved returns false -> opens in Edit Mode.
 */
export function isUserOnboarded(
  user?: Partial<UserRecord> | Partial<UserSession> | null,
  profile?: ProfileData | null
): boolean {
  if (!user) return false;
  if (user.onboardingCompleted === true) return true;
  return hasRealSavedProfileData(profile);
}

/**
 * Determines target destination URL and mode ('edit' | 'preview') based on single user rule.
 */
export function getProfileLandingDestination(
  user: Partial<UserRecord> | Partial<UserSession>,
  profile: ProfileData | null,
  overrideEdit?: boolean
): { url: string; mode: 'edit' | 'preview' } {
  const targetSlug = profile?.slug || profile?.id || user.id || 'my-profile';
  const onboarded = isUserOnboarded(user, profile);

  if (overrideEdit === true || !onboarded) {
    return {
      url: `/profile/${encodeURIComponent(targetSlug)}?edit=true`,
      mode: 'edit'
    };
  }

  return {
    url: `/profile/${encodeURIComponent(targetSlug)}`,
    mode: 'preview'
  };
}

/**
 * CANONICAL ROUTING RULE HELPER:
 *   not authenticated        → /login
 *   authenticated, no role   → role selection (/onboarding/role)
 *   role, no theme           → theme selection (/onboarding/theme?role=...)
 *   role + theme, no profile → profile form (/onboarding/details?role=...&theme=...)
 *   everything done          → profile VIEW page (/profile/[slug])
 *
 * A missing profile or missing onboarding data must NEVER be treated as "logged out."
 */
export function resolveUserDestination(state: {
  isAuthenticated: boolean;
  role?: string | null;
  theme?: string | null;
  hasProfile?: boolean;
  profileSlug?: string | null;
}): string {
  if (!state.isAuthenticated) {
    return '/login';
  }
  if (!state.role) {
    return '/onboarding/role';
  }
  if (!state.theme) {
    return `/onboarding/theme?role=${encodeURIComponent(state.role)}`;
  }
  if (!state.hasProfile) {
    return `/edit-profile?role=${encodeURIComponent(state.role)}&theme=${encodeURIComponent(state.theme)}`;
  }
  const slug = state.profileSlug || 'me';
  return `/profile/${encodeURIComponent(slug)}`;
}

export async function getUserRoutingDestination(
  sessionUser: UserSession | null,
  options?: { dbUser?: UserRecord | null; profile?: ProfileData | null }
): Promise<string> {
  if (!sessionUser || !sessionUser.id) {
    return '/login';
  }

  const { getUserById, getProfileByUserId, getProfilesByUserId } = await import('@/lib/db');
  const user = options?.dbUser !== undefined ? options.dbUser : await getUserById(sessionUser.id);

  const role = user?.role || sessionUser.role || null;
  const theme = user?.preferredTheme || sessionUser.preferredTheme || null;

  let profile = options?.profile;
  if (profile === undefined) {
    profile = await getProfileByUserId(sessionUser.id, role || undefined);
    if (!profile) {
      const allProfiles = await getProfilesByUserId(sessionUser.id);
      profile = allProfiles?.[0] || null;
    }
  }

  const hasProfile = isUserOnboarded(user || sessionUser, profile);

  return resolveUserDestination({
    isAuthenticated: true,
    role,
    theme,
    hasProfile,
    profileSlug: profile?.slug || profile?.id || null
  });
}

