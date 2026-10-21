import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserByEmailOrUsername, resetPasswordWithRecoveryCode, createPasswordResetToken } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';

// In-memory rate limiting by IP and email/identifier
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return true;
  }
  entry.count++;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { 
      email, 
      username, 
      identifier, 
      recoveryCode, 
      newPassword, 
      password, 
      confirmPassword 
    } = body;

    const emailOrUsername = (identifier || email || username || '').trim();
    const cleanRecoveryCode = (recoveryCode || '').trim().toUpperCase();
    const targetPassword = newPassword || password || '';

    // 1. Validate Identifier
    if (!emailOrUsername) {
      return NextResponse.json(
        { error: 'Please enter your registered email address or username.' },
        { status: 400 }
      );
    }

    // 2. Rate Limiting Check
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown-ip';
    if (isRateLimited(`ip:${ip}`) || isRateLimited(`acc:${emailOrUsername.toLowerCase()}`)) {
      return NextResponse.json(
        { error: 'Too many recovery attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // 3. Handle Password Reset Link vs One-Time Recovery Code
    if (!cleanRecoveryCode) {
      // Flow A: Standard Password Reset Link generation
      const { isEmailServiceConfigured } = await import('@/lib/email');
      if (!isEmailServiceConfigured()) {
        return NextResponse.json(
          {
            error: 'Email delivery service is not configured. Please use your One-Time Recovery Code to reset your password.'
          },
          { status: 400 }
        );
      }

      const resetInfo = await createPasswordResetToken(emailOrUsername);
      if (resetInfo) {
        const origin = request.nextUrl.origin || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const resetUrl = `${origin}/reset-password?token=${resetInfo.token}&email=${encodeURIComponent(resetInfo.user.email)}`;
        try {
          await sendPasswordResetEmail({
            to: resetInfo.user.email,
            name: resetInfo.user.name,
            resetUrl
          });
        } catch (emailErr) {
          console.error('Failed to send reset email:', emailErr);
        }
      }

      // Consistent response to prevent user enumeration without leaking resetUrl bypass
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email address, a password reset link has been sent.'
        },
        { status: 200 }
      );
    }

    // Flow B: In-App One-Time Recovery Code Password Reset
    // 4. Validate Passwords
    if (!targetPassword || typeof targetPassword !== 'string' || targetPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (targetPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match. Please verify both passwords.' },
        { status: 400 }
      );
    }

    // 5. Look up user account
    const user = await getUserByEmailOrUsername(emailOrUsername);
    if (!user || !user.recoveryCodeHash) {
      return NextResponse.json(
        { error: 'Invalid email/username or recovery code.' },
        { status: 400 }
      );
    }

    // 6. Verify Recovery Code Hash (SHA-256)
    const codeHash = crypto.createHash('sha256').update(cleanRecoveryCode).digest('hex');
    if (user.recoveryCodeHash !== codeHash) {
      return NextResponse.json(
        { error: 'Invalid email/username or recovery code.' },
        { status: 400 }
      );
    }

    // 7. Hash the new password on server
    const passwordHash = await hashPassword(targetPassword);

    // 8. Invalidate old recovery code and issue a brand new one
    const rawNewCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const newRecoveryCode = `RC-${rawNewCode.slice(0, 4)}-${rawNewCode.slice(4)}`;
    const newRecoveryCodeHash = crypto.createHash('sha256').update(newRecoveryCode.trim().toUpperCase()).digest('hex');

    const result = await resetPasswordWithRecoveryCode(
      emailOrUsername,
      cleanRecoveryCode,
      passwordHash,
      newRecoveryCodeHash
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update password. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your password has been successfully reset.',
        newRecoveryCode, // Newly issued recovery code for future use
        redirectTo: '/login?reset=success'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Password reset with recovery code error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while resetting your password.' },
      { status: 500 }
    );
  }
}
