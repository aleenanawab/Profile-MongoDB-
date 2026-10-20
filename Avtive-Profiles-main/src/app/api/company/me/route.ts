import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCompanyByOwnerUserId, getUserCompanyMemberships, getCompanyMembers, getCompanyMemberByUser } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Session required.' },
        { status: 401 }
      );
    }

    // Check if user is owner of a company or member of a company
    const ownedCompany = await getCompanyByOwnerUserId(session.id);
    let targetCompany = ownedCompany;
    let currentUserRole = 'OWNER';

    if (!targetCompany) {
      const memberships = await getUserCompanyMemberships(session.id);
      if (memberships.length > 0) {
        targetCompany = memberships[0].company;
        currentUserRole = memberships[0].member.role;
      }
    }

    if (!targetCompany) {
      return NextResponse.json({
        success: true,
        company: null,
        members: [],
        currentMember: null
      });
    }

    const currentMember = await getCompanyMemberByUser(targetCompany.id, session.id);
    const members = await getCompanyMembers(targetCompany.id);

    return NextResponse.json({
      success: true,
      company: targetCompany,
      members,
      currentMember,
      role: currentMember?.role || currentUserRole
    });
  } catch (error: any) {
    console.error('Error fetching company in /api/company/me:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while retrieving company.' },
      { status: 500 }
    );
  }
}
