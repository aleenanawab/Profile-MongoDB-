import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getShareRecipientsForUser } from '@/lib/db';
import { isEmailServiceConfigured } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const data = await getShareRecipientsForUser(session.id, q);

    return NextResponse.json(
      {
        success: true,
        recipients: data.recipients,
        availableLabels: data.availableLabels,
        emailConfigured: isEmailServiceConfigured()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Share Recipients GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch recipients.' }, { status: 500 });
  }
}
