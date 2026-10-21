import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSessionCookie } from '@/lib/auth';
import { getProfileByUserId, updateProfile, getMongoDb, COLLECTIONS } from '@/lib/db';
import { normalizeProfileType, ProfileTheme, UserSession } from '@/types/profile';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { role, profileType, theme } = body;

    const db = await getMongoDb();
    const usersCol = db.collection(COLLECTIONS.USERS);

    const userUpdates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    const selectedRole = role || profileType ? normalizeProfileType(role || profileType) : undefined;
    const selectedTheme = theme && theme !== 'default' ? (theme as ProfileTheme) : undefined;

    if (selectedRole) {
      userUpdates.role = selectedRole;
    }
    if (selectedTheme) {
      userUpdates.preferredTheme = selectedTheme;
    }

    await usersCol.updateOne(
      { $or: [{ _id: session.id as any }, { id: session.id }] },
      { $set: userUpdates }
    );

    // Save role and theme on existing profile if found (find-first check to prevent duplicates)
    // Individual and company profiles are kept separate via type
    const targetType = selectedRole || session.role;
    let profile = null;
    if (targetType) {
      profile = await getProfileByUserId(session.id, targetType);
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
      }
    }

    const updatedSession: UserSession = {
      ...session,
      ...(selectedRole ? { role: selectedRole } : {}),
      ...(selectedTheme ? { preferredTheme: selectedTheme } : {})
    };

    const response = NextResponse.json({
      success: true,
      user: updatedSession,
      profile
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

