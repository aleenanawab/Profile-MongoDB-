import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createCompany } from '@/lib/db';
import { ensureSupabaseAssetUrl } from '@/lib/supabase';
import { CreateCompanyInput } from '@/types/company';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to create a company profile.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Validation error: Company name must be at least 2 characters long.' },
        { status: 400 }
      );
    }

    // Sanitize and validate inputs
    const input: CreateCompanyInput = {
      name,
      slug: typeof body.slug === 'string' ? body.slug.trim() : undefined,
      tagline: typeof body.tagline === 'string' ? body.tagline.trim() : undefined,
      description: typeof body.description === 'string' ? body.description.trim() : undefined,
      industry: typeof body.industry === 'string' ? body.industry.trim() : undefined,
      size: typeof body.size === 'string' ? body.size.trim() : undefined,
      website: typeof body.website === 'string' ? body.website.trim() : undefined,
      location: typeof body.location === 'string' ? body.location.trim() : undefined,
      theme: body.theme,
      visibility: body.visibility && typeof body.visibility === 'object' ? body.visibility : undefined
    };

    // Validate URL formats if provided
    if (input.website && !input.website.startsWith('http://') && !input.website.startsWith('https://')) {
      input.website = `https://${input.website}`;
    }

    // Auto-upload base64 assets if present using existing upload helper
    if (body.logoUrl) {
      input.logoUrl = await ensureSupabaseAssetUrl(body.logoUrl, 'profiles');
    }
    if (body.coverUrl) {
      input.coverUrl = await ensureSupabaseAssetUrl(body.coverUrl, 'profiles');
    }

    const result = await createCompany(session.id, input);

    return NextResponse.json(
      {
        success: true,
        message: 'Company profile created successfully.',
        company: result.company,
        member: result.member,
        profile: result.profile
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating company in /api/company:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error while creating company.' },
      { status: 500 }
    );
  }
}
