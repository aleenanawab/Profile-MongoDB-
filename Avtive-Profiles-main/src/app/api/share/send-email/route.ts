import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getShareLinkDetailsForOwner, recordShareEventSafe } from '@/lib/db';
import { isEmailServiceConfigured, sendShareLinkEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/sharing/rateLimit';
import { isValidEmail } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    if (!isEmailServiceConfigured()) {
      return NextResponse.json(
        { error: 'Email delivery is not configured on this server. Use Copy Link or Native Share instead.' },
        { status: 503 }
      );
    }

    const rl = checkRateLimit(`share:email:${session.id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for email sharing. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const shareLinkId = String(body.shareLinkId || '');
    const rawRecipients = Array.isArray(body.recipients) ? body.recipients : [];

    if (!shareLinkId || rawRecipients.length === 0) {
      return NextResponse.json({ error: 'shareLinkId and at least one email recipient are required.' }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const linkResult = await getShareLinkDetailsForOwner(shareLinkId, session.id, origin);
    if (!linkResult.success || !linkResult.link) {
      return NextResponse.json({ error: linkResult.error || 'Share link not found.' }, { status: linkResult.status });
    }

    if (linkResult.link.status !== 'active') {
      return NextResponse.json({ error: `Cannot send a link whose status is ${linkResult.link.status}.` }, { status: 400 });
    }

    const sent: string[] = [];
    const sentNames: string[] = [];
    const failed: Array<{ email: string; error: string }> = [];

    for (const r of rawRecipients.slice(0, 10)) {
      const email = String(r?.email || '').trim();
      if (!isValidEmail(email)) continue;
      const res = await sendShareLinkEmail({
        to: email,
        recipientName: r?.name ? String(r.name) : undefined,
        senderName: linkResult.link.profileName || session.name || 'Avtive Member',
        shareUrl: linkResult.link.shareUrl,
        shareTitle: linkResult.link.title,
        eventLabel: linkResult.link.eventLabel
      });
      if (res.success) {
        sent.push(email);
        if (r?.name && String(r.name).trim()) {
          sentNames.push(String(r.name).trim());
        }
      } else {
        failed.push({ email, error: res.error || 'Failed to send' });
      }
    }

    if (sent.length === 0) {
      return NextResponse.json(
        { error: failed[0]?.error || 'No valid email recipients succeeded.', failed },
        { status: 502 }
      );
    }

    const eventResult = await recordShareEventSafe({
      shareLinkId: linkResult.link.id,
      ownerUserId: session.id,
      profileId: linkResult.link.profileId,
      eventType: 'email_sent',
      actorType: 'owner',
      targetType: 'share_link',
      channel: 'email',
      selectedFields: linkResult.link.selectedFields,
      selectedFieldsCount: linkResult.link.selectedFields.length,
      recipientNames: sentNames.length > 0 ? sentNames : undefined,
      profileName: linkResult.link.profileName,
      profileSlug: linkResult.link.profileSlug,
      metadata: { sentCount: sent.length, failedCount: failed.length }
    });

    return NextResponse.json(
      {
        success: true,
        sent,
        failed,
        historyRecorded: eventResult.recorded,
        ...(eventResult.error ? { historyError: eventResult.error } : {})
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Share Email POST Error:', error);
    return NextResponse.json({ error: 'Internal server error sending share email.' }, { status: 500 });
  }
}
