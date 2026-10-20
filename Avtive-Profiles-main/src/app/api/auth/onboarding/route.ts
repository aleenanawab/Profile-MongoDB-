import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { completeUserOnboarding, createProfileForUser, getProfileByUserId, updateProfile } from '@/lib/db';
import { normalizeProfileType, ProfileTheme } from '@/types/profile';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { role, profileType, theme } = body;

    const selectedRole = normalizeProfileType(role || profileType || 'individual');
    const selectedTheme = (theme && theme !== 'default' ? theme : 'editorial') as ProfileTheme;

    // Complete user onboarding on user record
    const onboardingResult = await completeUserOnboarding(session.id, selectedRole, selectedTheme);

    // Ensure active profile exists with the preferences
    let profile = await getProfileByUserId(session.id);
    if (!profile) {
      profile = await createProfileForUser(session.id, {
        name: session.name,
        email: session.email,
        profileName: selectedRole === 'team' ? 'Company Profile' : 'Primary Profile',
        designation: 'Professional',
        type: selectedRole,
        theme: selectedTheme
      });
    } else {
      const updateRes = await updateProfile(
        profile.id,
        {
          type: selectedRole,
          theme: selectedTheme
        },
        session.id,
        session.email
      );
      if (updateRes.profile) {
        profile = updateRes.profile;
      }
    }

    return NextResponse.json({
      success: true,
      onboardingCompleted: true,
      user: onboardingResult.user,
      profile
    });
  } catch (error) {
    console.error('Onboarding API Error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding preferences.' },
      { status: 500 }
    );
  }
}
