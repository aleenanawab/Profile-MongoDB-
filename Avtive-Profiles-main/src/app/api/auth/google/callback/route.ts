import { NextRequest, NextResponse } from 'next/server';
import {
  verifyOAuthState,
  exchangeGoogleAuthCode,
  verifyGoogleIdToken,
  getGoogleRedirectUri,
  OAUTH_COOKIE_NAMES
} from '@/lib/auth/google';
import {
  getUserByGoogleSub,
  getUserByEmail,
  linkUserGoogleSub,
  createUser,
  getProfileByUserId,
  getProfilesByUserId,
  createProfileForUser
} from '@/lib/db';
import { setSessionCookie, setReturningUserCookie, sanitizeReturnUrl, resolveReturnUrlForExistingUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const stateParam = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  function errorRedirect(message: string): NextResponse {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', message);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(OAUTH_COOKIE_NAMES.STATE);
    res.cookies.delete(OAUTH_COOKIE_NAMES.VERIFIER);
    res.cookies.delete(OAUTH_COOKIE_NAMES.NONCE);
    return res;
  }

  // 1. Handle Google Provider Cancel / Error
  if (error) {
    console.warn('[Google OAuth Callback] Provider error:', error, errorDescription);
    return errorRedirect(errorDescription || 'Google sign-in was cancelled or encountered an error.');
  }

  if (!code) {
    return errorRedirect('Missing authorization code from Google.');
  }

  // 2. Validate Single-Use State & Anti-CSRF
  const cookieState = request.cookies.get(OAUTH_COOKIE_NAMES.STATE)?.value || '';
  const stateVerification = verifyOAuthState(stateParam || '', cookieState);
  if (!stateVerification.valid) {
    return errorRedirect(stateVerification.error || 'Invalid or expired OAuth state. Please try signing in again.');
  }

  // 3. Retrieve PKCE Verifier and Nonce
  const codeVerifier = request.cookies.get(OAUTH_COOKIE_NAMES.VERIFIER)?.value;
  const nonce = request.cookies.get(OAUTH_COOKIE_NAMES.NONCE)?.value;

  if (!codeVerifier || !nonce) {
    return errorRedirect('OAuth session expired or cookies missing. Please try signing in again.');
  }

  const host = request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;
  const redirectUri = getGoogleRedirectUri(origin);

  let googleClaims: any;
  try {
    // 4. Server-Side Token Exchange
    const tokenResponse = await exchangeGoogleAuthCode(code, codeVerifier, redirectUri);

    // 5. Verify ID Token (JWKS, iss, aud, exp, nonce)
    googleClaims = await verifyGoogleIdToken(tokenResponse.id_token, nonce);
  } catch (err: any) {
    console.error('[Google OAuth Exchange / Verify Error]:', err);
    return errorRedirect(err?.message || 'Failed to complete Google authentication. Please try again.');
  }

  const { sub, email, email_verified, name, picture } = googleClaims;

  if (!sub) {
    return errorRedirect('Google authentication response missing unique user identifier.');
  }

  // 6. User Account Resolution & Linking
  let user = await getUserByGoogleSub(sub);
  let isNewUser = false;

  if (!user) {
    if (!email_verified) {
      return errorRedirect('Your Google email address is not verified. Please verify your email with Google before signing in.');
    }

    if (!email) {
      return errorRedirect('Google did not return an email address for your account.');
    }

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      // Check if existing account has a password
      const hasPassword = Boolean(
        existingUser.passwordHash && !existingUser.passwordHash.startsWith('oauth_google_')
      );

      if (hasPassword) {
        // HARD RULE: Never auto-link to a password account
        return errorRedirect(
          'An account with this email already exists with a password. Please sign in with your email and password to access your account.'
        );
      }

      // Existing account is Google-created or has no password -> Link to Google sub
      await linkUserGoogleSub(existingUser.id, sub);
      user = (await getUserByGoogleSub(sub)) || existingUser;
      user.googleSub = sub;
    } else {
      // Create new user in MongoDB
      const fullName = name || email.split('@')[0] || 'Google User';
      const createRes = await createUser({
        name: fullName,
        email,
        avatar: picture || undefined,
        googleSub: sub,
        passwordHash: `oauth_google_${Date.now()}`,
        onboardingCompleted: false,
        createProfile: false
      });

      user = createRes.user;
      isNewUser = true;

      // Create initial profile for the new user
      try {
        await createProfileForUser(user.id, {
          name: fullName,
          email,
          avatar: picture || '',
          type: 'individual',
          theme: 'editorial'
        });
      } catch (profErr) {
        console.warn('[Google OAuth Callback] Warning creating initial profile:', profErr);
      }
    }
  }

  // 7. Check Profile & Onboarding Landing
  const [profile, profiles] = await Promise.all([
    getProfileByUserId(user.id, user.role),
    getProfilesByUserId(user.id)
  ]);
  const userProfile = profile || (profiles && profiles.length > 0 ? profiles[0] : null);

  const hasRealProfileData = Boolean(
    userProfile && (
      (userProfile.designation && userProfile.designation !== 'Professional') ||
      (userProfile.skills && userProfile.skills.length > 0) ||
      (userProfile.experiences && userProfile.experiences.length > 0) ||
      (userProfile.services && userProfile.services.length > 0)
    )
  );

  const isOnboardingComplete = Boolean(user.onboardingCompleted || hasRealProfileData);

  const returnUrl = stateVerification.returnUrl;
  const safeNext = sanitizeReturnUrl(returnUrl, null);
  let destinationPath = '/onboarding/role';

  if (!isNewUser && isOnboardingComplete && userProfile) {
    // Returning user: go straight to their existing profile
    const targetSlug = userProfile.slug || userProfile.id || user.id;
    destinationPath = resolveReturnUrlForExistingUser(safeNext, `/profile/${targetSlug}`);
  } else {
    // New user or incomplete onboarding: route to onboarding
    destinationPath = '/onboarding/role';
  }

  const sessionUser = {
    id: user.id,
    name: user.name || name || 'Google User',
    email: user.email || email,
    avatar: picture || user.avatar
  };

  const redirectUrl = new URL(destinationPath, request.url);
  const response = NextResponse.redirect(redirectUrl);

  // Set session cookies
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  await setSessionCookie(sessionUser, response);
  setReturningUserCookie(response);

  // Clear single-use OAuth cookies
  response.cookies.delete(OAUTH_COOKIE_NAMES.STATE);
  response.cookies.delete(OAUTH_COOKIE_NAMES.VERIFIER);
  response.cookies.delete(OAUTH_COOKIE_NAMES.NONCE);

  return response;
}
