import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public endpoints that do not require authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/api/upload',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/social',
  '/api/auth/callback',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/profile/connect',
  '/company/invite'
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Allow public static assets and next internal assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Allow public authentication endpoints
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }

  // 3. Allow public profile viewing (/profile/[slug]) but protect editing/sharing routes
  if (pathname.startsWith('/profile/')) {
    const isEditOrShare = pathname.includes('/edit') || pathname.includes('/share');
    if (!isEditOrShare) {
      return NextResponse.next();
    }
  }

  // 3b. Allow public company profile viewing (/api/company/[slug] via GET, excluding /me or /members)
  if (
    pathname.startsWith('/api/company/') && 
    request.method === 'GET' && 
    !pathname.endsWith('/me') && 
    !pathname.includes('/members')
  ) {
    return NextResponse.next();
  }

  // 4. Check for active session cookie
  const sessionCookie = request.cookies.get('avtive_session');
  const hasValidSession = Boolean(sessionCookie && sessionCookie.value && sessionCookie.value.includes('.'));


  // 4. Strict gatekeeper: If no valid session, deny access to site and data
  if (!hasValidSession) {
    // For API endpoints: return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to access this resource.' },
        { status: 401 }
      );
    }

    // For all page navigations: redirect to login
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('returnUrl', pathname + search);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
};
