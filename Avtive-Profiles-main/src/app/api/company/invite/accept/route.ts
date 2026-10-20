import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { acceptCompanyInvite } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to accept an invitation.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token.trim() : '';

    if (!token) {
      return NextResponse.json(
        { error: 'Validation error: Invitation token is required.' },
        { status: 400 }
      );
    }

    const result = await acceptCompanyInvite(token, session.id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to accept invitation.' },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully. You are now a member of the company.',
      company: result.company,
      member: result.member
    });
  } catch (error: any) {
    console.error('Error in POST /api/company/invite/accept:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while accepting invite.' },
      { status: 500 }
    );
  }
}
