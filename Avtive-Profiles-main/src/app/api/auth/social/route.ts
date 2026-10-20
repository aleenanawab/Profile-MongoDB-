import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getUserById, getProfileByUserId, getProfilesByUserId, createUser } from '@/lib/db';
import { setSessionCookie, setReturningUserCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { provider = 'google', email, name, avatar, id } = body;

    const normalizedProvider = provider.toLowerCase();
    let userEmail = email?.trim()?.toLowerCase();
    let userName = name?.trim();
    const userAvatar = avatar?.trim() || '';

    // If no email passed, assign default social test account
    if (!userEmail) {
      if (normalizedProvider === 'linkedin') {
        userEmail = 'linkedin.user@avtive.app';
        userName = userName || 'LinkedIn Professional';
      } else if (normalizedProvider === 'github') {
        userEmail = 'github.user@avtive.app';
        userName = userName || 'GitHub Developer';
      } else if (normalizedProvider === 'facebook') {
        userEmail = 'facebook.user@avtive.app';
        userName = userName || 'Facebook User';
      } else {
        userEmail = 'google.user@avtive.app';
        userName = userName || 'Google User';
      }
    }

    if (!userName) {
      userName = userEmail.split('@')[0].replace(/[._-]/g, ' ');
      userName = userName.charAt(0).toUpperCase() + userName.slice(1);
    }

    // Check if user already exists in DB
    let user = id ? await getUserById(id) : null;
    if (!user && userEmail) {
      user = await getUserByEmail(userEmail);
    }

    let isNewUser = false;

    if (user) {
      // Existing user: ensure name and avatar are synced if missing
      if (!user.name && userName) {
        user.name = userName;
      }
      if (userAvatar && !user.avatar) {
        user.avatar = userAvatar;
      }
    } else {
      // New user: register account (without profile, so they go through onboarding)
      isNewUser = true;
      const result = await createUser({
        id: id || undefined,
        name: userName,
        email: userEmail,
        passwordHash: `oauth_${normalizedProvider}_verified_${Date.now()}`,
        avatar: userAvatar,
        createProfile: false
      });
      user = result.user;
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || userAvatar
    };

    // Check onboarding status: Does user have an existing profile?
    const [profile, profiles] = await Promise.all([
      getProfileByUserId(user.id),
      getProfilesByUserId(user.id)
    ]);
    const hasProfile = Boolean(profile || (profiles && profiles.length > 0));
    const activeProfile = profile || (profiles && profiles.length > 0 ? profiles[0] : null);
    const profileSlug = activeProfile?.slug || activeProfile?.id || null;

    const response = NextResponse.json({
      success: true,
      isNewUser,
      message: isNewUser
        ? `Account created and verified with ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`
        : `Successfully signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`,
      user: sessionUser,
      hasProfile,
      onboardingCompleted: hasProfile,
      profileSlug
    }, { status: isNewUser ? 201 : 200 });

    response.headers.set('Cache-Control', 'no-store, max-age=0');
    await setSessionCookie(sessionUser, response);
    setReturningUserCookie(response);

    return response;
  } catch (error) {
    console.error('Social Auth Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during social authentication.' },
      { status: 500 }
    );
  }
}
