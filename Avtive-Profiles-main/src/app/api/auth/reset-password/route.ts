import { NextRequest, NextResponse } from 'next/server';
import { verifyPasswordResetToken, resetUserPassword } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email;
    const token = body.token;
    const password = body.password || body.newPassword;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Reset token and new password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : '';

    // Verify token validity and expiration
    const verification = await verifyPasswordResetToken(normalizedEmail, token);
    if (!verification.valid || !verification.user) {
      return NextResponse.json(
        { error: verification.error || 'Invalid or expired password reset link.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const newHash = await hashPassword(password);

    // Update user record in database
    const updatedUser = await resetUserPassword(normalizedEmail, token, newHash);
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update password. Please request a new reset link.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully updated. Please sign in with your new password.',
      redirectTo: '/login'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred while resetting your password.' },
      { status: 500 }
    );
  }
}

