import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProfileByIdOrSlug, deleteProfile, sanitizeProfileForPublic } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to access profile data.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const profile = await getProfileByIdOrSlug(id);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found.' },
        { status: 404 }
      );
    }

    const isOwner = Boolean(profile.userId && session.id === profile.userId);
    const sanitized = sanitizeProfileForPublic(profile, isOwner);

    return NextResponse.json({
      success: true,
      profile: sanitized,
      isOwner
    });
  } catch (error) {
    console.error('Get Profile API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching profile.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to delete a profile.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const result = await deleteProfile(id, session.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete profile.' },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully.'
    }, { status: 200 });
  } catch (error) {
    console.error('Delete Profile API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while deleting profile.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const profile = await getProfileByIdOrSlug(id);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found.' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400 }
      );
    }

    if (body.website || body.honeypot || body.companyField) {
      return NextResponse.json(
        { error: 'Spam submission detected.' },
        { status: 400 }
      );
    }

    const rawName = typeof body.name === 'string' ? body.name : '';
    const rawMessage = typeof body.message === 'string' ? body.message : '';

    const cleanName = rawName.replace(/<[^>]*>?/gm, '').trim();
    const cleanMessage = rawMessage.replace(/<[^>]*>?/gm, '').trim();

    if (!cleanName || cleanName.length > 60) {
      return NextResponse.json(
        { error: 'Name is required and must be at most 60 characters.' },
        { status: 400 }
      );
    }

    if (!cleanMessage || cleanMessage.length > 500) {
      return NextResponse.json(
        { error: 'Message is required and must be at most 500 characters.' },
        { status: 400 }
      );
    }

    // Duplicate check: reject identical name + message within 10 minutes
    const now = Date.now();
    const existingRecs = Array.isArray(profile.recommendations) ? profile.recommendations : [];
    const isDuplicate = existingRecs.some((r: any) => {
      const matchName = (r.author || '').toLowerCase().trim() === cleanName.toLowerCase();
      const matchText = (r.text || r.summary || '').toLowerCase().trim() === cleanMessage.toLowerCase();
      if (!matchName || !matchText) return false;

      if (r.createdAt) {
        const diff = now - new Date(r.createdAt).getTime();
        if (diff >= 0 && diff < 10 * 60 * 1000) return true;
      }
      const idMatch = typeof r.id === 'string' && r.id.match(/^rec-(\d+)$/);
      if (idMatch) {
        const diff = now - Number(idMatch[1]);
        if (diff >= 0 && diff < 10 * 60 * 1000) return true;
      }
      return true;
    });

    if (isDuplicate) {
      return NextResponse.json(
        { error: 'A duplicate recommendation was recently submitted. Please wait before submitting again.' },
        { status: 429 }
      );
    }

    const newRec = {
      id: `rec-${now}`,
      author: cleanName,
      text: cleanMessage,
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      createdAt: new Date().toISOString(),
      visible: true
    };

    const { getMongoDb, COLLECTIONS } = await import('@/lib/db');
    const { ObjectId } = await import('mongodb');
    const db = await getMongoDb();

    const matchCriteria: any[] = [
      { id: profile.id },
      { slug: profile.slug },
      { _id: profile.id as any }
    ];
    if (ObjectId.isValid(profile.id)) {
      matchCriteria.push({ _id: new ObjectId(profile.id) });
    }

    await db.collection(COLLECTIONS.PROFILES).updateOne(
      { $or: matchCriteria },
      {
        $push: { recommendations: newRec } as any,
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Recommendation submitted successfully.',
      recommendation: newRec
    }, { status: 201 });
  } catch (error) {
    console.error('Leave Recommendation API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while saving recommendation.' },
      { status: 500 }
    );
  }
}

