import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validate and sanitize returnUrl to prevent open redirects.
 * Only accepts same-origin relative paths starting with a single '/'
 * Rejects '//', backslashes '\', protocols, javascript:, data:, and encoded variants.
 */
export function sanitizeReturnUrl(url: string | null | undefined, defaultUrl: string | null = '/'): string | null {
  if (!url || typeof url !== 'string') return defaultUrl;
  const trimmed = url.trim();
  if (!trimmed) return defaultUrl;

  // Must start with exactly one '/' and not followed by another '/' or '\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.includes('\\')) {
    return defaultUrl;
  }

  // Reject URL-encoded characters that decode to slashes or backslashes at start or in protocol
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('/%2f') || lower.startsWith('/%5c') || lower.includes('%5c')) {
    return defaultUrl;
  }

  // Reject explicit schemes or pseudo-schemes
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) || /javascript:/i.test(trimmed) || /data:/i.test(trimmed) || /vbscript:/i.test(trimmed)) {
    return defaultUrl;
  }

  // Reject authentication/auth loops
  if (trimmed.startsWith('/login') || trimmed.startsWith('/register') || trimmed.startsWith('/api/auth')) {
    return defaultUrl;
  }

  // Verify URL parsing relative to dummy origin produces strictly same-origin relative path
  try {
    const dummyOrigin = 'https://avtive.internal';
    const parsed = new URL(trimmed, dummyOrigin);
    if (parsed.origin !== dummyOrigin) {
      return defaultUrl;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return defaultUrl;
  }
}

/**
 * For an existing user with a profile, resolves a returnUrl so that
 * any URL ending in /edit, matching an edit path, or containing an edit flag resolves
 * to the view URL of their profile.
 * Non-edit same-origin relative returnUrls (e.g. /dashboard) are preserved.
 */
export function resolveReturnUrlForExistingUser(
  returnUrl: string | null | undefined,
  userProfileUrl: string
): string {
  if (!returnUrl) return userProfileUrl;
  const sanitized = sanitizeReturnUrl(returnUrl, null);
  if (!sanitized) return userProfileUrl;

  try {
    const dummyOrigin = 'https://avtive.internal';
    const parsed = new URL(sanitized, dummyOrigin);
    const pathname = parsed.pathname.replace(/\/+$/, '');
    const hasEditFlag =
      parsed.searchParams.has('edit') ||
      parsed.searchParams.get('edit') === 'true' ||
      parsed.searchParams.get('edit') === '1';

    // Reject auth/onboarding loops
    if (
      pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/api/auth')
    ) {
      return userProfileUrl;
    }

    // Direct /profile, /my-profile, or undefined identifier paths to user's saved profile
    if (
      pathname === '' ||
      pathname === '/profile' ||
      pathname === '/my-profile' ||
      pathname === '/profile/undefined' ||
      pathname === '/profile/null'
    ) {
      return userProfileUrl;
    }

    // If pathname is an edit route, ends with /edit, or contains an edit flag
    if (
      pathname === '/edit-profile' ||
      pathname === '/profile/edit' ||
      pathname.endsWith('/edit') ||
      hasEditFlag
    ) {
      // If it targets a specific profile like /profile/:identifier/edit or /profile/:identifier?edit=true
      const profileMatch = pathname.match(/^\/profile\/([^/]+)(\/edit)?$/);
      if (profileMatch && profileMatch[1] && profileMatch[1] !== 'edit') {
        const identifier = profileMatch[1];
        parsed.searchParams.delete('edit');
        const remainingSearch = parsed.searchParams.toString();
        const searchSuffix = remainingSearch ? `?${remainingSearch}` : '';
        return `/profile/${identifier}${searchSuffix}${parsed.hash}`;
      }
      return userProfileUrl;
    }

    return sanitized;
  } catch {
    return userProfileUrl;
  }
}
