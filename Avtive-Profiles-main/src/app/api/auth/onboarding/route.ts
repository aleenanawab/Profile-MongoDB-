import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSessionCookie } from '@/lib/auth';
import { getProfileByUserId, updateProfile, getMongoDb, COLLECTIONS, getUserById, createProfileForUser, completeUserOnboarding } from '@/lib/db';
import { normalizeProfileType, ProfileTheme, UserSession } from '@/types/profile';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { role, profileType, theme } = body;

    const selectedRole = role || profileType ? normalizeProfileType(role || profileType) : undefined;
    const selectedTheme = theme && theme !== 'default' ? (theme as ProfileTheme) : undefined;

    // If theme is provided, user is at Step 2 (Theme) and completing onboarding
    if (selectedTheme) {
      await completeUserOnboarding(session.id, selectedRole, selectedTheme);
    } else {
      const db = await getMongoDb();
      const usersCol = db.collection(COLLECTIONS.USERS);
      const userUpdates: Record<string, any> = { updatedAt: new Date().toISOString() };
      if (selectedRole) userUpdates.role = selectedRole;
      await usersCol.updateOne(
        { $or: [{ _id: session.id as any }, { id: session.id }] },
        { $set: userUpdates }
      );
    }

    // Save role and theme on existing profile if found (find-first check to prevent duplicates)
    const targetType = selectedRole || session.role || 'individual';
    let profile = await getProfileByUserId(session.id, targetType);

    if (profile && (selectedRole || selectedTheme)) {
      const updateRes = await updateProfile(
        profile.id,
        {
          ...(selectedRole ? { type: selectedRole } : {}),
          ...(selectedTheme ? { theme: selectedTheme } : {})
        },
        session.id,
        session.email
      );
      if (updateRes.profile) {
        profile = updateRes.profile;
      }
    } else if (!profile && (selectedRole || selectedTheme)) {
      const dbUser = await getUserById(session.id);
      profile = await createProfileForUser(session.id, {
        name: dbUser?.name || session.name || 'User',
        email: session.email || dbUser?.email || '',
        type: targetType,
        theme: selectedTheme || 'editorial'
      });
    }

    const isOnboardingComplete = Boolean(selectedTheme);
    const updatedSession: UserSession = {
      ...session,
      ...(selectedRole ? { role: selectedRole } : {}),
      ...(selectedTheme ? { preferredTheme: selectedTheme } : {}),
      onboardingCompleted: isOnboardingComplete || session.onboardingCompleted
    };

    const response = NextResponse.json({
      success: true,
      user: updatedSession,
      profile,
      profileSlug: profile?.slug || profile?.id || null
    });

    await setSessionCookie(updatedSession, response);
    return response;

  } catch (error) {
    console.error('Onboarding API Error:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding preferences.' },
      { status: 500 }
    );
  }
}

