import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  getCompanyById, 
  getCompanyBySlug, 
  getCompanyByOwnerUserId,
  getProfileByIdOrSlug,
  updateCompanyMember, 
  removeCompanyMember 
} from '@/lib/db';
import { ensureSupabaseAssetUrl } from '@/lib/supabase';
import { UpdateCompanyMemberInput } from '@/types/company';

interface RouteContext {
  params: Promise<{ id: string; memberId: string }>;
}

/**
 * PUT /api/company/[id]/members/[memberId]
 * Edit member details / change role (OWNER/ADMIN; only OWNER can grant or revoke ADMIN/OWNER)
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { id: identifier, memberId } = await params;
    let company = (await getCompanyById(identifier)) || (await getCompanyBySlug(identifier));
    if (!company) {
      const profile = await getProfileByIdOrSlug(identifier);
      if (profile && profile.userId) {
        company = await getCompanyByOwnerUserId(profile.userId);
      }
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const input: UpdateCompanyMemberInput = {};

    if (typeof body.name === 'string') {
      const trimmedName = body.name.trim();
      if (trimmedName.length < 2) {
        return NextResponse.json({ error: 'Validation error: Member name must be at least 2 characters.' }, { status: 400 });
      }
      input.name = trimmedName;
    }
    if (typeof body.title === 'string') input.title = body.title.trim();
    if (typeof body.department === 'string') input.department = body.department.trim();
    if (typeof body.bio === 'string') input.bio = body.bio.trim();
    if (typeof body.profileUrl === 'string') {
      const trimmedProfileUrl = body.profileUrl.trim();
      if (trimmedProfileUrl && !/^(https?:\/\/|\/profile\/|[a-zA-Z0-9_\-\.]+)/i.test(trimmedProfileUrl)) {
        return NextResponse.json({ error: 'Validation error: Profile URL must be a valid web link or profile slug.' }, { status: 400 });
      }
      input.profileUrl = trimmedProfileUrl;
    }
    if (body.role) input.role = body.role;

    if (body.avatarUrl) {
      input.avatarUrl = await ensureSupabaseAssetUrl(body.avatarUrl, 'avatars');
    }

    const result = await updateCompanyMember(company.id, memberId, input, session.id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update member.' },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully.',
      member: result.member
    });
  } catch (error: any) {
    console.error('Error in PUT /api/company/[id]/members/[memberId]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while updating member.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/company/[id]/members/[memberId]
 * Remove member (OWNER/ADMIN; cannot remove the last OWNER; members may remove themselves)
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { id: identifier, memberId } = await params;
    let company = (await getCompanyById(identifier)) || (await getCompanyBySlug(identifier));
    if (!company) {
      const profile = await getProfileByIdOrSlug(identifier);
      if (profile && profile.userId) {
        company = await getCompanyByOwnerUserId(profile.userId);
      }
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    const result = await removeCompanyMember(company.id, memberId, session.id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to remove member.' },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully.'
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/company/[id]/members/[memberId]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while removing member.' },
      { status: 500 }
    );
  }
}
