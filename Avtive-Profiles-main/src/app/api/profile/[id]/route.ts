import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProfileByIdOrSlug, deleteProfile, sanitizeProfileForPublic } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to access profile data.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const profile = await getProfileByIdOrSlug(id);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found.' },
        { status: 404 }
      );
    }

    const isOwner = Boolean(profile.userId && session.id === profile.userId);
    const sanitized = sanitizeProfileForPublic(profile, isOwner);

    return NextResponse.json({
      success: true,
      profile: sanitized,
      isOwner
    });
  } catch (error) {
    console.error('Get Profile API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching profile.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to delete a profile.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const result = await deleteProfile(id, session.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete profile.' },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully.'
    }, { status: 200 });
  } catch (error) {
    console.error('Delete Profile API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while deleting profile.' },
      { status: 500 }
    );
  }
}
