import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabaseAdmin, SUPABASE_DEFAULT_AVATAR, SUPABASE_DEFAULT_COVER } from '@/lib/supabase';
import { ProfileData, UserRecord, ProfileTheme, ProfileType, UserConnection, SharingSettings, normalizeProfileType, TeamMemberItem } from '@/types/profile';
import { 
  CompanyRecord, 
  CompanyMemberRecord, 
  CompanyRole, 
  CompanyMemberStatus, 
  CreateCompanyInput, 
  UpdateCompanyInput, 
  AddCompanyMemberInput, 
  UpdateCompanyMemberInput 
} from '@/types/company';
import { founderProfile, teamMemberProfile, companyProfile } from '@/data/mockProfiles';

import {
  DEFAULT_SHARING_SETTINGS,
  DEFAULT_SECTION_VISIBILITY,
  DEFAULT_SECTION_ORDER
} from '@/types/profile';

export {
  DEFAULT_SHARING_SETTINGS,
  DEFAULT_SECTION_VISIBILITY,
  DEFAULT_SECTION_ORDER
};

interface DatabaseSchema {
  users: UserRecord[];
  profiles: Record<string, ProfileData>;
  connections?: UserConnection[];
  companies?: CompanyRecord[];
  companyMembers?: CompanyMemberRecord[];
}

const globalForDb = globalThis as unknown as { __AVTIVE_DB__?: DatabaseSchema };

async function withTimeout<T = any>(promise: PromiseLike<T> | any, ms: number = 6000): Promise<any> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

async function asyncSyncSupabase(action: PromiseLike<any>) {
  try {
    await withTimeout(action, 6000);
  } catch {}
}

function getWritableDbPath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'avtive_db.json');
  }
  return path.join(process.cwd(), 'src', 'data', 'db.json');
}

function getSeedDbPath(): string {
  return path.join(process.cwd(), 'src', 'data', 'db.json');
}

// Helper to slugify user names
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Initial Seed Database
function getInitialSeedData(): DatabaseSchema {
  const defaultPasswordHash = bcrypt.hashSync('Avtive@123', 10);
  const abcdPasswordHash = bcrypt.hashSync('12345678', 10);

  const founderUser: UserRecord = {
    id: 'user-mesum',
    name: 'Syed Mesum Raza Shah',
    email: 'mesum@avtive.app',
    passwordHash: defaultPasswordHash,
    createdAt: new Date().toISOString()
  };

  const teamUser: UserRecord = {
    id: 'user-hamza',
    name: 'Hamza Malik',
    email: 'hamza@avtive.app',
    passwordHash: defaultPasswordHash,
    createdAt: new Date().toISOString()
  };

  const abcdUser: UserRecord = {
    id: 'user-abcd',
    name: 'ABCD User',
    email: 'abcd@gmail.com',
    passwordHash: abcdPasswordHash,
    createdAt: new Date().toISOString()
  };

  const leapUser: UserRecord = {
    id: 'user-leap',
    name: 'The Leap Pakistan',
    email: 'theleappakistan22@gmail.com',
    passwordHash: abcdPasswordHash,
    createdAt: new Date().toISOString()
  };

  const aleenaUser: UserRecord = {
    id: 'user-aleena',
    name: 'Aleena Nawab',
    email: 'aleenaknawab@gmail.com',
    passwordHash: abcdPasswordHash,
    createdAt: new Date().toISOString()
  };

  const seededFounderProfile: ProfileData = {
    ...founderProfile,
    userId: founderUser.id,
    theme: (founderProfile.theme || 'elegant') as ProfileTheme
  };

  const seededTeamProfile: ProfileData = {
    ...teamMemberProfile,
    userId: teamUser.id,
    theme: (teamMemberProfile.theme || 'elegant') as ProfileTheme
  };

  const seededCompanyProfile: ProfileData = {
    ...companyProfile,
    userId: founderUser.id,
    theme: (companyProfile.theme || 'elegant') as ProfileTheme
  };

  const seededAbcdProfile: ProfileData = {
    ...founderProfile,
    id: 'prof-abcd',
    slug: 'abcd-user-profile',
    userId: abcdUser.id,
    name: 'ABCD User',
    email: 'abcd@gmail.com',
    profileName: 'Primary Profile',
    designation: 'Professional',
    theme: 'editorial'
  };

  const seededAleenaProfile: ProfileData = {
    ...founderProfile,
    id: 'prof-aleena',
    slug: 'aleena-nawab',
    userId: aleenaUser.id,
    name: 'Aleena Nawab',
    email: 'aleenaknawab@gmail.com',
    profileName: 'Primary Profile',
    designation: 'Lead Product Designer',
    theme: 'editorial'
  };

  const seededCompany: CompanyRecord = {
    id: 'comp-avtive',
    ownerUserId: founderUser.id,
    name: 'Avtive',
    slug: 'avtive',
    tagline: 'The Digital Identity Standard',
    description: 'B2B SaaS platform for intelligent digital profiles, enterprise team directories, and cloud-managed contactless identity solutions.',
    industry: 'Software / SaaS',
    size: '11-50',
    website: 'https://www.avtive.app',
    location: 'NSTP, Islamabad, Pakistan',
    logoUrl: '/images/avtive-symbol.png',
    coverUrl: '/images/default-cover.png',
    theme: 'editorial',
    visibility: { ...DEFAULT_SECTION_VISIBILITY },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const seededOwnerMember: CompanyMemberRecord = {
    id: 'cmem-mesum',
    companyId: seededCompany.id,
    userId: founderUser.id,
    email: founderUser.email,
    name: founderUser.name,
    title: 'Founder & Creative Director',
    department: 'Executive Strategy & Design',
    bio: 'Strategy-based artist with over 10 years of experience creating compelling design solutions.',
    avatarUrl: '/images/founder-pfp.jpg',
    role: 'OWNER',
    status: 'ACTIVE',
    inviteToken: null,
    inviteExpiresAt: null,
    invitedByUserId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const seededTeamMember: CompanyMemberRecord = {
    id: 'cmem-hamza',
    companyId: seededCompany.id,
    userId: teamUser.id,
    email: teamUser.email,
    name: teamUser.name,
    title: 'Lead Mobile & NFC Systems',
    department: 'Hardware Interop & Engineering',
    bio: 'Specializing in contactless NFC hardware firmware and instant vCard synchronization.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
    role: 'MEMBER',
    status: 'ACTIVE',
    inviteToken: null,
    inviteExpiresAt: null,
    invitedByUserId: founderUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    users: [founderUser, teamUser, abcdUser, leapUser, aleenaUser],
    profiles: {
      [seededFounderProfile.id]: seededFounderProfile,
      [seededFounderProfile.slug]: seededFounderProfile,
      [seededTeamProfile.id]: seededTeamProfile,
      [seededTeamProfile.slug]: seededTeamProfile,
      [seededCompanyProfile.id]: seededCompanyProfile,
      [seededCompanyProfile.slug]: seededCompanyProfile,
      [seededAbcdProfile.id]: seededAbcdProfile,
      [seededAbcdProfile.slug]: seededAbcdProfile,
      [seededAleenaProfile.id]: seededAleenaProfile,
      [seededAleenaProfile.slug]: seededAleenaProfile
    },
    companies: [seededCompany],
    companyMembers: [seededOwnerMember, seededTeamMember]
  };
}

function normalizeProfiles(profiles: Record<string, ProfileData>) {
  Object.values(profiles).forEach((p) => {
    p.type = normalizeProfileType(p.type);
    if (!p.theme || p.theme === 'default') p.theme = 'editorial';
    if (!p.profileName) {
      p.profileName = p.designation || (p.type === 'team' ? 'Team Profile' : 'Primary Profile');
    }
    if (!p.profession) {
      p.profession = p.designation || 'Professional';
    }
    if (!p.createdAt) {
      p.createdAt = new Date().toISOString();
    }
    if (!p.updatedAt) {
      p.updatedAt = p.createdAt || new Date().toISOString();
    }
    if (!p.username) {
      p.username = p.slug ? p.slug.replace(/^@/, '') : slugify(p.name);
    }
    if (!p.customFields) {
      p.customFields = [];
    }
    if (!p.dynamicSections) {
      p.dynamicSections = [];
    }
    if (!p.sharingSettings) {
      p.sharingSettings = { ...DEFAULT_SHARING_SETTINGS };
    }
    if (!p.sectionOrder || !p.sectionOrder.length) {
      p.sectionOrder = [...DEFAULT_SECTION_ORDER];
    }
    if (!p.sectionVisibility) {
      p.sectionVisibility = {
        ...DEFAULT_SECTION_VISIBILITY,
        ...(p.sharingSettings
          ? {
              about: p.sharingSettings.bio !== false,
              skills: p.sharingSettings.skills !== false,
              services: p.sharingSettings.services !== false,
              projects: p.sharingSettings.projects !== false,
              experience: p.sharingSettings.experience !== false,
              education: p.sharingSettings.education !== false,
              certifications: p.sharingSettings.certifications !== false,
              volunteer: p.sharingSettings.volunteer !== false,
              languages: p.sharingSettings.languages !== false,
              recommendations: p.sharingSettings.recommendations !== false,
              contact: p.sharingSettings.contactInfo !== false,
              'virtual-card': p.sharingSettings.nfcCard !== false,
              company: p.sharingSettings.companySection !== false
            }
          : {})
      };
    }
    if (!Array.isArray(p.socials)) {
      if (p.socials && typeof p.socials === 'object') {
        p.socials = Object.entries(p.socials).map(([platform, url]) => ({
          platform: platform as any,
          url: String(url),
          label: platform
        }));
      } else {
        p.socials = [];
      }
    }
    if (!Array.isArray(p.socialLinks)) {
      p.socialLinks = p.socials.map((s: any) => ({ platform: s.platform, url: s.url, label: s.label }));
    }
  });
}

function loadDb(): DatabaseSchema {
  if (globalForDb.__AVTIVE_DB__) {
    if (!globalForDb.__AVTIVE_DB__.companies) globalForDb.__AVTIVE_DB__.companies = [];
    if (!globalForDb.__AVTIVE_DB__.companyMembers) globalForDb.__AVTIVE_DB__.companyMembers = [];
    return globalForDb.__AVTIVE_DB__;
  }

  const writablePath = getWritableDbPath();
  const seedPath = getSeedDbPath();

  try {
    if (fs.existsSync(writablePath)) {
      const content = fs.readFileSync(writablePath, 'utf8');
      const data: DatabaseSchema = JSON.parse(content);
      if (data && data.profiles && Array.isArray(data.users)) {
        if (!data.companies) data.companies = [];
        if (!data.companyMembers) data.companyMembers = [];
        normalizeProfiles(data.profiles);
        globalForDb.__AVTIVE_DB__ = data;
        return data;
      }
    }
  } catch (e) {
    console.error('Failed to read from writablePath:', e);
  }

  try {
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, 'utf8');
      const data: DatabaseSchema = JSON.parse(content);
      if (data && data.profiles && Array.isArray(data.users)) {
        if (!data.companies) data.companies = [];
        if (!data.companyMembers) data.companyMembers = [];
        normalizeProfiles(data.profiles);
        globalForDb.__AVTIVE_DB__ = data;
        saveDb(data);
        return data;
      }
    }
  } catch (e) {
    console.error('Failed to read from seedPath:', e);
  }

  const seed = getInitialSeedData();
  normalizeProfiles(seed.profiles);
  globalForDb.__AVTIVE_DB__ = seed;
  saveDb(seed);
  return seed;
}

function saveDb(data: DatabaseSchema): void {
  globalForDb.__AVTIVE_DB__ = data;
  const writablePath = getWritableDbPath();

  try {
    const dir = path.dirname(writablePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(writablePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Failed to write to ${writablePath}, attempting /tmp fallback:`, e);
    try {
      const tmpPath = path.join('/tmp', 'avtive_db.json');
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (tmpErr) {
      console.error('Failed to write to fallback /tmp:', tmpErr);
    }
  }
}

export function isUuidString(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

export function mapSupabaseProfileToProfileData(
  item: any,
  fallbackUserId?: string,
  fallbackRole?: ProfileType
): ProfileData {
  const servicesData = item.services;
  const isComplexServices = servicesData && typeof servicesData === 'object' && !Array.isArray(servicesData);
  const customFields = isComplexServices && Array.isArray(servicesData.customFields)
    ? servicesData.customFields
    : (item.data?.customFields || []);
  const dynamicSections = isComplexServices && Array.isArray(servicesData.dynamicSections)
    ? servicesData.dynamicSections
    : (item.data?.dynamicSections || []);
  const sectionOrder = isComplexServices && Array.isArray(servicesData.sectionOrder)
    ? servicesData.sectionOrder
    : (item.data?.sectionOrder || [...DEFAULT_SECTION_ORDER]);
  const sectionVisibility = isComplexServices && servicesData.sectionVisibility
    ? servicesData.sectionVisibility
    : (item.data?.sectionVisibility || { ...DEFAULT_SECTION_VISIBILITY });
  const sharingSettings = isComplexServices && servicesData.sharingSettings
    ? servicesData.sharingSettings
    : (item.data?.sharingSettings || { ...DEFAULT_SHARING_SETTINGS });
  const companyInfo = isComplexServices && servicesData.companyInfo
    ? servicesData.companyInfo
    : (item.data?.companyInfo || undefined);
  const nfcCard = isComplexServices && servicesData.nfcCard
    ? servicesData.nfcCard
    : (item.data?.nfcCard || undefined);
  const servicesItems = isComplexServices
    ? (servicesData.items || [])
    : (Array.isArray(servicesData) ? servicesData : []);

  const name = item.name || item.data?.name || '';
  const designation = item.designation || item.data?.designation || item.professionalTitle || item.data?.professionalTitle || '';
  const company = item.company || item.data?.company || '';
  const shortBio = item.short_bio || item.data?.shortBio || item.bio || item.data?.bio || item.full_bio || '';
  const fullBio = item.full_bio || item.data?.fullBio || item.about || item.data?.about || '';

  const sp: ProfileData = {
    ...(item.data || {}),
    id: item.id,
    userId: item.user_id || fallbackUserId || '',
    slug: item.slug,
    name,
    email: item.email || item.data?.email || '',
    designation,
    professionalTitle: designation,
    profession: designation || 'Professional',
    company,
    location: item.location || item.data?.location || '',
    avatar: item.avatar || item.data?.avatar || SUPABASE_DEFAULT_AVATAR,
    coverImage: item.cover_image || item.coverImage || item.data?.coverImage || item.data?.cover_image || SUPABASE_DEFAULT_COVER,
    shortBio,
    bio: shortBio,
    fullBio,
    about: fullBio,
    phone: item.phone || item.data?.phone || '',
    whatsapp: item.whatsapp || item.data?.whatsapp || '',
    website: item.website || item.data?.website || '',
    bookingUrl: item.booking_url || item.data?.bookingUrl || '',
    tagline: item.tagline || item.data?.tagline || '',
    skills: Array.isArray(item.skills) ? item.skills : (item.data?.skills || []),
    socials: Array.isArray(item.socials) ? item.socials : (item.data?.socials || []),
    socialLinks: Array.isArray(item.socials) ? item.socials : (item.data?.socialLinks || []),
    experiences: Array.isArray(item.experiences) ? item.experiences : (item.data?.experiences || []),
    experience: Array.isArray(item.experiences) ? item.experiences : (item.data?.experience || []),
    projects: Array.isArray(item.projects) ? item.projects : (item.data?.projects || []),
    certifications: Array.isArray(item.certifications) ? item.certifications : (item.data?.certifications || []),
    services: servicesItems,
    customFields,
    dynamicSections,
    sectionOrder,
    sectionVisibility,
    sharingSettings,
    companyInfo,
    nfcCard,
    type: item.type ? normalizeProfileType(item.type) : (fallbackRole ? normalizeProfileType(fallbackRole) : 'individual'),
    theme: (item.theme && item.theme !== 'default' ? item.theme : 'editorial') as ProfileTheme,
    createdAt: item.created_at || new Date().toISOString(),
    updatedAt: item.updated_at || new Date().toISOString()
  };

  return sp;
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const db = loadDb();
  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users.find((u) => u.email.toLowerCase().trim() === normalizedEmail);
  if (user) return user;

  // Supabase lookup fallback
  try {
    const { data, error } = await withTimeout(
      supabaseAdmin
        .from('users')
        .select('*')
        .ilike('email', normalizedEmail)
        .maybeSingle(),
      6000
    );

    if (data && !error) {
      // Check if user has completed onboarding by checking profile
      const profQuery = isUuidString(data.id)
        ? supabaseAdmin.from('profiles').select('id, designation, short_bio, skills').or(`user_id.eq.${data.id},email.eq.${normalizedEmail}`).limit(1)
        : supabaseAdmin.from('profiles').select('id, designation, short_bio, skills').eq('email', normalizedEmail).limit(1);

      const { data: profData } = await withTimeout(profQuery, 4000).catch(() => ({ data: null }));

      const hasSavedContent = Boolean(
        profData && profData.length > 0 &&
        (profData[0].designation || profData[0].short_bio || (Array.isArray(profData[0].skills) && profData[0].skills.length > 0))
      );

      const su: UserRecord = {
        id: data.id,
        name: data.name,
        email: data.email,
        passwordHash: data.password_hash || data.passwordHash,
        resetToken: data.reset_token || data.resetToken,
        resetTokenExpires: data.reset_token_expires || data.resetTokenExpires,
        onboardingCompleted: hasSavedContent,
        createdAt: data.created_at || data.createdAt || new Date().toISOString()
      };
      db.users.push(su);
      return su;
    }
  } catch {}

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cachedUserRaw = cookieStore.get('avtive_user_cache')?.value;
    if (cachedUserRaw) {
      const cu = JSON.parse(decodeURIComponent(cachedUserRaw));
      if (cu && cu.email?.toLowerCase().trim() === normalizedEmail) {
        db.users.push(cu);
        return cu;
      }
    }
  } catch {}

  if (normalizedEmail === 'abcd@gmail.com') {
    const abcdHash = bcrypt.hashSync('12345678', 10);
    const abcdUser: UserRecord = {
      id: 'user-abcd',
      name: 'ABCD User',
      email: 'abcd@gmail.com',
      passwordHash: abcdHash,
      createdAt: new Date().toISOString()
    };
    db.users.push(abcdUser);
    return abcdUser;
  }

  return null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const db = loadDb();
  const user = db.users.find((u) => u.id === id);
  if (user) return user;

  // Supabase lookup fallback
  try {
    const { data, error } = await withTimeout(
      supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle()
    );

    if (data && !error) {
      const su: UserRecord = {
        id: data.id,
        name: data.name,
        email: data.email,
        passwordHash: data.password_hash || data.passwordHash,
        resetToken: data.reset_token || data.resetToken,
        resetTokenExpires: data.reset_token_expires || data.resetTokenExpires,
        createdAt: data.created_at || data.createdAt || new Date().toISOString()
      };
      db.users.push(su);
      return su;
    }
  } catch {}

  return null;
}

export async function getUserByEmailOrUsername(identifier: string): Promise<UserRecord | null> {
  const clean = identifier.toLowerCase().trim();
  if (clean.includes('@')) {
    return getUserByEmail(clean);
  }
  // Try direct username lookup on user records
  const db = loadDb();
  const matchedUser = db.users.find(
    (u) => (u as any).username?.toLowerCase().trim() === clean || u.name?.toLowerCase().trim() === clean
  );
  if (matchedUser) return matchedUser;

  // Try lookup via profile slug or username
  const matchedProfile = Object.values(db.profiles).find(
    (p) => p.slug?.toLowerCase().trim() === clean || p.username?.toLowerCase().trim() === clean
  );
  if (matchedProfile && matchedProfile.userId) {
    const user = await getUserById(matchedProfile.userId);
    if (user) return user;
  }

  return getUserByEmail(clean);
}

export async function createUser(data: {
  id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  role?: ProfileType;
  createProfile?: boolean;
  recoveryCodeHash?: string;
  onboardingCompleted?: boolean;
  preferredTheme?: ProfileTheme;
}): Promise<{ user: UserRecord; profile?: ProfileData }> {
  const db = loadDb();
  const userId = data.id || crypto.randomUUID();

  const newUser: UserRecord = {
    id: userId,
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    passwordHash: data.passwordHash || `oauth_verified_${Date.now()}`,
    avatar: data.avatar,
    role: data.role ? normalizeProfileType(data.role) : undefined,
    onboardingCompleted: data.onboardingCompleted !== undefined ? data.onboardingCompleted : (data.createProfile ? true : false),
    recoveryCodeHash: data.recoveryCodeHash,
    preferredTheme: data.preferredTheme,
    createdAt: new Date().toISOString()
  };

  // Check if existing user with same ID or email already in DB
  const existingIndex = db.users.findIndex((u) => u.id === userId || u.email.toLowerCase().trim() === newUser.email);
  if (existingIndex !== -1) {
    db.users[existingIndex] = {
      ...db.users[existingIndex],
      ...newUser
    };
  } else {
    db.users.push(newUser);
  }

  // Sync user to Supabase strictly with valid columns
  try {
    await asyncSyncSupabase(
      supabaseAdmin.from('users').upsert({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        password_hash: newUser.passwordHash,
        created_at: newUser.createdAt
      }, { onConflict: 'email' })
    );
  } catch {}

  let newProfile: ProfileData | undefined;
  if (data.createProfile) {
    const slug = `${slugify(data.name)}-${Math.random().toString(36).substring(2, 6)}`;
    const profileUuid = crypto.randomUUID();
    newProfile = {
      id: profileUuid,
      userId: userId,
      slug: slug,
      type: 'individual',
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      designation: 'Professional',
      company: 'Avtive Network',
      location: 'Global',
      avatar: SUPABASE_DEFAULT_AVATAR,
      shortBio: 'Welcome to my digital profile on Avtive.',
      fullBio: 'Connect with me directly via phone, WhatsApp, or email.',
      theme: 'elegant',
      contactOrder: ['whatsapp', 'phone', 'email', 'website', 'location'],
      socials: [
        {
          platform: 'website',
          url: 'https://www.avtive.app',
          label: 'Website',
          handle: 'avtive.app'
        }
      ]
    };
    db.profiles[newProfile.id] = newProfile;
    db.profiles[newProfile.slug] = newProfile;

    // Sync profile to Supabase with proper columns and services jsonb wrapper
    try {
      const servicesPayload = {
        items: newProfile.services || [],
        customFields: newProfile.customFields || [],
        dynamicSections: newProfile.dynamicSections || [],
        sectionOrder: newProfile.sectionOrder || [...DEFAULT_SECTION_ORDER],
        sectionVisibility: newProfile.sectionVisibility || { ...DEFAULT_SECTION_VISIBILITY },
        sharingSettings: newProfile.sharingSettings || { ...DEFAULT_SHARING_SETTINGS }
      };

      asyncSyncSupabase(
        supabaseAdmin.from('profiles').upsert({
          id: newProfile.id,
          user_id: newProfile.userId,
          slug: newProfile.slug,
          name: newProfile.name,
          designation: newProfile.designation || 'Professional',
          company: newProfile.company || '',
          location: newProfile.location || '',
          avatar: newProfile.avatar || SUPABASE_DEFAULT_AVATAR,
          cover_image: newProfile.coverImage || SUPABASE_DEFAULT_COVER,
          short_bio: newProfile.shortBio || '',
          full_bio: newProfile.fullBio || '',
          email: newProfile.email,
          type: newProfile.type,
          theme: newProfile.theme,
          socials: newProfile.socials || [],
          services: servicesPayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      );
    } catch {}
  }

  saveDb(db);
  return { user: newUser, profile: newProfile };
}

export async function createPasswordResetToken(email: string): Promise<{ token: string; user: UserRecord } | null> {
  const db = loadDb();
  const normalizedEmail = email.toLowerCase().trim();
  const user = await getUserByEmail(normalizedEmail);
  if (!user) return null;

  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour validity

  // Store hashed token at rest
  user.resetToken = tokenHash;
  user.resetTokenExpires = expires;

  // Sync token hash update to Supabase
  try {
    await asyncSyncSupabase(
      supabaseAdmin.from('users').update({
        reset_token: tokenHash,
        reset_token_expires: expires
      }).eq('email', normalizedEmail)
    );
  } catch {}

  saveDb(db);
  // Return unhashed token strictly for email dispatch
  return { token, user };
}

export async function verifyPasswordResetToken(email: string, token: string): Promise<{ valid: boolean; error?: string; user?: UserRecord }> {
  const db = loadDb();
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  const crypto = await import('crypto');
  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  let user: UserRecord | null = null;
  if (normalizedEmail) {
    user = await getUserByEmail(normalizedEmail);
  }

  // If user not found by email or email was omitted in token-only reset link, search by reset token
  if (!user) {
    user = db.users.find((u) => u.resetToken === tokenHash || u.resetToken === token.trim()) || null;
  }

  // Fallback to Supabase
  if (!user) {
    try {
      const { data, error } = await withTimeout(
        supabaseAdmin
          .from('users')
          .select('*')
          .or(`reset_token.eq.${tokenHash},reset_token.eq.${token.trim()}`)
          .maybeSingle(),
        6000
      );
      if (data && !error) {
        user = {
          id: data.id,
          name: data.name,
          email: data.email,
          passwordHash: data.password_hash || data.passwordHash,
          resetToken: data.reset_token || data.resetToken,
          resetTokenExpires: data.reset_token_expires || data.resetTokenExpires,
          createdAt: data.created_at || data.createdAt || new Date().toISOString()
        };
        db.users.push(user);
      }
    } catch {}
  }

  if (!user) {
    return { valid: false, error: 'Invalid or expired password reset link.' };
  }

  // Verify against hashed token, with backward compatibility for any existing plaintext tokens
  const isMatch = user.resetToken === tokenHash || user.resetToken === token.trim();

  if (!user.resetToken || !isMatch) {
    return { valid: false, error: 'Invalid or expired password reset link.' };
  }

  if (!user.resetTokenExpires || new Date(user.resetTokenExpires).getTime() < Date.now()) {
    return { valid: false, error: 'Password reset link has expired. Please request a new one.' };
  }

  return { valid: true, user };
}

export async function resetUserPassword(email: string, token: string, newPasswordHash: string): Promise<UserRecord | null> {
  const db = loadDb();
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  const crypto = await import('crypto');
  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  let userIndex = normalizedEmail ? db.users.findIndex((u) => u.email.toLowerCase().trim() === normalizedEmail) : -1;
  if (userIndex === -1) {
    userIndex = db.users.findIndex((u) => u.resetToken === tokenHash || u.resetToken === token.trim());
  }

  const user = userIndex !== -1 ? db.users[userIndex] : (normalizedEmail ? await getUserByEmail(normalizedEmail) : null);
  if (!user) return null;

  const isMatch = user.resetToken === tokenHash || user.resetToken === token.trim();
  if (!user.resetToken || !isMatch) return null;
  if (!user.resetTokenExpires || new Date(user.resetTokenExpires).getTime() < Date.now()) return null;

  user.passwordHash = newPasswordHash;
  delete user.resetToken;
  delete user.resetTokenExpires;

  // Sync password reset to Supabase
  try {
    await asyncSyncSupabase(
      supabaseAdmin.from('users').update({
        password_hash: newPasswordHash,
        reset_token: null,
        reset_token_expires: null
      }).eq('id', user.id)
    );
  } catch {}

  saveDb(db);
  return user;
}

export async function verifyRecoveryCode(
  emailOrUsername: string,
  recoveryCode: string
): Promise<{ valid: boolean; user?: UserRecord; error?: string }> {
  const user = await getUserByEmailOrUsername(emailOrUsername);
  if (!user) {
    return { valid: false, error: 'Invalid email/username or recovery code.' };
  }

  if (!user.recoveryCodeHash) {
    return { valid: false, error: 'No recovery code configured for this account. Please contact support.' };
  }

  const crypto = await import('crypto');
  const codeHash = crypto.createHash('sha256').update(recoveryCode.trim().toUpperCase()).digest('hex');

  if (user.recoveryCodeHash !== codeHash) {
    return { valid: false, error: 'Invalid email/username or recovery code.' };
  }

  return { valid: true, user };
}

export async function resetPasswordWithRecoveryCode(
  emailOrUsername: string,
  recoveryCode: string,
  newPasswordHash: string,
  newRecoveryCodeHash: string
): Promise<{ success: boolean; user?: UserRecord; error?: string }> {
  const db = loadDb();
  const identifier = emailOrUsername.toLowerCase().trim();
  const userIndex = db.users.findIndex(
    (u) => u.email.toLowerCase().trim() === identifier || (u as any).username?.toLowerCase().trim() === identifier
  );

  const user = userIndex !== -1 ? db.users[userIndex] : await getUserByEmailOrUsername(identifier);
  if (!user) {
    return { success: false, error: 'User account not found.' };
  }

  const crypto = await import('crypto');
  const codeHash = crypto.createHash('sha256').update(recoveryCode.trim().toUpperCase()).digest('hex');

  if (!user.recoveryCodeHash || user.recoveryCodeHash !== codeHash) {
    return { success: false, error: 'Invalid recovery code.' };
  }

  user.passwordHash = newPasswordHash;
  user.recoveryCodeHash = newRecoveryCodeHash; // invalidate old code, set new one
  delete user.resetToken;
  delete user.resetTokenExpires;

  if (userIndex !== -1) {
    db.users[userIndex] = user;
  }
  saveDb(db);

  // Sync to Supabase if available
  try {
    await asyncSyncSupabase(
      supabaseAdmin.from('users').update({
        password_hash: newPasswordHash,
        reset_token: null,
        reset_token_expires: null
      }).eq('id', user.id)
    );
  } catch {}

  return { success: true, user };
}

export async function completeUserOnboarding(
  userId: string,
  role?: ProfileType,
  theme?: ProfileTheme
): Promise<{ success: boolean; user?: UserRecord }> {
  const db = loadDb();
  const userIndex = db.users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return { success: false };
  }
  const user = db.users[userIndex];
  user.onboardingCompleted = true;
  if (role) user.role = normalizeProfileType(role);
  if (theme) user.preferredTheme = theme;
  db.users[userIndex] = user;
  saveDb(db);

  try {
    const updatePayload: any = {};
    if (role) updatePayload.type = normalizeProfileType(role);
    if (theme) updatePayload.theme = theme;
    if (Object.keys(updatePayload).length > 0) {
      if (isUuidString(userId)) {
        asyncSyncSupabase(
          supabaseAdmin.from('profiles').update(updatePayload).eq('user_id', userId)
        );
      }
    }
  } catch {}

  return { success: true, user };
}

export async function createProfileForUser(
  userId: string,
  data: Partial<ProfileData>
): Promise<ProfileData> {
  const db = loadDb();
  const user = await getUserById(userId);
  const name = (data.name || user?.name || 'Professional').trim();
  const profileName = (data.profileName || data.designation || 'Professional Profile').trim();
  const profession = (data.profession || data.designation || 'Professional').trim();
  const slugBase = slugify(data.profileName ? `${name}-${data.profileName}` : name);
  const slug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;
  const profileId = data.id && isUuidString(data.id) ? data.id : crypto.randomUUID();
  const now = new Date().toISOString();

  const newProfile: ProfileData = {
    id: profileId,
    userId: userId,
    profileName: profileName,
    profession: profession,
    slug: slug,
    type: normalizeProfileType(data.type),
    name: name,
    email: (data.email || user?.email || '').toLowerCase().trim(),
    firstName: data.firstName || (name.split(' ')[0] || ''),
    secondName: data.secondName || data.lastName || (name.split(' ').slice(1).join(' ') || ''),
    lastName: data.lastName || data.secondName || (name.split(' ').slice(1).join(' ') || ''),
    professionalTitle: data.professionalTitle || data.designation || profession,
    designation: data.designation?.trim() || data.professionalTitle?.trim() || profession,
    company: data.company?.trim() || 'Avtive Network',
    location: data.location?.trim() || 'Global',
    country: data.country?.trim() || '',
    avatar: data.avatar || SUPABASE_DEFAULT_AVATAR,
    coverImage: data.coverImage || SUPABASE_DEFAULT_COVER,
    bio: data.bio?.trim() || data.shortBio?.trim() || 'Welcome to my digital profile on Avtive.',
    about: data.about?.trim() || data.fullBio?.trim() || 'Passionate professional delivering intuitive digital experiences with modern technology and clean architecture.',
    shortBio: data.shortBio?.trim() || data.bio?.trim() || 'Welcome to my digital profile on Avtive.',
    fullBio: data.fullBio?.trim() || data.about?.trim() || 'Connect with me directly via phone, WhatsApp, or email.',
    tagline: data.tagline?.trim() || '',
    phone: data.phone?.trim() || '',
    whatsapp: data.whatsapp?.trim() || data.phone?.trim() || '',
    theme: (data.theme && data.theme !== 'default' ? data.theme : 'editorial') as ProfileTheme,
    contactOrder: data.contactOrder || ['whatsapp', 'phone', 'email', 'website', 'location'],
    socials: Array.isArray(data.socials)
      ? data.socials
      : data.socials && typeof data.socials === 'object'
      ? Object.entries(data.socials).map(([platform, url]) => ({
          platform: platform as any,
          url: String(url),
          label: platform
        }))
      : [
          {
            platform: 'website',
            url: 'https://www.avtive.app',
            label: 'Website',
            handle: 'avtive.app'
          }
        ],
    socialLinks: Array.isArray(data.socialLinks)
      ? data.socialLinks
      : Array.isArray(data.socials)
      ? data.socials.map(s => ({ platform: s.platform, url: s.url, label: s.label }))
      : [],
    skills: Array.isArray(data.skills)
      ? data.skills
      : typeof data.skills === 'string'
      ? (data.skills as string).split(',').map((s) => s.trim()).filter(Boolean)
      : ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    experience: data.experience || data.experiences || [],
    experiences: data.experiences || data.experience || [],
    education: data.education || [],
    projects: data.projects || [],
    services: data.services || [],
    certifications: data.certifications || [],
    languages: data.languages || [],
    recommendations: data.recommendations || [],
    testimonials: data.testimonials || [],
    companyInfo: data.companyInfo,
    nfcCard: data.nfcCard,
    sharingSettings: data.sharingSettings ? { ...DEFAULT_SHARING_SETTINGS, ...data.sharingSettings } : { ...DEFAULT_SHARING_SETTINGS },
    sectionOrder: (data.sectionOrder && data.sectionOrder.length) ? data.sectionOrder : [...DEFAULT_SECTION_ORDER],
    sectionVisibility: data.sectionVisibility ? { ...DEFAULT_SECTION_VISIBILITY, ...data.sectionVisibility } : { ...DEFAULT_SECTION_VISIBILITY },
    username: (data.username || (data.slug ? data.slug.replace(/^@/, '') : slugBase)).toLowerCase().replace(/[^a-z0-9_-]/g, ''),
    customFields: Array.isArray(data.customFields) ? data.customFields : [],
    dynamicSections: Array.isArray(data.dynamicSections) ? data.dynamicSections : [],
    createdAt: now,
    updatedAt: now
  };

  db.profiles[newProfile.id] = newProfile;
  db.profiles[newProfile.slug] = newProfile;
  if (newProfile.username) {
    db.profiles[newProfile.username] = newProfile;
  }
  const targetUser = db.users.find((u) => u.id === userId);
  if (targetUser) {
    targetUser.role = normalizeProfileType(data.type);
    targetUser.onboardingCompleted = true;
  }
  saveDb(db);

  // Sync profile to Supabase so it is accessible across serverless lambdas
  try {
    const servicesPayload = {
      items: newProfile.services || [],
      customFields: newProfile.customFields || [],
      dynamicSections: newProfile.dynamicSections || [],
      sectionOrder: newProfile.sectionOrder || [...DEFAULT_SECTION_ORDER],
      sectionVisibility: newProfile.sectionVisibility || { ...DEFAULT_SECTION_VISIBILITY },
      sharingSettings: newProfile.sharingSettings || { ...DEFAULT_SHARING_SETTINGS },
      companyInfo: newProfile.companyInfo || null,
      nfcCard: newProfile.nfcCard || null
    };

    if (isUuidString(newProfile.userId)) {
      asyncSyncSupabase(
        supabaseAdmin.from('profiles').upsert({
          id: newProfile.id,
          user_id: newProfile.userId,
          slug: newProfile.slug,
          name: newProfile.name,
          designation: newProfile.designation || 'Professional',
          company: newProfile.company || '',
          location: newProfile.location || '',
          avatar: newProfile.avatar || SUPABASE_DEFAULT_AVATAR,
          cover_image: newProfile.coverImage || SUPABASE_DEFAULT_COVER,
          short_bio: newProfile.shortBio || '',
          full_bio: newProfile.fullBio || '',
          phone: newProfile.phone || '',
          whatsapp: newProfile.whatsapp || '',
          email: newProfile.email,
          website: newProfile.website || '',
          type: newProfile.type,
          theme: newProfile.theme,
          skills: newProfile.skills || [],
          socials: newProfile.socials || [],
          services: servicesPayload,
          experiences: newProfile.experiences || [],
          projects: newProfile.projects || [],
          certifications: newProfile.certifications || [],
          created_at: newProfile.createdAt,
          updated_at: newProfile.updatedAt
        })
      );
    }
  } catch {}

  return newProfile;
}

export function setProfileResponseCookies(response: any, profile: ProfileData) {
  try {
    if (!response || !response.cookies) return;

    // Proactively delete/expire legacy chunked cookies that cause 494 REQUEST_HEADER_TOO_LARGE
    response.cookies.delete('avtive_prof_count');
    for (let i = 0; i <= 25; i++) {
      response.cookies.delete(`avtive_prof_${i}`);
    }

    const mini = {
      id: profile.id,
      slug: profile.slug,
      userId: profile.userId,
      name: profile.name
    };
    response.cookies.set('avtive_last_profile', encodeURIComponent(JSON.stringify(mini)), {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });
  } catch (err) {
    console.error('Failed to set response cookie:', err);
  }
}

function hydrateProfileData(p: ProfileData | null, db: DatabaseSchema): ProfileData | null {
  if (!p) return null;
  if (normalizeProfileType(p.type) === 'team') {
    const comp = (db.companies || []).find(
      (c) => c.id === p.id || c.slug === p.slug || (p.userId && c.ownerUserId === p.userId)
    );
    const compId = comp ? comp.id : p.id;
    const members = (db.companyMembers || []).filter((m) => m.companyId === compId && m.status !== 'REMOVED');
    if (members.length > 0) {
      p.teamMembers = members.map((m): TeamMemberItem => ({
        id: m.id,
        name: m.name,
        role: m.title || m.role,
        department: m.department || '',
        avatar: m.avatarUrl || SUPABASE_DEFAULT_AVATAR,
        bio: m.bio || '',
        email: m.email,
        profileId: m.profileUrl || m.userId || undefined,
        status: m.status
      }));
    }
  }
  return p;
}

export async function getProfileByIdOrSlug(idOrSlug: string): Promise<ProfileData | null> {
  const db = loadDb();
  const clean = idOrSlug.toLowerCase().replace(/^@/, '').trim();
  if (db.profiles[idOrSlug]) {
    return hydrateProfileData(db.profiles[idOrSlug], db);
  }
  if (db.profiles[clean]) {
    return hydrateProfileData(db.profiles[clean], db);
  }

  // Linear search in case of lowercase/trim difference or username match
  const found = Object.values(db.profiles).find(
    (p) =>
      p.id.toLowerCase() === idOrSlug.toLowerCase() ||
      p.slug.toLowerCase() === idOrSlug.toLowerCase() ||
      p.slug.toLowerCase() === clean ||
      (p.username && p.username.toLowerCase() === clean) ||
      (p.username && p.username.toLowerCase() === idOrSlug.toLowerCase())
  );
  if (found) return hydrateProfileData(found, db);

  // Fallback: check if idOrSlug matches a userId
  const byUser = Object.values(db.profiles).find((p) => p.userId === idOrSlug);
  if (byUser) return hydrateProfileData(byUser, db);

  // Fallback alias for aleena-nawab-professional-profile-agef from live environment
  if (clean === 'aleena-nawab-professional-profile-agef' || clean.includes('aleena-nawab')) {
    const aleenaProf = Object.values(db.profiles).find(
      (p) => p.slug?.toLowerCase().includes('aleena-nawab') || p.name?.toLowerCase().includes('aleena')
    );
    if (aleenaProf) {
      return hydrateProfileData({
        ...aleenaProf,
        slug: clean === 'aleena-nawab-professional-profile-agef' ? 'aleena-nawab-professional-profile-agef' : aleenaProf.slug
      }, db);
    }
  }

  // Supabase lookup fallback across serverless lambdas
  try {
    const isIdUuid = isUuidString(idOrSlug);
    const filter = isIdUuid
      ? `id.eq.${idOrSlug},user_id.eq.${idOrSlug},slug.eq.${idOrSlug}`
      : `slug.eq.${idOrSlug},slug.eq.${clean}`;

    const { data, error } = await withTimeout(
      supabaseAdmin
        .from('profiles')
        .select('*')
        .or(filter)
        .maybeSingle(),
      6000
    );

    if (data && !error) {
      const sp = mapSupabaseProfileToProfileData(data);
      normalizeProfiles({ [sp.id]: sp });
      db.profiles[sp.id] = sp;
      db.profiles[sp.slug] = sp;
      return hydrateProfileData(sp, db);
    }
  } catch {}

  // Cookie fallback for newly created/updated profiles across serverless lambdas
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    const lastProfileRaw = cookieStore.get('avtive_last_profile')?.value;
    if (lastProfileRaw) {
      const p = JSON.parse(decodeURIComponent(lastProfileRaw));
      if (p && (p.id === idOrSlug || p.slug === idOrSlug || p.userId === idOrSlug)) {
        if (db.profiles[p.id]) return hydrateProfileData(db.profiles[p.id], db);
        if (db.profiles[p.slug]) return hydrateProfileData(db.profiles[p.slug], db);
      }
    }
  } catch {}

  return null;
}

export async function getProfileByUserId(userId: string): Promise<ProfileData | null> {
  const db = loadDb();

  // 1. Check if there is an active/last selected profile via cookie for this user
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const lastProfileRaw = cookieStore.get('avtive_last_profile')?.value;
    if (lastProfileRaw) {
      const p = JSON.parse(decodeURIComponent(lastProfileRaw));
      if (p && (p.userId === userId || !p.userId)) {
        const found = Object.values(db.profiles).find(
          (cand) => (cand.id === p.id || cand.slug === p.slug) && (cand.userId === userId || !cand.userId)
        );
        if (found) {
          found.userId = userId;
          return found;
        }
      }
    }
  } catch {}

  // 2. Fetch all profiles for this user from DB and honor saved profile type
  const user = db.users.find((u) => u.id === userId);
  const userEmail = user?.email?.toLowerCase().trim();

  // Find all profiles belonging to this user
  const matchingProfiles = Object.values(db.profiles).filter(
    (p) => p.userId === userId || (userEmail && p.email && p.email.toLowerCase().trim() === userEmail)
  );

  if (matchingProfiles.length > 0) {
    // If user's registered role is team/company, prioritize team/company profile
    const userRoleType = user?.role ? normalizeProfileType(user.role) : undefined;
    if (userRoleType === 'team') {
      const companyProfile = matchingProfiles.find((p) => normalizeProfileType(p.type) === 'team');
      if (companyProfile) return companyProfile;
    }
    // Return the first saved profile record without arbitrarily forcing individual
    return matchingProfiles[0];
  }

  // 3. Supabase lookup fallback across serverless lambdas
  try {
    const isUserUuid = isUuidString(userId);
    const filter = isUserUuid
      ? `user_id.eq.${userId}${userEmail ? `,email.eq.${userEmail}` : ''}`
      : (userEmail ? `email.eq.${userEmail}` : '');

    if (filter) {
      const { data, error } = await withTimeout(
        supabaseAdmin
          .from('profiles')
          .select('*')
          .or(filter)
          .limit(1),
        6000
      );

      if (data && !error && data.length > 0) {
        const item = data[0];
        const sp = mapSupabaseProfileToProfileData(item, userId, user?.role);
        normalizeProfiles({ [sp.id]: sp });
        db.profiles[sp.id] = sp;
        db.profiles[sp.slug] = sp;
        return sp;
      }
    }
  } catch {}

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const lastProfileRaw = cookieStore.get('avtive_last_profile')?.value;
    if (lastProfileRaw) {
      const p = JSON.parse(decodeURIComponent(lastProfileRaw));
      if (p && (p.userId === userId || !p.userId)) {
        p.userId = userId;
        db.profiles[p.id] = p;
        db.profiles[p.slug] = p;
        return p;
      }
    }
  } catch {}

  return null;
}

export async function getProfilesByUserId(userId: string): Promise<ProfileData[]> {
  const db = loadDb();
  const user = db.users.find((u) => u.id === userId);
  const userEmail = user?.email?.toLowerCase().trim();
  const unique = new Map<string, ProfileData>();
  for (const p of Object.values(db.profiles)) {
    if (p.userId === userId || (userEmail && p.email && p.email.toLowerCase().trim() === userEmail)) {
      if (p.userId !== userId) {
        p.userId = userId;
      }
      unique.set(p.id, p);
    }
  }

  if (unique.size === 0) {
    try {
      const isUserUuid = isUuidString(userId);
      const filter = isUserUuid
        ? `user_id.eq.${userId}${userEmail ? `,email.eq.${userEmail}` : ''}`
        : (userEmail ? `email.eq.${userEmail}` : '');

      if (filter) {
        const { data, error } = await withTimeout(
          supabaseAdmin
            .from('profiles')
            .select('*')
            .or(filter)
        );

        if (data && !error && data.length > 0) {
          for (const item of data) {
            const sp = mapSupabaseProfileToProfileData(item, userId, user?.role);
            normalizeProfiles({ [sp.id]: sp });
            db.profiles[sp.id] = sp;
            db.profiles[sp.slug] = sp;
            unique.set(sp.id, sp);
          }
        }
      }
    } catch {}

    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const lastProfileRaw = cookieStore.get('avtive_last_profile')?.value;
      if (lastProfileRaw) {
        const p = JSON.parse(decodeURIComponent(lastProfileRaw));
        if (p && (p.userId === userId || !p.userId)) {
          p.userId = userId;
          db.profiles[p.id] = p;
          db.profiles[p.slug] = p;
          unique.set(p.id, p);
        }
      }
    } catch {}
  }

  return Array.from(unique.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeA - timeB;
  });
}

export async function getAllProfiles(): Promise<ProfileData[]> {
  const db = loadDb();
  const unique = new Map<string, ProfileData>();
  for (const p of Object.values(db.profiles)) {
    unique.set(p.id, p);
  }
  return Array.from(unique.values());
}

export async function updateProfile(
  profileId: string,
  updatedData: Partial<ProfileData>,
  sessionUserId: string,
  sessionUserEmail?: string
): Promise<{ success: boolean; profile?: ProfileData; error?: string; status: number }> {
  const db = loadDb();
  let target = await getProfileByIdOrSlug(profileId);

  if (!target && (updatedData as any)?.id) {
    target = await getProfileByIdOrSlug((updatedData as any).id);
  }

  if (!target && (updatedData as any)?.slug) {
    target = await getProfileByIdOrSlug((updatedData as any).slug);
  }

  if (!target) {
    target = await getProfileByUserId(sessionUserId);
  }

  if (!target) {
    // If not found in memory/tmp (common on cold lambdas), upsert and persist for this session user
    const slug =
      (updatedData as any)?.slug ||
      (updatedData.profileName
        ? slugify(`${updatedData.name || 'User'}-${updatedData.profileName}`)
        : slugify(updatedData.name || 'user')) ||
      profileId;

    const effectiveUsername = updatedData.username
      ? updatedData.username.toLowerCase().replace(/[^a-z0-9_-]/g, '')
      : slug;

    const newProfileId = (profileId && isUuidString(profileId)) ? profileId : crypto.randomUUID();
    const newProfile: ProfileData = {
      id: newProfileId,
      userId: sessionUserId,
      slug: slug,
      username: effectiveUsername,
      type: normalizeProfileType(updatedData.type),
      name: updatedData.name || 'Professional',
      email: updatedData.email || sessionUserEmail || '',
      ...updatedData,
      customFields: Array.isArray(updatedData.customFields) ? updatedData.customFields : [],
      dynamicSections: Array.isArray(updatedData.dynamicSections) ? updatedData.dynamicSections : [],
      sectionOrder: (updatedData.sectionOrder && updatedData.sectionOrder.length) ? updatedData.sectionOrder : [...DEFAULT_SECTION_ORDER],
      sectionVisibility: updatedData.sectionVisibility
        ? { ...DEFAULT_SECTION_VISIBILITY, ...updatedData.sectionVisibility }
        : { ...DEFAULT_SECTION_VISIBILITY },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as ProfileData;

    db.profiles[newProfile.id] = newProfile;
    db.profiles[newProfile.slug] = newProfile;
    if (newProfile.username) {
      db.profiles[newProfile.username] = newProfile;
    }
    saveDb(db);

    try {
      const servicesPayload = {
        items: newProfile.services || [],
        customFields: newProfile.customFields || [],
        dynamicSections: newProfile.dynamicSections || [],
        sectionOrder: newProfile.sectionOrder || [...DEFAULT_SECTION_ORDER],
        sectionVisibility: newProfile.sectionVisibility || { ...DEFAULT_SECTION_VISIBILITY },
        sharingSettings: newProfile.sharingSettings || { ...DEFAULT_SHARING_SETTINGS },
        companyInfo: newProfile.companyInfo || null,
        nfcCard: newProfile.nfcCard || null
      };

      if (isUuidString(newProfile.id) && isUuidString(newProfile.userId)) {
        asyncSyncSupabase(
          supabaseAdmin.from('profiles').upsert({
            id: newProfile.id,
            user_id: newProfile.userId,
            slug: newProfile.slug,
            name: newProfile.name,
            designation: newProfile.designation || 'Professional',
            company: newProfile.company || '',
            location: newProfile.location || '',
            avatar: newProfile.avatar || SUPABASE_DEFAULT_AVATAR,
            cover_image: newProfile.coverImage || SUPABASE_DEFAULT_COVER,
            short_bio: newProfile.shortBio || '',
            full_bio: newProfile.fullBio || '',
            phone: newProfile.phone || '',
            whatsapp: newProfile.whatsapp || '',
            email: newProfile.email || '',
            website: newProfile.website || '',
            type: newProfile.type,
            theme: newProfile.theme || 'editorial',
            skills: newProfile.skills || [],
            socials: newProfile.socials || [],
            services: servicesPayload,
            experiences: newProfile.experiences || [],
            projects: newProfile.projects || [],
            certifications: newProfile.certifications || [],
            created_at: newProfile.createdAt,
            updated_at: newProfile.updatedAt
          }, { onConflict: 'id' })
        );
      }
    } catch {}

    return { success: true, profile: newProfile, status: 200 };
  }

  // Ownership verification: Allow if sessionUserId matches target.userId OR if caller email matches target email
  const sessionUser = sessionUserEmail ? { email: sessionUserEmail } : await getUserById(sessionUserId);
  const normalizedSessionEmail = (sessionUser?.email || sessionUserEmail || '').toLowerCase().trim();
  const normalizedTargetEmail = (target.email || '').toLowerCase().trim();
  const isOwnerByEmail = Boolean(normalizedSessionEmail && normalizedTargetEmail && normalizedSessionEmail === normalizedTargetEmail);

  if (target.userId && target.userId !== sessionUserId && !isOwnerByEmail) {
    return {
      success: false,
      error: 'Forbidden: You do not own this profile. Only the verified owner can perform edits.',
      status: 403
    };
  }

  // If verified by email or if unassigned, bind target ownership to current session user
  if (!target.userId || (isOwnerByEmail && target.userId !== sessionUserId)) {
    target.userId = sessionUserId;
  }

  // Handle username update if provided
  const effectiveUsername = updatedData.username !== undefined
    ? (updatedData.username ? updatedData.username.toLowerCase().replace(/[^a-z0-9_-]/g, '') : undefined)
    : (target.username || (target.slug ? target.slug.replace(/^@/, '') : undefined));

  // Handle separated sectionVisibility and bidirectional sync with sharingSettings
  const mergedSectionVisibility: Record<string, boolean> = updatedData.sectionVisibility
    ? { ...(target.sectionVisibility || DEFAULT_SECTION_VISIBILITY), ...updatedData.sectionVisibility }
    : (target.sectionVisibility || { ...DEFAULT_SECTION_VISIBILITY });

  const mergedSharingSettings = updatedData.sharingSettings
    ? { ...(target.sharingSettings || DEFAULT_SHARING_SETTINGS), ...updatedData.sharingSettings }
    : { ...(target.sharingSettings || DEFAULT_SHARING_SETTINGS) };

  if (updatedData.sectionVisibility) {
    if (updatedData.sectionVisibility.about !== undefined) mergedSharingSettings.bio = updatedData.sectionVisibility.about;
    if (updatedData.sectionVisibility.skills !== undefined) mergedSharingSettings.skills = updatedData.sectionVisibility.skills;
    if (updatedData.sectionVisibility.services !== undefined) mergedSharingSettings.services = updatedData.sectionVisibility.services;
    if (updatedData.sectionVisibility.projects !== undefined) mergedSharingSettings.projects = updatedData.sectionVisibility.projects;
    if (updatedData.sectionVisibility.experience !== undefined) mergedSharingSettings.experience = updatedData.sectionVisibility.experience;
    if (updatedData.sectionVisibility.education !== undefined) mergedSharingSettings.education = updatedData.sectionVisibility.education;
    if (updatedData.sectionVisibility.certifications !== undefined) mergedSharingSettings.certifications = updatedData.sectionVisibility.certifications;
    if (updatedData.sectionVisibility.volunteer !== undefined) mergedSharingSettings.volunteer = updatedData.sectionVisibility.volunteer;
    if (updatedData.sectionVisibility.languages !== undefined) mergedSharingSettings.languages = updatedData.sectionVisibility.languages;
    if (updatedData.sectionVisibility.recommendations !== undefined) mergedSharingSettings.recommendations = updatedData.sectionVisibility.recommendations;
    if (updatedData.sectionVisibility.contact !== undefined) mergedSharingSettings.contactInfo = updatedData.sectionVisibility.contact;
    if (updatedData.sectionVisibility['virtual-card'] !== undefined) mergedSharingSettings.nfcCard = updatedData.sectionVisibility['virtual-card'];
    if (updatedData.sectionVisibility.company !== undefined) mergedSharingSettings.companySection = updatedData.sectionVisibility.company;
  } else if (updatedData.sharingSettings) {
    if (updatedData.sharingSettings.bio !== undefined) mergedSectionVisibility.about = updatedData.sharingSettings.bio;
    if (updatedData.sharingSettings.skills !== undefined) mergedSectionVisibility.skills = updatedData.sharingSettings.skills;
    if (updatedData.sharingSettings.services !== undefined) mergedSectionVisibility.services = updatedData.sharingSettings.services;
    if (updatedData.sharingSettings.projects !== undefined) mergedSectionVisibility.projects = updatedData.sharingSettings.projects;
    if (updatedData.sharingSettings.experience !== undefined) mergedSectionVisibility.experience = updatedData.sharingSettings.experience;
    if (updatedData.sharingSettings.education !== undefined) mergedSectionVisibility.education = updatedData.sharingSettings.education;
    if (updatedData.sharingSettings.certifications !== undefined) mergedSectionVisibility.certifications = updatedData.sharingSettings.certifications;
    if (updatedData.sharingSettings.volunteer !== undefined) mergedSectionVisibility.volunteer = updatedData.sharingSettings.volunteer;
    if (updatedData.sharingSettings.languages !== undefined) mergedSectionVisibility.languages = updatedData.sharingSettings.languages;
    if (updatedData.sharingSettings.recommendations !== undefined) mergedSectionVisibility.recommendations = updatedData.sharingSettings.recommendations;
    if (updatedData.sharingSettings.contactInfo !== undefined) mergedSectionVisibility.contact = updatedData.sharingSettings.contactInfo;
    if (updatedData.sharingSettings.nfcCard !== undefined) mergedSectionVisibility['virtual-card'] = updatedData.sharingSettings.nfcCard;
    if (updatedData.sharingSettings.companySection !== undefined) mergedSectionVisibility.company = updatedData.sharingSettings.companySection;
  }

  // Merge safe updates
  const merged: ProfileData = {
    ...target,
    ...updatedData,
    username: effectiveUsername,
    customFields: Array.isArray(updatedData.customFields)
      ? updatedData.customFields
      : (target.customFields || []),
    dynamicSections: Array.isArray(updatedData.dynamicSections)
      ? updatedData.dynamicSections
      : (target.dynamicSections || []),
    sectionOrder: (updatedData.sectionOrder && updatedData.sectionOrder.length)
      ? updatedData.sectionOrder
      : (target.sectionOrder || [...DEFAULT_SECTION_ORDER]),
    sectionVisibility: mergedSectionVisibility,
    sharingSettings: mergedSharingSettings,
    type: updatedData.type ? normalizeProfileType(updatedData.type) : normalizeProfileType(target.type),
    teamMembers: updatedData.teamMembers !== undefined ? updatedData.teamMembers : target.teamMembers,
    companyInfo: updatedData.companyInfo !== undefined ? updatedData.companyInfo : target.companyInfo,
    id: target.id, // Prevent tampering with immutable ID
    userId: sessionUserId, // Ensure bound to active session user
    slug: target.slug || (updatedData as any)?.slug || profileId,
    updatedAt: new Date().toISOString()
  };

  // Persist to id, slug, and username keys
  db.profiles[merged.id] = merged;
  db.profiles[merged.slug] = merged;
  if (merged.username) {
    db.profiles[merged.username] = merged;
  }
  saveDb(db);

  // Sync profile update to Supabase
  try {
    const servicesPayload = {
      items: merged.services || [],
      customFields: merged.customFields || [],
      dynamicSections: merged.dynamicSections || [],
      sectionOrder: merged.sectionOrder || [...DEFAULT_SECTION_ORDER],
      sectionVisibility: merged.sectionVisibility || { ...DEFAULT_SECTION_VISIBILITY },
      sharingSettings: merged.sharingSettings || { ...DEFAULT_SHARING_SETTINGS },
      companyInfo: merged.companyInfo || null,
      nfcCard: merged.nfcCard || null
    };

    if (isUuidString(merged.id) && isUuidString(merged.userId)) {
      asyncSyncSupabase(
        supabaseAdmin.from('profiles').upsert({
          id: merged.id,
          user_id: merged.userId,
          slug: merged.slug,
          name: merged.name,
          designation: merged.designation || 'Professional',
          company: merged.company || '',
          location: merged.location || '',
          avatar: merged.avatar || SUPABASE_DEFAULT_AVATAR,
          cover_image: merged.coverImage || SUPABASE_DEFAULT_COVER,
          short_bio: merged.shortBio || '',
          full_bio: merged.fullBio || '',
          phone: merged.phone || '',
          whatsapp: merged.whatsapp || '',
          email: merged.email || '',
          website: merged.website || '',
          type: merged.type,
          theme: merged.theme,
          skills: merged.skills || [],
          socials: merged.socials || [],
          services: servicesPayload,
          experiences: merged.experiences || [],
          projects: merged.projects || [],
          certifications: merged.certifications || [],
          updated_at: merged.updatedAt
        }, { onConflict: 'id' })
      );
    }
  } catch {}

  return { success: true, profile: merged, status: 200 };
}

export async function duplicateProfile(
  profileId: string,
  sessionUserId: string
): Promise<{ success: boolean; profile?: ProfileData; error?: string; status: number }> {
  const db = loadDb();
  const target = await getProfileByIdOrSlug(profileId);

  if (!target) {
    return { success: false, error: 'Profile not found.', status: 404 };
  }

  // Strict ownership check
  if (!target.userId || target.userId !== sessionUserId) {
    return {
      success: false,
      error: 'Forbidden: You do not have permission to duplicate this profile.',
      status: 403
    };
  }

  const newId = crypto.randomUUID();
  const duplicateName = target.profileName ? `${target.profileName} (Copy)` : `${target.name} (Copy)`;
  const slugBase = slugify(`${target.name}-${duplicateName}`);
  const newSlug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const cloned: ProfileData = {
    ...JSON.parse(JSON.stringify(target)),
    id: newId,
    userId: sessionUserId,
    profileName: duplicateName,
    slug: newSlug,
    createdAt: now,
    updatedAt: now
  };

  db.profiles[cloned.id] = cloned;
  db.profiles[cloned.slug] = cloned;
  saveDb(db);

  // Sync duplicate to Supabase
  try {
    const servicesPayload = {
      items: cloned.services || [],
      customFields: cloned.customFields || [],
      dynamicSections: cloned.dynamicSections || [],
      sectionOrder: cloned.sectionOrder || [...DEFAULT_SECTION_ORDER],
      sectionVisibility: cloned.sectionVisibility || { ...DEFAULT_SECTION_VISIBILITY },
      sharingSettings: cloned.sharingSettings || { ...DEFAULT_SHARING_SETTINGS },
      companyInfo: cloned.companyInfo || null,
      nfcCard: cloned.nfcCard || null
    };

    if (isUuidString(cloned.userId)) {
      asyncSyncSupabase(
        supabaseAdmin.from('profiles').upsert({
          id: cloned.id,
          user_id: cloned.userId,
          slug: cloned.slug,
          name: cloned.name,
          designation: cloned.designation || 'Professional',
          company: cloned.company || '',
          location: cloned.location || '',
          avatar: cloned.avatar || SUPABASE_DEFAULT_AVATAR,
          cover_image: cloned.coverImage || SUPABASE_DEFAULT_COVER,
          short_bio: cloned.shortBio || '',
          full_bio: cloned.fullBio || '',
          phone: cloned.phone || '',
          whatsapp: cloned.whatsapp || '',
          email: cloned.email || '',
          website: cloned.website || '',
          type: cloned.type,
          theme: cloned.theme,
          skills: cloned.skills || [],
          socials: cloned.socials || [],
          services: servicesPayload,
          experiences: cloned.experiences || [],
          projects: cloned.projects || [],
          certifications: cloned.certifications || [],
          created_at: cloned.createdAt,
          updated_at: cloned.updatedAt
        }, { onConflict: 'id' })
      );
    }
  } catch {}

  return { success: true, profile: cloned, status: 201 };
}

export async function deleteProfile(
  profileId: string,
  sessionUserId: string
): Promise<{ success: boolean; error?: string; status: number }> {
  const db = loadDb();
  const target = await getProfileByIdOrSlug(profileId);

  if (!target) {
    return { success: false, error: 'Profile not found.', status: 404 };
  }

  // Strict ownership check
  if (!target.userId || target.userId !== sessionUserId) {
    return {
      success: false,
      error: 'Forbidden: You do not have permission to delete this profile.',
      status: 403
    };
  }

  // Delete from profiles
  delete db.profiles[target.id];
  delete db.profiles[target.slug];

  // Clean up any remaining key references
  for (const key of Object.keys(db.profiles)) {
    if (db.profiles[key].id === target.id) {
      delete db.profiles[key];
    }
  }

  saveDb(db);

  // Delete from Supabase
  asyncSyncSupabase(
    supabaseAdmin.from('profiles').delete().eq('id', target.id)
  );

  return { success: true, status: 200 };
}

/**
 * Server-side projection that strips unshared/hidden fields from a profile.
 * Ensures that if a user turns off Phone, Experience, Email, etc. in sharing settings,
 * the public API / server props NEVER expose that data to viewers.
 */
export function sanitizeProfileForPublic(profile: ProfileData, isOwner: boolean = false): ProfileData {
  if (isOwner) {
    return profile;
  }

  const settings = profile.sharingSettings || DEFAULT_SHARING_SETTINGS;
  const visibility = profile.sectionVisibility || DEFAULT_SECTION_VISIBILITY;
  const sanitized: ProfileData = { ...profile };

  if (settings.photo === false || visibility['photo'] === false) {
    sanitized.avatar = '';
    sanitized.coverImage = undefined;
  }

  if (settings.nameAndTitle === false) {
    sanitized.name = 'Professional';
    sanitized.designation = '';
    sanitized.tagline = '';
  }

  if (settings.bio === false || visibility['about'] === false) {
    sanitized.bio = '';
    sanitized.about = '';
    sanitized.shortBio = '';
    sanitized.fullBio = '';
  }

  if (settings.contactInfo === false || settings.phone === false || visibility['contact'] === false) {
    sanitized.phone = '';
    sanitized.whatsapp = '';
  }

  if (settings.contactInfo === false || settings.email === false || visibility['contact'] === false) {
    sanitized.email = '';
  }

  if (settings.socialLinks === false || visibility['social-links'] === false || visibility['socialLinks'] === false) {
    sanitized.socials = [];
    sanitized.socialLinks = [];
  } else {
    if (Array.isArray(sanitized.socialLinks)) {
      sanitized.socialLinks = sanitized.socialLinks.filter((s: any) => s && s.visible !== false);
    }
    if (Array.isArray(sanitized.socials)) {
      sanitized.socials = sanitized.socials.filter((s: any) => s && s.visible !== false);
    }
  }

  if (settings.skills === false || visibility['skills'] === false) {
    sanitized.skills = [];
  }

  if (settings.experience === false || visibility['experience'] === false) {
    sanitized.experiences = [];
    sanitized.experience = [];
  }

  if (settings.education === false || visibility['education'] === false) {
    sanitized.education = [];
  }

  if (settings.certifications === false || visibility['certifications'] === false) {
    sanitized.certifications = [];
  }

  if (settings.projects === false || visibility['projects'] === false) {
    sanitized.projects = [];
  }

  if (settings.services === false || visibility['services'] === false) {
    sanitized.services = [];
  }

  if (settings.recommendations === false || visibility['recommendations'] === false) {
    sanitized.recommendations = [];
    sanitized.testimonials = [];
  }

  if (settings.volunteer === false || visibility['volunteer'] === false) {
    sanitized.volunteerExperiences = [];
  }

  if (settings.languages === false || visibility['languages'] === false) {
    sanitized.languages = [];
  }

  if (settings.companySection === false || visibility['company'] === false) {
    sanitized.companyInfo = undefined;
    sanitized.teamMembers = [];
  }

  if (settings.nfcCard === false || visibility['virtual-card'] === false) {
    sanitized.nfcCard = undefined;
  }

  // Handle custom fields visibility
  if (visibility['custom-fields'] === false) {
    sanitized.customFields = [];
  } else if (Array.isArray(sanitized.customFields)) {
    sanitized.customFields = sanitized.customFields.filter(f => f && f.visible !== false);
  }

  sanitized.username = profile.username || profile.slug;
  sanitized.sectionOrder = profile.sectionOrder || DEFAULT_SECTION_ORDER;
  sanitized.sectionVisibility = visibility;
  sanitized.dynamicSections = (profile.dynamicSections || []).filter(ds => ds && ds.visible !== false);

  return sanitized;
}


export async function createConnection(data: {
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toProfileId: string;
  note?: string;
}): Promise<{ success: boolean; connection?: UserConnection; error?: string; status: number }> {
  const db = loadDb();
  if (!db.connections) {
    db.connections = [];
  }

  const targetProfile = await getProfileByIdOrSlug(data.toProfileId);
  if (!targetProfile) {
    return { success: false, error: 'Target profile not found.', status: 404 };
  }

  // Prevent user from connecting to their own profile
  if (targetProfile.userId && targetProfile.userId === data.fromUserId) {
    return { success: false, error: 'You cannot connect with your own profile.', status: 400 };
  }

  // Check if connection already exists
  const existing = db.connections.find(
    (c) =>
      c.fromUserId === data.fromUserId &&
      (c.toProfileId === targetProfile.id || c.toProfileId === targetProfile.slug)
  );

  if (existing) {
    return { success: true, connection: existing, status: 200 };
  }

  const newConn: UserConnection = {
    id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    fromUserId: data.fromUserId,
    fromUserName: data.fromUserName,
    fromUserEmail: data.fromUserEmail,
    toProfileId: targetProfile.id,
    toUserId: targetProfile.userId,
    createdAt: new Date().toISOString(),
    note: data.note?.trim()
  };

  db.connections.push(newConn);
  saveDb(db);

  return { success: true, connection: newConn, status: 201 };
}

export async function checkIsConnected(fromUserId: string, toProfileId: string): Promise<boolean> {
  const db = loadDb();
  if (!db.connections) return false;

  const target = await getProfileByIdOrSlug(toProfileId);
  const targetId = target ? target.id : toProfileId;
  const targetSlug = target ? target.slug : toProfileId;

  return db.connections.some(
    (c) =>
      c.fromUserId === fromUserId &&
      (c.toProfileId === targetId || c.toProfileId === targetSlug)
  );
}

export async function getUserConnections(userId: string): Promise<UserConnection[]> {
  const db = loadDb();
  if (!db.connections) return [];

  return db.connections.filter(
    (c) => c.fromUserId === userId || c.toUserId === userId
  );
}

// ============================================================================
// COMPANY & TEAM MEMBER DATA LAYER
// ============================================================================

export function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Synchronize a CompanyRecord with its ProfileData counterpart
 * to preserve full compatibility with DualScreenWorkspace, AvtiveDigitalCard,
 * and the existing profile routing system.
 */
export async function syncCompanyToProfile(companyId: string): Promise<ProfileData | null> {
  const db = loadDb();
  const company = db.companies?.find((c) => c.id === companyId);
  if (!company) return null;

  const activeMembers = (db.companyMembers || [])
    .filter((m) => m.companyId === companyId && m.status !== 'REMOVED')
    .map((m): TeamMemberItem => ({
      id: m.id,
      name: m.name,
      role: m.title || m.role,
      department: m.department || '',
      avatar: m.avatarUrl || SUPABASE_DEFAULT_AVATAR,
      bio: m.bio || '',
      email: m.email,
      profileId: m.profileUrl || m.userId || undefined,
      status: m.status
    }));

  const existingProfile = db.profiles[company.id] || db.profiles[company.slug];
  const now = new Date().toISOString();

  const companyProfileData: ProfileData = {
    ...(existingProfile || {}),
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
    avatar: company.logoUrl || SUPABASE_DEFAULT_AVATAR,
    companyLogo: company.logoUrl || SUPABASE_DEFAULT_AVATAR,
    coverImage: company.coverUrl || SUPABASE_DEFAULT_COVER,
    theme: company.theme || 'editorial',
    teamMembers: activeMembers,
    companyInfo: {
      id: company.id,
      name: company.name,
      tagline: company.tagline,
      logo: company.logoUrl || SUPABASE_DEFAULT_AVATAR,
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

  db.profiles[company.id] = companyProfileData;
  db.profiles[company.slug] = companyProfileData;
  saveDb(db);

  try {
    asyncSyncSupabase(
      supabaseAdmin.from('profiles').upsert({
        id: companyProfileData.id,
        user_id: companyProfileData.userId,
        slug: companyProfileData.slug,
        name: companyProfileData.name,
        email: companyProfileData.email,
        type: 'team',
        theme: companyProfileData.theme,
        data: companyProfileData,
        updated_at: companyProfileData.updatedAt
      })
    );
  } catch {}

  return companyProfileData;
}

export async function createCompany(
  ownerUserId: string,
  data: CreateCompanyInput
): Promise<{ company: CompanyRecord; member: CompanyMemberRecord; profile: ProfileData }> {
  const db = loadDb();
  if (!db.companies) db.companies = [];
  if (!db.companyMembers) db.companyMembers = [];

  let ownerUser = await getUserById(ownerUserId);
  if (!ownerUser) {
    ownerUser = {
      id: ownerUserId,
      name: (data.name || 'Company Owner').trim(),
      email: (data as any).email || `${ownerUserId}@company.local`,
      passwordHash: '',
      role: 'team',
      onboardingCompleted: true,
      createdAt: new Date().toISOString()
    };
    db.users.push(ownerUser);
  } else {
    ownerUser.role = 'team';
    ownerUser.onboardingCompleted = true;
  }

  // Generate unique URL-safe slug with collision avoidance
  const rawBase = slugify(data.slug || data.name || 'company');
  let finalSlug = rawBase || `company-${Date.now().toString(36)}`;
  
  if (data.slug) {
    const existingComp = db.companies.find((c) => c.slug.toLowerCase() === data.slug!.toLowerCase());
    if (!existingComp || existingComp.ownerUserId === ownerUserId) {
      finalSlug = data.slug;
    }
  } else {
    let collisionCount = 0;
    while (
      db.companies.some((c) => c.slug.toLowerCase() === finalSlug.toLowerCase())
    ) {
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

  const newCompany: CompanyRecord = {
    id: companyId,
    ownerUserId: ownerUserId,
    name: (data.name || 'My Company').trim(),
    slug: finalSlug,
    tagline: (data.tagline || '').trim(),
    description: (data.description || '').trim(),
    industry: (data.industry || 'Technology').trim(),
    size: (data.size || '1-10').trim(),
    website: (data.website || '').trim(),
    location: (data.location || '').trim(),
    logoUrl: data.logoUrl || SUPABASE_DEFAULT_AVATAR,
    coverUrl: data.coverUrl || SUPABASE_DEFAULT_COVER,
    theme: (data.theme && data.theme !== 'default' ? data.theme : 'editorial') as ProfileTheme,
    visibility: data.visibility || { ...DEFAULT_SECTION_VISIBILITY },
    createdAt: now,
    updatedAt: now
  };

  db.companies.push(newCompany);

  // Automatically create the initial OWNER member
  const memberId = `cmem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const ownerMember: CompanyMemberRecord = {
    id: memberId,
    companyId: companyId,
    userId: ownerUserId,
    email: (ownerUser.email || (data as any).email || '').toLowerCase().trim(),
    name: ownerUser.name || data.name || 'Company Owner',
    title: 'Founder & Owner',
    department: 'Leadership',
    bio: '',
    avatarUrl: ownerUser.avatar || data.logoUrl || SUPABASE_DEFAULT_AVATAR,
    role: 'OWNER',
    status: 'ACTIVE',
    inviteToken: null,
    inviteExpiresAt: null,
    invitedByUserId: null,
    createdAt: now,
    updatedAt: now
  };

  db.companyMembers.push(ownerMember);

  saveDb(db);

  // Sync to Supabase
  try {
    asyncSyncSupabase(
      supabaseAdmin.from('companies').upsert({
        id: newCompany.id,
        owner_user_id: newCompany.ownerUserId,
        name: newCompany.name,
        slug: newCompany.slug,
        tagline: newCompany.tagline,
        description: newCompany.description,
        industry: newCompany.industry,
        size: newCompany.size,
        website: newCompany.website,
        location: newCompany.location,
        logo_url: newCompany.logoUrl,
        cover_url: newCompany.coverUrl,
        theme: newCompany.theme,
        visibility: newCompany.visibility,
        created_at: newCompany.createdAt,
        updated_at: newCompany.updatedAt
      })
    );
    asyncSyncSupabase(
      supabaseAdmin.from('company_members').upsert({
        id: ownerMember.id,
        company_id: ownerMember.companyId,
        user_id: ownerMember.userId,
        email: ownerMember.email,
        name: ownerMember.name,
        title: ownerMember.title,
        department: ownerMember.department,
        bio: ownerMember.bio,
        avatar_url: ownerMember.avatarUrl,
        role: ownerMember.role,
        status: ownerMember.status,
        created_at: ownerMember.createdAt,
        updated_at: ownerMember.updatedAt
      })
    );
  } catch {}

  // Synchronize company profile data
  const profile = (await syncCompanyToProfile(companyId)) || db.profiles[companyId];

  return { company: newCompany, member: ownerMember, profile };
}

export async function getCompanyById(id: string): Promise<CompanyRecord | null> {
  const db = loadDb();
  if (db.companies) {
    const found = db.companies.find((c) => c.id === id);
    if (found) return found;
  }

  // Supabase fallback
  try {
    const { data, error } = await withTimeout(
      supabaseAdmin.from('companies').select('*').eq('id', id).maybeSingle()
    );
    if (data && !error) {
      const rec: CompanyRecord = {
        id: data.id,
        ownerUserId: data.owner_user_id || data.ownerUserId,
        name: data.name,
        slug: data.slug,
        tagline: data.tagline || '',
        description: data.description || '',
        industry: data.industry || '',
        size: data.size || '',
        website: data.website || '',
        location: data.location || '',
        logoUrl: data.logo_url || data.logoUrl || '',
        coverUrl: data.cover_url || data.coverUrl || '',
        theme: data.theme || 'editorial',
        visibility: data.visibility || { ...DEFAULT_SECTION_VISIBILITY },
        createdAt: data.created_at || data.createdAt || new Date().toISOString(),
        updatedAt: data.updated_at || data.updatedAt || new Date().toISOString()
      };
      if (!db.companies) db.companies = [];
      db.companies.push(rec);
      return rec;
    }
  } catch {}

  // Profile entity fallback: check if id matches a team profile
  const matchedProfile = db.profiles[id] || Object.values(db.profiles).find((p) => p.id === id);
  if (matchedProfile && normalizeProfileType(matchedProfile.type) === 'team' && matchedProfile.userId) {
    const owned = db.companies?.find((c) => c.ownerUserId === matchedProfile.userId || c.slug === matchedProfile.slug || c.id === matchedProfile.id);
    if (owned) return owned;
  }

  return null;
}

export async function getCompanyBySlug(slug: string): Promise<CompanyRecord | null> {
  const db = loadDb();
  const clean = slug.toLowerCase().trim();
  if (db.companies) {
    const found = db.companies.find((c) => c.slug.toLowerCase().trim() === clean || c.id === slug);
    if (found) return found;
  }

  // Supabase fallback
  try {
    const { data, error } = await withTimeout(
      supabaseAdmin.from('companies').select('*').or(`slug.eq.${clean},id.eq.${slug}`).maybeSingle()
    );
    if (data && !error) {
      const rec: CompanyRecord = {
        id: data.id,
        ownerUserId: data.owner_user_id || data.ownerUserId,
        name: data.name,
        slug: data.slug,
        tagline: data.tagline || '',
        description: data.description || '',
        industry: data.industry || '',
        size: data.size || '',
        website: data.website || '',
        location: data.location || '',
        logoUrl: data.logo_url || data.logoUrl || '',
        coverUrl: data.cover_url || data.coverUrl || '',
        theme: data.theme || 'editorial',
        visibility: data.visibility || { ...DEFAULT_SECTION_VISIBILITY },
        createdAt: data.created_at || data.createdAt || new Date().toISOString(),
        updatedAt: data.updated_at || data.updatedAt || new Date().toISOString()
      };
      if (!db.companies) db.companies = [];
      db.companies.push(rec);
      return rec;
    }
  } catch {}

  // Profile entity fallback: check if slug matches a team profile
  const matchedProfBySlug = db.profiles[clean] || Object.values(db.profiles).find((p) => (p.slug && p.slug.toLowerCase().trim() === clean) || p.id === slug);
  if (matchedProfBySlug && normalizeProfileType(matchedProfBySlug.type) === 'team' && matchedProfBySlug.userId) {
    const owned = db.companies?.find((c) => c.ownerUserId === matchedProfBySlug.userId || c.slug === matchedProfBySlug.slug || c.id === matchedProfBySlug.id);
    if (owned) return owned;
  }

  return null;
}

export async function getCompanyByOwnerUserId(userId: string): Promise<CompanyRecord | null> {
  const db = loadDb();
  if (db.companies) {
    const owned = db.companies.find((c) => c.ownerUserId === userId);
    if (owned) return owned;
  }

  // Also check if user is OWNER in companyMembers
  if (db.companyMembers) {
    const ownerMember = db.companyMembers.find(
      (m) => m.userId === userId && m.role === 'OWNER' && m.status === 'ACTIVE'
    );
    if (ownerMember) {
      const c = await getCompanyById(ownerMember.companyId);
      if (c) return c;
    }
  }

  // Supabase fallback
  try {
    const { data } = await withTimeout(
      supabaseAdmin
        .from('companies')
        .select('*')
        .eq('owner_user_id', userId)
        .maybeSingle()
    );
    if (data) {
      const rec: CompanyRecord = {
        id: data.id,
        ownerUserId: data.owner_user_id || data.ownerUserId,
        name: data.name,
        slug: data.slug,
        tagline: data.tagline || '',
        description: data.description || '',
        industry: data.industry || 'Technology',
        size: data.size || '1-10',
        website: data.website || '',
        location: data.location || '',
        logoUrl: data.logo_url || data.logoUrl || SUPABASE_DEFAULT_AVATAR,
        coverUrl: data.cover_url || data.coverUrl || SUPABASE_DEFAULT_COVER,
        theme: data.theme || 'editorial',
        visibility: data.visibility || { ...DEFAULT_SECTION_VISIBILITY },
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString()
      };
      if (!db.companies) db.companies = [];
      db.companies.push(rec);
      return rec;
    }
  } catch {}

  return null;
}

export async function getUserCompanyMemberships(
  userId: string
): Promise<Array<{ company: CompanyRecord; member: CompanyMemberRecord }>> {
  const db = loadDb();
  if (!db.companyMembers || !db.companies) return [];

  const activeMembers = db.companyMembers.filter(
    (m) => m.userId === userId && m.status === 'ACTIVE'
  );

  const results: Array<{ company: CompanyRecord; member: CompanyMemberRecord }> = [];
  for (const m of activeMembers) {
    const comp = db.companies.find((c) => c.id === m.companyId);
    if (comp) {
      results.push({ company: comp, member: m });
    }
  }
  return results;
}

export async function updateCompany(
  id: string,
  data: UpdateCompanyInput,
  operatorUserId: string
): Promise<{ success: boolean; company?: CompanyRecord; error?: string; status?: number }> {
  const db = loadDb();
  const company = db.companies?.find((c) => c.id === id);
  if (!company) {
    return { success: false, error: 'Company not found.', status: 404 };
  }

  // Authorization check: operator must be active OWNER or ADMIN
  const member = db.companyMembers?.find(
    (m) => m.companyId === id && m.userId === operatorUserId && m.status === 'ACTIVE'
  );
  if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
    return { success: false, error: 'Forbidden: Only an OWNER or ADMIN may update company details.', status: 403 };
  }

  // If slug is changing, verify uniqueness
  if (data.slug && data.slug.toLowerCase().trim() !== company.slug.toLowerCase().trim()) {
    const cleanNewSlug = slugify(data.slug);
    const conflict = db.companies?.some(
      (c) => c.id !== id && c.slug.toLowerCase().trim() === cleanNewSlug
    );
    if (conflict) {
      return { success: false, error: 'A company with this slug already exists. Please choose another.', status: 409 };
    }
    company.slug = cleanNewSlug;
  }

  if (data.name !== undefined) company.name = data.name.trim();
  if (data.tagline !== undefined) company.tagline = data.tagline.trim();
  if (data.description !== undefined) company.description = data.description.trim();
  if (data.industry !== undefined) company.industry = data.industry.trim();
  if (data.size !== undefined) company.size = data.size.trim();
  if (data.website !== undefined) company.website = data.website.trim();
  if (data.location !== undefined) company.location = data.location.trim();
  if (data.logoUrl !== undefined) company.logoUrl = data.logoUrl;
  if (data.coverUrl !== undefined) company.coverUrl = data.coverUrl;
  if (data.theme !== undefined) company.theme = data.theme;
  if (data.visibility !== undefined) company.visibility = { ...company.visibility, ...data.visibility };
  company.updatedAt = new Date().toISOString();

  saveDb(db);
  await syncCompanyToProfile(company.id);

  try {
    asyncSyncSupabase(
      supabaseAdmin.from('companies').update({
        name: company.name,
        slug: company.slug,
        tagline: company.tagline,
        description: company.description,
        industry: company.industry,
        size: company.size,
        website: company.website,
        location: company.location,
        logo_url: company.logoUrl,
        cover_url: company.coverUrl,
        theme: company.theme,
        visibility: company.visibility,
        updated_at: company.updatedAt
      }).eq('id', company.id)
    );
  } catch {}

  return { success: true, company, status: 200 };
}

export async function deleteCompany(
  id: string,
  operatorUserId: string
): Promise<{ success: boolean; error?: string; status?: number }> {
  const db = loadDb();
  const companyIndex = db.companies?.findIndex((c) => c.id === id) ?? -1;
  if (companyIndex === -1 || !db.companies) {
    return { success: false, error: 'Company not found.', status: 404 };
  }

  // Authorization: Only OWNER may delete
  const member = db.companyMembers?.find(
    (m) => m.companyId === id && m.userId === operatorUserId && m.status === 'ACTIVE'
  );
  if (!member || member.role !== 'OWNER') {
    return { success: false, error: 'Forbidden: Only an OWNER may delete this company.', status: 403 };
  }

  const [removedCompany] = db.companies.splice(companyIndex, 1);
  if (db.companyMembers) {
    db.companyMembers = db.companyMembers.filter((m) => m.companyId !== id);
  }
  if (db.profiles) {
    delete db.profiles[removedCompany.id];
    delete db.profiles[removedCompany.slug];
  }

  saveDb(db);

  try {
    asyncSyncSupabase(supabaseAdmin.from('companies').delete().eq('id', id));
    asyncSyncSupabase(supabaseAdmin.from('company_members').delete().eq('company_id', id));
    asyncSyncSupabase(supabaseAdmin.from('profiles').delete().eq('id', id));
  } catch {}

  return { success: true, status: 200 };
}

export async function getCompanyMembers(
  companyId: string,
  onlyActive: boolean = false
): Promise<CompanyMemberRecord[]> {
  const db = loadDb();
  if (!db.companyMembers) return [];

  return db.companyMembers.filter((m) => {
    if (m.companyId !== companyId) return false;
    if (onlyActive) return m.status === 'ACTIVE';
    return m.status !== 'REMOVED';
  });
}

export async function getCompanyMemberById(
  companyId: string,
  memberId: string
): Promise<CompanyMemberRecord | null> {
  const db = loadDb();
  if (!db.companyMembers) return null;
  return db.companyMembers.find((m) => m.companyId === companyId && m.id === memberId) || null;
}

export async function getCompanyMemberByUser(
  companyId: string,
  userId: string
): Promise<CompanyMemberRecord | null> {
  const db = loadDb();
  if (!db.companyMembers) return null;
  return (
    db.companyMembers.find(
      (m) => m.companyId === companyId && m.userId === userId && m.status === 'ACTIVE'
    ) || null
  );
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
  const db = loadDb();
  const company = await getCompanyById(companyId);
  if (!company) {
    return { success: false, error: 'Company not found.', status: 404 };
  }

  // Authorization check: Operator must be OWNER or ADMIN or the company owner
  const operatorMember = await getCompanyMemberByUser(companyId, operatorUserId);
  const isCompanyOwner = company.ownerUserId === operatorUserId;
  if (!isCompanyOwner && (!operatorMember || (operatorMember.role !== 'OWNER' && operatorMember.role !== 'ADMIN'))) {
    return {
      success: false,
      error: 'Forbidden: Only an OWNER or ADMIN can invite team members.',
      status: 403
    };
  }

  // Ensure owner record exists in companyMembers if operator is owner
  if (isCompanyOwner && !operatorMember) {
    const ownerRec: CompanyMemberRecord = {
      id: `cmem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      companyId: companyId,
      userId: operatorUserId,
      email: (company as any).email || '',
      name: company.name || 'Company Owner',
      title: 'Founder & Owner',
      department: 'Leadership',
      bio: '',
      avatarUrl: company.logoUrl || SUPABASE_DEFAULT_AVATAR,
      role: 'OWNER',
      status: 'ACTIVE',
      inviteToken: null,
      inviteExpiresAt: null,
      invitedByUserId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!db.companyMembers) db.companyMembers = [];
    db.companyMembers.push(ownerRec);
  }

  // Validate email
  const cleanEmail = (input.email || '').toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return { success: false, error: 'A valid email address is required.', status: 400 };
  }

  const cleanName = (input.name || cleanEmail.split('@')[0]).trim();
  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: 'Member name must be at least 2 characters.', status: 400 };
  }

  // Only OWNER can invite as OWNER or ADMIN
  const targetRole: CompanyRole = input.role || 'MEMBER';
  if ((targetRole === 'OWNER' || targetRole === 'ADMIN') && !isCompanyOwner && operatorMember?.role !== 'OWNER') {
    return {
      success: false,
      error: 'Forbidden: Only an OWNER can assign OWNER or ADMIN roles.',
      status: 403
    };
  }

  // Check unique constraint on (companyId, email)
  const existingMember = db.companyMembers?.find(
    (m) => m.companyId === companyId && m.email.toLowerCase().trim() === cleanEmail && m.status !== 'REMOVED'
  );
  if (existingMember) {
    return {
      success: false,
      error: 'A member or invitation with this email address already exists in this company.',
      status: 409
    };
  }

  // Check if email belongs to an existing user in the platform
  const existingUser = await getUserByEmail(cleanEmail);
  const now = new Date().toISOString();
  const isExisting = Boolean(existingUser);
  const memberStatus: CompanyMemberStatus = isExisting ? 'ACTIVE' : 'PENDING';

  let linkedProfile: ProfileData | null = null;
  if (existingUser) {
    linkedProfile = await getProfileByUserId(existingUser.id);
  }

  // Generate secure invite token (single use, expiring in 7 days, sha256 hashed at rest)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashInviteToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const newMemberId = `cmem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newMember: CompanyMemberRecord = {
    id: newMemberId,
    companyId: companyId,
    userId: existingUser ? existingUser.id : null,
    email: cleanEmail,
    name: cleanName,
    title: (input.title || linkedProfile?.designation || linkedProfile?.professionalTitle || 'Team Member').trim(),
    department: (input.department || 'General').trim(),
    bio: (input.bio || linkedProfile?.bio || '').trim(),
    avatarUrl: input.avatarUrl || linkedProfile?.avatar || existingUser?.avatar || SUPABASE_DEFAULT_AVATAR,
    profileUrl: input.profileUrl || (linkedProfile ? (linkedProfile.slug || linkedProfile.id) : undefined),
    role: targetRole,
    status: memberStatus,
    inviteToken: isExisting ? null : hashedToken,
    inviteExpiresAt: isExisting ? null : expiresAt,
    invitedByUserId: operatorUserId,
    createdAt: now,
    updatedAt: now
  };

  if (!db.companyMembers) db.companyMembers = [];
  db.companyMembers.push(newMember);
  saveDb(db);

  await syncCompanyToProfile(companyId);

  try {
    asyncSyncSupabase(
      supabaseAdmin.from('company_members').upsert({
        id: newMember.id,
        company_id: newMember.companyId,
        user_id: newMember.userId,
        email: newMember.email,
        name: newMember.name,
        title: newMember.title,
        department: newMember.department,
        bio: newMember.bio,
        avatar_url: newMember.avatarUrl,
        role: newMember.role,
        status: newMember.status,
        invite_token: newMember.inviteToken,
        invite_expires_at: newMember.inviteExpiresAt,
        invited_by_user_id: newMember.invitedByUserId,
        created_at: newMember.createdAt,
        updated_at: newMember.updatedAt
      })
    );
  } catch {}

  const inviteLink = `/company/invite?token=${encodeURIComponent(rawToken)}`;

  return {
    success: true,
    member: newMember,
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
  const db = loadDb();
  const member = await getCompanyMemberById(companyId, memberId);
  if (!member || member.status === 'REMOVED') {
    return { success: false, error: 'Team member not found.', status: 404 };
  }

  // Authorization: Operator must be OWNER or ADMIN
  const company = await getCompanyById(companyId);
  const isCompanyOwner = Boolean(company && company.ownerUserId === operatorUserId);
  const operatorMember = await getCompanyMemberByUser(companyId, operatorUserId);
  if (!isCompanyOwner && (!operatorMember || (operatorMember.role !== 'OWNER' && operatorMember.role !== 'ADMIN'))) {
    return {
      success: false,
      error: 'Forbidden: Only an OWNER or ADMIN can modify team members.',
      status: 403
    };
  }

  // Permission: If operator is ADMIN:
  // - cannot modify an OWNER
  // - cannot promote anyone to OWNER or ADMIN
  // - cannot demote an ADMIN or OWNER
  if (!isCompanyOwner && operatorMember?.role === 'ADMIN') {
    if (member.role === 'OWNER') {
      return { success: false, error: 'Forbidden: An ADMIN cannot modify an OWNER.', status: 403 };
    }
    if (input.role && (input.role === 'OWNER' || input.role === 'ADMIN')) {
      return { success: false, error: 'Forbidden: Only an OWNER can grant OWNER or ADMIN roles.', status: 403 };
    }
    if (input.role && member.role === 'ADMIN') {
      return { success: false, error: 'Forbidden: Only an OWNER can change another ADMIN role.', status: 403 };
    }
  }

  // Permission: Cannot demote the last OWNER
  if (member.role === 'OWNER' && input.role && input.role !== 'OWNER') {
    const activeOwners = (db.companyMembers || []).filter(
      (m) => m.companyId === companyId && m.role === 'OWNER' && m.status === 'ACTIVE'
    );
    if (activeOwners.length <= 1) {
      return {
        success: false,
        error: 'Forbidden: A company must have at least one active OWNER.',
        status: 400
      };
    }
  }

  if (input.name !== undefined) member.name = input.name.trim();
  if (input.title !== undefined) member.title = input.title.trim();
  if (input.department !== undefined) member.department = input.department.trim();
  if (input.bio !== undefined) member.bio = input.bio.trim();
  if (input.avatarUrl !== undefined) member.avatarUrl = input.avatarUrl;
  if (input.profileUrl !== undefined) member.profileUrl = input.profileUrl;
  if (input.role !== undefined) member.role = input.role;
  member.updatedAt = new Date().toISOString();

  saveDb(db);
  await syncCompanyToProfile(companyId);

  try {
    asyncSyncSupabase(
      supabaseAdmin.from('company_members').update({
        name: member.name,
        title: member.title,
        department: member.department,
        bio: member.bio,
        avatar_url: member.avatarUrl,
        role: member.role,
        updated_at: member.updatedAt
      }).eq('id', member.id)
    );
  } catch {}

  return { success: true, member, status: 200 };
}

export async function removeCompanyMember(
  companyId: string,
  memberId: string,
  operatorUserId: string
): Promise<{ success: boolean; error?: string; status?: number }> {
  const db = loadDb();
  const member = await getCompanyMemberById(companyId, memberId);
  if (!member || member.status === 'REMOVED') {
    return { success: false, error: 'Team member not found.', status: 404 };
  }

  const isSelf = member.userId && member.userId === operatorUserId;
  const company = await getCompanyById(companyId);
  const isCompanyOwner = Boolean(company && company.ownerUserId === operatorUserId);
  const operatorMember = await getCompanyMemberByUser(companyId, operatorUserId);

  if (!isSelf && !isCompanyOwner) {
    if (!operatorMember || (operatorMember.role !== 'OWNER' && operatorMember.role !== 'ADMIN')) {
      return {
        success: false,
        error: 'Forbidden: You do not have permission to remove this member.',
        status: 403
      };
    }
    if (operatorMember.role === 'ADMIN' && member.role === 'OWNER') {
      return {
        success: false,
        error: 'Forbidden: An ADMIN cannot remove an OWNER.',
        status: 403
      };
    }
  }

  // Safety rule: Cannot remove the last OWNER
  if (member.role === 'OWNER') {
    const activeOwners = (db.companyMembers || []).filter(
      (m) => m.companyId === companyId && m.role === 'OWNER' && m.status === 'ACTIVE'
    );
    if (activeOwners.length <= 1) {
      return {
        success: false,
        error: 'Forbidden: Cannot remove the last remaining OWNER of the company.',
        status: 400
      };
    }
  }

  // Mark as REMOVED (or remove record)
  member.status = 'REMOVED';
  member.updatedAt = new Date().toISOString();
  saveDb(db);

  await syncCompanyToProfile(companyId);

  try {
    asyncSyncSupabase(
      supabaseAdmin.from('company_members').update({
        status: 'REMOVED',
        updated_at: member.updatedAt
      }).eq('id', member.id)
    );
  } catch {}

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
  const db = loadDb();
  if (!rawToken || !rawToken.trim()) {
    return { success: false, error: 'Invite token is required.', status: 400 };
  }

  const user = await getUserById(userId);
  if (!user) {
    return { success: false, error: 'Unauthorized: User not found.', status: 401 };
  }

  const hashed = hashInviteToken(rawToken);

  const member = (db.companyMembers || []).find(
    (m) => m.inviteToken === hashed && m.status === 'PENDING'
  );

  if (!member) {
    return {
      success: false,
      error: 'Invalid or already accepted invitation token.',
      status: 404
    };
  }

  // Check token expiration
  if (member.inviteExpiresAt && new Date(member.inviteExpiresAt).getTime() < Date.now()) {
    return {
      success: false,
      error: 'This invitation has expired. Please ask the company owner for a new invitation.',
      status: 410
    };
  }

  // Email verification: Authenticated user's email must match invite email
  if (user.email.toLowerCase().trim() !== member.email.toLowerCase().trim()) {
    return {
      success: false,
      error: `This invitation was issued to ${member.email}. You are currently logged in as ${user.email}. Please sign in with the invited email address.`,
      status: 403
    };
  }

  const company = await getCompanyById(member.companyId);
  if (!company) {
    return { success: false, error: 'Company associated with invite not found.', status: 404 };
  }

  // Activate membership
  member.status = 'ACTIVE';
  member.userId = user.id;
  member.name = user.name || member.name;
  member.avatarUrl = user.avatar || member.avatarUrl;
  member.inviteToken = null;
  member.inviteExpiresAt = null;
  member.updatedAt = new Date().toISOString();

  saveDb(db);
  await syncCompanyToProfile(company.id);

  try {
    asyncSyncSupabase(
      supabaseAdmin.from('company_members').update({
        status: 'ACTIVE',
        user_id: user.id,
        invite_token: null,
        invite_expires_at: null,
        updated_at: member.updatedAt
      }).eq('id', member.id)
    );
  } catch {}

  return { success: true, company, member, status: 200 };
}

