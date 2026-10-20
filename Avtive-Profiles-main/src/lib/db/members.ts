import crypto from 'crypto';
import {
  CompanyMemberRecord,
  CompanyRecord,
  AddCompanyMemberInput,
  UpdateCompanyMemberInput,
  CompanyRole
} from '@/types/company';
import { getMongoDb, COLLECTIONS } from './client';
import { lazyEnsureIndexes } from './indexes';
import { getCompanyById, syncCompanyToProfile } from './companies';
import { getUserById } from './users';
import { normalizeEmail } from '../validation';

export function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

function mapDocToCompanyMember(doc: any): CompanyMemberRecord {
  return {
    id: String(doc._id || doc.id),
    companyId: String(doc.companyId),
    userId: doc.userId ? String(doc.userId) : null,
    email: doc.email || '',
    name: doc.name || '',
    title: doc.title || '',
    department: doc.department || '',
    bio: doc.bio || '',
    avatarUrl: doc.avatarUrl || '',
    role: (doc.role || 'MEMBER') as CompanyRole,
    status: doc.status || 'PENDING',
    profileUrl: doc.profileUrl || undefined,
    inviteToken: doc.inviteToken || null,
    inviteExpiresAt: doc.inviteExpiresAt instanceof Date ? doc.inviteExpiresAt.toISOString() : (doc.inviteExpiresAt || null),
    invitedByUserId: doc.invitedByUserId ? String(doc.invitedByUserId) : null,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : (doc.createdAt || new Date().toISOString()),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : (doc.updatedAt || new Date().toISOString())
  };
}

export async function getCompanyMembers(
  companyId: string,
  onlyActive: boolean = false
): Promise<CompanyMemberRecord[]> {
  if (!companyId) return [];

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const filter: Record<string, any> = { companyId };
  if (onlyActive) {
    filter.status = 'ACTIVE';
  } else {
    filter.status = { $ne: 'REMOVED' };
  }

  const docs = await db.collection(COLLECTIONS.COMPANY_MEMBERS).find(filter).toArray();
  return docs.map(mapDocToCompanyMember);
}

export async function getCompanyMemberById(
  companyId: string,
  memberId: string
): Promise<CompanyMemberRecord | null> {
  if (!companyId || !memberId) return null;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const doc = await db.collection(COLLECTIONS.COMPANY_MEMBERS).findOne({
    companyId,
    $or: [{ _id: memberId as any }, { id: memberId }]
  });
  if (!doc) return null;
  return mapDocToCompanyMember(doc);
}

export async function getCompanyMemberByUser(
  companyId: string,
  userId: string
): Promise<CompanyMemberRecord | null> {
  if (!companyId || !userId) return null;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const doc = await db.collection(COLLECTIONS.COMPANY_MEMBERS).findOne({
    companyId,
    userId,
    status: { $ne: 'REMOVED' }
  });
  if (!doc) return null;
  return mapDocToCompanyMember(doc);
}

export async function addCompanyMember(
  companyId: string,
  input: AddCompanyMemberInput,
  operatorUserId: string
): Promise<{
  success: boolean;
  member?: CompanyMemberRecord;
  inviteLink?: string;
  rawToken?: string;
  error?: string;
  status?: number;
}> {
  if (!operatorUserId) {
    return { success: false, error: 'Unauthorized: Session required.', status: 401 };
  }

  const company = await getCompanyById(companyId);
  if (!company) {
    return { success: false, error: 'Company not found.', status: 404 };
  }

  const db = await getMongoDb();
  const membersCol = db.collection(COLLECTIONS.COMPANY_MEMBERS);

  // Authorization: Operator must be OWNER or ADMIN
  const caller = await getCompanyMemberByUser(companyId, operatorUserId);
  const isOwner = company.ownerUserId === operatorUserId;
  if (!isOwner && (!caller || (caller.role !== 'OWNER' && caller.role !== 'ADMIN'))) {
    return { success: false, error: 'Forbidden: Only an OWNER or ADMIN can invite team members.', status: 403 };
  }

  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail) {
    return { success: false, error: 'Member email is required.', status: 400 };
  }

  // Check if member already in company
  const existing = await membersCol.findOne({ companyId, email: normalizedEmail });
  if (existing && existing.status === 'ACTIVE') {
    return { success: false, error: 'A member with this email is already active in the company.', status: 409 };
  }

  const rawToken = crypto.randomBytes(24).toString('hex');
  const hashedToken = hashInviteToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const memberId = existing ? String(existing._id || existing.id) : `cmem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const memberDoc: any = {
    _id: memberId,
    id: memberId,
    companyId,
    userId: null,
    email: normalizedEmail,
    name: input.name.trim(),
    title: input.title?.trim() || 'Team Member',
    department: input.department?.trim() || 'General',
    bio: input.bio?.trim() || '',
    avatarUrl: input.avatarUrl || '',
    role: input.role || 'MEMBER',
    status: 'PENDING',
    profileUrl: input.profileUrl || undefined,
    inviteToken: hashedToken,
    inviteExpiresAt: expiresAt,
    invitedByUserId: operatorUserId,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  await membersCol.updateOne(
    { _id: memberId as any },
    { $set: memberDoc },
    { upsert: true }
  );

  await syncCompanyToProfile(companyId);

  const inviteLink = `/company/invite?token=${rawToken}`;
  return {
    success: true,
    member: mapDocToCompanyMember(memberDoc),
    inviteLink,
    rawToken,
    status: 201
  };
}

export async function updateCompanyMember(
  companyId: string,
  memberId: string,
  input: UpdateCompanyMemberInput,
  operatorUserId: string
): Promise<{ success: boolean; member?: CompanyMemberRecord; error?: string; status?: number }> {
  if (!operatorUserId) {
    return { success: false, error: 'Unauthorized: Session required.', status: 401 };
  }

  const company = await getCompanyById(companyId);
  if (!company) {
    return { success: false, error: 'Company not found.', status: 404 };
  }

  const db = await getMongoDb();
  const membersCol = db.collection(COLLECTIONS.COMPANY_MEMBERS);

  const targetMember = await getCompanyMemberById(companyId, memberId);
  if (!targetMember || targetMember.status === 'REMOVED') {
    return { success: false, error: 'Team member not found.', status: 404 };
  }

  // Authorization: Operator must be OWNER or ADMIN
  const caller = await getCompanyMemberByUser(companyId, operatorUserId);
  const isOwner = company.ownerUserId === operatorUserId;
  if (!isOwner && (!caller || (caller.role !== 'OWNER' && caller.role !== 'ADMIN'))) {
    return { success: false, error: 'Forbidden: Only an OWNER or ADMIN can modify team members.', status: 403 };
  }

  // If changing role to or from OWNER/ADMIN, only company OWNER can do that
  if (input.role && input.role !== targetMember.role) {
    if (!isOwner && caller?.role !== 'OWNER') {
      return { success: false, error: 'Forbidden: Only the company OWNER can modify administrative roles.', status: 403 };
    }
    // Prevent removing the last OWNER
    if (targetMember.role === 'OWNER' && input.role !== 'OWNER') {
      const activeOwners = await membersCol.countDocuments({ companyId, role: 'OWNER', status: 'ACTIVE' });
      if (activeOwners <= 1) {
        return { success: false, error: 'Cannot demote the last remaining company owner.', status: 400 };
      }
    }
  }

  const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.department !== undefined) updates.department = input.department.trim();
  if (input.bio !== undefined) updates.bio = input.bio.trim();
  if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;
  if (input.role !== undefined) updates.role = input.role;
  if (input.profileUrl !== undefined) updates.profileUrl = input.profileUrl;

  await membersCol.updateOne({ _id: targetMember.id as any }, { $set: updates });
  await syncCompanyToProfile(companyId);

  const updated = await getCompanyMemberById(companyId, memberId);
  return { success: true, member: updated || undefined, status: 200 };
}

export async function removeCompanyMember(
  companyId: string,
  memberId: string,
  operatorUserId: string
): Promise<{ success: boolean; error?: string; status?: number }> {
  if (!operatorUserId) {
    return { success: false, error: 'Unauthorized: Session required.', status: 401 };
  }

  const company = await getCompanyById(companyId);
  if (!company) {
    return { success: false, error: 'Company not found.', status: 404 };
  }

  const targetMember = await getCompanyMemberById(companyId, memberId);
  if (!targetMember || targetMember.status === 'REMOVED') {
    return { success: false, error: 'Team member not found.', status: 404 };
  }

  const isSelf = targetMember.userId === operatorUserId;
  const isOwner = company.ownerUserId === operatorUserId;
  const caller = await getCompanyMemberByUser(companyId, operatorUserId);

  if (!isSelf && !isOwner && (!caller || (caller.role !== 'OWNER' && caller.role !== 'ADMIN'))) {
    return { success: false, error: 'Forbidden: You do not have permission to remove this member.', status: 403 };
  }

  // Prevent removing last owner
  if (targetMember.role === 'OWNER') {
    const db = await getMongoDb();
    const activeOwners = await db.collection(COLLECTIONS.COMPANY_MEMBERS).countDocuments({
      companyId,
      role: 'OWNER',
      status: 'ACTIVE'
    });
    if (activeOwners <= 1) {
      return { success: false, error: 'Cannot remove the last remaining company owner.', status: 400 };
    }
  }

  const db = await getMongoDb();
  await db.collection(COLLECTIONS.COMPANY_MEMBERS).updateOne(
    { _id: targetMember.id as any },
    { $set: { status: 'REMOVED', updatedAt: new Date().toISOString() } }
  );

  await syncCompanyToProfile(companyId);
  return { success: true, status: 200 };
}

export async function acceptCompanyInvite(
  rawToken: string,
  userId: string
): Promise<{
  success: boolean;
  company?: CompanyRecord;
  member?: CompanyMemberRecord;
  error?: string;
  status?: number;
}> {
  if (!rawToken || !userId) {
    return { success: false, error: 'Invalid invite parameters.', status: 400 };
  }

  const user = await getUserById(userId);
  if (!user) {
    return { success: false, error: 'User account not found.', status: 404 };
  }

  const hashedToken = hashInviteToken(rawToken);
  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const membersCol = db.collection(COLLECTIONS.COMPANY_MEMBERS);

  const member = await membersCol.findOne({ inviteToken: hashedToken });
  if (!member) {
    return { success: false, error: 'Invalid or expired invitation token.', status: 404 };
  }

  if (member.inviteExpiresAt) {
    const expires = new Date(member.inviteExpiresAt);
    if (isNaN(expires.getTime()) || expires.getTime() < Date.now()) {
      return { success: false, error: 'This invitation link has expired. Please ask the company for a new invite.', status: 410 };
    }
  }

  const company = await getCompanyById(member.companyId);
  if (!company) {
    return { success: false, error: 'Company associated with invite not found.', status: 404 };
  }

  const now = new Date().toISOString();
  await membersCol.updateOne(
    { _id: member._id },
    {
      $set: {
        status: 'ACTIVE',
        userId: user.id,
        name: user.name || member.name,
        avatarUrl: user.avatar || member.avatarUrl,
        inviteToken: null,
        inviteExpiresAt: null,
        updatedAt: now
      }
    }
  );

  await syncCompanyToProfile(company.id);

  const updatedMember = await getCompanyMemberById(company.id, String(member._id || member.id));
  return {
    success: true,
    company,
    member: updatedMember || undefined,
    status: 200
  };
}
