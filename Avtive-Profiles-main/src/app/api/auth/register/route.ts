import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/db';
import { hashPassword, setSessionCookie, setReturningUserCookie } from '@/lib/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword } = body;

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please provide your full name (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match. Please verify both passwords.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check duplicate accounts on server & DB
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in or use another email.' },
        { status: 409 }
      );
    }

    // 3. Compute password hash
    const passwordHash = await hashPassword(password);

    // 4. Generate one-time recovery code (format: RC-XXXX-XXXX) and store only its SHA-256 hash
    const crypto = await import('crypto');
    const rawCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const recoveryCode = `RC-${rawCode.slice(0, 4)}-${rawCode.slice(4)}`;
    const recoveryCodeHash = crypto.createHash('sha256').update(recoveryCode.trim().toUpperCase()).digest('hex');

    // 5. Save account with recovery code hash (onboarding will be completed upon setup)
    const { user } = await createUser({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      recoveryCodeHash,
      onboardingCompleted: false,
      createProfile: false
    });

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully.',
        recoveryCode, // Sent once to display with copy button and warning
        email: user.email,
        user: sessionUser
      },
      { status: 201 }
    );

    response.headers.set('Cache-Control', 'no-store, max-age=0');
    setReturningUserCookie(response);

    return response;
  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
