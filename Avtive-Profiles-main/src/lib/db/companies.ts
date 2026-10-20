import crypto from 'crypto';
import { CompanyRecord, CompanyMemberRecord, CreateCompanyInput, UpdateCompanyInput } from '@/types/company';
import { ProfileData, ProfileTheme, TeamMemberItem, DEFAULT_SECTION_VISIBILITY, DEFAULT_SECTION_ORDER } from '@/types/profile';
import { getMongoDb, COLLECTIONS } from './client';
import { lazyEnsureIndexes } from './indexes';
import { getUserById } from './users';
import { slugify } from '../validation';

export function mapDocToCompanyRecord(doc: any): CompanyRecord {
  const id = String(doc._id || doc.id);
  return {
    id,
    ownerUserId: String(doc.ownerUserId || ''),
    name: doc.name || '',
    slug: doc.slug || id,
    tagline: doc.tagline || '',
    description: doc.description || '',
    industry: doc.industry || 'Technology',
    size: doc.size || '1-10',
    website: doc.website || '',
    location: doc.location || '',
    logoUrl: doc.logoUrl || '',
    coverUrl: doc.coverUrl || '',
    theme: (doc.theme || 'editorial') as ProfileTheme,
    visibility: doc.visibility || { ...DEFAULT_SECTION_VISIBILITY },
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : (doc.createdAt || new Date().toISOString()),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : (doc.updatedAt || new Date().toISOString())
  };
}

export async function getCompanyById(id: string): Promise<CompanyRecord | null> {
  if (!id || typeof id !== 'string') return null;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const doc = await db.collection(COLLECTIONS.COMPANIES).findOne({
    $or: [{ _id: id as any }, { id: id }]
  });
  if (!doc) return null;
  return mapDocToCompanyRecord(doc);
}

export async function getCompanyBySlug(slug: string): Promise<CompanyRecord | null> {
  if (!slug || typeof slug !== 'string') return null;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const doc = await db.collection(COLLECTIONS.COMPANIES).findOne({
    $or: [{ slug: slug.trim() }, { slug: slug.toLowerCase().trim() }]
  });
  if (!doc) return null;
  return mapDocToCompanyRecord(doc);
}

export async function getCompanyByOwnerUserId(userId: string): Promise<CompanyRecord | null> {
  if (!userId || typeof userId !== 'string') return null;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const doc = await db.collection(COLLECTIONS.COMPANIES).findOne({ ownerUserId: userId });
  if (!doc) return null;
  return mapDocToCompanyRecord(doc);
}

export async function getUserCompanyMemberships(
  userId: string
): Promise<Array<{ company: CompanyRecord; member: CompanyMemberRecord }>> {
  if (!userId || typeof userId !== 'string') return [];

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const membersCol = db.collection(COLLECTIONS.COMPANY_MEMBERS);
  const activeMembers = await membersCol.find({ userId, status: 'ACTIVE' }).toArray();

  const results: Array<{ company: CompanyRecord; member: CompanyMemberRecord }> = [];
  for (const m of activeMembers) {
    const comp = await getCompanyById(m.companyId);
    if (comp) {
      results.push({
        company: comp,
        member: {
          id: String(m._id || m.id),
          companyId: m.companyId,
          userId: m.userId,
          email: m.email,
          name: m.name,
          title: m.title || '',
          department: m.department || '',
          bio: m.bio || '',
          avatarUrl: m.avatarUrl || '',
          role: m.role || 'MEMBER',
          status: m.status || 'ACTIVE',
          profileUrl: m.profileUrl,
          inviteToken: m.inviteToken || null,
          inviteExpiresAt: m.inviteExpiresAt || null,
          invitedByUserId: m.invitedByUserId || null,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt
        }
      });
    }
  }

  return results;
}

export async function syncCompanyToProfile(companyId: string): Promise<ProfileData | null> {
  const company = await getCompanyById(companyId);
  if (!company) return null;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const membersCol = db.collection(COLLECTIONS.COMPANY_MEMBERS);
  const profilesCol = db.collection(COLLECTIONS.PROFILES);

  const activeMembersRaw = await membersCol
    .find({ companyId, status: { $ne: 'REMOVED' } })
    .toArray();

  const activeMembers: TeamMemberItem[] = activeMembersRaw.map((m) => ({
    id: String(m._id || m.id),
    name: m.name,
    role: m.title || m.role,
    department: m.department || '',
    avatar: m.avatarUrl || '',
    bio: m.bio || '',
    email: m.email,
    profileId: m.profileUrl || m.userId || undefined,
    status: m.status
  }));

  const existingProfile = await profilesCol.findOne({
    $or: [{ _id: company.id as any }, { id: company.id }, { slug: company.slug }]
  });

  const now = new Date().toISOString();
  const companyProfileData: any = {
    ...(existingProfile || {}),
    _id: company.id,
    id: company.id,
    userId: company.ownerUserId,
    type: 'team',
    profileType: 'team',
    slug: company.slug,
    name: company.name,
    company: company.name,
    companyName: company.name,
    tagline: company.tagline,
    bio: company.description,
    about: company.description,
    shortBio: company.tagline || company.description,
    fullBio: company.description,
    location: company.location || 'Global',
    website: company.website || '',
    avatar: company.logoUrl || '',
    companyLogo: company.logoUrl || '',
    coverImage: company.coverUrl || undefined,
    theme: company.theme || 'editorial',
    teamMembers: activeMembers,
    companyInfo: {
      id: company.id,
      name: company.name,
      tagline: company.tagline,
      logo: company.logoUrl || '',
      industry: company.industry,
      location: company.location,
      website: company.website,
      employeeCount: company.size,
      profileId: company.slug
    },
    sectionOrder: existingProfile?.sectionOrder || [...DEFAULT_SECTION_ORDER],
    sectionVisibility: existingProfile?.sectionVisibility || {
      ...DEFAULT_SECTION_VISIBILITY,
      company: true,
      about: true,
      contact: true,
      services: true,
      projects: true
    },
    socials: existingProfile?.socials || (company.website ? [{ platform: 'website', url: company.website, label: 'Website' }] : []),
    createdAt: company.createdAt || now,
    updatedAt: now
  };

  await profilesCol.updateOne(
    { _id: company.id as any },
    { $set: companyProfileData },
    { upsert: true }
  );

  return companyProfileData;
}

export async function createCompany(
  ownerUserId: string,
  data: CreateCompanyInput
): Promise<{ company: CompanyRecord; member: CompanyMemberRecord; profile: ProfileData }> {
  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const companiesCol = db.collection(COLLECTIONS.COMPANIES);
  const membersCol = db.collection(COLLECTIONS.COMPANY_MEMBERS);

  const ownerUser = await getUserById(ownerUserId);
  const rawBase = slugify(data.slug || data.name || 'company');
  let finalSlug = rawBase || `company-${Date.now().toString(36)}`;

  if (data.slug) {
    const existingComp = await companiesCol.findOne({ slug: data.slug.toLowerCase().trim() });
    if (!existingComp || existingComp.ownerUserId === ownerUserId) {
      finalSlug = data.slug.toLowerCase().trim();
    }
  } else {
    let collisionCount = 0;
    while (await companiesCol.findOne({ slug: finalSlug.toLowerCase() })) {
      collisionCount++;
      finalSlug = `${rawBase}-${Math.random().toString(36).substring(2, 6)}`;
      if (collisionCount > 10) {
        finalSlug = `${rawBase}-${Date.now().toString(36)}`;
        break;
      }
    }
  }

  const companyId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newCompanyDoc: any = {
    _id: companyId,
    id: companyId,
    ownerUserId,
    name: (data.name || 'My Company').trim(),
    slug: finalSlug,
    tagline: (data.tagline || '').trim(),
    description: (data.description || '').trim(),
    industry: (data.industry || 'Technology').trim(),
    size: (data.size || '1-10').trim(),
    website: (data.website || '').trim(),
    location: (data.location || '').trim(),
    logoUrl: data.logoUrl || '',
    coverUrl: data.coverUrl || '',
    theme: (data.theme && data.theme !== 'default' ? data.theme : 'editorial') as ProfileTheme,
    visibility: data.visibility || { ...DEFAULT_SECTION_VISIBILITY },
    createdAt: now,
    updatedAt: now
  };

  await companiesCol.insertOne(newCompanyDoc);

  const memberId = `cmem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const ownerMemberDoc: any = {
    _id: memberId,
    id: memberId,
    companyId,
    userId: ownerUserId,
    email: (ownerUser?.email || (data as any).email || '').toLowerCase().trim(),
    name: ownerUser?.name || data.name || 'Company Owner',
    title: 'Founder & Owner',
    department: 'Leadership',
    bio: '',
    avatarUrl: ownerUser?.avatar || data.logoUrl || '',
    role: 'OWNER',
    status: 'ACTIVE',
    inviteToken: null,
    inviteExpiresAt: null,
    invitedByUserId: null,
    createdAt: now,
    updatedAt: now
  };

  await membersCol.insertOne(ownerMemberDoc);

  const company = mapDocToCompanyRecord(newCompanyDoc);
  const profile = (await syncCompanyToProfile(companyId))!;

  return { company, member: ownerMemberDoc, profile };
}

export async function updateCompany(
  id: string,
  data: UpdateCompanyInput,
  operatorUserId: string
): Promise<{ success: boolean; company?: CompanyRecord; error?: string; status?: number }> {
  if (!operatorUserId) {
    return { success: false, error: 'Unauthorized: Session required.', status: 401 };
  }

  const company = await getCompanyById(id);
  if (!company) {
    return { success: false, error: 'Company not found.', status: 404 };
  }

  const db = await getMongoDb();
  const membersCol = db.collection(COLLECTIONS.COMPANY_MEMBERS);
  const companiesCol = db.collection(COLLECTIONS.COMPANIES);

  // Authorization: Operator must be active OWNER or ADMIN
  const member = await membersCol.findOne({
    companyId: company.id,
    userId: operatorUserId,
    status: 'ACTIVE'
  });
  const isOwner = company.ownerUserId === operatorUserId;

  if (!isOwner && (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN'))) {
    return { success: false, error: 'Forbidden: Only an OWNER or ADMIN may update company details.', status: 403 };
  }

  // If slug is changing, verify uniqueness
  let cleanNewSlug = company.slug;
  if (data.slug && data.slug.toLowerCase().trim() !== company.slug.toLowerCase().trim()) {
    cleanNewSlug = slugify(data.slug);
    const conflict = await companiesCol.findOne({
      _id: { $ne: company.id as any },
      slug: cleanNewSlug
    });
    if (conflict) {
      return { success: false, error: 'A company with this slug already exists. Please choose another.', status: 409 };
    }
  }

  const now = new Date().toISOString();
  const updates: Record<string, any> = { updatedAt: now };

  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.slug !== undefined) updates.slug = cleanNewSlug;
  if (data.tagline !== undefined) updates.tagline = data.tagline.trim();
  if (data.description !== undefined) updates.description = data.description.trim();
  if (data.industry !== undefined) updates.industry = data.industry.trim();
  if (data.size !== undefined) updates.size = data.size.trim();
  if (data.website !== undefined) updates.website = data.website.trim();
  if (data.location !== undefined) updates.location = data.location.trim();
  if (data.logoUrl !== undefined) updates.logoUrl = data.logoUrl;
  if (data.coverUrl !== undefined) updates.coverUrl = data.coverUrl;
  if (data.theme !== undefined) updates.theme = data.theme;
  if (data.visibility !== undefined) updates.visibility = { ...company.visibility, ...data.visibility };

  await companiesCol.updateOne({ _id: company.id as any }, { $set: updates });
  await syncCompanyToProfile(company.id);

  const updatedCompany = await getCompanyById(company.id);
  return { success: true, company: updatedCompany || undefined, status: 200 };
}

export async function deleteCompany(
  id: string,
  operatorUserId: string
): Promise<{ success: boolean; error?: string; status?: number }> {
  if (!operatorUserId) {
    return { success: false, error: 'Unauthorized: Session required.', status: 401 };
  }

  const company = await getCompanyById(id);
  if (!company) {
    return { success: false, error: 'Company not found.', status: 404 };
  }

  // Authorization: Only OWNER may delete
  const isOwner = company.ownerUserId === operatorUserId;
  if (!isOwner) {
    return { success: false, error: 'Forbidden: Only the OWNER may delete this company.', status: 403 };
  }

  const db = await getMongoDb();
  await db.collection(COLLECTIONS.COMPANIES).deleteOne({ _id: company.id as any });
  await db.collection(COLLECTIONS.COMPANY_MEMBERS).deleteMany({ companyId: company.id });
  await db.collection(COLLECTIONS.PROFILES).deleteMany({
    $or: [{ _id: company.id as any }, { slug: company.slug }]
  });

  return { success: true, status: 200 };
}
