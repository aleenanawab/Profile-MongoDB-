import crypto from 'crypto';
import * as jose from 'jose';

import { getSessionSecret } from './session';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

export const OAUTH_COOKIE_NAMES = {
  STATE: 'avtive_oauth_state',
  VERIFIER: 'avtive_oauth_verifier',
  NONCE: 'avtive_oauth_nonce'
} as const;

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  isConfigured: boolean;
}

export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  return {
    clientId,
    clientSecret,
    isConfigured: Boolean(clientId && clientSecret)
  };
}

export function getGoogleRedirectUri(origin?: string): string {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || origin || 'http://localhost:3000').replace(/\/+$/, '');
  return `${baseUrl}/api/auth/google/callback`;
}

export interface GoogleInitAuthResult {
  url: string;
  state: string;
  codeVerifier: string;
  nonce: string;
}

/**
 * Generate PKCE verifier, challenge, signed state, and nonce
 */
export function createGoogleAuthUrl(origin: string, returnUrl?: string): GoogleInitAuthResult {
  const { clientId, isConfigured } = getGoogleOAuthConfig();
  if (!isConfigured) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are missing.');
  }

  // 1. PKCE Code Verifier & Challenge (RFC 7636 S256)
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  // 2. Cryptographic Nonce to prevent replay attacks
  const nonce = crypto.randomBytes(16).toString('base64url');

  // 3. Signed Single-Use State (HMAC-SHA256) with 10-minute validity
  const statePayload = Buffer.from(
    JSON.stringify({
      id: crypto.randomUUID(),
      returnUrl: returnUrl || null,
      timestamp: Date.now()
    })
  ).toString('base64url');

  const stateSig = crypto.createHmac('sha256', getSessionSecret()).update(statePayload).digest('base64url');
  const state = `${statePayload}.${stateSig}`;

  const redirectUri = getGoogleRedirectUri(origin);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    nonce,
    access_type: 'online',
    prompt: 'select_account'
  });

  return {
    url: `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`,
    state,
    codeVerifier,
    nonce
  };
}

export interface VerifiedOAuthState {
  valid: boolean;
  returnUrl?: string | null;
  error?: string;
}

/**
 * Verify and decode HMAC-signed state
 */
export function verifyOAuthState(stateString: string, cookieState: string): VerifiedOAuthState {
  if (!stateString || !cookieState) {
    return { valid: false, error: 'Missing OAuth state token.' };
  }

  if (stateString !== cookieState) {
    return { valid: false, error: 'OAuth state mismatch (potential CSRF).' };
  }

  const parts = stateString.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed OAuth state.' };
  }

  const [payloadBase64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', getSessionSecret()).update(payloadBase64).digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, error: 'Invalid OAuth state signature.' };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    if (!payload || !payload.timestamp) {
      return { valid: false, error: 'Invalid state payload.' };
    }

    // 10 minutes maximum state age
    if (Date.now() - payload.timestamp > 10 * 60 * 1000) {
      return { valid: false, error: 'OAuth session expired. Please sign in again.' };
    }

    return { valid: true, returnUrl: payload.returnUrl || null };
  } catch {
    return { valid: false, error: 'Failed to parse OAuth state.' };
  }
}

export interface GoogleTokenResponse {
  id_token: string;
  access_token: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

/**
 * Exchange Authorization Code for Tokens at Google Token Endpoint
 */
export async function exchangeGoogleAuthCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  tokenEndpointOverride?: string
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, isConfigured } = getGoogleOAuthConfig();
  if (!isConfigured) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are missing.');
  }

  const endpoint = tokenEndpointOverride || GOOGLE_TOKEN_ENDPOINT;

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Google token exchange failed (${res.status}): ${errorBody || res.statusText}`);
  }

  const data = await res.json();
  if (!data.id_token) {
    throw new Error('Google token exchange response did not contain an id_token.');
  }

  return data;
}

export interface GoogleUserClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

let cachedJWKS: jose.JWTVerifyGetKey | null = null;

function getGoogleJWKS(): jose.JWTVerifyGetKey {
  if (!cachedJWKS) {
    cachedJWKS = jose.createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
  }
  return cachedJWKS;
}

/**
 * Verify Google ID Token cryptographic signature via JWKS, issuer, audience, and nonce
 */
export async function verifyGoogleIdToken(
  idToken: string,
  expectedNonce: string,
  jwksOverride?: Parameters<typeof jose.jwtVerify>[1]
): Promise<GoogleUserClaims> {
  const { clientId } = getGoogleOAuthConfig();
  const jwks = jwksOverride || getGoogleJWKS();

  const { payload } = await jose.jwtVerify(idToken, jwks, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: clientId || undefined
  });

  if (!payload.sub) {
    throw new Error('Google ID token is missing the "sub" claim.');
  }

  if (expectedNonce && payload.nonce !== expectedNonce) {
    throw new Error('Google ID token nonce does not match session nonce.');
  }

  return {
    sub: String(payload.sub),
    email: typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : '',
    email_verified: Boolean(payload.email_verified),
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined
  };
}
