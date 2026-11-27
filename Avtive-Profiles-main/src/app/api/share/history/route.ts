import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProfilesByUserId, queryShareHistoryForOwner } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawProfileId = searchParams.get('profileId') || undefined;
    const profileId = rawProfileId && rawProfileId !== 'all' ? rawProfileId : undefined;
    if (profileId) {
      const ownedProfiles = await getProfilesByUserId(session.id);
      const ownsTarget = ownedProfiles.some((p) => p.id === profileId || p.slug === profileId);
      if (!ownsTarget) {
        return NextResponse.json(
          { error: 'Forbidden: You do not own this profile.' },
          { status: 403 }
        );
      }
    }
    const eventType = searchParams.get('eventType') || undefined;
    const channel = searchParams.get('channel') || undefined;
    const status = searchParams.get('status') || undefined;
    const actorType = searchParams.get('actorType') || undefined;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 20);

    const history = await queryShareHistoryForOwner(session.id, {
      profileId,
      eventType,
      channel,
      status,
      actorType,
      from,
      to,
      search,
      page,
      limit
    });

    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    console.error('Share History GET Error:', error);
    return NextResponse.json({ error: 'Failed to load share history.' }, { status: 500 });
  }
}
