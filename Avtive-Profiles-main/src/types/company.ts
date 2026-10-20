import { ProfileTheme } from './profile';

export type CompanyRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type CompanyMemberStatus = 'PENDING' | 'ACTIVE' | 'REMOVED';

export interface CompanyRecord {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  industry: string;
  size: string;
  website: string;
  location: string;
  logoUrl: string;
  coverUrl: string;
  theme: ProfileTheme;
  visibility: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMemberRecord {
  id: string;
  companyId: string;
  userId: string | null;
  email: string;
  name: string;
  title: string;
  department: string;
  bio: string;
  avatarUrl: string;
  role: CompanyRole;
  status: CompanyMemberStatus;
  profileUrl?: string;
  inviteToken: string | null; // sha256 hash at rest
  inviteExpiresAt: string | null;
  invitedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyInput {
  name: string;
  slug?: string;
  tagline?: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  location?: string;
  logoUrl?: string;
  coverUrl?: string;
  theme?: ProfileTheme;
  visibility?: Record<string, boolean>;
}

export interface UpdateCompanyInput {
  name?: string;
  slug?: string;
  tagline?: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  location?: string;
  logoUrl?: string;
  coverUrl?: string;
  theme?: ProfileTheme;
  visibility?: Record<string, boolean>;
}

export interface AddCompanyMemberInput {
  email: string;
  name: string;
  title?: string;
  department?: string;
  bio?: string;
  avatarUrl?: string;
  profileUrl?: string;
  role?: CompanyRole;
}

export interface UpdateCompanyMemberInput {
  name?: string;
  title?: string;
  department?: string;
  bio?: string;
  avatarUrl?: string;
  profileUrl?: string;
  role?: CompanyRole;
}

export interface PublicCompanyData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  industry: string;
  size: string;
  website: string;
  location: string;
  logoUrl: string;
  coverUrl: string;
  theme: ProfileTheme;
  visibility: Record<string, boolean>;
  members: Array<{
    id: string;
    userId: string | null;
    name: string;
    title: string;
    department: string;
    bio: string;
    avatarUrl: string;
    role: CompanyRole;
  }>;
  createdAt: string;
  updatedAt: string;
}
