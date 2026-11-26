import assert from 'node:assert';
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';

// 1. Configure test environment BEFORE importing app modules
process.env.NODE_ENV = 'development';
process.env.MONGODB_URI = 'mongodb://localhost:27017/avtive_test';
process.env.SESSION_SECRET = 'avtive-super-secret-key-prod-2026-secure-session-auth';
delete process.env.SMTP_HOST;
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;
delete process.env.RESEND_API_KEY;

// 2. Deterministic In-Memory MongoDB Store with Atomic & Query Semantics
const collections: Record<string, any[]> = {
  users: [],
  profiles: [],
  companies: [],
  company_members: [],
  connections: [],
  sessions: [],
  share_links: [],
  share_templates: [],
  share_events: [],
  contact_tags: [],
  contact_tag_links: []
};

function clone<T>(v: T): T {
  return v === undefined ? (undefined as any) : JSON.parse(JSON.stringify(v));
}

function getNested(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), obj);
}

function setNested(obj: any, path: string, val: any) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = val;
}

function matchesFilter(doc: any, filter: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [k, v] of Object.entries(filter)) {
    if (k === '$or' && Array.isArray(v)) {
      if (!v.some((sub) => matchesFilter(doc, sub))) return false;
      continue;
    }
    if (k === '$and' && Array.isArray(v)) {
      if (!v.every((sub) => matchesFilter(doc, sub))) return false;
      continue;
    }

    const docVal = getNested(doc, k);

    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      const ops = v as Record<string, any>;
      if ('$ne' in ops && (docVal === ops.$ne || String(docVal) === String(ops.$ne))) return false;
      if ('$in' in ops && Array.isArray(ops.$in) && !ops.$in.some((item) => item === docVal || String(item) === String(docVal))) return false;
      if ('$gt' in ops) {
        if (docVal === null || docVal === undefined || !(String(docVal) > String(ops.$gt))) return false;
      }
      if ('$lt' in ops) {
        if (typeof docVal !== 'number' || !(docVal < ops.$lt)) return false;
      }
      if ('$eq' in ops && docVal !== ops.$eq) return false;
      continue;
    }

    if (v === null) {
      if (docVal !== null && docVal !== undefined) return false;
      continue;
    }

    if (docVal !== v && String(docVal) !== String(v)) {
      return false;
    }
  }
  return true;
}

function createFakeCollection(name: string) {
  if (!collections[name]) collections[name] = [];
  return {
    findOne: async (filter: any) => {
      const found = collections[name].find((d) => matchesFilter(d, filter));
      return found ? clone(found) : null;
    },
    find: (filter: any) => {
      const docs = collections[name].filter((d) => matchesFilter(d, filter)).map(clone);
      let sortSpec: Record<string, number> | null = null;
      let limitCount: number | null = null;
      const cursor: any = {
        sort: (spec: Record<string, number>) => {
          sortSpec = spec;
          return cursor;
        },
        limit: (n: number) => {
          limitCount = n;
          return cursor;
        },
        toArray: async () => {
          let result = [...docs];
          if (sortSpec) {
            const [[field, dir]] = Object.entries(sortSpec);
            result.sort((a, b) => {
              const va = String(a[field] || '');
              const vb = String(b[field] || '');
              return dir >= 0 ? va.localeCompare(vb) : vb.localeCompare(va);
            });
          }
          if (limitCount !== null) result = result.slice(0, limitCount);
          return result;
        }
      };
      return cursor;
    },
    insertOne: async (doc: any) => {
      const copy = clone(doc);
      if (!copy._id) copy._id = copy.id || `id-${crypto.randomUUID()}`;
      if (!copy.id) copy.id = String(copy._id);
      collections[name].push(copy);
      return { acknowledged: true, insertedId: copy._id };
    },
    updateOne: async (filter: any, update: any) => {
      const doc = collections[name].find((d) => matchesFilter(d, filter));
      if (!doc) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      if (update.$set) {
        for (const [p, val] of Object.entries(update.$set)) setNested(doc, p, clone(val));
      }
      if (update.$inc) {
        for (const [p, incVal] of Object.entries(update.$inc)) {
          doc[p] = (typeof doc[p] === 'number' ? doc[p] : 0) + Number(incVal);
        }
      }
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    },
    findOneAndUpdate: async (filter: any, update: any) => {
      // Single-threaded atomic compare-and-modify matching MongoDB semantics
      const doc = collections[name].find((d) => matchesFilter(d, filter));
      if (!doc) return null;
      if (update.$inc) {
        for (const [p, incVal] of Object.entries(update.$inc)) {
          doc[p] = (typeof doc[p] === 'number' ? doc[p] : 0) + Number(incVal);
        }
      }
      if (update.$set) {
        for (const [p, val] of Object.entries(update.$set)) setNested(doc, p, clone(val));
      }
      return clone(doc);
    },
    deleteOne: async (filter: any) => {
      const idx = collections[name].findIndex((d) => matchesFilter(d, filter));
      if (idx >= 0) {
        collections[name].splice(idx, 1);
        return { acknowledged: true, deletedCount: 1 };
      }
      return { acknowledged: true, deletedCount: 0 };
    },
    indexes: async () => [],
    createIndex: async () => 'idx',
    dropIndex: async () => true
  };
}

const fakeDb: any = { collection: (name: string) => createFakeCollection(name) };
const fakeClient: any = { db: () => fakeDb, connect: async () => fakeClient };
(global as any)._mongoClientPromise = Promise.resolve(fakeClient);

// 3. Session switching & Next navigation helpers
const nextHeaders = require('next/headers');
const nextNavigation = require('next/navigation');
const { createSessionToken } = require('../src/lib/auth');

nextNavigation.useRouter = () => ({
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {}
});
nextNavigation.usePathname = () => '/';
nextNavigation.useSearchParams = () => new URLSearchParams();

const USER_A = {
  id: 'usr-owner-A',
  name: 'Hamzah Farooq',
  email: 'hamzah@avtive.test',
  role: 'individual' as const,
  onboardingCompleted: true
};
const USER_B = {
  id: 'usr-attacker-B',
  name: 'Other User',
  email: 'other@avtive.test',
  role: 'individual' as const,
  onboardingCompleted: true
};

let activeCookieUser: typeof USER_A | null = USER_A;

nextHeaders.cookies = async () => ({
  get: (name: string) => {
    if (name === 'avtive_session' && activeCookieUser) {
      return { name, value: createSessionToken(activeCookieUser) };
    }
    return undefined;
  },
  set: () => {}
});

// 4. Import server modules & route handlers AFTER DB & headers setup
import { ProfileData } from '../src/types/profile';
import {
  filterAuthorizedSelection,
  getFieldPrivacyTier,
  getPresetFieldsForProfile
} from '../src/lib/sharing/presets';
import { sanitizeProfileForShare } from '../src/lib/sharing/sanitize';
import { hasFieldValue } from '../src/lib/sharing/presets';
import { mapDocToProfileData } from '../src/lib/db/profiles';
import { generateVCardString } from '../src/lib/vcard';
import { resetRateLimitsForTests } from '../src/lib/sharing/rateLimit';
import { consumeAndResolveShareLink } from '../src/lib/db/shareLinks';
import { GET as shareLinksGET, POST as shareLinksPOST } from '../src/app/api/share/links/route';
import { GET as shareLinkDetailGET, PATCH as shareLinkDetailPATCH } from '../src/app/api/share/links/[id]/route';
import { POST as shareLinkRevokePOST } from '../src/app/api/share/links/[id]/revoke/route';
import { GET as templatesGET, POST as templatesPOST } from '../src/app/api/share/templates/route';
import { PATCH as templatePATCH, POST as templateDuplicatePOST, DELETE as templateDELETE } from '../src/app/api/share/templates/[id]/route';
import {
  GET as recipientsGET,
  POST as recipientsPOST,
  PATCH as recipientsPATCH,
  DELETE as recipientsDELETE
} from '../src/app/api/share/recipients/route';
import { POST as sendEmailPOST } from '../src/app/api/share/send-email/route';

// Seed realistic profile for User A including Normal, Private, Owner-Hidden, and Never Share fields
const PROFILE_A: ProfileData = {
  id: 'prof-hamzah-1',
  userId: USER_A.id,
  type: 'individual',
  slug: 'hamzah-farooq',
  name: 'Hamzah Farooq',
  designation: 'Edge AI Engineer',
  avatar: 'https://cdn.example.com/hamzah.jpg',
  avatarPublicId: 'avatars/secret-public-id',
  coverImage: 'https://cdn.example.com/cover.jpg',
  shortBio: 'Building low-latency ML systems.',
  bio: 'Building low-latency ML systems.',
  about: 'Principal AI engineer focused on edge inference.',
  email: 'hamzah@avtive.test',
  phone: '+49 170 5550199',
  website: 'https://hamzah.dev',
  location: 'Munich, Germany',
  pronouns: 'he/him',
  birthday: '1994-08-19',
  resumeUrl: 'https://cdn.example.com/hamzah-cv.pdf',
  resumeFileName: 'Hamzah_CV.pdf',
  skills: [{ name: 'PyTorch' }, { name: 'ONNX' }],
  experiences: [{ id: 'exp-1', role: 'Lead AI', company: 'EdgeLabs', period: '2023-2026' }],
  education: [{ id: 'edu-1', degree: 'MSc CS', institution: 'TUM' }],
  projects: [{ id: 'proj-1', title: 'TinyVLM', description: 'Edge Vision LLM' }],
  certifications: [{ id: 'cert-1', name: 'AWS ML', issuer: 'AWS', issued: '2025' }],
  socials: [{ platform: 'linkedin', url: 'https://linkedin.com/in/hamzah', visible: true }],
  socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com/in/hamzah', visible: true }],
  nfcCard: { cardNumber: 'AVT-1001', chipId: 'INTERNAL-CHIP-SECRET', finish: 'obsidian' },
  interests: [{ id: 'int-1', type: 'topic', name: 'Robotics', visible: true }],
  customFields: [
    { id: 'cf-bank', label: 'Main Bank Account', value: 'DE89370400440532013000', type: 'text', visible: true },
    { id: 'cf-passport', label: 'Passport Number', value: 'P99881122', type: 'text', visible: true },
    { id: 'cf-portfolio', label: 'Research Blog', value: 'https://blog.hamzah.dev', type: 'link', visible: true },
    { id: 'cf-secret-note', label: 'Personal Code', value: '9981', type: 'number', visible: true, privacy: 'never_share' }
  ],
  fieldPrivacy: {
    'custom-field-cf-secret-note': 'never_share'
  },
  sharingSettings: {
    photo: true,
    nameAndTitle: true,
    bio: true,
    contactInfo: true,
    email: true,
    phone: true,
    skills: true,
    experience: true,
    education: true,
    projects: true,
    certifications: true,
    socialLinks: true,
    pronouns: false,
    birthday: false
  },
  sectionVisibility: {
    experience: true,
    education: true,
    interests: false // Independently hidden by owner on profile
  }
};

const PROFILE_A_SECOND: ProfileData = {
  ...PROFILE_A,
  id: 'prof-hamzah-company',
  slug: 'edgelabs-gmbh',
  profileName: 'EdgeLabs Consulting',
  name: 'EdgeLabs Consulting',
  designation: 'AI Advisory Studio',
  type: 'team'
};

async function runSuite() {
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      passed++;
      console.log(`  ✔ ${name}`);
    } catch (err: any) {
      failed++;
      console.error(`  ✖ ${name}\n    Reason: ${err?.stack || err}`);
    }
  }

  console.log('\n===============================================================');
  console.log(' AVTIVE PHASE 1 UNIFIED SHARING SYSTEM — FULL TEST SUITE');
  console.log('===============================================================\n');

  // Seed DB
  collections.users.push(USER_A, USER_B);
  collections.profiles.push({ _id: PROFILE_A.id, ...PROFILE_A }, { _id: PROFILE_A_SECOND.id, ...PROFILE_A_SECOND });

  // ── GROUP 1: Privacy Tiers, Presets & Server Sanitization ─────────────────
  console.log('--- Group 1: Presets, Privacy Tiers & Never Share Engine ---');

  await test('Never Share keywords and explicit flags classify strictly as never_share', () => {
    assert.strictEqual(getFieldPrivacyTier(PROFILE_A, 'custom-field-cf-bank'), 'never_share');
    assert.strictEqual(getFieldPrivacyTier(PROFILE_A, 'custom-field-cf-passport'), 'never_share');
    assert.strictEqual(getFieldPrivacyTier(PROFILE_A, 'custom-field-cf-secret-note'), 'never_share');
    assert.strictEqual(getFieldPrivacyTier(PROFILE_A, 'custom-field-cf-portfolio'), 'normal');
    assert.strictEqual(getFieldPrivacyTier(PROFILE_A, 'birthday'), 'private');
    assert.strictEqual(getFieldPrivacyTier(PROFILE_A, 'pronouns'), 'private');
    assert.strictEqual(getFieldPrivacyTier(PROFILE_A, 'passwordHash'), 'never_share');
  });

  await test('All 4 presets exclude Never Share, Private, and owner-hidden sections', () => {
    for (const preset of ['everything', 'general', 'personal', 'embedded_jobs'] as const) {
      const fields = getPresetFieldsForProfile(PROFILE_A, preset);
      assert.ok(!fields.includes('custom-field-cf-bank'), `${preset} must exclude bank account`);
      assert.ok(!fields.includes('custom-field-cf-passport'), `${preset} must exclude passport`);
      assert.ok(!fields.includes('custom-field-cf-secret-note'), `${preset} must exclude never_share note`);
      assert.ok(!fields.includes('birthday'), `${preset} must exclude private birthday by default`);
      assert.ok(!fields.includes('interests'), `${preset} must exclude owner-hidden interests section`);
    }

    const jobsFields = getPresetFieldsForProfile(PROFILE_A, 'embedded_jobs');
    assert.ok(jobsFields.includes('experience'), 'Embedded Jobs includes experience');
    assert.ok(jobsFields.includes('resume'), 'Embedded Jobs includes CV/resume');
    assert.ok(!jobsFields.includes('phone'), 'Embedded Jobs omits phone by default');
  });

  await test('sanitizeProfileForShare + vCard strictly enforce whitelists & strip secrets', () => {
    const reqFields = ['photo', 'name', 'title', 'email', 'experience', 'custom-field-cf-portfolio', 'custom-field-cf-bank', 'birthday'];
    const sanitized = sanitizeProfileForShare(PROFILE_A, { selectedFields: reqFields });

    assert.strictEqual(sanitized.email, PROFILE_A.email);
    assert.strictEqual(sanitized.phone, '', 'Phone excluded when not in selectedFields');
    assert.strictEqual(sanitized.experiences?.length, 1);
    assert.strictEqual(sanitized.projects?.length, 0);
    assert.strictEqual(sanitized.resumeUrl, undefined, 'Resume excluded when not selected');
    assert.strictEqual(sanitized.avatarPublicId, undefined, 'Internal Cloudinary publicId stripped');
    assert.strictEqual(sanitized.nfcCard?.chipId, undefined, 'nfcCard not selected');
    assert.strictEqual(sanitized.customFields?.length, 1);
    assert.strictEqual(sanitized.customFields?.[0]?.id, 'cf-portfolio', 'Never Share bank account never appears');

    const vcf = generateVCardString(sanitized);
    assert.ok(vcf.includes(PROFILE_A.email!), 'vCard contains allowed email');
    assert.ok(!vcf.includes(PROFILE_A.phone!), 'vCard omits excluded phone');
    assert.ok(!vcf.includes('DE893704'), 'vCard never contains Never Share bank IBAN');

    // Legacy logoUrl & coverUrl fallback with empty string avatar/coverImage
    const legacyDoc = {
      _id: 'prof-legacy-img',
      id: 'prof-legacy-img',
      slug: 'legacy-co',
      name: 'Legacy Co',
      type: 'team',
      avatar: '',
      coverImage: '',
      logoUrl: 'https://cdn.example.com/legacy-logo.png',
      coverUrl: 'https://cdn.example.com/legacy-cover.jpg'
    };
    const mappedLegacy = mapDocToProfileData(legacyDoc);
    assert.strictEqual(mappedLegacy.avatar, 'https://cdn.example.com/legacy-logo.png', 'mapDocToProfileData falls back from empty avatar to logoUrl');
    assert.strictEqual(mappedLegacy.coverImage, 'https://cdn.example.com/legacy-cover.jpg', 'mapDocToProfileData falls back from empty coverImage to coverUrl');
    assert.strictEqual(hasFieldValue(legacyDoc as any, 'photo'), true, 'hasFieldValue detects legacy logoUrl');
    assert.strictEqual(hasFieldValue(legacyDoc as any, 'coverImage'), true, 'hasFieldValue detects legacy coverUrl');

    const sharedLegacyAllowed = sanitizeProfileForShare(legacyDoc as any, {
      selectedFields: ['name', 'photo', 'coverImage']
    });
    assert.strictEqual(sharedLegacyAllowed.avatar, 'https://cdn.example.com/legacy-logo.png', 'Shared profile preserves legacy logoUrl as avatar when permitted');
    assert.strictEqual(sharedLegacyAllowed.coverImage, 'https://cdn.example.com/legacy-cover.jpg', 'Shared profile preserves legacy coverUrl as coverImage when permitted');

    const sharedLegacyDenied = sanitizeProfileForShare(legacyDoc as any, {
      selectedFields: ['name']
    });
    assert.strictEqual(sharedLegacyDenied.avatar, '', 'Avatar cleared when photo unselected');
    assert.strictEqual(sharedLegacyDenied.coverImage, undefined, 'Cover cleared when coverImage unselected');
    assert.strictEqual((sharedLegacyDenied as any).logoUrl, undefined, 'Legacy logoUrl stripped when photo unselected');
    assert.strictEqual((sharedLegacyDenied as any).coverUrl, undefined, 'Legacy coverUrl stripped when coverImage unselected');
  });

  // ── GROUP 2: Share Link API Security & CRUD ───────────────────────────────
  console.log('\n--- Group 2: Secure Share Link Generation & Auth Enforcement ---');

  await test('Unauthenticated POST /api/share/links returns 401', async () => {
    activeCookieUser = null;
    const req = new NextRequest('http://localhost:3000/api/share/links', {
      method: 'POST',
      body: JSON.stringify({ profileId: PROFILE_A.id, selectedFields: ['name', 'email'] })
    });
    const res = await shareLinksPOST(req);
    assert.strictEqual(res.status, 401);
    activeCookieUser = USER_A;
  });

  await test('User B creating a share link for User A profile returns 403 Forbidden', async () => {
    activeCookieUser = USER_B;
    const req = new NextRequest('http://localhost:3000/api/share/links', {
      method: 'POST',
      body: JSON.stringify({ profileId: PROFILE_A.id, selectedFields: ['name', 'email'] })
    });
    const res = await shareLinksPOST(req);
    assert.strictEqual(res.status, 403);
    activeCookieUser = USER_A;
  });

  let createdToken = '';
  let createdLinkId = '';

  await test('Server strips unconfirmed Private & Never Share fields even on crafted API POST', async () => {
    resetRateLimitsForTests();
    const req = new NextRequest('http://localhost:3000/api/share/links', {
      method: 'POST',
      body: JSON.stringify({
        profileId: PROFILE_A.id,
        title: 'Recruiter Screening',
        selectedFields: ['name', 'title', 'email', 'birthday', 'custom-field-cf-bank', 'custom-field-cf-portfolio', 'interests'],
        templateName: 'Embedded Jobs',
        eventLabel: 'Expo 2027',
        expiryOption: 'never'
      })
    });

    const res = await shareLinksPOST(req);
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.ok(body.link);
    createdLinkId = body.link.id;
    createdToken = body.link.sharePath.replace('/s/', '');

    assert.ok(createdToken.length >= 24, 'Cryptographic token generated');
    assert.ok(!body.link.tokenHash, 'Response never leaks tokenHash');
    assert.ok(!body.link.encryptedToken, 'Response never leaks encryptedToken');
    assert.ok(!body.link.selectedFields.includes('custom-field-cf-bank'), 'Never Share stripped server-side');
    assert.ok(!body.link.selectedFields.includes('birthday'), 'Unconfirmed Private birthday stripped server-side');
    assert.ok(!body.link.selectedFields.includes('interests'), 'Owner-hidden interests stripped server-side');
    assert.ok(body.link.selectedFields.includes('custom-field-cf-portfolio'));
  });

  await test('Confirmed Private field CAN be shared explicitly via Share Link', async () => {
    const req = new NextRequest('http://localhost:3000/api/share/links', {
      method: 'POST',
      body: JSON.stringify({
        profileId: PROFILE_A.id,
        title: 'Family Contact',
        selectedFields: ['name', 'birthday', 'custom-field-cf-bank'],
        confirmedPrivateFields: ['birthday']
      })
    });
    const res = await shareLinksPOST(req);
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.ok(body.link.selectedFields.includes('birthday'), 'Confirmed private field included');
    assert.ok(!body.link.selectedFields.includes('custom-field-cf-bank'), 'Never Share STILL blocked even if requested');

    const token = body.link.sharePath.replace('/s/', '');
    const resolved = await consumeAndResolveShareLink(token, { channel: 'link', clientSignature: 'v1' });
    assert.strictEqual(resolved.outcome, 'valid');
    if (resolved.outcome === 'valid') {
      assert.strictEqual(resolved.profile.birthday, PROFILE_A.birthday);
      assert.strictEqual(resolved.profile.customFields?.length, 0);
    }
  });

  // ── GROUP 3: Visitor Token Resolution, Deduplication, Expiry & 1-View Concurrency ──
  console.log('\n--- Group 3: Visitor Token Resolution, Atomic 1-View & Revocation ---');

  await test('Tampered / unknown token returns not_found with zero data', async () => {
    const res = await consumeAndResolveShareLink(`${createdToken}tampered`, { channel: 'link' });
    assert.strictEqual(res.outcome, 'not_found');
  });

  await test('Multi-view link records access once per 15s dedup window & distinguishes QR channel', async () => {
    const first = await consumeAndResolveShareLink(createdToken, { channel: 'link', clientSignature: 'browser-1' });
    assert.strictEqual(first.outcome, 'valid');
    // Immediate repeat hit with same signature + channel should NOT inflate accessCount
    const repeat = await consumeAndResolveShareLink(createdToken, { channel: 'link', clientSignature: 'browser-1' });
    assert.strictEqual(repeat.outcome, 'valid');

    // QR scan channel IS tracked cleanly
    const qrHit = await consumeAndResolveShareLink(createdToken, { channel: 'qr', clientSignature: 'browser-1' });
    assert.strictEqual(qrHit.outcome, 'valid');

    const detailsRes = await shareLinkDetailGET(
      new NextRequest(`http://localhost:3000/api/share/links/${createdLinkId}`),
      { params: Promise.resolve({ id: createdLinkId }) }
    );
    const details = await detailsRes.json();
    assert.strictEqual(details.link.accessCount, 2, 'Dedup prevented refresh inflation while preserving distinct QR event');
    const eventTypes = details.events.map((e: any) => e.eventType);
    assert.ok(eventTypes.includes('share_created'));
    assert.ok(eventTypes.includes('link_opened'));
    assert.ok(eventTypes.includes('qr_opened'));
  });

  await test('Atomic 1-view lock permits EXACTLY 1 winner across 5 concurrent requests', async () => {
    const createRes = await shareLinksPOST(
      new NextRequest('http://localhost:3000/api/share/links', {
        method: 'POST',
        body: JSON.stringify({
          profileId: PROFILE_A.id,
          title: 'Secret Single View',
          selectedFields: ['name', 'email'],
          expiryOption: '1_view'
        })
      })
    );
    const { link } = await createRes.json();
    const oneViewToken = link.sharePath.replace('/s/', '');

    // Bot/Prefetch must NOT consume the 1-view lock
    const prefetchRes = await consumeAndResolveShareLink(oneViewToken, { isPrefetch: true });
    assert.strictEqual(prefetchRes.outcome, 'valid');

    // Concurrent race of 5 real opens
    const results = await Promise.all(
      [1, 2, 3, 4, 5].map((i) =>
        consumeAndResolveShareLink(oneViewToken, { channel: 'link', clientSignature: `concurrent-${i}` })
      )
    );
    const wins = results.filter((r) => r.outcome === 'valid');
    const expired = results.filter((r) => r.outcome === 'expired');

    assert.strictEqual(wins.length, 1, 'Exactly one concurrent caller wins 1-view lock');
    assert.strictEqual(expired.length, 4, 'All other 4 concurrent callers get expired');

    const stored = collections.share_links.find((l) => l.id === link.id);
    assert.strictEqual(stored.accessCount, 1);
    assert.strictEqual(stored.status, 'expired');
  });

  await test('7-day expiry rejects expired links on server and updates status', async () => {
    const createRes = await shareLinksPOST(
      new NextRequest('http://localhost:3000/api/share/links', {
        method: 'POST',
        body: JSON.stringify({
          profileId: PROFILE_A.id,
          title: '7 Day Link',
          selectedFields: ['name', 'email'],
          expiryOption: '7d'
        })
      })
    );
    const { link } = await createRes.json();
    const token = link.sharePath.replace('/s/', '');

    // Fast-forward expiresAt into the past in DB
    const dbRecord = collections.share_links.find((l) => l.id === link.id);
    dbRecord.expiresAt = new Date(Date.now() - 60_000).toISOString();

    const expiredRes = await consumeAndResolveShareLink(token, { channel: 'link' });
    assert.strictEqual(expiredRes.outcome, 'expired');
  });

  await test('Immediate revocation blocks subsequent visitor access and blocks further edits', async () => {
    activeCookieUser = USER_B;
    const unauthRevoke = await shareLinkRevokePOST(
      new NextRequest(`http://localhost:3000/api/share/links/${createdLinkId}/revoke`, { method: 'POST' }),
      { params: Promise.resolve({ id: createdLinkId }) }
    );
    assert.strictEqual(unauthRevoke.status, 403, 'Non-owner cannot revoke another user link');

    activeCookieUser = USER_A;
    const revokeRes = await shareLinkRevokePOST(
      new NextRequest(`http://localhost:3000/api/share/links/${createdLinkId}/revoke`, { method: 'POST' }),
      { params: Promise.resolve({ id: createdLinkId }) }
    );
    assert.strictEqual(revokeRes.status, 200);
    const revokeBody = await revokeRes.json();
    assert.strictEqual(revokeBody.link.status, 'revoked');

    const visitAfterRevoke = await consumeAndResolveShareLink(createdToken, { channel: 'link', clientSignature: 'new-visitor' });
    assert.strictEqual(visitAfterRevoke.outcome, 'revoked', 'Revoked URL immediately blocked on server');

    const patchRevoked = await shareLinkDetailPATCH(
      new NextRequest(`http://localhost:3000/api/share/links/${createdLinkId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Should Fail' })
      }),
      { params: Promise.resolve({ id: createdLinkId }) }
    );
    assert.strictEqual(patchRevoked.status, 400);
  });

  await test('Owner links search, filter & dynamic post-creation Never Share enforcement', async () => {
    const createRes = await shareLinksPOST(
      new NextRequest('http://localhost:3000/api/share/links', {
        method: 'POST',
        body: JSON.stringify({
          profileId: PROFILE_A.id,
          title: 'Dynamic Check Link',
          selectedFields: ['name', 'phone', 'email'],
          expiryOption: 'never'
        })
      })
    );
    const { link } = await createRes.json();
    const dynToken = link.sharePath.replace('/s/', '');

    // Filter active links
    const activeRes = await shareLinksGET(new NextRequest('http://localhost:3000/api/share/links?status=active'));
    const activeList = (await activeRes.json()).links;
    assert.ok(activeList.some((l: any) => l.id === link.id));
    assert.ok(!activeList.some((l: any) => l.id === createdLinkId), 'Revoked link excluded from active filter');

    // Now owner retrospectively marks `phone` as never_share on their profile!
    collections.profiles[0].fieldPrivacy = { ...collections.profiles[0].fieldPrivacy, phone: 'never_share' };

    const visitorCheck = await consumeAndResolveShareLink(dynToken, { channel: 'link', clientSignature: 'v-retro' });
    assert.strictEqual(visitorCheck.outcome, 'valid');
    if (visitorCheck.outcome === 'valid') {
      assert.strictEqual(visitorCheck.profile.phone, '', 'Retrospective Never Share immediately strips phone from existing link');
      assert.strictEqual(visitorCheck.profile.email, PROFILE_A.email);
    }
    // Restore
    delete collections.profiles[0].fieldPrivacy.phone;
  });

  // ── GROUP 4: Templates CRUD, Recipients & Rate Limiting ───────────────────
  console.log('\n--- Group 4: Templates CRUD, Recipients & Security Guardrails ---');

  await test('Templates API CRUD: list built-ins, create custom (Never Share stripped), duplicate, rename, delete', async () => {
    const listRes = await templatesGET();
    const listBody = await listRes.json();
    assert.ok(listBody.templates.some((t: any) => t.id === 'tpl-builtin-general'));
    assert.ok(listBody.templates.some((t: any) => t.id === 'tpl-builtin-embedded-jobs'));

    // Create custom template
    const createTplRes = await templatesPOST(
      new NextRequest('http://localhost:3000/api/share/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Investor Deck',
          description: 'Clean executive brief',
          profileId: PROFILE_A.id,
          selectedFields: ['name', 'title', 'email', 'projects', 'custom-field-cf-bank']
        })
      })
    );
    assert.strictEqual(createTplRes.status, 201);
    const { template } = await createTplRes.json();
    assert.ok(!template.selectedFields.includes('custom-field-cf-bank'), 'Never Share stripped from saved template');

    // Rename & edit
    const patchRes = await templatePATCH(
      new NextRequest(`http://localhost:3000/api/share/templates/${template.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Seed Investor Brief' })
      }),
      { params: Promise.resolve({ id: template.id }) }
    );
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual((await patchRes.json()).template.name, 'Seed Investor Brief');

    // Duplicate built-in
    const dupRes = await templateDuplicatePOST(
      new NextRequest('http://localhost:3000/api/share/templates/tpl-builtin-general', { method: 'POST' }),
      { params: Promise.resolve({ id: 'tpl-builtin-general' }) }
    );
    assert.strictEqual(dupRes.status, 201);
    const dupTpl = (await dupRes.json()).template;
    assert.strictEqual(dupTpl.isBuiltIn, false);

    // User B cannot delete User A's custom template
    activeCookieUser = USER_B;
    const forbiddenDel = await templateDELETE(
      new NextRequest(`http://localhost:3000/api/share/templates/${template.id}`, { method: 'DELETE' }),
      { params: Promise.resolve({ id: template.id }) }
    );
    assert.strictEqual(forbiddenDel.status, 403);
    activeCookieUser = USER_A;

    // Cannot delete built-in template
    const badDel = await templateDELETE(
      new NextRequest('http://localhost:3000/api/share/templates/tpl-builtin-general', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'tpl-builtin-general' }) }
    );
    assert.strictEqual(badDel.status, 400);

    // Delete custom template cleanly
    const delRes = await templateDELETE(
      new NextRequest(`http://localhost:3000/api/share/templates/${template.id}`, { method: 'DELETE' }),
      { params: Promise.resolve({ id: template.id }) }
    );
    assert.strictEqual(delRes.status, 200);
  });

  await test('Recipients API returns zero fake contacts on empty DB and real enriched connections when seeded', async () => {
    const emptyRes = await recipientsGET(new NextRequest('http://localhost:3000/api/share/recipients'));
    const emptyData = await emptyRes.json();
    assert.strictEqual(emptyData.recipients.length, 0, 'Must never fabricate contacts');
    assert.strictEqual(emptyData.emailConfigured, false);

    // Seed real connection + target profile
    collections.profiles.push({
      _id: 'prof-recruiter-1',
      id: 'prof-recruiter-1',
      userId: USER_B.id,
      name: 'Elena Rostova',
      email: 'elena@nordic.ai',
      company: 'Nordic Robotics',
      designation: 'Head of Talent',
      type: 'individual'
    });
    collections.connections.push({
      _id: 'conn-1',
      id: 'conn-1',
      fromUserId: USER_A.id,
      toProfileId: 'prof-recruiter-1',
      toUserId: USER_B.id,
      createdAt: new Date().toISOString()
    });

    const realRes = await recipientsGET(new NextRequest('http://localhost:3000/api/share/recipients?q=Nordic'));
    const realData = await realRes.json();
    assert.strictEqual(realData.recipients.length, 1);
    assert.strictEqual(realData.recipients[0].name, 'Elena Rostova');
    assert.strictEqual(realData.recipients[0].company, 'Nordic Robotics');
    assert.deepStrictEqual(
      realData.activeContactTags,
      [],
      'Must not expose unused default labels as active contact filters'
    );
    assert.deepStrictEqual(realData.availableLabels, [], 'availableLabels stays empty until real tags are assigned');

    // Share event label on a created share link must stay separate from contact tags
    assert.ok(
      !(realData.contactTags || []).some((t: any) => t.name === 'Expo 2027'),
      'Share event labels from past links must not become contact tags'
    );
    assert.ok(
      (realData.eventLabels || []).includes('Expo 2027'),
      'Past share event labels appear strictly under eventLabels'
    );

    // Seed second contact for multi-contact batch tagging test
    collections.profiles.push({
      _id: 'prof-client-2',
      id: 'prof-client-2',
      userId: 'usr-client-2',
      name: 'Marcus Lind',
      email: 'marcus@studio.io',
      company: 'Nordic Studio',
      designation: 'Design Lead',
      type: 'individual'
    });
    collections.connections.push({
      _id: 'conn-2',
      id: 'conn-2',
      fromUserId: USER_A.id,
      toProfileId: 'prof-client-2',
      toUserId: 'usr-client-2',
      createdAt: new Date().toISOString()
    });
    const elenaBeforeSnapshot = JSON.stringify(collections.profiles.find((p) => p.id === 'prof-recruiter-1'));

    // Create contact tag (unused at creation -> not in activeContactTags yet)
    const createTagRes = await recipientsPOST(
      new NextRequest('http://localhost:3000/api/share/recipients', {
        method: 'POST',
        body: JSON.stringify({ name: 'Recruiters' })
      })
    );
    assert.strictEqual(createTagRes.status, 201);
    const createdTagData = await createTagRes.json();
    assert.ok(createdTagData.contactTags.some((t: any) => t.name === 'Recruiters' && t.count === 0));
    assert.strictEqual(createdTagData.activeContactTags.includes('Recruiters'), false);

    // Assign tag to multiple contacts at once
    const batchAssignRes = await recipientsPATCH(
      new NextRequest('http://localhost:3000/api/share/recipients', {
        method: 'PATCH',
        body: JSON.stringify({
          recipientIds: ['conn-prof-recruiter-1', 'conn-prof-client-2'],
          addTags: ['Recruiters', 'VIP']
        })
      })
    );
    assert.strictEqual(batchAssignRes.status, 200);
    const batchData = await batchAssignRes.json();
    assert.ok(batchData.activeContactTags.includes('Recruiters') && batchData.activeContactTags.includes('VIP'));
    const elenaRec = batchData.recipients.find((r: any) => r.id === 'conn-prof-recruiter-1');
    const marcusRec = batchData.recipients.find((r: any) => r.id === 'conn-prof-client-2');
    assert.ok(elenaRec?.tags?.includes('Recruiters') && elenaRec?.tags?.includes('VIP'));
    assert.ok(marcusRec?.tags?.includes('Recruiters') && marcusRec?.tags?.includes('VIP'));
    assert.strictEqual(
      JSON.stringify(collections.profiles.find((p) => p.id === 'prof-recruiter-1')),
      elenaBeforeSnapshot,
      'Assigning contact tags must never modify another user profile document'
    );

    // Search by tag returns matching contacts
    const tagSearchRes = await recipientsGET(new NextRequest('http://localhost:3000/api/share/recipients?q=VIP'));
    const tagSearchData = await tagSearchRes.json();
    assert.strictEqual(tagSearchData.recipients.length, 2);

    // Remove tag from a single contact
    const removeTagRes = await recipientsPATCH(
      new NextRequest('http://localhost:3000/api/share/recipients', {
        method: 'PATCH',
        body: JSON.stringify({
          recipientIds: ['conn-prof-client-2'],
          removeTags: ['VIP']
        })
      })
    );
    const afterRemoveData = await removeTagRes.json();
    const marcusAfter = afterRemoveData.recipients.find((r: any) => r.id === 'conn-prof-client-2');
    assert.strictEqual(marcusAfter?.tags?.includes('VIP'), false);
    assert.strictEqual(marcusAfter?.tags?.includes('Recruiters'), true);

    // Rename tag ('Recruiters' -> 'Hiring Partners') updates catalog + assignments & persists
    const renameTagRes = await recipientsPATCH(
      new NextRequest('http://localhost:3000/api/share/recipients', {
        method: 'PATCH',
        body: JSON.stringify({ tagName: 'Recruiters', newName: 'Hiring Partners' })
      })
    );
    assert.strictEqual(renameTagRes.status, 200, 'Renaming tag returns 200');
    const renamedData = await renameTagRes.json();
    assert.ok(
      renamedData.activeContactTags.includes('Hiring Partners') && !renamedData.activeContactTags.includes('Recruiters'),
      'Renamed tag replaces old name in activeContactTags'
    );
    const marcusAfterRename = renamedData.recipients.find((r: any) => r.id === 'conn-prof-client-2');
    assert.ok(marcusAfterRename?.tags?.includes('Hiring Partners'), 'Renamed tag updates contact assignments');
    const freshReloadRes = await recipientsGET(new NextRequest('http://localhost:3000/api/share/recipients?q=Hiring'));
    const freshReloadData = await freshReloadRes.json();
    assert.strictEqual(freshReloadData.recipients.length, 2, 'Renamed tag remains persisted on reload & search');

    // Rename back to 'Recruiters' before cleanup check so downstream expectations stay consistent
    await recipientsPATCH(
      new NextRequest('http://localhost:3000/api/share/recipients', {
        method: 'PATCH',
        body: JSON.stringify({ tagName: 'Hiring Partners', newName: 'Recruiters' })
      })
    );

    // Delete custom tag cleans up catalog and assignments
    const delTagRes = await recipientsDELETE(
      new NextRequest('http://localhost:3000/api/share/recipients', {
        method: 'DELETE',
        body: JSON.stringify({ tagName: 'VIP' })
      })
    );
    const afterDeleteData = await delTagRes.json();
    assert.strictEqual(afterDeleteData.activeContactTags.includes('VIP'), false);
    assert.strictEqual(
      afterDeleteData.recipients.find((r: any) => r.id === 'conn-prof-recruiter-1')?.tags?.includes('VIP'),
      false
    );

    // Isolation check: User B must never see User A contact tags
    activeCookieUser = USER_B;
    const userBRes = await recipientsGET(new NextRequest('http://localhost:3000/api/share/recipients'));
    const userBData = await userBRes.json();
    assert.strictEqual((userBData.contactTags || []).some((t: any) => t.name === 'Recruiters'), false);
    activeCookieUser = USER_A;

    // Honest email check when unconfigured
    const emailRes = await sendEmailPOST(
      new NextRequest('http://localhost:3000/api/share/send-email', {
        method: 'POST',
        body: JSON.stringify({ shareLinkId: createdLinkId, recipients: [{ email: 'elena@nordic.ai' }] })
      })
    );
    assert.strictEqual(emailRes.status, 503);
  });

  await test('Rate limiting triggers 429 on excessive share link creation', async () => {
    resetRateLimitsForTests();
    let hit429 = false;
    for (let i = 0; i < 35; i++) {
      const res = await shareLinksPOST(
        new NextRequest('http://localhost:3000/api/share/links', {
          method: 'POST',
          body: JSON.stringify({ profileId: PROFILE_A.id, selectedFields: ['name'] })
        })
      );
      if (res.status === 429) {
        hit429 = true;
        break;
      }
    }
    assert.strictEqual(hit429, true, 'Rate limiter returned 429 after exceeding quota');
    resetRateLimitsForTests();
  });

  // ── GROUP 5: UI Component Integration (JSDOM + React 19) ──────────────────
  console.log('--- Group 5: UI Components (UnifiedShareWorkspace & SharedProfileClient) ---');

  await test('UnifiedShareWorkspace renders inline 3 tabs, switches profiles, renders Safety Check inline without modal/drawer overlays, and toggles Live Preview', async () => {
    activeCookieUser = USER_A;
    resetRateLimitsForTests();

    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('<!doctype html><html><body><div id="share-ui-root"></div></body></html>', {
      url: 'http://localhost:3000/profile/hamzah-farooq'
    });

    const g = globalThis as any;
    const prevWindow = g.window;
    const prevSelf = g.self;
    const prevDocument = g.document;
    const prevNavigator = g.navigator;
    const prevHTMLElement = g.HTMLElement;
    const prevEvent = g.Event;
    const prevCustomEvent = g.CustomEvent;
    const prevMutationObserver = g.MutationObserver;
    const prevFetch = g.fetch;
    const prevActEnv = g.IS_REACT_ACT_ENVIRONMENT;

    g.window = dom.window;
    g.self = dom.window;
    g.document = dom.window.document;
    Object.defineProperty(g, 'navigator', { value: dom.window.navigator, configurable: true, writable: true });
    g.HTMLElement = dom.window.HTMLElement;
    g.Event = dom.window.Event;
    g.CustomEvent = dom.window.CustomEvent;
    g.MutationObserver = dom.window.MutationObserver;
    g.IS_REACT_ACT_ENVIRONMENT = true;
    dom.window.HTMLElement.prototype.scrollIntoView = () => {};

    let profileListCalls = 0;
    let linksCalls = 0;
    let templatesCalls = 0;

    // Route client fetches directly to the real Next.js handlers
    g.fetch = async (input: any, init?: any) => {
      const urlStr = typeof input === 'string' ? input : input?.url || '';
      const method = (init?.method || 'GET').toUpperCase();
      const bodyStr = typeof init?.body === 'string' ? init.body : undefined;
      const fullUrl = urlStr.startsWith('http') ? urlStr : `http://localhost:3000${urlStr}`;

      if (urlStr.includes('/api/profile/list')) {
        profileListCalls++;
        return new Response(
          JSON.stringify({ success: true, profiles: [PROFILE_A, PROFILE_A_SECOND] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (urlStr.includes('/api/share/recipients')) {
        if (method === 'POST') return recipientsPOST(new NextRequest(fullUrl, { method, body: bodyStr }));
        if (method === 'PATCH') return recipientsPATCH(new NextRequest(fullUrl, { method, body: bodyStr }));
        if (method === 'DELETE') return recipientsDELETE(new NextRequest(fullUrl, { method, body: bodyStr }));
        return recipientsGET(new NextRequest(fullUrl, { method }));
      }
      if (urlStr.endsWith('/api/share/links') || urlStr.includes('/api/share/links?')) {
        linksCalls++;
        if (method === 'POST') {
          return shareLinksPOST(new NextRequest(fullUrl, { method, body: bodyStr }));
        }
        return shareLinksGET(new NextRequest(fullUrl, { method }));
      }
      if (urlStr.endsWith('/api/share/templates') || urlStr.includes('/api/share/templates?')) {
        templatesCalls++;
        if (method === 'POST') {
          return templatesPOST(new NextRequest(fullUrl, { method, body: bodyStr }));
        }
        return templatesGET(new NextRequest(fullUrl, { method }));
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    try {
      const React = await import('react');
      const { createRoot } = await import('react-dom/client');
      const { UnifiedShareWorkspace } = await import('../src/components/sharing/UnifiedShareWorkspace');
      const { SharedProfileClient } = await import('../src/app/s/[token]/SharedProfileClient');

      const uiProfile: ProfileData = {
        ...PROFILE_A,
        customFields: [
          ...(PROFILE_A.customFields || []),
          {
            id: 'cf-private-residence',
            label: 'Private Residence',
            value: 'Apt 9B Munich',
            type: 'text',
            visible: true,
            privacy: 'private'
          }
        ],
        fieldPrivacy: {
          ...(PROFILE_A.fieldPrivacy || {}),
          'custom-field-cf-private-residence': 'private'
        }
      };

      let selectedProfileId = uiProfile.id;
      let savedDrafts: Record<string, string[]> = {};
      const container = dom.window.document.getElementById('share-ui-root')!;
      const root = createRoot(container);

      const renderDrawer = (isOpen: boolean) =>
        React.createElement(UnifiedShareWorkspace, {
          isOpen,
          onClose: () => {},
          profile: uiProfile,
          userProfiles: [uiProfile, PROFILE_A_SECOND],
          selectedProfileId,
          onSelectProfileId: (id: string) => {
            selectedProfileId = id;
          },
          draftSelectionsByProfile: savedDrafts,
          onUpdateDraftSelection: (pid: string, fields: string[]) => {
            savedDrafts = { ...savedDrafts, [pid]: fields };
          }
        });

      await React.act(async () => {
        root.render(renderDrawer(true));
      });
      await React.act(async () => {
        await new Promise((r) => setTimeout(r, 30));
      });

      const workspaceEl = container.querySelector('[data-testid="unified-share-workspace"]');
      assert.ok(workspaceEl, 'UnifiedShareWorkspace renders in-page container');
      assert.strictEqual(container.querySelector('[role="dialog"]'), null, 'Sharing workspace must not render a modal dialog');
      assert.ok(!workspaceEl!.className.includes('fixed inset-0'), 'Sharing workspace must not use fixed inset-0 overlay');

      const bodyText = container.textContent || '';
      assert.ok(bodyText.includes('Share Profile'), 'Workspace renders Share Profile header');
      assert.ok(bodyText.includes('Everything') && bodyText.includes('Embedded Jobs'), 'Workspace renders all presets');
      assert.ok(bodyText.includes('Shared Links') && bodyText.includes('Templates'), 'Workspace renders 3 unified tabs');

      // 1. Trigger Safety Check on a Private field (must render inline without role="dialog")
      const privateToggle = container.querySelector('button[aria-label="Toggle Private Residence"]') as HTMLButtonElement | null;
      assert.ok(privateToggle, 'Private custom field switch exists');
      await React.act(async () => {
        privateToggle!.click();
      });
      assert.ok(
        (container.textContent || '').includes('Private Residence is marked Private'),
        'Clicking private field renders Safety Check warning inline'
      );
      assert.strictEqual(container.querySelector('[role="dialog"]'), null, 'Safety check renders inline without a dialog popup');

      const confirmPrivateBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        (b.textContent || '').includes('Include in this share link')
      ) as HTMLButtonElement | undefined;
      assert.ok(confirmPrivateBtn, 'Safety Check confirmation button is rendered');
      await React.act(async () => {
        confirmPrivateBtn!.click();
      });
      assert.ok(
        (savedDrafts[uiProfile.id] || []).includes('custom-field-cf-private-residence'),
        'Confirming Safety Check adds private field to draft selection'
      );

      // 2. Toggle Live Preview and confirm Never Share items never leak
      const previewBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        (b.textContent || '').trim() === 'Preview'
      ) as HTMLButtonElement | undefined;
      assert.ok(previewBtn, 'Preview toggle button exists');
      await React.act(async () => {
        previewBtn!.click();
      });
      const previewText = container.textContent || '';
      assert.ok(previewText.includes('Recipient Live Preview'), 'Live Preview panel opens');
      assert.ok(!previewText.includes('DE89370400440532013000'), 'Never Share bank account value never renders in Live Preview');

      // 3. Switch Profile inside drawer to Team / Company profile & verify close/reopen draft retention
      const switchTrigger = Array.from(container.querySelectorAll('div')).find(
        (d) =>
          typeof d.className === 'string' &&
          d.className.includes('cursor-pointer') &&
          (d.textContent || '').includes('Hamzah Farooq') &&
          (d.textContent || '').includes('Switch')
      );
      assert.ok(switchTrigger, 'Profile switcher control renders');
      await React.act(async () => {
        switchTrigger!.click();
      });
      const secondProfileBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        (b.textContent || '').includes('EdgeLabs Consulting')
      ) as HTMLButtonElement | undefined;
      assert.ok(secondProfileBtn, 'Second owned profile appears in dropdown');
      await React.act(async () => {
        secondProfileBtn!.click();
      });
      assert.strictEqual(selectedProfileId, PROFILE_A_SECOND.id, 'Switching profile updates active target');

      // Switch back, close and reopen drawer, and confirm draft selection stays intact
      await React.act(async () => {
        root.render(renderDrawer(false));
      });
      await React.act(async () => {
        root.render(renderDrawer(true));
      });
      assert.ok(
        (savedDrafts[uiProfile.id] || []).includes('custom-field-cf-private-residence'),
        'Unsaved sharing draft remains retained across drawer close/reopen'
      );

      // 3b. Open Contacts picker & verify interactive Contact Tag creation, batch assignment, filtering & event separation
      const contactsTriggerBtn = container.querySelector('button[aria-label="Select recipients"]') as HTMLButtonElement | null;
      assert.ok(contactsTriggerBtn, 'Contacts picker button renders');
      await React.act(async () => {
        contactsTriggerBtn!.click();
        await new Promise((r) => setTimeout(r, 30));
      });
      const pickerEl = container.querySelector('[data-testid="recipient-picker-panel"]');
      assert.ok(pickerEl, 'RecipientPickerModal mounts inline');
      const filterButtonsBefore = Array.from(
        pickerEl!.querySelectorAll('[role="tablist"] button')
      ).map((b) => (b.textContent || '').trim());
      assert.ok(!filterButtonsBefore.some((txt) => txt.includes('Expo 2027')), 'Event label does not leak into contact tag filters');
      assert.ok(!filterButtonsBefore.some((txt) => txt.includes('Clients')), 'Unused default labels do not appear in filter bar');

      // Select both contacts and create+apply tag 'Founders'
      const selectElenaBtn = pickerEl!.querySelector('button[aria-label="Select Elena Rostova"]') as HTMLButtonElement | null;
      const selectMarcusBtn = pickerEl!.querySelector('button[aria-label="Select Marcus Lind"]') as HTMLButtonElement | null;
      assert.ok(selectElenaBtn && selectMarcusBtn, 'Seeded contacts appear in picker');
      await React.act(async () => {
        selectElenaBtn!.click();
        selectMarcusBtn!.click();
      });

      const newTagInput = pickerEl!.querySelector('input[aria-label="New contact tag"]') as HTMLInputElement | null;
      assert.ok(newTagInput, 'Contact tag creation input exists');
      await React.act(async () => {
        const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')?.set;
        setter?.call(newTagInput, 'Founders');
        newTagInput!.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      });
      const addTagBtn = Array.from(pickerEl!.querySelectorAll('button')).find(
        (b) => (b.textContent || '').trim() === 'Add tag'
      ) as HTMLButtonElement | undefined;
      assert.ok(addTagBtn && !addTagBtn.disabled, 'Add tag button enabled');
      await React.act(async () => {
        addTagBtn!.click();
        await new Promise((r) => setTimeout(r, 40));
      });

      // Confirm Founders now shows as an active filter chip and removes cleanly from Marcus
      const filterButtonsAfter = Array.from(
        pickerEl!.querySelectorAll('[role="tablist"] button')
      ).map((b) => (b.textContent || '').trim());
      assert.ok(filterButtonsAfter.some((txt) => txt.includes('Founders')), 'Newly assigned tag appears in active filter chips');

      const removeFoundersMarcusBtn = pickerEl!.querySelector(
        'button[aria-label="Remove tag Founders from Marcus Lind"]'
      ) as HTMLButtonElement | null;
      assert.ok(removeFoundersMarcusBtn, 'Per-contact remove tag button renders');
      await React.act(async () => {
        removeFoundersMarcusBtn!.click();
        await new Promise((r) => setTimeout(r, 40));
      });
      assert.strictEqual(
        pickerEl!.querySelector('button[aria-label="Remove tag Founders from Marcus Lind"]'),
        null,
        'Removed tag updates immediately in UI'
      );

      // Rename tag 'Founders' -> 'Angels' and filter by 'Angels' in UI
      const editFoundersBtn = pickerEl!.querySelector('button[aria-label="Edit tag Founders"]') as HTMLButtonElement | null;
      assert.ok(editFoundersBtn, 'Inline edit tag button exists');
      await React.act(async () => {
        editFoundersBtn!.click();
      });
      const renameTagInput = pickerEl!.querySelector('input[aria-label="Rename tag Founders"]') as HTMLInputElement | null;
      assert.ok(renameTagInput, 'Rename tag input renders');
      await React.act(async () => {
        const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')?.set;
        setter?.call(renameTagInput, 'Angels');
        renameTagInput!.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      });
      const saveRenameBtn = pickerEl!.querySelector('button[aria-label="Save renamed tag Founders"]') as HTMLButtonElement | null;
      assert.ok(saveRenameBtn, 'Save renamed tag button renders');
      await React.act(async () => {
        saveRenameBtn!.click();
        await new Promise((r) => setTimeout(r, 40));
      });
      const angelsChip = Array.from(pickerEl!.querySelectorAll('[role="tablist"] button')).find((b) =>
        (b.textContent || '').includes('Angels')
      ) as HTMLButtonElement | undefined;
      assert.ok(angelsChip, 'Renamed tag Angels updates filter chip in UI');
      await React.act(async () => {
        angelsChip!.click();
      });
      assert.ok((pickerEl!.textContent || '').includes('Elena Rostova'), 'Filtering by renamed tag shows matching contact');
      assert.ok(!(pickerEl!.textContent || '').includes('Marcus Lind'), 'Filtering hides contact without renamed tag');
      const allChip = Array.from(pickerEl!.querySelectorAll('[role="tablist"] button')).find((b) =>
        (b.textContent || '').trim() === 'All'
      ) as HTMLButtonElement | undefined;
      await React.act(async () => {
        allChip?.click();
      });

      // Separate Share Event Label input and finish selection
      const evInput = pickerEl!.querySelector('#share-event-label-input') as HTMLInputElement | null;
      assert.ok(evInput, 'Share Event Label input exists separately');
      await React.act(async () => {
        const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')?.set;
        setter?.call(evInput, 'Summit Berlin');
        evInput!.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      });
      const donePickerBtn = Array.from(pickerEl!.querySelectorAll('button')).find((b) =>
        (b.textContent || '').startsWith('Done')
      ) as HTMLButtonElement | undefined;
      assert.ok(donePickerBtn, 'Done button closes recipient picker');
      await React.act(async () => {
        donePickerBtn!.click();
      });
      assert.ok((container.textContent || '').includes('Summit Berlin'), 'Share Event Label attaches to composer');

      // 4. Switch to Shared Links & Templates tabs inside same drawer
      const linksTabBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        (b.textContent || '').trim() === 'Shared Links'
      ) as HTMLButtonElement | undefined;
      assert.ok(linksTabBtn, 'Shared Links tab exists');
      await React.act(async () => {
        linksTabBtn!.click();
        await new Promise((r) => setTimeout(r, 30));
      });
      assert.ok(
        (container.textContent || '').includes('Show link titles') &&
          (container.textContent || '').includes('revoked'),
        'Shared Links filter controls and title toggle render'
      );

      const tplTabBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        (b.textContent || '').trim() === 'Templates'
      ) as HTMLButtonElement | undefined;
      assert.ok(tplTabBtn, 'Templates tab exists');
      await React.act(async () => {
        tplTabBtn!.click();
        await new Promise((r) => setTimeout(r, 30));
      });
      assert.ok(
        (container.textContent || '').includes('Share Templates') &&
          (container.textContent || '').includes('Embedded Jobs'),
        'Templates tab displays built-in presets and saved custom templates'
      );
      assert.strictEqual(profileListCalls, 0, 'UnifiedShareWorkspace skips redundant /api/profile/list fetch when userProfiles is provided');

      // 4b. Verify 401 session expiration shows clear banner and halts repeated /api/share/links & /api/share/templates calls
      activeCookieUser = null;
      const linksCountBefore401 = linksCalls;
      const tplCountBefore401 = templatesCalls;
      const expiredContainer = dom.window.document.createElement('div');
      dom.window.document.body.appendChild(expiredContainer);
      const expiredRoot = createRoot(expiredContainer);
      await React.act(async () => {
        expiredRoot.render(
          React.createElement(UnifiedShareWorkspace, {
            isOpen: true,
            onClose: () => {},
            profile: uiProfile,
            userProfiles: [uiProfile],
          })
        );
      });
      await React.act(async () => {
        await new Promise((r) => setTimeout(r, 30));
      });
      assert.ok(
        expiredContainer.querySelector('[data-testid="share-auth-required-banner"]'),
        'UnifiedShareWorkspace surfaces session-expired alert banner on 401'
      );

      const linksTabOn401 = Array.from(expiredContainer.querySelectorAll('button')).find((b) =>
        (b.textContent || '').trim() === 'Shared Links'
      ) as HTMLButtonElement | undefined;
      await React.act(async () => {
        linksTabOn401?.click();
        await new Promise((r) => setTimeout(r, 20));
      });
      const tplTabOn401 = Array.from(expiredContainer.querySelectorAll('button')).find((b) =>
        (b.textContent || '').trim() === 'Templates'
      ) as HTMLButtonElement | undefined;
      await React.act(async () => {
        tplTabOn401?.click();
        await new Promise((r) => setTimeout(r, 20));
      });
      assert.strictEqual(linksCalls, linksCountBefore401, 'SharedLinksTab does not spam /api/share/links after 401');
      assert.strictEqual(templatesCalls, tplCountBefore401, 'ShareTemplatesTab does not spam /api/share/templates after 401');
      await React.act(async () => {
        expiredRoot.unmount();
      });
      expiredContainer.remove();
      activeCookieUser = USER_A;

      // 5. Render SharedProfileClient in valid (images permitted & unpermitted), mobile preview toggle, revoked, and expired states
      const { AppRouterContext } = await import(
        'next/dist/shared/lib/app-router-context.shared-runtime'
      );
      const mockAppRouter: any = {
        back: () => {},
        forward: () => {},
        refresh: () => {},
        push: () => {},
        replace: () => {},
        prefetch: () => {},
        bfcacheId: 'test-bfcache'
      };

      // 5a. Shared link with photo, coverImage, and resume permitted
      await React.act(async () => {
        root.render(
          React.createElement(
            AppRouterContext.Provider,
            { value: mockAppRouter },
            React.createElement(SharedProfileClient, {
              result: {
                outcome: 'valid',
                profile: sanitizeProfileForShare(PROFILE_A, {
                  selectedFields: ['photo', 'coverImage', 'name', 'bio', 'skills', 'resume', 'custom-field-cf-portfolio']
                }),
                shareMeta: {
                  shareLinkId: 'lnk-ui-1',
                  title: 'AI Meetup Share',
                  eventLabel: 'Expo 2027',
                  expiryOption: 'never',
                  selectedFieldsCount: 7
                }
              }
            })
          )
        );
      });
      const visitorValidText = container.textContent || '';
      assert.ok(visitorValidText.includes('AI Meetup Share') && visitorValidText.includes('Expo 2027'));
      assert.ok(!visitorValidText.includes('DE89370400440532013000'), 'Shared visitor view excludes Never Share items');

      const headerEl = container.querySelector('header');
      assert.ok(headerEl, 'Shared view renders minimalist sticky header');
      const headerConnectBtns = Array.from(headerEl!.querySelectorAll('button')).filter((b) =>
        (b.textContent || '').includes('Connect') || (b.getAttribute('aria-label') || '').includes('Connect')
      );
      assert.strictEqual(headerConnectBtns.length, 0, 'Sticky header must NOT contain duplicate Connect button');

      const allConnectBtns = Array.from(container.querySelectorAll('button')).filter(
        (b) => (b.textContent || '').trim() === 'Connect'
      );
      assert.strictEqual(allConnectBtns.length, 1, 'Exactly one Connect action exists inside Hero section');
      assert.ok(headerEl!.querySelector('button[aria-label="Save Contact"]'), 'Compact Save Contact icon present');
      assert.ok(headerEl!.querySelector('button[aria-label="View CV"]'), 'CV icon shown when resume access is permitted');
      assert.ok(headerEl!.querySelector('button[aria-label="Download PDF"]'), 'Compact PDF icon present');
      assert.ok(headerEl!.querySelector('button[aria-label="Copy Share Link"]'), 'Compact Copy icon present');
      assert.ok(headerEl!.querySelector('button[aria-label="Share Profile"]'), 'Compact Share icon present');

      const renderedImgs = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src') || '');
      assert.ok(renderedImgs.includes(PROFILE_A.coverImage!), 'Permitted coverImage renders on shared preview');
      assert.ok(renderedImgs.includes(PROFILE_A.avatar!), 'Permitted profile avatar renders on shared preview');

      // Toggle Desktop -> Mobile preview on SharedProfileClient
      const mobilePreviewToggle = headerEl!.querySelector('button[aria-label="Mobile preview"]') as HTMLButtonElement | null;
      assert.ok(mobilePreviewToggle, 'Desktop/Mobile preview switch exists on shared page header');
      await React.act(async () => {
        mobilePreviewToggle!.click();
      });
      const mobilePreviewChassis = container.querySelector('[data-testid="shared-mobile-preview"]');
      assert.ok(mobilePreviewChassis, 'Clicking Mobile preview renders PhonePreview chassis on desktop');
      assert.strictEqual(
        mobilePreviewChassis!.querySelector('button[aria-label="Edit Profile"]'),
        null,
        'Mobile preview on shared link must never expose owner Edit controls'
      );

      // 5b. Shared link where photo, coverImage, and resume are NOT selected -> images & CV strictly hidden
      await React.act(async () => {
        root.render(
          React.createElement(
            AppRouterContext.Provider,
            { value: mockAppRouter },
            React.createElement(SharedProfileClient, {
              result: {
                outcome: 'valid',
                profile: sanitizeProfileForShare(PROFILE_A, {
                  selectedFields: ['name', 'bio', 'skills']
                }),
                shareMeta: {
                  shareLinkId: 'lnk-ui-2',
                  title: 'Minimal Share',
                  expiryOption: 'never',
                  selectedFieldsCount: 3
                }
              }
            })
          )
        );
      });
      assert.strictEqual(container.querySelector('button[aria-label="View CV"]'), null, 'CV action hidden when resume is not permitted');
      const unpermittedImgs = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src') || '');
      assert.ok(!unpermittedImgs.includes(PROFILE_A.coverImage!), 'Unselected coverImage must not render');
      assert.ok(!unpermittedImgs.includes(PROFILE_A.avatar!), 'Unselected avatar must not render');

      await React.act(async () => {
        root.render(
          React.createElement(
            AppRouterContext.Provider,
            { value: mockAppRouter },
            React.createElement(SharedProfileClient, { result: { outcome: 'revoked' } })
          )
        );
      });
      assert.ok((container.textContent || '').includes('This share link has been revoked'));

      await React.act(async () => {
        root.render(
          React.createElement(
            AppRouterContext.Provider,
            { value: mockAppRouter },
            React.createElement(SharedProfileClient, { result: { outcome: 'expired' } })
          )
        );
      });
      assert.ok((container.textContent || '').includes('This share link is no longer active'));

      await React.act(async () => {
        root.unmount();
      });
    } finally {
      dom.window.close();
      g.window = prevWindow;
      g.self = prevSelf;
      g.document = prevDocument;
      Object.defineProperty(g, 'navigator', { value: prevNavigator, configurable: true, writable: true });
      g.HTMLElement = prevHTMLElement;
      g.Event = prevEvent;
      g.CustomEvent = prevCustomEvent;
      g.MutationObserver = prevMutationObserver;
      g.fetch = prevFetch;
      g.IS_REACT_ACT_ENVIRONMENT = prevActEnv;
    }
  });

  console.log(`\n===============================================================`);
  console.log(` PHASE 1 SHARING TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Unhandled suite failure:', err);
  process.exit(1);
});
