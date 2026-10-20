import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateProfile } from '@/lib/db';
import { SharingSettings } from '@/types/profile';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to update sharing settings.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { profileId, sharingSettings, sectionOrder, sectionVisibility } = body;

    if (!profileId) {
      return NextResponse.json(
        { error: 'profileId is required.' },
        { status: 400 }
      );
    }

    const result = await updateProfile(
      profileId,
      {
        ...(sharingSettings ? { sharingSettings: sharingSettings as SharingSettings } : {}),
        ...(sectionOrder ? { sectionOrder: sectionOrder as string[] } : {}),
        ...(sectionVisibility ? { sectionVisibility: sectionVisibility as Record<string, boolean> } : {})
      },
      session.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update sharing settings.' },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sharing settings updated successfully.',
      profile: result.profile
    }, { status: 200 });
  } catch (error) {
    console.error('Share Settings API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while saving share settings.' },
      { status: 500 }
    );
  }
}
