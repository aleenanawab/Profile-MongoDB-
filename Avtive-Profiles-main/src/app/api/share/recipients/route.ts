import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  createContactTagForOwner,
  deleteContactTagForOwner,
  getShareRecipientsForUser,
  updateRecipientTagsForOwner
} from '@/lib/db';
import { isEmailServiceConfigured } from '@/lib/email';

async function buildRecipientsResponsePayload(userId: string, q: string = '') {
  const data = await getShareRecipientsForUser(userId, q);
  return {
    success: true,
    recipients: data.recipients,
    contactTags: data.contactTags,
    activeContactTags: data.activeContactTags,
    availableLabels: data.availableLabels,
    eventLabels: data.eventLabels,
    emailConfigured: isEmailServiceConfigured()
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const payload = await buildRecipientsResponsePayload(session.id, q);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error('Share Recipients GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch recipients.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rawName = typeof body.name === 'string' ? body.name : typeof body.tagName === 'string' ? body.tagName : '';
    if (!rawName.trim()) {
      return NextResponse.json({ error: 'Tag name is required.' }, { status: 400 });
    }

    const createdTag = await createContactTagForOwner(session.id, rawName);

    const optionalRecipientIds = Array.isArray(body.recipientIds)
      ? body.recipientIds.map((id: unknown) => String(id || '').trim()).filter(Boolean)
      : [];
    if (optionalRecipientIds.length > 0) {
      await updateRecipientTagsForOwner(session.id, {
        recipientIds: optionalRecipientIds,
        addTags: [createdTag.name]
      });
    }

    const payload = await buildRecipientsResponsePayload(session.id);
    return NextResponse.json({ ...payload, tag: createdTag }, { status: 201 });
  } catch (error) {
    console.error('Share Recipients POST Tag Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create contact tag.';
    const status = message.includes('empty') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const recipientIds: string[] = Array.isArray(body.recipientIds)
      ? body.recipientIds.map((id: unknown) => String(id || '').trim()).filter(Boolean)
      : typeof body.recipientId === 'string' && body.recipientId.trim()
        ? [body.recipientId.trim()]
        : [];

    if (recipientIds.length === 0) {
      return NextResponse.json({ error: 'At least one contact ID is required.' }, { status: 400 });
    }

    await updateRecipientTagsForOwner(session.id, {
      recipientIds,
      addTags: Array.isArray(body.addTags) ? body.addTags.map(String) : undefined,
      removeTags: Array.isArray(body.removeTags) ? body.removeTags.map(String) : undefined,
      replaceTags: Array.isArray(body.replaceTags) ? body.replaceTags.map(String) : undefined
    });

    const payload = await buildRecipientsResponsePayload(session.id);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error('Share Recipients PATCH Tags Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update contact tags.';
    const status = message.includes('Select at least') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const identifier =
      (typeof body.tagId === 'string' && body.tagId.trim()) ||
      (typeof body.tagName === 'string' && body.tagName.trim()) ||
      searchParams.get('tagId') ||
      searchParams.get('tagName') ||
      '';

    if (!identifier.trim()) {
      return NextResponse.json({ error: 'Tag identifier is required.' }, { status: 400 });
    }

    await deleteContactTagForOwner(session.id, identifier);
    const payload = await buildRecipientsResponsePayload(session.id);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error('Share Recipients DELETE Tag Error:', error);
    return NextResponse.json({ error: 'Failed to delete contact tag.' }, { status: 500 });
  }
}
