import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { duplicateProfile } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to duplicate a profile.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { profileId } = body;

    if (!profileId) {
      return NextResponse.json(
        { error: 'profileId is required to duplicate a profile.' },
        { status: 400 }
      );
    }

    const result = await duplicateProfile(profileId, session.id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to duplicate profile.' },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile duplicated successfully.',
      profile: result.profile
    }, { status: 201 });
  } catch (error) {
    console.error('Duplicate Profile API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while duplicating profile.' },
      { status: 500 }
    );
  }
}
