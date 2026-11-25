import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listShareTemplatesForOwner, createShareTemplateForOwner, getProfileByIdOrSlug } from '@/lib/db';
import { filterAuthorizedSelection } from '@/lib/sharing/presets';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const templates = await listShareTemplatesForOwner(session.id);
    return NextResponse.json({ success: true, templates }, { status: 200 });
  } catch (error) {
    console.error('Share Templates GET Error:', error);
    return NextResponse.json({ error: 'Failed to load templates.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    let selectedFields = Array.isArray(body.selectedFields) ? body.selectedFields : [];

    // Enforce Never Share rules against the owner's profile if profileId supplied
    if (body.profileId) {
      const profile = await getProfileByIdOrSlug(String(body.profileId));
      if (profile && profile.userId === session.id) {
        const filtered = filterAuthorizedSelection(profile, selectedFields, {
          allowConfirmedPrivate: true
        });
        selectedFields = filtered.authorizedFields;
      }
    }

    const result = await createShareTemplateForOwner(session.id, {
      name: typeof body.name === 'string' ? body.name : '',
      description: typeof body.description === 'string' ? body.description : undefined,
      selectedFields,
      lostAndFoundMode: Boolean(body.lostAndFoundMode)
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, template: result.template }, { status: 201 });
  } catch (error) {
    console.error('Share Templates POST Error:', error);
    return NextResponse.json({ error: 'Failed to create template.' }, { status: 500 });
  }
}
