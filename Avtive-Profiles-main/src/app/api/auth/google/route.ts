import { NextRequest, NextResponse } from 'next/server';
import { createGoogleAuthUrl, getGoogleOAuthConfig, OAUTH_COOKIE_NAMES } from '@/lib/auth/google';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { isConfigured } = getGoogleOAuthConfig();
    if (!isConfigured) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Google Sign-In is not configured on this server (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET).');
      return NextResponse.redirect(loginUrl);
    }

    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl') || searchParams.get('next') || undefined;

    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const origin = `${proto}://${host}`;

    const { url, state, codeVerifier, nonce } = createGoogleAuthUrl(origin, returnUrl);

    const response = NextResponse.redirect(url);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 600 // 10 minutes
    };

    response.cookies.set(OAUTH_COOKIE_NAMES.STATE, state, cookieOptions);
    response.cookies.set(OAUTH_COOKIE_NAMES.VERIFIER, codeVerifier, cookieOptions);
    response.cookies.set(OAUTH_COOKIE_NAMES.NONCE, nonce, cookieOptions);

    return response;
  } catch (err: any) {
    console.error('[Google OAuth Init Error]:', err);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', err?.message || 'Failed to initialize Google Sign-In.');
    return NextResponse.redirect(loginUrl);
  }
}
