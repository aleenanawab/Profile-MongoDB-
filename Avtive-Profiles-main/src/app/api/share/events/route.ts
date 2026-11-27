import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSession } from '@/lib/auth';
import {
  getCompanyMemberByUser,
  getProfileByIdOrSlug,
  getShareLinkDetailsForOwner,
  recordShareEventSafe
} from '@/lib/db';
import { checkRateLimit } from '@/lib/sharing/rateLimit';
import { ShareEventType, ShareTargetType } from '@/types/sharing';

const OWNER_CLIENT_EVENT_TYPES = new Set<ShareEventType>([
  'link_copied',
  'native_shared',
  'qr_generated',
  'nfc_shared',
  'vcard_downloaded'
]);

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const rl = checkRateLimit(`share:event:${session.id}`, 120, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded while recording share activity.', recorded: false },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawEventType = String(body.eventType || '') as ShareEventType;
    const profileIdInput = String(body.profileId || '').trim();
    const shareLinkIdInput = typeof body.shareLinkId === 'string' ? body.shareLinkId.trim() : '';

    if (!OWNER_CLIENT_EVENT_TYPES.has(rawEventType)) {
      return NextResponse.json(
        { error: 'Invalid or unsupported owner share eventType.', recorded: false },
        { status: 400 }
      );
    }

    if (!profileIdInput) {
      return NextResponse.json(
        { error: 'profileId is required.', recorded: false },
        { status: 400 }
      );
    }

    const profile = await getProfileByIdOrSlug(profileIdInput);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found.', recorded: false }, { status: 404 });
    }

    let isOwner =
      profile.userId === session.id ||
      (profile as any).user_id === session.id ||
      (ObjectId.isValid(session.id) &&
        (String(profile.userId) === session.id || String((profile as any).user_id) === session.id));

    if (!isOwner && profile.companyId) {
      const member = await getCompanyMemberByUser(profile.companyId, session.id);
      if (member && (member.role === 'OWNER' || member.role === 'ADMIN')) {
        isOwner = true;
      }
    }

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this profile.', recorded: false },
        { status: 403 }
      );
    }

    let resolvedShareLinkId = 'public_profile';
    let targetType: ShareTargetType = 'public_profile';
    let selectedFields: string[] | undefined = Array.isArray(body.selectedFields)
      ? body.selectedFields.map(String).slice(0, 100)
      : undefined;
    let selectedFieldsCount: number | undefined =
      typeof body.selectedFieldsCount === 'number' ? body.selectedFieldsCount : selectedFields?.length;
    let recipientNames: string[] | undefined = Array.isArray(body.recipientNames)
      ? body.recipientNames.map((n: unknown) => String(n || '').trim()).filter(Boolean)
      : undefined;

    if (shareLinkIdInput && shareLinkIdInput !== 'public_profile') {
      const linkRes = await getShareLinkDetailsForOwner(shareLinkIdInput, session.id);
      if (!linkRes.success || !linkRes.link) {
        return NextResponse.json(
          { error: linkRes.error || 'Share link not found.', recorded: false },
          { status: linkRes.status }
        );
      }
      resolvedShareLinkId = linkRes.link.id;
      targetType = 'share_link';
      if (!selectedFields) selectedFields = linkRes.link.selectedFields;
      if (selectedFieldsCount === undefined) selectedFieldsCount = linkRes.link.selectedFields.length;
      if (!recipientNames && linkRes.link.recipients.length > 0) {
        recipientNames = linkRes.link.recipients.map((r) => r.name).filter(Boolean);
      }
    }

    const channel =
      typeof body.channel === 'string' && body.channel.trim()
        ? body.channel.trim().slice(0, 40)
        : rawEventType === 'qr_generated'
          ? 'qr'
          : rawEventType === 'nfc_shared'
            ? 'nfc'
            : rawEventType === 'vcard_downloaded'
              ? 'vcard'
              : rawEventType === 'native_shared'
                ? 'native'
                : 'link';

    let dedupKey: string | undefined;
    if (typeof body.dedupToken === 'string' && body.dedupToken.trim()) {
      dedupKey = crypto
        .createHash('sha256')
        .update(`${session.id}:${profile.id}:${resolvedShareLinkId}:${rawEventType}:${body.dedupToken.trim()}`)
        .digest('hex');
    }

    const safeTargetUrl =
      targetType === 'public_profile'
        ? `/profile/${profile.slug || profile.id}`
        : undefined;

    const result = await recordShareEventSafe({
      shareLinkId: resolvedShareLinkId,
      ownerUserId: session.id,
      profileId: profile.id,
      eventType: rawEventType,
      actorType: 'owner',
      targetType,
      targetUrl: safeTargetUrl,
      channel,
      dedupKey,
      selectedFields,
      selectedFieldsCount,
      recipientNames,
      profileName: profile.profileName || profile.name,
      profileSlug: profile.slug
    });

    if (!result.recorded) {
      return NextResponse.json(
        {
          success: false,
          recorded: false,
          error: result.error || 'Failed to persist share activity.'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        recorded: true,
        deduplicated: Boolean(result.deduplicated),
        event: result.event
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Share Event POST Error:', error);
    return NextResponse.json(
      { success: false, recorded: false, error: 'Failed to record share activity.' },
      { status: 500 }
    );
  }
}
