import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { getUserByEmail, getUserById, createUser, getProfileByUserId, getProfilesByUserId } from '@/lib/db';
import { setSessionCookie, setReturningUserCookie, sanitizeReturnUrl, resolveReturnUrlForExistingUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// In-memory cache for recent and in-flight code exchanges to prevent duplicate code burning
interface CodeExchangeCache {
  user: any;
  timestamp: number;
}
const processedCodes = new Map<string, CodeExchangeCache>();
const inFlightExchanges = new Map<string, Promise<any>>();

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('returnUrl') || request.cookies.get('auth_return_url')?.value;

  if (error) {
    console.error('[OAuth Callback] Provider returned error:', error, errorDescription);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 1. Check if this code was already exchanged recently (prevents double-execution / prefetch code burning)
    const cached = processedCodes.get(code);
    let authUser: any = null;
    const cookiesToSetOnResponse: Array<{ name: string; value: string; options: any }> = [];

    if (cached && (Date.now() - cached.timestamp < 60000)) {
      authUser = cached.user;
    } else if (inFlightExchanges.has(code)) {
      authUser = await inFlightExchanges.get(code);
    } else {
      const exchangePromise = (async () => {
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach((c) => cookiesToSetOnResponse.push(c));
            },
          },
        });

        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('[OAuth Callback] exchangeCodeForSession error:', exchangeError.message || exchangeError);
          return null;
        }

        return data?.user || (data as any)?.session?.user || null;
      })();

      inFlightExchanges.set(code, exchangePromise);
      try {
        authUser = await exchangePromise;
        if (authUser) {
          processedCodes.set(code, { user: authUser, timestamp: Date.now() });
          setTimeout(() => processedCodes.delete(code), 120000);
        }
      } finally {
        inFlightExchanges.delete(code);
      }
    }

    if (!authUser) {
      console.error('[OAuth Callback] Unable to retrieve user from auth code. Code length:', code.length);
      const loginUrl = new URL('/login', request.url);
      const detailError = 'Google authentication exchange failed with Supabase. Please ensure your Supabase keys (NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY) are added to your Vercel Environment Variables.';
      loginUrl.searchParams.set('error', detailError);
      return NextResponse.redirect(loginUrl);
    }

    const userId = authUser.id;
    const userEmail = (authUser.email || '').toLowerCase().trim();
    const userMetadata = authUser.user_metadata || {};
    const fullName = userMetadata.full_name || userMetadata.name || userMetadata.user_name || (userEmail ? userEmail.split('@')[0] : 'Google User');
    const avatarUrl = userMetadata.avatar_url || userMetadata.picture || '';

    // Check if user already exists in DB
    let user = await getUserById(userId);
    if (!user && userEmail) {
      user = await getUserByEmail(userEmail);
    }

    if (!user) {
      // New Google user: create user account using auth.users.id reference without profile
      const createRes = await createUser({
        id: userId,
        name: fullName,
        email: userEmail,
        passwordHash: `oauth_google_verified_${Date.now()}`,
        avatar: avatarUrl,
        createProfile: false // Must complete onboarding first
      });
      user = createRes.user;
    } else {
      // Sync Google avatar and name if missing
      if (!user.name && fullName) user.name = fullName;
      if (avatarUrl && !user.avatar) user.avatar = avatarUrl;
    }

    // Check onboarding completion status: does the user have an existing completed profile?
    const [profile, profiles] = await Promise.all([
      getProfileByUserId(user.id),
      getProfilesByUserId(user.id)
    ]);
    const userProfile = profile || (profiles && profiles.length > 0 ? profiles[0] : null);
    const hasRealProfileData = Boolean(
      userProfile && (
        (userProfile.designation && userProfile.designation !== 'Professional') ||
        (userProfile.skills && userProfile.skills.length > 0) ||
        (userProfile.experience && userProfile.experience.length > 0) ||
        (userProfile.services && userProfile.services.length > 0) ||
        (userProfile.customFields && userProfile.customFields.length > 0) ||
        (userProfile.shortBio && !userProfile.shortBio.includes('Welcome to my digital profile on Avtive.'))
      )
    );
    const hasCompletedOnboarding = Boolean(user.onboardingCompleted || hasRealProfileData);

    const sessionUser = {
      id: user.id,
      name: user.name || fullName,
      email: user.email || userEmail,
      avatar: avatarUrl || user.avatar
    };

    const safeNext = sanitizeReturnUrl(next, null);
    let destinationPath = '/onboarding/role';

    if (hasCompletedOnboarding && userProfile) {
      // Completed user: redirect directly to their own profile in view mode (or valid returnUrl)
      const targetSlug = userProfile.slug || userProfile.id || user.id;
      const userProfileUrl = `/profile/${targetSlug}`;
      destinationPath = resolveReturnUrlForExistingUser(safeNext, userProfileUrl);
    } else {
      // New user or incomplete onboarding: resume only the missing step
      const userRole = user.role || userProfile?.type;
      const userTheme = user.preferredTheme || userProfile?.theme;
      if (!userRole) {
        destinationPath = '/onboarding/role';
      } else if (!userTheme) {
        destinationPath = `/onboarding/theme?role=${encodeURIComponent(userRole)}`;
      } else {
        destinationPath = `/edit-profile?role=${encodeURIComponent(userRole)}&theme=${encodeURIComponent(userTheme)}&edit=true`;
      }
    }

    const redirectUrl = new URL(destinationPath, request.url);
    const response = NextResponse.redirect(redirectUrl);

    // Apply Supabase auth cookies on response
    cookiesToSetOnResponse.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    response.headers.set('Cache-Control', 'no-store, max-age=0');
    await setSessionCookie(sessionUser, response);
    setReturningUserCookie(response);

    response.cookies.delete('auth_return_url');
    response.cookies.delete('sb-pkce-verifier');

    return response;

  } catch (err: any) {
    console.error('OAuth callback error:', err);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'An error occurred during Google sign in.');
    return NextResponse.redirect(loginUrl);
  }
}
