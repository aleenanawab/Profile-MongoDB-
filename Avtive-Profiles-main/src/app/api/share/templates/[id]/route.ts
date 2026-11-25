import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  updateShareTemplateForOwner,
  duplicateShareTemplateForOwner,
  deleteShareTemplateForOwner,
  getProfileByIdOrSlug
} from '@/lib/db';
import { filterAuthorizedSelection } from '@/lib/sharing/presets';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    let selectedFields = Array.isArray(body.selectedFields) ? body.selectedFields : undefined;

    if (selectedFields && body.profileId) {
      const profile = await getProfileByIdOrSlug(String(body.profileId));
      if (profile && profile.userId === session.id) {
        selectedFields = filterAuthorizedSelection(profile, selectedFields, {
          allowConfirmedPrivate: true
        }).authorizedFields;
      }
    }

    const result = await updateShareTemplateForOwner(id, session.id, {
      ...(typeof body.name === 'string' ? { name: body.name } : {}),
      ...(typeof body.description === 'string' ? { description: body.description } : {}),
      ...(selectedFields ? { selectedFields } : {}),
      ...(typeof body.lostAndFoundMode === 'boolean' ? { lostAndFoundMode: body.lostAndFoundMode } : {})
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, template: result.template }, { status: 200 });
  } catch (error) {
    console.error('Share Template PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update template.' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await duplicateShareTemplateForOwner(id, session.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, template: result.template }, { status: 201 });
  } catch (error) {
    console.error('Share Template Duplicate POST Error:', error);
    return NextResponse.json({ error: 'Failed to duplicate template.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await deleteShareTemplateForOwner(id, session.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Share Template DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete template.' }, { status: 500 });
  }
}
