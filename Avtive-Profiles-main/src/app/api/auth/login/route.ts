import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getProfileByUserId } from '@/lib/db';
import { verifyPassword, setSessionCookie, DUMMY_BCRYPT_HASH, setReturningUserCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await getUserByEmail(normalizedEmail);

    // ANTI-ENUMERATION TIMING DEFENSE:
    // If user does not exist, run verifyPassword against constant dummy hash
    // so response time is identical to the path where user exists
    if (!user) {
      await verifyPassword(password, DUMMY_BCRYPT_HASH);
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    let isValid = false;
    if (user.passwordHash) {
      if (user.passwordHash.startsWith('oauth_google_')) {
        return NextResponse.json(
          { error: 'This account was created with Google Sign-In. Please sign in with Google or use "Forgot password?" to set a password.' },
          { status: 401 }
        );
      }
      isValid = await verifyPassword(password, user.passwordHash);
    } else {
      return NextResponse.json(
        { error: 'This account does not have a password set. Please use "Forgot password?" to set a password.' },
        { status: 401 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const userProfile = await getProfileByUserId(user.id, user.role);
    const { hasRealSavedProfileData, resolveUserDestination } = await import('@/lib/auth/userStatus');
    const hasProfile = Boolean(userProfile && hasRealSavedProfileData(userProfile));
    const isOnboardingComplete = Boolean(user.onboardingCompleted || hasProfile);
    const targetSlug = userProfile?.slug || userProfile?.id || null;

    const role = user.role || userProfile?.type || null;
    const preferredTheme = user.preferredTheme || userProfile?.theme || null;

    // Set persistent, secure session cookie
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      onboardingCompleted: isOnboardingComplete,
      role: role || undefined,
      preferredTheme: preferredTheme || undefined
    };

    // Calculate landing page using canonical ROUTING RULE
    const redirectUrl = resolveUserDestination({
      isAuthenticated: true,
      role,
      theme: preferredTheme,
      hasProfile,
      profileSlug: targetSlug
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful.',
      user: sessionUser,
      hasProfile,
      profileSlug: targetSlug,
      profileType: role || 'individual',
      type: role || 'individual',
      onboardingCompleted: isOnboardingComplete,
      role,
      preferredTheme,
      redirectTo: redirectUrl
    });

    response.headers.set('Cache-Control', 'no-store, max-age=0');
    await setSessionCookie(sessionUser, response);
    setReturningUserCookie(response);

    if (userProfile) {
      try {
        response.cookies.set(
          'avtive_last_profile',
          encodeURIComponent(JSON.stringify({
            id: userProfile.id,
            slug: userProfile.slug,
            type: userProfile.type,
            userId: user.id
          })),
          {
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365
          }
        );
      } catch {}
    }

    return response;
  } catch (error: unknown) {
    console.error('Login API Error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
