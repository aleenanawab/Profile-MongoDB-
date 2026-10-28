import assert from 'node:assert';
import { NextRequest } from 'next/server';

// 1. Setup Environment FIRST
process.env.NODE_ENV = 'development';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
process.env.SESSION_SECRET = 'avtive-super-secret-key-prod-2026-secure-session-auth';

// 2. In-memory fake MongoDB collections
interface InMemoryDoc {
  _id?: any;
  id?: string;
  slug?: string;
  userId?: string;
  [key: string]: any;
}

const collections: Record<string, InMemoryDoc[]> = {
  profiles: [],
  users: [],
  companies: [],
  company_members: [],
  connections: [],
  sessions: []
};

function clone<T>(obj: T): T {
  if (obj === undefined) return undefined as any;
  return JSON.parse(JSON.stringify(obj));
}

function setNested(obj: any, path: string, val: any) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!current[p] || typeof current[p] !== 'object') {
      current[p] = {};
    }
    current = current[p];
  }
  current[parts[parts.length - 1]] = val;
}

function matchesFilter(doc: any, filter: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  if (filter.$or && Array.isArray(filter.$or)) {
    return filter.$or.some((sub: any) => matchesFilter(doc, sub));
  }
  for (const [k, v] of Object.entries(filter)) {
    if (k === '$or') continue;
    if (v && typeof v === 'object' && '$ne' in (v as any)) {
      const neVal = (v as any).$ne;
      if (doc[k] === neVal || String(doc[k]) === String(neVal)) return false;
      continue;
    }
    if (k === '_id') {
      if (String(doc._id) !== String(v)) return false;
      continue;
    }
    if (doc[k] !== v && String(doc[k]) !== String(v)) {
      return false;
    }
  }
  return true;
}

function createFakeCollection(name: string) {
  return {
    findOne: async (filter: any) => {
      const list = collections[name] || [];
      const found = list.find((d) => matchesFilter(d, filter));
      return found ? clone(found) : null;
    },
    find: (filter: any) => {
      return {
        toArray: async () => {
          const list = collections[name] || [];
          return list.filter((d) => matchesFilter(d, filter)).map(clone);
        }
      };
    },
    insertOne: async (doc: any) => {
      const copy = clone(doc);
      if (!copy._id) copy._id = copy.id || `id-${Date.now()}-${Math.random()}`;
      if (!copy.id) copy.id = String(copy._id);
      collections[name].push(copy);
      return { acknowledged: true, insertedId: copy._id };
    },
    updateOne: async (filter: any, update: any) => {
      const list = collections[name] || [];
      const doc = list.find((d) => matchesFilter(d, filter));
      if (!doc) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      if (update.$set) {
        for (const [path, val] of Object.entries(update.$set)) {
          setNested(doc, path, clone(val));
        }
      }
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    },
    findOneAndUpdate: async (filter: any, update: any, _options?: any) => {
      const list = collections[name] || [];
      const doc = list.find((d) => matchesFilter(d, filter));
      if (!doc) return null;
      if (update.$set) {
        for (const [path, val] of Object.entries(update.$set)) {
          setNested(doc, path, clone(val));
        }
      }
      return clone(doc);
    },
    deleteOne: async (filter: any) => {
      const list = collections[name] || [];
      const idx = list.findIndex((d) => matchesFilter(d, filter));
      if (idx >= 0) {
        list.splice(idx, 1);
        return { acknowledged: true, deletedCount: 1 };
      }
      return { acknowledged: true, deletedCount: 0 };
    },
    indexes: async () => [],
    createIndex: async () => 'idx',
    dropIndex: async () => true
  };
}

const fakeDb: any = {
  collection: (name: string) => createFakeCollection(name)
};

const fakeMongoClient: any = {
  db: () => fakeDb,
  connect: async () => fakeMongoClient
};

(global as any)._mongoClientPromise = Promise.resolve(fakeMongoClient);

// 3. Mock next/headers cookies and auth
const nextHeaders = require('next/headers');
const { createSessionToken } = require('../src/lib/auth');

const FIXED_SESSION = {
  id: 'usr-test-session-1',
  name: 'Session User',
  email: 'session@example.com',
  role: 'individual',
  preferredTheme: 'editorial',
  onboardingCompleted: true
};

const sessionToken = createSessionToken(FIXED_SESSION);

nextHeaders.cookies = async () => ({
  get: (name: string) => {
    if (name === 'avtive_session') return { name, value: sessionToken };
    return undefined;
  },
  set: () => {}
});

// Pre-seed the fixed user
collections.users = [
  {
    _id: 'usr-test-session-1',
    id: 'usr-test-session-1',
    name: 'Session User',
    email: 'session@example.com',
    onboardingCompleted: true
  }
];

// 4. Import server modules BEFORE window/jsdom is installed
import * as dbProfiles from '../src/lib/db/profiles';
import * as storageModule from '../src/lib/storage';
import * as nextNavigation from 'next/navigation';
import { POST as updateRoutePOST } from '../src/app/api/profile/update/route';

(storageModule as any).ensureCloudinaryAssetUrl = async (url: string) => url;
(storageModule as any).deleteFromCloudinary = async () => true;
try {
  const nextCache = require('next/cache');
  nextCache.revalidatePath = () => {};
} catch {}
(nextNavigation as any).useRouter = () => ({
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {}
});

// 5. Install JSDOM globals
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', {
  url: 'http://localhost:3000'
});

(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).navigator = dom.window.navigator;
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).HTMLInputElement = dom.window.HTMLInputElement;
(global as any).Event = dom.window.Event;
(global as any).CustomEvent = dom.window.CustomEvent;
(global as any).MutationObserver = dom.window.MutationObserver;
(global as any).localStorage = dom.window.localStorage;
(global as any).sessionStorage = dom.window.sessionStorage;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

dom.window.HTMLElement.prototype.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
if (dom.window.Element) {
  dom.window.Element.prototype.scrollTo = () => {};
  dom.window.Element.prototype.scrollIntoView = () => {};
}

// 6. Setup mocked fetch pointing /api/profile/update directly to the real route handler
let networkRequestCount = 0;
let lastRequestBody: any = null;
let requestBodies: any[] = [];

const originalFetch = global.fetch;
(global as any).fetch = async (input: any, init?: any) => {
  const urlStr = typeof input === 'string' ? input : input?.url || '';
  if (urlStr.includes('/api/profile/update')) {
    networkRequestCount++;
    const bodyStr = typeof init?.body === 'string' ? init.body : '';
    const parsedBody = bodyStr ? JSON.parse(bodyStr) : null;
    lastRequestBody = parsedBody;
    requestBodies.push(parsedBody);

    const nextReq = new NextRequest('http://localhost:3000/api/profile/update', {
      method: init?.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr
    });

    const routeRes = await updateRoutePOST(nextReq);
    return routeRes;
  }
  if (urlStr.includes('/api/profile/list')) {
    return new Response(JSON.stringify({ success: true, profiles: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const resolvedUrl = urlStr.startsWith('/') ? 'http://localhost:3000' + urlStr : urlStr;
  return originalFetch ? originalFetch(resolvedUrl, init) : new Response('{}', { status: 200 });
};

// 7. Import React and client modules
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ProfileEditorProvider, useProfileEditor, ProfileEditorContextValue } from '../src/context/ProfileEditorContext';
import { sanitizeProfileForPublic } from '../src/lib/db';
import { ProfileData } from '../src/types/profile';

let currentContextValue: ProfileEditorContextValue | null = null;

function ContextReader({ onContext }: { onContext?: (ctx: ProfileEditorContextValue) => void }) {
  const ctx = useProfileEditor();
  React.useEffect(() => {
    currentContextValue = ctx;
    if (onContext) onContext(ctx);
  });
  return <div id="context-mounted">Mounted</div>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let root: Root | null = null;
const container = dom.window.document.getElementById('test-root')!;

async function mountProvider(initialProfile: ProfileData): Promise<ProfileEditorContextValue> {
  if (root) {
    await act(async () => {
      root!.unmount();
    });
    root = null;
    await sleep(20);
  }
  container.innerHTML = '';
  root = createRoot(container);
  let resolvedCtx: ProfileEditorContextValue | null = null;

  await act(async () => {
    root!.render(
      <ProfileEditorProvider initialProfile={initialProfile}>
        <ContextReader onContext={(ctx) => { resolvedCtx = ctx; }} />
      </ProfileEditorProvider>
    );
  });

  await sleep(50);
  return new Proxy({} as ProfileEditorContextValue, {
    get: (_target, prop) => {
      return (currentContextValue as any)?.[prop];
    }
  });
}

async function unmountProvider() {
  if (root) {
    await act(async () => {
      root!.unmount();
    });
    root = null;
    await sleep(50);
  }
}

function resetHarness() {
  networkRequestCount = 0;
  lastRequestBody = null;
  requestBodies = [];
  try {
    localStorage.clear();
  } catch {}
}

function makeBaselineProfile(slug: string, overrides: Partial<ProfileData> = {}): ProfileData {
  return {
    id: `prof-${slug}`,
    _id: `prof-${slug}`,
    slug,
    userId: FIXED_SESSION.id,
    name: 'Initial Name',
    firstName: 'Initial',
    secondName: 'Name',
    lastName: 'Name',
    professionalTitle: 'Software Architect',
    designation: 'Software Architect',
    profession: 'Software Architect',
    bio: 'Initial Bio',
    shortBio: 'Initial Bio',
    about: 'Initial Full Bio',
    fullBio: 'Initial Full Bio',
    tagline: 'Initial Tagline',
    company: 'Avtive Corp',
    location: 'San Francisco, CA',
    email: 'user@example.com',
    phone: '+1234567890',
    theme: 'editorial',
    avatar: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    skills: ['TypeScript', 'Next.js'],
    socials: [],
    socialLinks: [],
    sectionOrder: ['profile', 'contactInfo', 'skills'],
    sectionVisibility: { profile: true, contactInfo: true, skills: true },
    sharingSettings: { phone: true, email: true, photo: true, nameAndTitle: true, bio: true, skills: true },
    ...overrides
  };
}

async function runPersistenceSuite() {
  console.log('\n======================================================');
  console.log(' RUNNING PHASE 0 E2E PERSISTENCE REGRESSION HARNESS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function testScenario(name: string, fn: () => Promise<void>) {
    resetHarness();
    try {
      await fn();
      passed++;
      console.log(`  [PASS] ${name}`);
    } catch (err: any) {
      failed++;
      console.error(`  [FAIL] ${name}: ${err?.message || err}`, err?.errors || '');
    } finally {
      await unmountProvider();
    }
  }

  // ──────────────────────────────────────────────────────────
  // S1: updateField('socialLinks', [...]) -> persisted in DB and in liveProfile.socials
  // ──────────────────────────────────────────────────────────
  await testScenario('S1: updateField socialLinks -> persisted in DB and liveProfile.socials', async () => {
    const slug = 's1-social-links';
    const profile = makeBaselineProfile(slug, { socials: [], socialLinks: [] });
    collections.profiles = [clone(profile)];

    const ctx = await mountProvider(profile);
    const newLinks = [{ platform: 'instagram' as const, url: 'https://instagram.com/x', visible: true }];

    await act(async () => {
      ctx.updateField('socialLinks', newLinks as any);
    });

    // Check liveProfile before saving
    assert.strictEqual(
      ctx.liveProfile.socials?.length,
      1,
      `liveProfile.socials must reflect socialLinks immediately (got ${JSON.stringify(ctx.liveProfile.socials)})`
    );
    assert.strictEqual(ctx.liveProfile.socials[0].platform, 'instagram');

    // Save
    await act(async () => {
      await ctx.saveProfile();
    });

    const doc = await dbProfiles.getProfileByIdOrSlug(slug);
    assert(doc, 'Profile must exist in DB');
    const storedSocials = doc.socials || doc.socialLinks || [];
    assert.strictEqual(storedSocials.length, 1, `DB must have 1 social link (got ${JSON.stringify(storedSocials)})`);
    assert.strictEqual(storedSocials[0].platform, 'instagram');
    assert.strictEqual(storedSocials[0].url, 'https://instagram.com/x');
  });

  // ──────────────────────────────────────────────────────────
  // S2: Clear professional title via updateField('professionalTitle','') alone & with designation
  // ──────────────────────────────────────────────────────────
  await testScenario('S2: Clear professional title -> professionalTitle, designation AND profession empty in DB', async () => {
    const slug = 's2-clear-title';
    const profile = makeBaselineProfile(slug, {
      professionalTitle: 'VP Engineering',
      designation: 'VP Engineering',
      profession: 'VP Engineering'
    });
    collections.profiles = [clone(profile)];

    const ctx = await mountProvider(profile);

    // Part A: Clear via updateField('professionalTitle', '')
    await act(async () => {
      ctx.updateField('professionalTitle', '');
    });

    assert.strictEqual(ctx.liveProfile.professionalTitle, '', 'liveProfile.professionalTitle must be empty');
    assert.strictEqual(ctx.liveProfile.designation, '', 'liveProfile.designation must be empty when title cleared');
    assert.strictEqual(ctx.liveProfile.profession, '', 'liveProfile.profession must be empty when title cleared');

    await act(async () => {
      await ctx.saveProfile();
    });

    const doc = await dbProfiles.getProfileByIdOrSlug(slug);
    assert.strictEqual(doc?.professionalTitle, '', `DB professionalTitle must be empty (got "${doc?.professionalTitle}")`);
    assert.strictEqual(doc?.designation, '', `DB designation must be empty (got "${doc?.designation}")`);
    assert.strictEqual(doc?.profession, '', `DB profession must be empty (got "${doc?.profession}")`);
  });

  // ──────────────────────────────────────────────────────────
  // S3: updateField('name', 'John') from 'John Smith' -> secondName/lastName cleared
  // ──────────────────────────────────────────────────────────
  await testScenario('S3: updateField name "John" from "John Smith" -> secondName/lastName cleared; reload shows John', async () => {
    const slug = 's3-single-name';
    const profile = makeBaselineProfile(slug, {
      name: 'John Smith',
      firstName: 'John',
      secondName: 'Smith',
      lastName: 'Smith'
    });
    collections.profiles = [clone(profile)];

    const ctx = await mountProvider(profile);

    await act(async () => {
      ctx.updateField('name', 'John');
    });

    assert.strictEqual(ctx.liveProfile.name, 'John', `liveProfile.name must be John (got "${ctx.liveProfile.name}")`);
    assert.strictEqual(ctx.liveProfile.secondName, '', `liveProfile.secondName must be empty (got "${ctx.liveProfile.secondName}")`);
    assert.strictEqual(ctx.liveProfile.lastName, '', `liveProfile.lastName must be empty (got "${ctx.liveProfile.lastName}")`);

    await act(async () => {
      await ctx.saveProfile();
    });

    const doc = await dbProfiles.getProfileByIdOrSlug(slug);
    assert.strictEqual(doc?.name, 'John', `DB name must be John (got "${doc?.name}")`);
    assert.strictEqual(doc?.secondName, '', `DB secondName must be empty (got "${doc?.secondName}")`);
    assert.strictEqual(doc?.lastName, '', `DB lastName must be empty (got "${doc?.lastName}")`);
  });

  // ──────────────────────────────────────────────────────────
  // S4: updateField('slug', 'new-slug') -> DB slug changes
  // ──────────────────────────────────────────────────────────
  await testScenario('S4: updateField slug "new-slug" -> DB slug changes', async () => {
    const oldSlug = 's4-old-slug';
    const newSlug = 's4-new-slug';
    const profile = makeBaselineProfile(oldSlug, { slug: oldSlug, username: oldSlug });
    collections.profiles = [clone(profile)];

    const ctx = await mountProvider(profile);

    await act(async () => {
      ctx.updateField('slug', newSlug);
    });

    assert.strictEqual(ctx.liveProfile.slug, newSlug, `liveProfile.slug must be "${newSlug}" (got "${ctx.liveProfile.slug}")`);

    await act(async () => {
      await ctx.saveProfile();
    });

    const updatedDoc = await dbProfiles.getProfileByIdOrSlug(newSlug);
    assert(updatedDoc, `Profile must be retrievable by new slug "${newSlug}"`);
    assert.strictEqual(updatedDoc.slug, newSlug);
  });

  // ──────────────────────────────────────────────────────────
  // S5: hide a social link (visible: false) -> stored with visible: false, sanitize hides it
  // ──────────────────────────────────────────────────────────
  await testScenario('S5: hide a social link (visible:false) -> link still stored; public sanitize hides it', async () => {
    const slug = 's5-hidden-social';
    const profile = makeBaselineProfile(slug, {
      socials: [{ platform: 'github', url: 'https://github.com/myuser', label: 'GitHub', visible: true }],
      socialLinks: [{ platform: 'github', url: 'https://github.com/myuser', label: 'GitHub', visible: true }]
    });
    collections.profiles = [clone(profile)];

    const ctx = await mountProvider(profile);

    // Hide link via updateField
    await act(async () => {
      ctx.handleUpdateLink('link-github-0', { visible: false });
    });

    await act(async () => {
      await ctx.saveProfile();
    });

    const doc = await dbProfiles.getProfileByIdOrSlug(slug);
    assert(doc, 'Profile must exist in DB');
    const stored = (doc.socials || doc.socialLinks || []) as any[];
    assert.strictEqual(stored.length, 1, `Hidden link must NOT be deleted from DB (got ${stored.length})`);
    assert.strictEqual(stored[0].visible, false, 'Link in DB must have visible: false');

    const publicView = sanitizeProfileForPublic(doc, false);
    const publicLinks = (publicView.socials || publicView.socialLinks || []) as any[];
    assert.strictEqual(publicLinks.length, 0, 'Public view must hide links where visible === false');
  });

  // ──────────────────────────────────────────────────────────
  // S6: handleAddLinkItem('github') -> no placeholder "https://" is persisted
  // ──────────────────────────────────────────────────────────
  await testScenario('S6: handleAddLinkItem "github" -> no placeholder "https://" is persisted in DB', async () => {
    const slug = 's6-placeholder-link';
    const profile = makeBaselineProfile(slug, { socials: [], socialLinks: [] });
    collections.profiles = [clone(profile)];

    const ctx = await mountProvider(profile);

    await act(async () => {
      ctx.handleAddLinkItem('github');
    });

    await act(async () => {
      await ctx.saveProfile();
    });

    const doc = await dbProfiles.getProfileByIdOrSlug(slug);
    assert(doc, 'Profile must exist in DB');
    const stored = (doc.socials || doc.socialLinks || []) as any[];
    const hasPlaceholder = stored.some((s) => s.url === 'https://');
    assert.strictEqual(hasPlaceholder, false, `Must NOT persist placeholder "https://" in DB (got ${JSON.stringify(stored)})`);
  });

  // ──────────────────────────────────────────────────────────
  // S7: remove avatar -> DB avatar empty
  // ──────────────────────────────────────────────────────────
  await testScenario('S7: remove avatar -> DB avatar empty', async () => {
    const slug = 's7-remove-avatar';
    const profile = makeBaselineProfile(slug, { avatar: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg' });
    collections.profiles = [clone(profile)];

    const ctx = await mountProvider(profile);

    await act(async () => {
      ctx.updateField('avatar', '');
    });

    assert.strictEqual(ctx.liveProfile.avatar, '', `liveProfile.avatar must be empty string (got "${ctx.liveProfile.avatar}")`);

    await act(async () => {
      await ctx.saveProfile();
    });

    const doc = await dbProfiles.getProfileByIdOrSlug(slug);
    assert.strictEqual(doc?.avatar, '', `DB avatar must be empty string (got "${doc?.avatar}")`);
  });

  // ──────────────────────────────────────────────────────────
  // S8: typing "+9","+92","+921","+9212" with 50ms gaps -> exactly ONE request after debounce
  // ──────────────────────────────────────────────────────────
  await testScenario('S8: typing "+9","+92","+921","+9212" with 50ms gaps -> exactly ONE request after debounce', async () => {
    const slug = 's8-debounce-typing';
    const profile = makeBaselineProfile(slug, { phone: '' });
    collections.profiles = [clone(profile)];

    const ctx = await mountProvider(profile);
    networkRequestCount = 0;

    await act(async () => { ctx.updateField('phone', '+9'); });
    await sleep(50);
    await act(async () => { ctx.updateField('phone', '+92'); });
    await sleep(50);
    await act(async () => { ctx.updateField('phone', '+921'); });
    await sleep(50);
    await act(async () => { ctx.updateField('phone', '+9212'); });

    // Wait for the 1000ms debounce timer to fire
    await sleep(1300);

    assert.strictEqual(
      networkRequestCount,
      1,
      `Typing with gaps under debounce must send exactly 1 request (got ${networkRequestCount})`
    );

    const doc = await dbProfiles.getProfileByIdOrSlug(slug);
    assert.strictEqual(doc?.phone, '+9212', `DB phone must be "+9212" (got "${doc?.phone}")`);
  });

  // ──────────────────────────────────────────────────────────
  // S9: editor opened with zero edits -> zero requests
  // ──────────────────────────────────────────────────────────
  await testScenario('S9: editor opened with zero edits -> zero requests', async () => {
    const slug = 's9-zero-edits';
    // Server document from Mongo with only stored canonical fields (no derived aliases, no username atom)
    const profile: ProfileData = {
      id: `prof-${slug}`,
      _id: `prof-${slug}`,
      slug,
      userId: FIXED_SESSION.id,
      name: 'Server User',
      type: 'individual',
      theme: 'editorial',
      sectionOrder: ['personalDetails', 'contactInfo', 'skills'],
      sectionVisibility: { personalDetails: true, contactInfo: true, skills: true },
      sharingSettings: { phone: true, email: true }
    };
    collections.profiles = [clone(profile)];

    networkRequestCount = 0;
    await mountProvider(profile);

    // Wait past debounce period
    await sleep(1300);

    assert.strictEqual(
      networkRequestCount,
      0,
      `Opening editor with zero edits must send 0 requests (got ${networkRequestCount})`
    );
  });

  // ──────────────────────────────────────────────────────────
  // S10: POST with full updatedData containing avatar:'' -> stored avatar NOT erased without clearFields
  // ──────────────────────────────────────────────────────────
  await testScenario('S10: POST with full updatedData containing avatar:"" -> avatar NOT erased without explicit clearFields', async () => {
    const slug = 's10-full-payload-avatar';
    const avatarUrl = 'https://res.cloudinary.com/demo/image/upload/permanent-avatar.jpg';
    const profile = makeBaselineProfile(slug, { avatar: avatarUrl });
    collections.profiles = [clone(profile)];

    const req = new NextRequest('http://localhost:3000/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: slug,
        updatedData: {
          ...profile,
          avatar: '' // Empty avatar in full-payload editor
        }
      })
    });

    const res = await updateRoutePOST(req);
    assert.strictEqual(res.status, 200, 'Request must return 200');

    const doc = await dbProfiles.getProfileByIdOrSlug(slug);
    assert.strictEqual(
      doc?.avatar,
      avatarUrl,
      `Stored avatar must NOT be wiped by full-payload editor without clearFields (got "${doc?.avatar}")`
    );
  });

  // ──────────────────────────────────────────────────────────
  // S11: patch containing one unknown key -> valid keys applied, unknown key reported
  // ──────────────────────────────────────────────────────────
  await testScenario('S11: patch containing unknown key -> valid keys applied, unknown key reported in response', async () => {
    const slug = 's11-unknown-key';
    const profile = makeBaselineProfile(slug, { company: 'Old Company' });
    collections.profiles = [clone(profile)];

    const req = new NextRequest('http://localhost:3000/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: slug,
        patch: {
          company: 'New Company Inc',
          nonExistentUnknownField123: 'malicious-or-unknown-data'
        }
      })
    });

    const res = await updateRoutePOST(req);
    assert.strictEqual(res.status, 200, `Save with unknown key should succeed with 200 and strip unknown key (got ${res.status})`);
    const data = await res.json();
    assert(
      (data.rejectedKeys && data.rejectedKeys.includes('nonExistentUnknownField123')) ||
      (data.skippedKeys && data.skippedKeys.includes('nonExistentUnknownField123')),
      'Unknown key must be reported in response rejectedKeys or skippedKeys'
    );

    const doc = await dbProfiles.getProfileByIdOrSlug(slug);
    assert.strictEqual(doc?.company, 'New Company Inc', 'Valid field in patch must be applied');
  });

  // ──────────────────────────────────────────────────────────
  // S12: editing Short Bio never changes tagline
  // ──────────────────────────────────────────────────────────
  await testScenario('S12: editing Short Bio never changes tagline', async () => {
    const slug = 's12-bio-tagline';
    const profile = makeBaselineProfile(slug, {
      shortBio: 'Original Short Bio',
      bio: 'Original Short Bio',
      tagline: 'Permanent Tagline'
    });
    collections.profiles = [clone(profile)];

    // Mount DesktopProfileContent inside ProfileEditorProvider
    if (root) {
      await act(async () => { root!.unmount(); });
      root = null;
      await sleep(20);
    }
    container.innerHTML = '';
    root = createRoot(container);

    const { DesktopProfileContent } = await import('../src/components/profiles/DesktopProfileContent');
    const { ThemeProvider } = await import('../src/context/ThemeContext');
    const { AppRouterContext } = require('next/dist/shared/lib/app-router-context.shared-runtime');
    const mockRouter: any = {
      back: () => {},
      forward: () => {},
      refresh: () => {},
      hmrRefresh: () => {},
      push: () => {},
      replace: () => {},
      prefetch: () => {}
    };

    await act(async () => {
      root!.render(
        <AppRouterContext.Provider value={mockRouter}>
          <ThemeProvider>
            <ProfileEditorProvider initialProfile={profile}>
              <ContextReader />
              <DesktopProfileContent />
            </ProfileEditorProvider>
          </ThemeProvider>
        </AppRouterContext.Provider>
      );
    });

    // Find the Short Bio input in DesktopProfileContent
    const shortBioInput = container.querySelector('input[placeholder*="headline"]') as HTMLInputElement;
    assert(shortBioInput, 'Short Bio input must exist in DesktopProfileContent');

    // Simulate user typing in Short Bio
    const fiberKey = Object.keys(shortBioInput).find(k => k.startsWith('__reactProps$'));
    const reactProps = fiberKey ? (shortBioInput as any)[fiberKey] : null;
    assert(reactProps?.onChange, 'Short Bio input must have an onChange handler');
    await act(async () => {
      reactProps.onChange({ target: { value: 'Brand New Headline' } });
    });

    const doc = await dbProfiles.getProfileByIdOrSlug(slug);
    // On unfixed code, DesktopProfileContent writes tagline on Short Bio onChange!
    assert.strictEqual(
      currentContextValue?.liveProfile.tagline,
      'Permanent Tagline',
      `Editing shortBio must never change tagline (got "${currentContextValue?.liveProfile.tagline}")`
    );
  });

  // ──────────────────────────────────────────────────────────
  // S13: Pronouns and birthday default to private for non-owners in sanitizeProfileForPublic
  // ──────────────────────────────────────────────────────────
  await testScenario('S13: Pronouns & birthday default to private for non-owners', async () => {
    const slug = 's13-privacy-defaults';
    const profile = makeBaselineProfile(slug, {
      pronouns: 'they/them',
      birthday: '1990-01-01',
      sharingSettings: { photo: true, nameAndTitle: true }
    });

    // Default: non-owner sees neither
    const nonOwnerDefault = sanitizeProfileForPublic(profile, false);
    assert.strictEqual(nonOwnerDefault.pronouns, undefined, 'Pronouns must be hidden by default for non-owners');
    assert.strictEqual(nonOwnerDefault.birthday, undefined, 'Birthday must be hidden by default for non-owners');

    // Owner sees both
    const ownerView = sanitizeProfileForPublic(profile, true);
    assert.strictEqual(ownerView.pronouns, 'they/them', 'Owner must see pronouns');
    assert.strictEqual(ownerView.birthday, '1990-01-01', 'Owner must see birthday');

    // Non-owner sees if sharingSettings explicitly set to true
    const sharedProfile = makeBaselineProfile(slug, {
      pronouns: 'they/them',
      birthday: '1990-01-01',
      sharingSettings: { photo: true, nameAndTitle: true, pronouns: true, birthday: true }
    });
    const nonOwnerShared = sanitizeProfileForPublic(sharedProfile, false);
    assert.strictEqual(nonOwnerShared.pronouns, 'they/them', 'Non-owner must see pronouns when explicitly shared');
    assert.strictEqual(nonOwnerShared.birthday, '1990-01-01', 'Non-owner must see birthday when explicitly shared');
  });

  // ──────────────────────────────────────────────────────────
  // S14: Dev-time coverage assertion: Every key in LIVE_PROFILE_ATOM_KEYS is handled by updateField
  // ──────────────────────────────────────────────────────────
  await testScenario('S14: Dev-time assertion: Every key in LIVE_PROFILE_ATOM_KEYS is handled in updateField', async () => {
    const { LIVE_PROFILE_ATOM_KEYS } = await import('../src/context/ProfileEditorContext');
    assert(LIVE_PROFILE_ATOM_KEYS.length > 0, 'LIVE_PROFILE_ATOM_KEYS must not be empty');
    const slug = 's14-atom-coverage';
    const profile = makeBaselineProfile(slug);
    collections.profiles = [clone(profile)];
    const ctx = await mountProvider(profile);

    for (const key of LIVE_PROFILE_ATOM_KEYS) {
      assert.doesNotThrow(() => {
        act(() => {
          ctx.updateField(key as any, (profile as any)[key]);
        });
      }, `updateField must handle atom key "${key}" without error`);
    }
  });

  console.log('\n======================================================');
  console.log(` PHASE 0 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPersistenceSuite().catch((err) => {
  console.error('Fatal harness error:', err);
  process.exit(1);
});
