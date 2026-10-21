import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProfileByUserId, getProfilesByUserId, getUserById } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null, profile: null, profiles: [], onboardingCompleted: false });
    }

    const [dbUser, profile, profiles] = await Promise.all([
      getUserById(session.id),
      getProfileByUserId(session.id, session.role as import('@/types/profile').ProfileType | undefined),
      getProfilesByUserId(session.id)
    ]);

    const userProfile = profile || (profiles && profiles.length > 0 ? profiles[0] : null);
    const { isUserOnboarded } = await import('@/lib/auth/userStatus');
    const isOnboardingComplete = isUserOnboarded(dbUser || session, userProfile);
    const hasProfile = isOnboardingComplete;

    const role = userProfile?.type || dbUser?.role || session.role || null;
    const preferredTheme = userProfile?.theme || dbUser?.preferredTheme || session.preferredTheme || null;

    return NextResponse.json({
      user: {
        ...session,
        id: session.id,
        name: dbUser?.name || session.name,
        email: dbUser?.email || session.email,
        onboardingCompleted: isOnboardingComplete,
        preferredTheme: preferredTheme || undefined,
        role: role || undefined
      },
      profile: userProfile || null,
      profiles,
      hasProfile,
      onboardingCompleted: isOnboardingComplete,
      role,
      preferredTheme,
      profileSlug: userProfile?.slug || userProfile?.id || null
    });

  } catch (error) {
    console.error('Auth Me API Error:', error);
    return NextResponse.json(
      { user: null, profile: null, onboardingCompleted: false },
      { status: 200 }
    );
  }
}
