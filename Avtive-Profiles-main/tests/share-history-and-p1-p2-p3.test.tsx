import assert from 'node:assert';
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { JSDOM } from 'jsdom';

// 1. Setup Environment BEFORE importing app modules
process.env.NODE_ENV = 'development';
process.env.MONGODB_URI = 'mongodb://localhost:27017/avtive_phase4_verify';
process.env.SESSION_SECRET = 'avtive-super-secret-key-prod-2026-secure-session-auth';

// Setup JSDOM for React component checks
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000/profile/owner-alice'
});
(globalThis as any).window = dom.window;
(globalThis as any).self = dom.window;
(globalThis as any).document = dom.window.document;
if (!(globalThis as any).navigator) {
  Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
}
(globalThis as any).HTMLElement = dom.window.HTMLElement;
(globalThis as any).Element = dom.window.Element;
(globalThis as any).Node = dom.window.Node;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// 2. Deterministic In-Memory MongoDB Store with injected failure hook
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

let failShareEventInsertsRemaining = 0;

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
    const actual = getNested(doc, k);
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof RegExp)) {
      const ops = v as Record<string, any>;
      if ('$in' in ops) {
        if (!Array.isArray(ops.$in) || !ops.$in.includes(actual)) return false;
      }
      if ('$nin' in ops) {
        if (Array.isArray(ops.$nin) && ops.$nin.includes(actual)) return false;
      }
      if ('$ne' in ops) {
        if (actual === ops.$ne) return false;
      }
      if ('$lt' in ops) {
        if (!(actual < ops.$lt)) return false;
      }
      if ('$lte' in ops) {
        if (!(actual <= ops.$lte)) return false;
      }
      if ('$gt' in ops) {
        if (!(actual > ops.$gt)) return false;
      }
      if ('$gte' in ops) {
        if (!(actual >= ops.$gte)) return false;
      }
      if ('$regex' in ops) {
        const rx = ops.$regex instanceof RegExp ? ops.$regex : new RegExp(ops.$regex, ops.$options || 'i');
        if (!rx.test(String(actual || ''))) return false;
      }
      continue;
    }
    if (actual !== v) return false;
  }
  return true;
}

function createFakeCollection(name: string) {
  if (!collections[name]) collections[name] = [];
  return {
    find: (filter: any = {}) => {
      const rows = collections[name].filter((d) => matchesFilter(d, filter)).map(clone);
      let skipN = 0;
      let limitN: number | null = null;
      const cursor: any = {
        sort: (spec: Record<string, number>) => {
          const entries = Object.entries(spec);
          rows.sort((a, b) => {
            for (const [field, dir] of entries) {
              const av = getNested(a, field) ?? '';
              const bv = getNested(b, field) ?? '';
              if (av < bv) return -1 * dir;
              if (av > bv) return 1 * dir;
            }
            return 0;
          });
          return cursor;
        },
        skip: (n: number) => {
          skipN = n;
          return cursor;
        },
        limit: (n: number) => {
          limitN = n;
          return cursor;
        },
        toArray: async () => {
          const sliced = rows.slice(skipN, limitN !== null ? skipN + limitN : undefined);
          return sliced.map(clone);
        }
      };
      return cursor;
    },
    findOne: async (filter: any = {}) => {
      const found = collections[name].find((d) => matchesFilter(d, filter));
      return found ? clone(found) : null;
    },
    countDocuments: async (filter: any = {}) => {
      return collections[name].filter((d) => matchesFilter(d, filter)).length;
    },
    insertOne: async (doc: any) => {
      if (name === 'share_events' && failShareEventInsertsRemaining > 0) {
        failShareEventInsertsRemaining -= 1;
        throw new Error('Simulated share_events write outage');
      }
      const copy = clone(doc);
      if (!copy._id) copy._id = crypto.randomBytes(8).toString('hex');
      collections[name].push(copy);
      return { acknowledged: true, insertedId: copy._id };
    },
    updateOne: async (filter: any, update: any, opts?: any) => {
      let doc = collections[name].find((d) => matchesFilter(d, filter));
      if (!doc && opts?.upsert) {
        doc = { _id: crypto.randomBytes(8).toString('hex') };
        collections[name].push(doc);
      }
      if (!doc) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      if (update.$set) {
        for (const [p, val] of Object.entries(update.$set)) setNested(doc, p, clone(val));
      }
      if (update.$inc) {
        for (const [p, val] of Object.entries(update.$inc)) {
          doc[p] = (typeof doc[p] === 'number' ? doc[p] : 0) + Number(val);
        }
      }
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    },
    findOneAndUpdate: async (filter: any, update: any) => {
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

// 3. Session & Next mocks
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
nextNavigation.usePathname = () => '/profile/alice-profile';
nextNavigation.useSearchParams = () => new URLSearchParams();

const USER_A = {
  id: 'usr-alice-1',
  name: 'Alice Vance',
  email: 'alice@avtive.test',
  role: 'individual' as const,
  onboardingCompleted: true
};

const USER_B = {
  id: 'usr-bob-2',
  name: 'Bob Intruder',
  email: 'bob@avtive.test',
  role: 'individual' as const,
  onboardingCompleted: true
};

let activeCookieUser: typeof USER_A | typeof USER_B | null = USER_A;

nextHeaders.cookies = async () => ({
  get: (name: string) => {
    if (name === 'avtive_session' && activeCookieUser) {
      return { name, value: createSessionToken(activeCookieUser) };
    }
    return undefined;
  },
  set: () => {}
});

import { ProfileData } from '../src/types/profile';
import { sanitizeProfileForAudience } from '../src/lib/privacy/audience';
import { diffProfile } from '../src/lib/profileDiff';
import { mapDocToProfileData, sanitizeProfileForPublic } from '../src/lib/db/profiles';
import { consumeAndResolveShareLink } from '../src/lib/db/shareLinks';
import { GET as shareLinksGET, POST as shareLinksPOST } from '../src/app/api/share/links/route';
import { PATCH as shareLinkDetailPATCH } from '../src/app/api/share/links/[id]/route';
import { POST as shareLinkRevokePOST } from '../src/app/api/share/links/[id]/revoke/route';
import { GET as shareHistoryGET } from '../src/app/api/share/history/route';
import { POST as shareEventsPOST } from '../src/app/api/share/events/route';
import { OwnerBottomNav } from '../src/components/layout/OwnerBottomNav';

const PROFILE_ALICE_1: ProfileData = {
  id: 'prof-alice-1',
  userId: USER_A.id,
  type: 'individual',
  slug: 'alice-vance',
  profileName: 'Personal Executive',
  name: 'Alice Vance',
  designation: 'Product Architect',
  avatar: 'https://cdn.example.com/alice.jpg',
  shortBio: 'Designing calm digital products.',
  bio: 'Designing calm digital products.',
  email: 'alice@avtive.test',
  phone: '+1 415 555 0101',
  website: 'https://alice.design',
  location: 'San Francisco, CA',
  skills: [
    { id: 'sk-1', name: 'System Design', visible: true },
    { id: 'sk-2', name: 'Hidden Skill', visible: false }
  ],
  experiences: [
    { id: 'exp-1', company: 'Avtive Studio', role: 'Lead Architect', visible: true },
    { id: 'exp-2', company: 'Stealth Venture', role: 'Advisor', visible: false }
  ],
  socials: [
    { platform: 'linkedin', url: 'https://linkedin.com/in/alice', visible: true },
    { platform: 'github', url: 'https://github.com/alice-hidden', visible: false }
  ],
  customFields: [
    { id: 'cf-public', label: 'Portfolio Deck', value: 'https://deck.alice.design', type: 'link', visible: true },
    { id: 'cf-secret', label: 'National ID', value: '999-00-1234', type: 'text', visible: true, privacy: 'never_share' }
  ],
  fieldPrivacy: {
    email: 'normal',
    phone: 'never_share',
    'custom-field-cf-secret': 'never_share'
  },
  sharingSettings: {
    nameAndTitle: true,
    photo: true,
    bio: true,
    email: false, // hidden from Public by default
    phone: false,
    location: true,
    website: true,
    skills: true,
    experience: true,
    socialLinks: true,
    customFields: true
  },
  connectionSettings: {
    email: true, // authorized for accepted connections ONLY
    phone: true, // MUST remain blocked by fieldPrivacy.phone === 'never_share'!
    experience: true,
    website: false // explicitly hidden from connections if desired
  },
  sectionVisibility: {
    personalDetails: true,
    experience: true,
    skills: true,
    socialLinks: true,
    customFields: true
  }
};

const PROFILE_ALICE_2: ProfileData = {
  ...PROFILE_ALICE_1,
  id: 'prof-alice-2',
  slug: 'vance-consulting',
  profileName: 'Vance Advisory',
  name: 'Vance Advisory',
  type: 'team'
};

function seedData() {
  for (const key of Object.keys(collections)) collections[key] = [];
  collections.users.push(clone(USER_A), clone(USER_B));
  collections.profiles.push(clone(PROFILE_ALICE_1), clone(PROFILE_ALICE_2));
  activeCookieUser = USER_A;
  failShareEventInsertsRemaining = 0;
}

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    throw err;
  }
}

async function run() {
  console.log('\n================================================================');
  console.log('   SHARE HISTORY, P1/P2/P3 VISIBILITY & AUDIENCE VERIFICATION');
  console.log('================================================================\n');

  seedData();

  // 1. Empty history check
  await test('Empty Share History returns empty items and pagination defaults', async () => {
    const req = new NextRequest('http://localhost:3000/api/share/history');
    const res = await shareHistoryGET(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.deepStrictEqual(data.items, []);
    assert.strictEqual(data.total, 0);
    assert.strictEqual(data.totalPages, 1);
  });

  // 2. Full Phase 4F lifecycle across creation -> copy -> incognito open -> history -> revoke
  let createdLinkId = '';
  let createdRawToken = '';

  await test('Phase 4F lifecycle: create -> Shared Links -> copy -> incognito open -> Share History -> revoke', async () => {
    // Step 2: Create secure link
    const createReq = new NextRequest('http://localhost:3000/api/share/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: PROFILE_ALICE_1.id,
        selectedFields: ['name', 'bio', 'skills'],
        recipients: [{ name: 'Elena Investor' }],
        shareChannel: 'link',
        eventLabel: 'Seed Summit'
      })
    });
    const createRes = await shareLinksPOST(createReq);
    assert.strictEqual(createRes.status, 201);
    const createJson = await createRes.json();
    assert.strictEqual(createJson.historyRecorded, true);
    createdLinkId = createJson.link.id;
    createdRawToken = new URL(createJson.link.shareUrl).pathname.split('/s/')[1];
    assert.ok(createdLinkId && createdRawToken);

    // Step 3: Confirm appears in Shared Links
    const listRes = await shareLinksGET(
      new NextRequest(`http://localhost:3000/api/share/links?profileId=${PROFILE_ALICE_1.id}`)
    );
    const listJson = await listRes.json();
    assert.ok(listJson.links.some((l: any) => l.id === createdLinkId));

    // Step 4: Copy link successfully -> track link_copied
    const copyRes = await shareEventsPOST(
      new NextRequest('http://localhost:3000/api/share/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: PROFILE_ALICE_1.id,
          shareLinkId: createdLinkId,
          eventType: 'link_copied',
          channel: 'link',
          targetType: 'share_link',
          dedupToken: 'copy-seq-1'
        })
      })
    );
    assert.strictEqual(copyRes.status, 201);
    const copyJson = await copyRes.json();
    assert.strictEqual(copyJson.recorded, true);

    // Verify duplicate dedupToken does not insert duplicate event
    const dupCopyRes = await shareEventsPOST(
      new NextRequest('http://localhost:3000/api/share/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: PROFILE_ALICE_1.id,
          shareLinkId: createdLinkId,
          eventType: 'link_copied',
          channel: 'link',
          targetType: 'share_link',
          dedupToken: 'copy-seq-1'
        })
      })
    );
    const dupJson = await dupCopyRes.json();
    assert.strictEqual(dupJson.deduplicated, true);

    // Step 5: Open link in incognito (unauthenticated visitor)
    activeCookieUser = null;
    const resolved = await consumeAndResolveShareLink(createdRawToken, {
      channel: 'link',
      clientSignature: 'incognito-test-ua'
    });
    assert.strictEqual(resolved.outcome, 'valid');

    // Step 6-8: Return to owner & inspect Share History
    activeCookieUser = USER_A;
    const histRes = await shareHistoryGET(new NextRequest('http://localhost:3000/api/share/history'));
    assert.strictEqual(histRes.status, 200);
    const histJson = await histRes.json();
    const types = histJson.items.map((i: any) => i.eventType);
    assert.ok(types.includes('share_created'), 'History includes link creation');
    assert.ok(types.includes('link_copied'), 'History includes link copy');
    assert.ok(types.includes('link_opened'), 'History includes visitor open');

    const openedItem = histJson.items.find((i: any) => i.eventType === 'link_opened');
    assert.strictEqual(openedItem.actorType, 'visitor', 'Visitor open is NOT attributed as owner-initiated');
    assert.strictEqual(openedItem.profileName, 'Personal Executive');
    assert.strictEqual(openedItem.recipientNames[0], 'Elena Investor');
    assert.ok(!JSON.stringify(histJson).includes(createdRawToken), 'History must never leak raw share token');

    // Permission update event
    const patchRes = await shareLinkDetailPATCH(
      new NextRequest(`http://localhost:3000/api/share/links/${createdLinkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedFields: ['name', 'bio'] })
      }),
      { params: Promise.resolve({ id: createdLinkId }) }
    );
    assert.strictEqual(patchRes.status, 200);
    const patchJson = await patchRes.json();
    assert.strictEqual(patchJson.historyRecorded, true);

    // Step 9-10: Revoke link and verify revocation recorded
    const revokeRes = await shareLinkRevokePOST(
      new NextRequest(`http://localhost:3000/api/share/links/${createdLinkId}/revoke`, { method: 'POST' }),
      { params: Promise.resolve({ id: createdLinkId }) }
    );
    assert.strictEqual(revokeRes.status, 200);
    const revokeJson = await revokeRes.json();
    assert.strictEqual(revokeJson.historyRecorded, true);

    const revokedHist = await (
      await shareHistoryGET(new NextRequest('http://localhost:3000/api/share/history?eventType=link_revoked&status=revoked'))
    ).json();
    assert.strictEqual(revokedHist.items.length, 1);
    assert.strictEqual(revokedHist.items[0].accessStatus, 'revoked');
    assert.strictEqual(revokedHist.items[0].profileIdentifier, 'alice-vance');
    assert.strictEqual(revokedHist.items[0].viewCount, 1);
  });

  // 3. QR, NFC, vCard, Direct Public URL, Multi-profile owner & Filtering
  await test('Multi-profile owner, QR/NFC/vCard/public_profile channels, search, filters & pagination', async () => {
    // Public URL share copy on Profile 1
    const pubCopyRes = await shareEventsPOST(
      new NextRequest('http://localhost:3000/api/share/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: PROFILE_ALICE_1.id,
          eventType: 'link_copied',
          channel: 'link',
          targetType: 'public_profile'
        })
      })
    );
    assert.strictEqual(pubCopyRes.status, 201);

    // QR generation & NFC & vCard on Profile 2 (different profile owned by same USER_A)
    for (const [eventType, channel] of [
      ['qr_generated', 'qr'],
      ['nfc_shared', 'nfc'],
      ['vcard_downloaded', 'vcard']
    ] as const) {
      const res = await shareEventsPOST(
        new NextRequest('http://localhost:3000/api/share/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId: PROFILE_ALICE_2.id,
            eventType,
            channel,
            targetType: 'public_profile'
          })
        })
      );
      assert.strictEqual(res.status, 201);
    }

    // All-profiles history includes BOTH Profile 1 and Profile 2
    const allHist = await (
      await shareHistoryGET(new NextRequest('http://localhost:3000/api/share/history?limit=50'))
    ).json();
    const profileIdsSeen = new Set(allHist.items.map((i: any) => i.profileId));
    assert.ok(profileIdsSeen.has(PROFILE_ALICE_1.id) && profileIdsSeen.has(PROFILE_ALICE_2.id));

    // Filter by Profile 2 only
    const p2Hist = await (
      await shareHistoryGET(new NextRequest(`http://localhost:3000/api/share/history?profileId=${PROFILE_ALICE_2.id}`))
    ).json();
    assert.ok(p2Hist.items.length >= 3);
    assert.ok(p2Hist.items.every((i: any) => i.profileId === PROFILE_ALICE_2.id));

    // Filter by channel=qr
    const qrHist = await (
      await shareHistoryGET(new NextRequest('http://localhost:3000/api/share/history?channel=qr'))
    ).json();
    assert.ok(qrHist.items.length >= 1 && qrHist.items.every((i: any) => i.channel === 'qr'));

    // Expired link lifecycle + expired status filter
    const expiredCreate = await (
      await shareLinksPOST(
        new NextRequest('http://localhost:3000/api/share/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId: PROFILE_ALICE_1.id,
            selectedFields: ['name'],
            expiryOption: '7d',
            shareChannel: 'qr'
          })
        })
      )
    ).json();
    const expRawToken = new URL(expiredCreate.link.shareUrl).pathname.split('/s/')[1];
    // Force past expiration in mock store
    const storedExp = collections.share_links.find((l) => l.id === expiredCreate.link.id);
    storedExp.expiresAt = new Date(Date.now() - 60_000).toISOString();
    const expResolve = await consumeAndResolveShareLink(expRawToken);
    assert.strictEqual(expResolve.outcome, 'expired');

    const expHist = await (
      await shareHistoryGET(new NextRequest('http://localhost:3000/api/share/history?eventType=link_expired&status=expired'))
    ).json();
    assert.ok(expHist.items.some((i: any) => i.shareLinkId === expiredCreate.link.id));

    // Pagination check (limit=2)
    const page1 = await (
      await shareHistoryGET(new NextRequest('http://localhost:3000/api/share/history?page=1&limit=2'))
    ).json();
    assert.strictEqual(page1.items.length, 2);
    assert.ok(page1.totalPages >= 3);
  });

  // 4. Failed event write handling & Security (Unauthenticated 401 & Cross-owner 403)
  await test('Failed event write sets recorded:false (never silent success); unauthenticated 401 & cross-owner 403', async () => {
    // Transient single failure recovers via retry
    failShareEventInsertsRemaining = 1;
    const retryRecoverRes = await shareEventsPOST(
      new NextRequest('http://localhost:3000/api/share/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: PROFILE_ALICE_1.id,
          eventType: 'link_copied',
          channel: 'link',
          targetType: 'public_profile'
        })
      })
    );
    assert.strictEqual(retryRecoverRes.status, 201);
    assert.strictEqual((await retryRecoverRes.json()).recorded, true);

    // Exhausted retries (3 failures) via POST /api/share/events -> recorded:false
    failShareEventInsertsRemaining = 5;
    const failEventRes = await shareEventsPOST(
      new NextRequest('http://localhost:3000/api/share/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: PROFILE_ALICE_1.id,
          eventType: 'link_copied',
          channel: 'link',
          targetType: 'public_profile'
        })
      })
    );
    failShareEventInsertsRemaining = 0;
    assert.strictEqual(failEventRes.status, 500);
    const failEventJson = await failEventRes.json();
    assert.strictEqual(failEventJson.recorded, false);

    // Exhausted retries during link creation: link still succeeds, historyRecorded:false
    failShareEventInsertsRemaining = 5;
    const createDuringOutage = await shareLinksPOST(
      new NextRequest('http://localhost:3000/api/share/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: PROFILE_ALICE_1.id,
          selectedFields: ['name'],
          shareChannel: 'link'
        })
      })
    );
    failShareEventInsertsRemaining = 0;
    assert.strictEqual(createDuringOutage.status, 201);
    const outageJson = await createDuringOutage.json();
    assert.ok(outageJson.link?.id);
    assert.strictEqual(outageJson.historyRecorded, false);
    assert.ok(outageJson.historyError);

    // Unauthenticated requests blocked with 401
    activeCookieUser = null;
    assert.strictEqual(
      (await shareHistoryGET(new NextRequest('http://localhost:3000/api/share/history'))).status,
      401
    );
    assert.strictEqual(
      (
        await shareEventsPOST(
          new NextRequest('http://localhost:3000/api/share/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileId: PROFILE_ALICE_1.id, eventType: 'link_copied' })
          })
        )
      ).status,
      401
    );

    // Cross-owner USER_B cannot read USER_A history or log events on USER_A profile
    activeCookieUser = USER_B;
    const bobHist = await (
      await shareHistoryGET(new NextRequest('http://localhost:3000/api/share/history'))
    ).json();
    assert.strictEqual(bobHist.items.length, 0, 'USER_B must never receive USER_A history');

    const bobCrossProfileHist = await shareHistoryGET(
      new NextRequest(`http://localhost:3000/api/share/history?profileId=${PROFILE_ALICE_1.id}`)
    );
    assert.strictEqual(bobCrossProfileHist.status, 403);

    const bobCrossEvent = await shareEventsPOST(
      new NextRequest('http://localhost:3000/api/share/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: PROFILE_ALICE_1.id, eventType: 'link_copied' })
      })
    );
    assert.strictEqual(bobCrossEvent.status, 403);

    activeCookieUser = USER_A;
  });

  // 5. P1 item visibility & P2 Public vs Connection audience privacy rules
  await test('P1 individual visibility persistence & P2 Public vs Connection privacy sanitization', () => {
    // Skill visible:false change is detected by diffProfile & preserved in patch & mapDocToProfileData
    const diff = diffProfile(PROFILE_ALICE_1, {
      ...PROFILE_ALICE_1,
      skills: [
        { id: 'sk-1', name: 'System Design', visible: false },
        { id: 'sk-2', name: 'Hidden Skill', visible: false }
      ]
    });
    assert.strictEqual(diff.hasChanges, true);
    assert.strictEqual((diff.patch.skills as any[])[0].visible, false);
    const mapped = mapDocToProfileData(clone(PROFILE_ALICE_1));
    const hiddenSkill = (mapped.skills as any[]).find((s) => s.name === 'Hidden Skill');
    assert.strictEqual(hiddenSkill?.visible, false, 'SkillItem.visible=false must survive MongoDB mapping');

    // Owner view keeps hidden items visible
    const ownerView = sanitizeProfileForAudience(PROFILE_ALICE_1, 'owner');
    assert.strictEqual(ownerView.skills?.length, 2);
    assert.strictEqual(ownerView.experiences?.length, 2);
    assert.strictEqual(ownerView.phone, PROFILE_ALICE_1.phone);

    // Public view strips hidden items, email (sharingSettings.email=false), phone (never_share), secret custom field
    const publicView = sanitizeProfileForAudience(PROFILE_ALICE_1, 'public');
    assert.strictEqual(publicView.skills?.length, 1, 'Hidden skill stripped while visible skill remains');
    assert.strictEqual((publicView.skills as any[])[0].name, 'System Design');
    assert.strictEqual(publicView.experiences?.length, 1);
    assert.strictEqual(publicView.socials?.length, 1);
    assert.strictEqual(publicView.email, '');
    assert.strictEqual(publicView.phone, '');
    assert.strictEqual(publicView.website, 'https://alice.design');
    assert.ok(!publicView.customFields?.some((c) => c.id === 'cf-secret'));

    // Connection view respects connectionSettings (email=true, website=false) AND NEVER exposes never_share (phone, cf-secret)
    const connView = sanitizeProfileForAudience(PROFILE_ALICE_1, 'connection');
    assert.strictEqual(connView.email, 'alice@avtive.test', 'Accepted connection sees email enabled in connectionSettings');
    assert.strictEqual(connView.website, '', 'Connection website=false respected even though public website=true');
    assert.strictEqual(connView.phone, '', 'never_share phone must remain hidden from accepted connection');
    assert.ok(!connView.customFields?.some((c) => c.id === 'cf-secret'));

    // Server helper equivalence check with { isConnected: true }
    const serverConnView = sanitizeProfileForPublic(PROFILE_ALICE_1, false, { isConnected: true });
    assert.strictEqual(serverConnView.email, 'alice@avtive.test');
    assert.strictEqual(serverConnView.phone, '');

    // Private profile overrides both Public & Connection views
    const privProfile: ProfileData = { ...PROFILE_ALICE_1, profileVisibility: 'private' };
    const privConn = sanitizeProfileForAudience(privProfile, 'connection');
    assert.strictEqual(privConn.name, 'Alice Vance');
    assert.strictEqual(privConn.email, '');
    assert.strictEqual(privConn.skills?.length, 0);
  });

  // 6. 5-item Navigation component destinations verification
  await test('OwnerBottomNav renders all 5 functional navigation destinations (Profile, Contacts, Scan, Events, Settings)', async () => {
    const host = dom.window.document.createElement('div');
    dom.window.document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(React.createElement(OwnerBottomNav, { profileHref: '/profile/alice-vance' }));
    });
    const links = Array.from(host.querySelectorAll('a')).map((a) => ({
      text: a.textContent?.trim(),
      href: a.getAttribute('href')
    }));
    assert.deepStrictEqual(links, [
      { text: 'Profile', href: '/profile/alice-vance' },
      { text: 'Contacts', href: '/contacts' },
      { text: 'Scan', href: '/scan' },
      { text: 'Events', href: '/events' },
      { text: 'Settings', href: '/settings' }
    ]);
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  console.log('\n✓ Share History + P1/P2/P3 suite completed with 0 failures.\n');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
