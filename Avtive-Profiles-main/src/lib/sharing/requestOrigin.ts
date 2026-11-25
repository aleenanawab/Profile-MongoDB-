import { NextRequest } from 'next/server';

export function resolveRequestOrigin(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (host) {
    return `${host.includes('localhost') || host.startsWith('127.') ? 'http' : proto}://${host}`;
  }
  return request.nextUrl.origin;
}
