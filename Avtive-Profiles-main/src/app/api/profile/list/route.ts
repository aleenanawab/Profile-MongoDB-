import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProfilesByUserId } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to view profiles.' },
        { status: 401 }
      );
    }

    const profiles = await getProfilesByUserId(session.id);
    return NextResponse.json({
      success: true,
      profiles
    });
  } catch (error) {
    console.error('List Profiles API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching profiles.' },
      { status: 500 }
    );
  }
}
