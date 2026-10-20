import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  getCompanyById, 
  getCompanyBySlug, 
  getCompanyByOwnerUserId,
  getProfileByIdOrSlug,
  createCompany,
  getCompanyMembers, 
  getCompanyMemberByUser, 
  addCompanyMember 
} from '@/lib/db';
import { ensureSupabaseAssetUrl } from '@/lib/supabase';
import { AddCompanyMemberInput } from '@/types/company';
import { normalizeProfileType } from '@/types/profile';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/company/[id]/members
 * List company members (members only)
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { id: identifier } = await params;
    let company = (await getCompanyById(identifier)) || (await getCompanyBySlug(identifier));
    if (!company) {
      const profile = await getProfileByIdOrSlug(identifier);
      if (profile && profile.userId) {
        company = await getCompanyByOwnerUserId(profile.userId);
        if (!company && (normalizeProfileType(profile.type) === 'team' || profile.userId === session.id)) {
          const res = await createCompany(profile.userId, {
            name: profile.name || 'My Company',
            slug: profile.slug,
            theme: profile.theme,
            tagline: profile.tagline || profile.designation || '',
            description: profile.about || profile.bio || '',
            location: profile.location || '',
            logoUrl: profile.avatar || '',
            coverUrl: profile.coverImage || ''
          });
          company = res.company;
        }
      }
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    // Verify caller is a member or owner of this company
    const callerMember = await getCompanyMemberByUser(company.id, session.id);
    const isOwner = company.ownerUserId === session.id;
    if (!callerMember && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden: You must be a member of this company to view member list.' },
        { status: 403 }
      );
    }

    const members = await getCompanyMembers(company.id, false);

    // Sanitize member list to prevent exposing hashed tokens
    const sanitized = members.map((m) => ({
      id: m.id,
      companyId: m.companyId,
      userId: m.userId,
      email: m.email,
      name: m.name,
      title: m.title,
      department: m.department,
      bio: m.bio,
      avatarUrl: m.avatarUrl,
      role: m.role,
      status: m.status,
      inviteExpiresAt: m.inviteExpiresAt,
      invitedByUserId: m.invitedByUserId,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    return NextResponse.json({
      success: true,
      members: sanitized
    });
  } catch (error: any) {
    console.error('Error in GET /api/company/[id]/members:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while listing members.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/company/[id]/members
 * Add / invite team member by email (OWNER or ADMIN only)
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { id: identifier } = await params;
    let company = (await getCompanyById(identifier)) || (await getCompanyBySlug(identifier));
    if (!company) {
      const profile = await getProfileByIdOrSlug(identifier);
      if (profile && profile.userId) {
        company = await getCompanyByOwnerUserId(profile.userId);
        if (!company && (normalizeProfileType(profile.type) === 'team' || profile.userId === session.id)) {
          const res = await createCompany(profile.userId, {
            name: profile.name || 'My Company',
            slug: profile.slug,
            theme: profile.theme,
            tagline: profile.tagline || profile.designation || '',
            description: profile.about || profile.bio || '',
            location: profile.location || '',
            logoUrl: profile.avatar || '',
            coverUrl: profile.coverImage || ''
          });
          company = res.company;
        }
      }
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    // Authorization check
    const callerMember = await getCompanyMemberByUser(company.id, session.id);
    const isOwner = company.ownerUserId === session.id;
    if (!isOwner && (!callerMember || (callerMember.role !== 'OWNER' && callerMember.role !== 'ADMIN'))) {
      return NextResponse.json(
        { error: 'Forbidden: Only an OWNER or ADMIN can invite team members.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawName = typeof body.name === 'string' ? body.name.trim() : '';
    if (!rawName || rawName.length < 2) {
      return NextResponse.json({ error: 'Validation error: Member name is required and must be at least 2 characters.' }, { status: 400 });
    }

    let email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Validation error: Please enter a valid email address.' }, { status: 400 });
      }
    } else {
      // Auto-generate roster email for internal roster additions
      const slugBase = company.slug || 'company';
      email = `member-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}@${slugBase}.local`;
    }

    // Validate avatar image URL format and size if provided
    const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : undefined;
    if (avatarUrl) {
      if (avatarUrl.startsWith('data:image/')) {
        // Enforce max 5MB on base64 data URIs
        if (avatarUrl.length > 5 * 1024 * 1024 * 1.37) {
          return NextResponse.json({ error: 'Validation error: Member photo image size exceeds the 5MB limit.' }, { status: 400 });
        }
      } else if (!/^https?:\/\/.+/i.test(avatarUrl)) {
        return NextResponse.json({ error: 'Validation error: Photo must be a valid HTTP(S) URL or image data.' }, { status: 400 });
      }
    }

    // Validate profile URL format if provided
    const profileUrl = typeof body.profileUrl === 'string' ? body.profileUrl.trim() : undefined;
    if (profileUrl) {
      if (!/^(https?:\/\/|\/profile\/|[a-zA-Z0-9_\-\.]+)/i.test(profileUrl)) {
        return NextResponse.json({ error: 'Validation error: Profile URL must be a valid web link or profile slug.' }, { status: 400 });
      }
    }

    const input: AddCompanyMemberInput = {
      email,
      name: rawName,
      title: typeof body.title === 'string' ? body.title.trim() : 'Team Member',
      department: typeof body.department === 'string' ? body.department.trim() : 'General',
      bio: typeof body.bio === 'string' ? body.bio.trim() : '',
      profileUrl,
      role: body.role || 'MEMBER'
    };

    if (avatarUrl) {
      input.avatarUrl = await ensureSupabaseAssetUrl(avatarUrl, 'avatars');
    }

    const result = await addCompanyMember(company.id, input, session.id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to add member.' },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Member invitation created successfully.',
        member: result.member,
        inviteLink: result.inviteLink,
        rawToken: result.rawToken
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/company/[id]/members:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while adding company member.' },
      { status: 500 }
    );
  }
}
