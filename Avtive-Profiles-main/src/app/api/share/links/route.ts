import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createShareLink, listShareLinksForOwner } from '@/lib/db';
import { checkRateLimit } from '@/lib/sharing/rateLimit';
import { resolveRequestOrigin } from '@/lib/sharing/requestOrigin';
import { ShareLinkStatus } from '@/types/sharing';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get('status') || 'all') as 'all' | ShareLinkStatus;
    const search = searchParams.get('search') || '';
    const profileId = searchParams.get('profileId') || undefined;

    const links = await listShareLinksForOwner(session.id, {
      status: statusParam,
      search,
      profileId,
      originUrl: resolveRequestOrigin(request)
    });

    return NextResponse.json({ success: true, links }, { status: 200 });
  } catch (error) {
    console.error('Share Links GET Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve shared links.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const rl = checkRateLimit(`share:create:${session.id}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before creating more share links.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (!body.profileId) {
      return NextResponse.json({ error: 'profileId is required.' }, { status: 400 });
    }

    const result = await createShareLink({
      ownerUserId: session.id,
      profileId: String(body.profileId),
      title: typeof body.title === 'string' ? body.title : undefined,
      selectedFields: Array.isArray(body.selectedFields) ? body.selectedFields : [],
      confirmedPrivateFields: Array.isArray(body.confirmedPrivateFields) ? body.confirmedPrivateFields : [],
      templateId: typeof body.templateId === 'string' ? body.templateId : undefined,
      templateName: typeof body.templateName === 'string' ? body.templateName : undefined,
      recipients: Array.isArray(body.recipients) ? body.recipients : [],
      eventLabel: typeof body.eventLabel === 'string' ? body.eventLabel : undefined,
      shareChannel: body.shareChannel,
      expiryOption: body.expiryOption,
      originUrl: resolveRequestOrigin(request)
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create share link.', blockedNeverShare: result.blockedNeverShare },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        link: result.link,
        blockedNeverShare: result.blockedNeverShare || [],
        historyRecorded: result.historyRecorded ?? true,
        ...(result.historyError ? { historyError: result.historyError } : {})
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Share Links POST Error:', error);
    return NextResponse.json({ error: 'Internal server error creating share link.' }, { status: 500 });
  }
}
