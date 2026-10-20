import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  getCompanyById, 
  getCompanyBySlug, 
  updateCompany, 
  deleteCompany, 
  getCompanyMembers, 
  getCompanyMemberByUser 
} from '@/lib/db';
import { ensureSupabaseAssetUrl } from '@/lib/supabase';
import { UpdateCompanyInput } from '@/types/company';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/company/[id] or /api/company/[slug]
 * Public company profile respecting visibility, only ACTIVE members shown,
 * never leaks private user/token data.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: identifier } = await params;
    if (!identifier) {
      return NextResponse.json({ error: 'Company identifier is required.' }, { status: 400 });
    }

    const company = (await getCompanyById(identifier)) || (await getCompanyBySlug(identifier));
    if (!company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    // Retrieve active members for public display
    const isTeamVisible = company.visibility?.team !== false && company.visibility?.company !== false;
    const rawMembers = isTeamVisible ? await getCompanyMembers(company.id, true) : [];

    const publicMembers = rawMembers.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      title: m.title,
      department: m.department,
      bio: m.bio,
      avatarUrl: m.avatarUrl,
      role: m.role
    }));

    // Respect section visibility
    const publicData = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      tagline: company.tagline,
      description: company.visibility?.about !== false ? company.description : '',
      industry: company.industry,
      size: company.size,
      website: company.website,
      location: company.location,
      logoUrl: company.logoUrl,
      coverUrl: company.coverUrl,
      theme: company.theme,
      visibility: company.visibility,
      members: publicMembers,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    };

    return NextResponse.json({
      success: true,
      company: publicData
    });
  } catch (error: any) {
    console.error('Error in GET /api/company/[id]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while fetching company profile.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/company/[id]
 * Update company (OWNER or ADMIN only)
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { id: identifier } = await params;
    const company = (await getCompanyById(identifier)) || (await getCompanyBySlug(identifier));
    if (!company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updateInput: UpdateCompanyInput = {};

    if (typeof body.name === 'string') {
      const trimmed = body.name.trim();
      if (trimmed.length < 2) {
        return NextResponse.json({ error: 'Company name must be at least 2 characters.' }, { status: 400 });
      }
      updateInput.name = trimmed;
    }

    if (typeof body.slug === 'string') updateInput.slug = body.slug.trim();
    if (typeof body.tagline === 'string') updateInput.tagline = body.tagline.trim();
    if (typeof body.description === 'string') updateInput.description = body.description.trim();
    if (typeof body.industry === 'string') updateInput.industry = body.industry.trim();
    if (typeof body.size === 'string') updateInput.size = body.size.trim();
    if (typeof body.location === 'string') updateInput.location = body.location.trim();
    if (body.theme) updateInput.theme = body.theme;
    if (body.visibility && typeof body.visibility === 'object') updateInput.visibility = body.visibility;

    if (typeof body.website === 'string') {
      let web = body.website.trim();
      if (web && !web.startsWith('http://') && !web.startsWith('https://')) {
        web = `https://${web}`;
      }
      updateInput.website = web;
    }

    // Image uploads
    if (body.logoUrl) {
      updateInput.logoUrl = await ensureSupabaseAssetUrl(body.logoUrl, 'profiles');
    }
    if (body.coverUrl) {
      updateInput.coverUrl = await ensureSupabaseAssetUrl(body.coverUrl, 'profiles');
    }

    const result = await updateCompany(company.id, updateInput, session.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update company.' }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Company updated successfully.',
      company: result.company
    });
  } catch (error: any) {
    console.error('Error updating company in PUT /api/company/[id]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while updating company.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/company/[id]
 * Delete company (OWNER only)
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }

    const { id: identifier } = await params;
    const company = (await getCompanyById(identifier)) || (await getCompanyBySlug(identifier));
    if (!company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    const result = await deleteCompany(company.id, session.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete company.' }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully.'
    });
  } catch (error: any) {
    console.error('Error deleting company in DELETE /api/company/[id]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while deleting company.' },
      { status: 500 }
    );
  }
}
