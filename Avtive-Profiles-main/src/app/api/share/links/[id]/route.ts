import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getShareLinkDetailsForOwner, updateShareLinkForOwner } from '@/lib/db';
import { resolveRequestOrigin } from '@/lib/sharing/requestOrigin';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await getShareLinkDetailsForOwner(id, session.id, resolveRequestOrigin(request));
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      {
        success: true,
        link: result.link,
        events: result.events || []
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Share Link Details GET Error:', error);
    return NextResponse.json({ error: 'Failed to load share link details.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const result = await updateShareLinkForOwner(
      id,
      session.id,
      {
        ...(typeof body.title === 'string' ? { title: body.title } : {}),
        ...(Array.isArray(body.selectedFields) ? { selectedFields: body.selectedFields } : {}),
        ...(Array.isArray(body.confirmedPrivateFields) ? { confirmedPrivateFields: body.confirmedPrivateFields } : {}),
        ...(body.expiryOption ? { expiryOption: body.expiryOption } : {}),
        ...(body.eventLabel !== undefined ? { eventLabel: body.eventLabel } : {}),
        ...(Array.isArray(body.recipients) ? { recipients: body.recipients } : {})
      },
      resolveRequestOrigin(request)
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      {
        success: true,
        link: result.link,
        historyRecorded: result.historyRecorded ?? true,
        ...(result.historyError ? { historyError: result.historyError } : {})
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Share Link PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update share link.' }, { status: 500 });
  }
}
