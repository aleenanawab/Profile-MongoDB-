import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { revokeShareLinkForOwner } from '@/lib/db';
import { resolveRequestOrigin } from '@/lib/sharing/requestOrigin';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await revokeShareLinkForOwner(id, session.id, resolveRequestOrigin(request));
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
    console.error('Share Link Revoke Error:', error);
    return NextResponse.json({ error: 'Failed to revoke share link.' }, { status: 500 });
  }
}
