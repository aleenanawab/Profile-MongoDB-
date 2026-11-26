import assert from 'node:assert';
import { NextRequest } from 'next/server';

// 1. Setup Environment BEFORE importing app modules
process.env.NODE_ENV = 'development';
process.env.MONGODB_URI = 'mongodb://localhost:27017/avtive_phase2_test';
process.env.SESSION_SECRET = 'avtive-super-secret-key-prod-2026-secure-session-auth';

// 2. Deterministic In-Memory MongoDB Store
const collections: Record<string, any[]> = {
  users: [],
  profiles: [],
  companies: [],
  company_members: [],
  connections: [],
  sessions: [],
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
      continue;
    }
    if (docVal !== v && String(docVal) !== String(v)) return false;
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
      return {
        sort: () => ({ toArray: async () => docs, limit: () => ({ toArray: async () => docs }) }),
        limit: () => ({ toArray: async () => docs }),
        toArray: async () => docs,
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
      const doc = collections[name].find((d) => matchesFilter(d, filter));
      if (!doc) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      if (update.$set) {
        for (const [p, val] of Object.entries(update.$set)) setNested(doc, p, clone(val));
      }
      if (update.$unset) {
        for (const p of Object.keys(update.$unset)) delete doc[p];
      }
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    },
    findOneAndUpdate: async (filter: any, update: any) => {
      const doc = collections[name].find((d) => matchesFilter(d, filter));
      if (!doc) return null;
      if (update.$set) {
        for (const [p, val] of Object.entries(update.$set)) setNested(doc, p, clone(val));
      }
      if (update.$unset) {
        for (const p of Object.keys(update.$unset)) delete doc[p];
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
  push: () => { },
  replace: () => { },
  prefetch: () => { },
  back: () => { },
  forward: () => { },
  refresh: () => { },
});
nextNavigation.usePathname = () => '/profile/phase2-tester';
nextNavigation.useSearchParams = () => new URLSearchParams();

const OWNER_USER = {
  id: 'usr-phase2-owner',
  name: 'Elena Vance',
  email: 'elena@avtive.test',
  role: 'individual' as const,
  onboardingCompleted: true,
};

let activeUser: typeof OWNER_USER | null = OWNER_USER;

nextHeaders.cookies = async () => ({
  get: (name: string) => {
    if (name === 'avtive_session' && activeUser) {
      return { name, value: createSessionToken(activeUser) };
    }
    return undefined;
  },
  set: () => { },
});

// 4. Import app modules AFTER DB & headers setup
import { ProfileData } from '../src/types/profile';
import { diffProfile, isProfileDirty } from '../src/lib/profileDiff';
import { sanitizeProfileForPublic, mapDocToProfileData, getProfileByIdOrSlug } from '../src/lib/db/profiles';
import { PUT as updateProfilePUT } from '../src/app/api/profile/update/route';
import { POST as uploadPOST } from '../src/app/api/upload/route';
import { normalizeMimeType, uploadToCloudinary } from '../src/lib/storage/cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { getThemeConfig } from '../src/components/ui/themeStyles';

const SAMPLE_PROFILE: ProfileData = {
  id: 'prof-phase2-1',
  userId: OWNER_USER.id,
  name: 'Elena Vance',
  slug: 'phase2-tester',
  username: 'phase2-tester',
  type: 'individual',
  theme: 'editorial',
  headline: 'Principal Systems Designer',
  company: 'Monolith Labs',
  location: 'Zurich, Switzerland',
  bio: 'Building minimalist identity infrastructure.',
  about: 'Focused on high-trust digital identity systems.',
  email: 'elena@avtive.test',
  phone: '+41 44 555 0100',
  avatar: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
  skills: [{ name: 'Architecture', category: 'Engineering', level: 'Expert' }],
  experiences: [
    {
      id: 'exp-1',
      role: 'Lead Architect',
      company: 'Monolith Labs',
      period: '2022 - Present',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Zero-Color OS',
      description: 'Minimalist UI framework',
    },
  ],
  socials: [{ platform: 'github', url: 'https://github.com/elenavance', visible: true }],
  profileVisibility: 'public',
  backgroundType: 'default',
  sectionOrder: ['personalDetails', 'contactInfo', 'experience', 'projects', 'skills'],
  sectionVisibility: {
    personalDetails: true,
    contactInfo: true,
    experience: true,
    projects: true,
    skills: true,
  },
};

async function runTests() {
  console.log('\n===============================================================');
  console.log('   PHASE 2 TEST SUITE: EDITOR REDESIGN, PRIVACY & B&W THEME    ');
  console.log('===============================================================');

  let passed = 0;
  async function test(name: string, fn: () => Promise<void> | void) {
    process.stdout.write(`  [RUN] ${name}... `);
    await fn();
    passed++;
    console.log('PASS');
  }

  // Seed DB
  collections.users.push({ ...OWNER_USER });
  collections.profiles.push(clone(SAMPLE_PROFILE));

  // ── 1. Theme System Check ───────────────────────────────────────────────
  await test('Minimalist black & white system theme is the default editorial config', () => {
    const editorial = getThemeConfig('editorial');
    const fallback = getThemeConfig('default');
    assert.ok(editorial.btnPrimary.includes('bg-black'), 'Editorial primary CTA must use black light surface');
    assert.ok(editorial.btnPrimary.includes('dark:bg-white'), 'Editorial primary CTA must invert to white in dark mode');
    assert.ok(editorial.cardBg.includes('bg-white'), 'Editorial card surface must be pure white');
    assert.strictEqual(fallback.btnPrimary, editorial.btnPrimary, 'Default theme must match minimalist B&W editorial');
  });

  // ── 2. Server Privacy Enforcement (`Private shows your name only`) ─────
  await test('sanitizeProfileForPublic strips all non-name data for non-owners when profileVisibility is private', () => {
    const privDoc: ProfileData = {
      ...clone(SAMPLE_PROFILE),
      profileVisibility: 'private',
      backgroundType: 'image',
      customBackgroundImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f',
      resumeUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/cv.pdf',
      resumeFileName: 'Elena_CV.pdf',
    };

    const visitorView = sanitizeProfileForPublic(privDoc, false);
    assert.strictEqual(visitorView.name, 'Elena Vance');
    assert.strictEqual(visitorView.profileVisibility, 'private');
    assert.strictEqual(visitorView.headline, '');
    assert.strictEqual(visitorView.bio, '');
    assert.strictEqual(visitorView.about, '');
    assert.strictEqual(visitorView.email, '');
    assert.strictEqual(visitorView.phone, '');
    assert.strictEqual(visitorView.avatar, '');
    assert.strictEqual(visitorView.resumeUrl, '');
    assert.strictEqual(visitorView.customBackgroundImage, '');
    assert.deepStrictEqual(visitorView.experiences, []);
    assert.deepStrictEqual(visitorView.projects, []);
    assert.deepStrictEqual(visitorView.socials, []);

    const ownerView = sanitizeProfileForPublic(privDoc, true);
    assert.strictEqual(ownerView.headline, 'Principal Systems Designer');
    assert.strictEqual(ownerView.email, 'elena@avtive.test');
    assert.strictEqual(ownerView.resumeUrl, 'https://res.cloudinary.com/demo/raw/upload/v1/cv.pdf');
    assert.strictEqual(ownerView.customBackgroundImage, 'https://images.unsplash.com/photo-1513694203232-719a280e022f');
  });

  // ── 3. Profile Diff & Persistence for Phase 2 Fields ────────────────────
  await test('PUT /api/profile/update persists profileVisibility, backgroundType, customBackgroundImage/Video & resumeUrl', async () => {
    activeUser = OWNER_USER;
    const nextState: ProfileData = {
      ...SAMPLE_PROFILE,
      profileVisibility: 'private',
      backgroundType: 'video',
      customBackgroundVideo: 'preset:waves',
      resumeUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/resume.pdf',
      resumeFileName: 'Elena_Resume.pdf',
    };

    assert.strictEqual(isProfileDirty(SAMPLE_PROFILE, nextState), true);
    const diff = diffProfile(SAMPLE_PROFILE, nextState);
    assert.strictEqual(diff.hasChanges, true);
    assert.strictEqual(diff.patch.profileVisibility, 'private');
    assert.strictEqual(diff.patch.backgroundType, 'video');

    const req = new NextRequest('http://localhost:3000/api/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: SAMPLE_PROFILE.id,
        updatedData: diff.patch,
        clearFields: diff.clearFields,
      }),
    });
    const res = await updateProfilePUT(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.profile.profileVisibility, 'private');
    assert.strictEqual(data.profile.backgroundType, 'video');
    assert.strictEqual(data.profile.customBackgroundVideo, 'preset:waves');
    assert.strictEqual(data.profile.resumeUrl, 'https://res.cloudinary.com/demo/raw/upload/v1/resume.pdf');

    const stored = await getProfileByIdOrSlug(SAMPLE_PROFILE.id);
    assert.ok(stored);
    const mapped = mapDocToProfileData(stored);
    assert.strictEqual(mapped.profileVisibility, 'private');
    assert.strictEqual(mapped.resumeFileName, 'Elena_Resume.pdf');

    // Reset back to public for UI test
    collections.profiles[0] = clone(SAMPLE_PROFILE);
  });

  // ── 4. PDF Upload Signature Guard ───────────────────────────────────────
  await test('POST /api/upload validates %PDF signature for documents bucket', async () => {
    activeUser = OWNER_USER;
    const formData = new FormData();
    const fakePdf = new File([new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])], 'spoof.pdf', {
      type: 'application/pdf',
    });
    formData.append('file', fakePdf);
    formData.append('bucket', 'documents');

    const req = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData as any,
    });
    const res = await uploadPOST(req);
    assert.strictEqual(res.status, 400, 'Spoofed non-%PDF bytes must be rejected');
  });

  // ── 4b. Parameterized WebM Audio (audio/webm;codecs=opus) Voice Intro Upload ─
  await test('POST /api/upload & uploadToCloudinary support audio/webm;codecs=opus via binary stream', async () => {
    activeUser = OWNER_USER;
    assert.strictEqual(normalizeMimeType('audio/webm;codecs=opus'), 'audio/webm');
    assert.strictEqual(normalizeMimeType('video/webm;codecs=vp8,opus'), 'video/webm');

    const prevCloud = process.env.CLOUDINARY_CLOUD_NAME;
    const prevKey = process.env.CLOUDINARY_API_KEY;
    const prevSecret = process.env.CLOUDINARY_API_SECRET;
    process.env.CLOUDINARY_CLOUD_NAME = 'demo-cloud';
    process.env.CLOUDINARY_API_KEY = '123456';
    process.env.CLOUDINARY_API_SECRET = 'secret-key';

    let capturedOptions: any = null;
    let streamedBytes: Buffer[] = [];
    const origUploadStream = cloudinary.uploader.upload_stream;

    (cloudinary.uploader as any).upload_stream = (opts: any, cb: any) => {
      capturedOptions = opts;
      streamedBytes = [];
      return {
        end: (buf: Buffer) => {
          streamedBytes.push(Buffer.from(buf));
          cb(null, {
            secure_url: 'https://res.cloudinary.com/demo-cloud/video/upload/v1/voice_intro.webm',
            public_id: `${opts.folder}/${opts.public_id}`,
            bytes: buf.length,
            format: 'webm',
          });
        },
      };
    };

    try {
      const webmHeader = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01]);
      const directRes = await uploadToCloudinary(webmHeader, 'voice_test.webm', 'audio/webm;codecs=opus', 'media');
      assert.strictEqual(directRes.success, true);
      assert.strictEqual(directRes.mimeType, 'audio/webm');
      assert.strictEqual(capturedOptions?.resource_type, 'video');
      assert.strictEqual(Buffer.concat(streamedBytes).equals(webmHeader), true);

      const formData = new FormData();
      const voiceFile = new File([webmHeader], 'voice_intro.webm', {
        type: 'audio/webm;codecs=opus',
      });
      formData.append('file', voiceFile);
      formData.append('field', 'introductionMedia');

      const req = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData as any,
      });
      const res = await uploadPOST(req);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.mimeType, 'audio/webm');
      assert.ok(body.url.startsWith('https://'));
    } finally {
      (cloudinary.uploader as any).upload_stream = origUploadStream;
      if (prevCloud === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
      else process.env.CLOUDINARY_CLOUD_NAME = prevCloud;
      if (prevKey === undefined) delete process.env.CLOUDINARY_API_KEY;
      else process.env.CLOUDINARY_API_KEY = prevKey;
      if (prevSecret === undefined) delete process.env.CLOUDINARY_API_SECRET;
      else process.env.CLOUDINARY_API_SECRET = prevSecret;
    }
  });

  // ── 5. React 19 + JSDOM P3 In-Page Editor, Share Workspace & PublicProfileClient Modes ──
  await test('ProfileEditorView renders in-page without dialog/backdrop, supports Background/Identity/Visibility/Sections, Cancel/Done, & PublicProfileClient screen switching', async () => {
    activeUser = OWNER_USER;
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('<!doctype html><html><body><div id="p3-root"></div></body></html>', {
      url: 'http://localhost:3000/profile/phase2-tester?edit=true',
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
    const prevResizeObserver = g.ResizeObserver;
    const prevLocalStorage = g.localStorage;
    const prevFetch = g.fetch;
    const prevAct = g.IS_REACT_ACT_ENVIRONMENT;

    g.window = dom.window;
    g.self = dom.window;
    g.document = dom.window.document;
    Object.defineProperty(g, 'navigator', { value: dom.window.navigator, configurable: true, writable: true });
    g.HTMLElement = dom.window.HTMLElement;
    g.Event = dom.window.Event;
    g.CustomEvent = dom.window.CustomEvent;
    g.MutationObserver = dom.window.MutationObserver;
    g.localStorage = dom.window.localStorage;
    g.ResizeObserver = class {
      observe() { }
      unobserve() { }
      disconnect() { }
    };
    dom.window.HTMLElement.prototype.scrollIntoView = () => { };
    dom.window.HTMLElement.prototype.scrollTo = () => { };
    g.IS_REACT_ACT_ENVIRONMENT = true;

    let lastPutPayload: any = null;
    const putPayloads: any[] = [];
    g.fetch = async (input: any, init?: any) => {
      const urlStr = typeof input === 'string' ? input : input?.url || '';
      if (urlStr.includes('/api/profile/update')) {
        lastPutPayload = init?.body ? JSON.parse(init.body) : null;
        if (lastPutPayload) putPayloads.push(lastPutPayload);
        return updateProfilePUT(
          new NextRequest('http://localhost:3000/api/profile/update', {
            method: init?.method || 'PUT',
            body: init?.body,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      if (urlStr.includes('/api/profile/list')) {
        return new Response(JSON.stringify({ success: true, profiles: [clone(SAMPLE_PROFILE)] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('/api/share/recipients')) {
        return new Response(JSON.stringify({ recipients: [], availableLabels: [], emailConfigured: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('/api/share/links')) {
        return new Response(JSON.stringify({ links: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('/api/share/templates')) {
        return new Response(JSON.stringify({ templates: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    try {
      const React = await import('react');
      const { createRoot } = await import('react-dom/client');
      const { ThemeProvider } = await import('../src/context/ThemeContext');
      const { ProfileEditorProvider } = await import('../src/context/ProfileEditorContext');
      const { ProfileEditorView } = await import('../src/components/editor/ProfileEditorView');
      const { PublicProfileClient } = await import('../src/app/profile/[identifier]/PublicProfileClient');
      const { AvtiveDigitalCard } = await import('../src/components/card/AvtiveDigitalCard');
      const { resolveScreenModeFromSearch, buildProfileUrlForMode } = await import('../src/lib/profileScreenMode');
      const { BackgroundRenderer } = await (async () => ({
        BackgroundRenderer: await import('../src/components/editor/BackgroundRenderer'),
      }))();

      assert.strictEqual(
        BackgroundRenderer.resolveBackgroundMode({ backgroundType: 'image', customBackgroundImage: 'https://img/a.jpg' }),
        'image'
      );
      assert.strictEqual(
        BackgroundRenderer.getBackgroundDescription({ backgroundType: 'occasion', activeBackgroundThemeId: 'eid-mubarak' }),
        'Occasion · Eid Mubarak'
      );
      assert.strictEqual(
        BackgroundRenderer.getBackgroundDescription({ backgroundType: 'occasion', activeBackgroundThemeId: 'unknown-id' }),
        'Occasion theme'
      );

      // URL & Screen State helper checks
      assert.deepStrictEqual(resolveScreenModeFromSearch('?edit=true&share=true', true), {
        mode: 'edit',
        needsUrlNormalization: true,
      });
      assert.deepStrictEqual(resolveScreenModeFromSearch('?edit=true&share=true', false), {
        mode: 'share',
        needsUrlNormalization: true,
      });
      assert.deepStrictEqual(resolveScreenModeFromSearch('?edit=true', false), {
        mode: 'preview',
        needsUrlNormalization: true,
      });
      assert.strictEqual(buildProfileUrlForMode('elena-v', 'edit'), '/profile/elena-v?edit=true');
      assert.strictEqual(buildProfileUrlForMode('elena-v', 'share'), '/profile/elena-v?share=true');
      assert.strictEqual(buildProfileUrlForMode('elena-v', 'preview'), '/profile/elena-v');

      const container = dom.window.document.getElementById('p3-root')!;
      const root = createRoot(container);

      let cancelCalled = false;
      let doneSavedProfile: ProfileData | null = null;

      await React.act(async () => {
        root.render(
          React.createElement(
            ProfileEditorProvider,
            { initialProfile: clone(SAMPLE_PROFILE), userProfiles: [clone(SAMPLE_PROFILE)] },
            React.createElement(ProfileEditorView, {
              profile: clone(SAMPLE_PROFILE),
              theme: getThemeConfig('editorial'),
              onCancelClose: () => {
                cancelCalled = true;
              },
              onDoneClose: (saved) => {
                doneSavedProfile = saved;
              },
              onSavePartial: async (partial) => ({ ...SAMPLE_PROFILE, ...partial }),
            })
          )
        );
      });

      const editorEl = container.querySelector('[data-testid="profile-editor-view"]');
      assert.ok(editorEl, 'In-page ProfileEditorView container must mount');
      assert.strictEqual(container.querySelector('[role="dialog"]'), null, 'In-page editor must NOT be inside a dialog');
      assert.strictEqual(container.querySelector('[aria-modal="true"]'), null, 'In-page editor must NOT set aria-modal');
      assert.ok(!editorEl!.className.includes('fixed'), 'In-page editor must NOT use fixed overlay positioning');
      assert.ok(!editorEl!.className.includes('rounded-t-3xl'), 'In-page editor must NOT use bottom-sheet popup chrome');

      const text = container.textContent || '';
      assert.ok(text.includes('Cancel'), 'P3 header must include Cancel');
      assert.ok(text.includes('EDITING'), 'P3 header must include EDITING');
      assert.ok(text.includes('Done'), 'P3 header must include Done');
      assert.ok(text.includes('Background'), 'Background card must render');
      assert.ok(text.includes('Profile Identity'), 'Profile Identity card must render');
      assert.ok(/profile visibility/i.test(text), 'Profile Visibility card must render');
      assert.ok(text.includes('Private shows your name only'), 'Private visibility description must appear');

      // Expand background selector & verify 3 categories + Birthday occasion theme
      const changeBgBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Change background')
      );
      assert.ok(changeBgBtn, 'Change background button must be rendered');
      await React.act(async () => {
        changeBgBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      });
      const bgText = container.textContent || '';
      assert.ok(bgText.includes('Image'), 'Image category must exist');
      assert.ok(bgText.includes('Animated Video'), 'Animated Video category must exist');
      assert.ok(bgText.includes('Occasion'), 'Occasion category must exist');

      const occasionTab = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Occasion'
      );
      assert.ok(occasionTab, 'Occasion tab button must exist');
      await React.act(async () => {
        occasionTab!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      });
      assert.ok(
        (container.textContent || '').includes('Birthday'),
        'Existing Birthday occasion theme must remain available in Occasion tab'
      );

      // Expand Experience card & test + Add to Experience + Cancel unsaved prompt
      const expExpandBtn = container.querySelector('button[aria-label="Expand Experience"]');
      assert.ok(expExpandBtn, 'Experience expand toggle must exist');
      await React.act(async () => {
        expExpandBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      });
      assert.ok(
        (container.textContent || '').includes('Lead Architect'),
        'Existing experience item must render in expanded card'
      );
      const addToExpBtn = container.querySelector('[data-testid="add-to-experience"]');
      assert.ok(addToExpBtn, '+ Add to Experience button must render');
      await React.act(async () => {
        addToExpBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      });
      assert.ok(
        (container.textContent || '').includes('New Role'),
        'Clicking + Add to Experience must append editable item'
      );

      // Click Private visibility -> marks dirty, test Done saves via API
      const privateBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Private')
      );
      assert.ok(privateBtn, 'Private visibility button must exist');
      await React.act(async () => {
        privateBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      });

      // Clicking Cancel while dirty asks confirmation rather than closing blindly
      const cancelBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Cancel'
      );
      assert.ok(cancelBtn);
      await React.act(async () => {
        cancelBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      });
      assert.ok(
        (container.textContent || '').includes('Discard unsaved changes?'),
        'Cancel with dirty changes must show discard confirmation'
      );
      assert.strictEqual(cancelCalled, false, 'Cancel must wait for confirmation before closing when dirty');

      // Keep editing and click Done -> flushes & saves to real DB handler
      const keepEditingBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Keep editing'
      );
      assert.ok(keepEditingBtn);
      await React.act(async () => {
        keepEditingBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      });

      const doneBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Done'
      );
      assert.ok(doneBtn);
      await React.act(async () => {
        doneBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
        for (let i = 0; i < 30 && !doneSavedProfile; i++) {
          await new Promise((r) => setTimeout(r, 100));
        }
      });
      assert.ok(lastPutPayload, 'Done must trigger real /api/profile/update');
      const sentVisibilityPrivate = putPayloads.some(
        (p) => (p.patch?.profileVisibility ?? p.updatedData?.profileVisibility) === 'private'
      );
      assert.strictEqual(sentVisibilityPrivate, true, 'profileVisibility private must be persisted in /api/profile/update');
      assert.ok(doneSavedProfile, 'Done must resolve with saved profile');
      assert.strictEqual((doneSavedProfile as ProfileData).profileVisibility, 'private');

      // Test Cancel + Discard after making a new unsaved edit: must preserve previously saved changes
      const publicBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Public'
      );
      assert.ok(publicBtn);
      await React.act(async () => {
        publicBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      });
      await React.act(async () => {
        cancelBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      });
      const discardBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Discard'
      );
      assert.ok(discardBtn, 'Discard button must appear in confirmation bar');
      await React.act(async () => {
        discardBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      });
      assert.strictEqual(cancelCalled, true, 'Confirming Discard must call onCancelClose');

      // Render public AvtiveDigitalCard with private profile for visitor (!canEdit)
      await React.act(async () => {
        root.render(
          React.createElement(
            ProfileEditorProvider,
            { initialProfile: clone(SAMPLE_PROFILE), userProfiles: [] },
            React.createElement(AvtiveDigitalCard, {
              profile: { ...clone(SAMPLE_PROFILE), profileVisibility: 'private' },
              canEdit: false,
              isEditing: false,
              isDark: false,
              onSaveContact: () => { },
              onOpenShare: () => { },
              onOpenConnect: () => { },
              onOpenQRModal: () => { },
              onOpenResumeModal: () => { },
              onSelectProject: () => { },
            })
          )
        );
      });

      const visitorText = container.textContent || '';
      assert.ok(visitorText.includes('Elena Vance'), 'Private visitor view must show profile name');
      assert.ok(visitorText.includes('Private profile'), 'Private visitor view must indicate private state');
      assert.ok(!visitorText.includes('Zero-Color OS'), 'Private visitor view must hide projects');
      assert.ok(!visitorText.includes('elena@avtive.test'), 'Private visitor view must hide email');

      // ── 6. Full PublicProfileClient In-Page Mode Switching (preview | edit | share) & History ─
      dom.window.localStorage.clear();
      const { AppRouterContext } = await import(
        'next/dist/shared/lib/app-router-context.shared-runtime'
      );
      const mockAppRouter: any = {
        back: () => { },
        forward: () => { },
        refresh: () => { },
        push: () => { },
        replace: () => { },
        prefetch: () => { },
      };

      dom.window.history.replaceState(null, '', '/profile/phase2-tester');
      await React.act(async () => {
        root.render(
          React.createElement(
            AppRouterContext.Provider,
            { value: mockAppRouter },
            React.createElement(
              ThemeProvider,
              null,
              React.createElement(PublicProfileClient, {
                initialProfile: clone(SAMPLE_PROFILE),
                session: OWNER_USER,
                isOwner: true,
                initialIsEditing: false,
                initialIsSharing: false,
                userProfiles: [clone(SAMPLE_PROFILE)],
              })
            )
          )
        );
      });

      // Initially preview mode
      assert.ok((container.textContent || '').includes('Zero-Color OS'), 'Preview renders profile card');
      assert.strictEqual(container.querySelectorAll('[data-testid="profile-editor-view"]').length, 0);
      assert.strictEqual(container.querySelectorAll('[data-testid="unified-share-workspace"]').length, 0);

      // Phase 4: Verify section nav sits INSIDE card below Hero action buttons (no duplicate top-level nav) and uses icon-only tabs
      const desktopPanelEl = container.querySelector('#profile-scroll-panel');
      const mobilePanelEl = container.querySelector('#mobile-profile-scroll-panel');
      const desktopNav = desktopPanelEl?.querySelector('[data-testid="profile-section-tabbar"]');
      const mobileNav = mobilePanelEl?.querySelector('[data-testid="profile-section-tabbar"]');
      assert.ok(desktopNav && mobileNav, 'Section navigation must render inside both desktop and mobile profile panels');
      assert.strictEqual(
        container.querySelectorAll('[data-testid="profile-section-tabbar"]').length,
        2,
        'Must render strictly one ProfileSectionTabBar per preview layout without top-level duplicate navs'
      );
      const desktopHeroEl = desktopPanelEl?.querySelector('#section-hero');
      const desktopAboutEl = desktopPanelEl?.querySelector('#section-personalDetails');
      assert.ok(desktopHeroEl && desktopAboutEl && desktopNav, 'Hero, TabBar, and Content Sections exist in DOM');
      assert.ok(
        Boolean(desktopHeroEl.compareDocumentPosition(desktopNav) & 4), // DOCUMENT_POSITION_FOLLOWING
        'ProfileSectionTabBar must appear AFTER HeroSection action buttons'
      );
      assert.ok(
        Boolean(desktopNav.compareDocumentPosition(desktopAboutEl) & 4),
        'ProfileSectionTabBar must appear BEFORE profile content sections'
      );
      const tabButtons = Array.from(desktopNav.querySelectorAll('button[data-section-tab]')) as HTMLButtonElement[];
      assert.ok(tabButtons.length >= 4, 'Icon section buttons render');
      for (const tabBtn of tabButtons) {
        assert.ok(tabBtn.getAttribute('aria-label'), 'Each icon tab button requires aria-label');
        assert.ok(tabBtn.getAttribute('title'), 'Each icon tab button requires tooltip title');
        assert.strictEqual((tabBtn.textContent || '').trim(), '', 'Icon section tabs must not render visible text labels');
      }
      const aboutIconTab = desktopNav.querySelector('button[data-section-tab="personalDetails"]') as HTMLButtonElement | null;
      assert.ok(aboutIconTab, 'About icon tab exists');
      await React.act(async () => {
        aboutIconTab!.click();
      });
      assert.strictEqual(aboutIconTab!.getAttribute('aria-current'), 'page', 'Clicking section icon updates active state');

      // Company profile layout follows the same Hero -> Actions -> Section Nav -> Sections hierarchy
      await React.act(async () => {
        root.render(
          React.createElement(
            AppRouterContext.Provider,
            { value: mockAppRouter },
            React.createElement(
              ProfileEditorProvider,
              { initialProfile: { ...clone(SAMPLE_PROFILE), type: 'team', id: 'prof-company-ui', name: 'Acme Robotics' }, userProfiles: [] },
              React.createElement(AvtiveDigitalCard, {
                profile: { ...clone(SAMPLE_PROFILE), type: 'team', id: 'prof-company-ui', name: 'Acme Robotics' },
                canEdit: false,
                isEditing: false,
                isDark: false,
                onSaveContact: () => { },
                onOpenShare: () => { },
                onOpenConnect: () => { },
                onOpenQRModal: () => { },
                onOpenResumeModal: () => { },
                onSelectProject: () => { },
              })
            )
          )
        );
      });
      const companyNav = container.querySelector('[data-testid="profile-section-tabbar"]');
      const companyHero = container.querySelector('#section-hero');
      const companyFirstSection = container.querySelector('[data-section]');
      assert.ok(companyNav && companyHero && companyFirstSection, 'Company card renders Hero -> Section Nav -> Content');
      assert.ok(Boolean(companyHero.compareDocumentPosition(companyNav) & 4), 'Company section nav follows Hero actions');
      assert.ok(Boolean(companyNav.compareDocumentPosition(companyFirstSection) & 4), 'Company section nav precedes sections');

      // Restore full PublicProfileClient preview before switching Edit / Share modes
      await React.act(async () => {
        root.render(
          React.createElement(
            AppRouterContext.Provider,
            { value: mockAppRouter },
            React.createElement(
              ThemeProvider,
              null,
              React.createElement(PublicProfileClient, {
                initialProfile: clone(SAMPLE_PROFILE),
                session: OWNER_USER,
                isOwner: true,
                initialIsEditing: false,
                initialIsSharing: false,
                userProfiles: [clone(SAMPLE_PROFILE)],
              })
            )
          )
        );
      });

      // Switch Preview -> Edit
      const editProfileBtn = container.querySelector('button[aria-label="Edit Profile"]') as HTMLButtonElement | null;
      assert.ok(editProfileBtn, 'Edit Profile button must exist in preview header');
      await React.act(async () => {
        editProfileBtn!.click();
      });
      assert.strictEqual(dom.window.location.search, '?edit=true', 'Clicking Edit updates URL query cleanly');
      assert.strictEqual(container.querySelectorAll('[data-testid="profile-editor-view"]').length, 1, 'Exactly one in-page editor mounts');
      assert.strictEqual(container.querySelectorAll('[data-testid="unified-share-workspace"]').length, 0, 'Edit and Share cannot overlap');
      assert.strictEqual(container.querySelector('[role="dialog"]'), null, 'No popup dialog on Edit');
      assert.ok(!(container.textContent || '').includes('Zero-Color OS'), 'Preview content must be replaced during in-page Edit');

      // Cancel Edit -> Preview
      const pageCancelBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Cancel'
      );
      assert.ok(pageCancelBtn, 'In-page Cancel button must render');
      await React.act(async () => {
        pageCancelBtn!.click();
      });
      assert.strictEqual(dom.window.location.search, '', 'Cancel returns to clean profile URL');
      assert.strictEqual(container.querySelectorAll('[data-testid="profile-editor-view"]').length, 0, 'Editor unmounts on return');
      assert.ok((container.textContent || '').includes('Zero-Color OS'), 'Preview restores on Cancel');

      // Switch Preview -> Share
      const shareProfileBtn = container.querySelector('button[aria-label="Share Profile"]') as HTMLButtonElement | null;
      assert.ok(shareProfileBtn, 'Share Profile button must exist in preview header');
      await React.act(async () => {
        shareProfileBtn!.click();
        await new Promise((r) => setTimeout(r, 30));
      });
      assert.strictEqual(dom.window.location.search, '?share=true', 'Clicking Share updates URL query cleanly');
      assert.strictEqual(container.querySelectorAll('[data-testid="unified-share-workspace"]').length, 1, 'Exactly one in-page share workspace mounts');
      assert.strictEqual(container.querySelectorAll('[data-testid="profile-editor-view"]').length, 0);
      assert.strictEqual(container.querySelector('[role="dialog"]'), null, 'No popup dialog on Share');
      assert.ok(!(container.textContent || '').includes('Zero-Color OS'), 'Preview content must be replaced during in-page Share');

      // Close Share -> Preview
      const backShareBtn = container.querySelector('button[aria-label="Back to Profile"]') as HTMLButtonElement | null;
      assert.ok(backShareBtn, 'Back button must exist inside in-page share workspace');
      await React.act(async () => {
        backShareBtn!.click();
      });
      assert.strictEqual(dom.window.location.search, '', 'Closing share returns to clean profile URL');
      assert.strictEqual(container.querySelectorAll('[data-testid="unified-share-workspace"]').length, 0);
      assert.ok((container.textContent || '').includes('Zero-Color OS'), 'Preview restores after closing share');

      // Popstate Browser Back / Forward sync check
      await React.act(async () => {
        dom.window.history.replaceState(null, '', '/profile/phase2-tester?edit=true');
        dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate'));
      });
      assert.strictEqual(container.querySelectorAll('[data-testid="profile-editor-view"]').length, 1, 'Popstate opens in-page edit mode');
      await React.act(async () => {
        dom.window.history.replaceState(null, '', '/profile/phase2-tester');
        dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate'));
      });
      assert.strictEqual(container.querySelectorAll('[data-testid="profile-editor-view"]').length, 0, 'Popstate exits back to preview');

      // Non-owner visitor Share replaces preview in-page cleanly without modal overlay
      dom.window.history.replaceState(null, '', '/profile/phase2-tester');
      await React.act(async () => {
        root.render(
          React.createElement(
            AppRouterContext.Provider,
            { value: mockAppRouter },
            React.createElement(
              ThemeProvider,
              null,
              React.createElement(PublicProfileClient, {
                initialProfile: clone(SAMPLE_PROFILE),
                session: null,
                isOwner: false,
                initialIsEditing: false,
                initialIsSharing: false,
                userProfiles: [],
              })
            )
          )
        );
      });
      const visitorShareBtn = container.querySelector('button[aria-label="Share Profile"]') as HTMLButtonElement | null;
      assert.ok(visitorShareBtn, 'Visitor Share button renders in preview');
      await React.act(async () => {
        visitorShareBtn!.click();
      });
      assert.strictEqual(container.querySelectorAll('[data-testid="visitor-share-view"]').length, 1, 'Visitor share view renders in-page');
      assert.strictEqual(container.querySelector('[role="dialog"]'), null, 'Visitor share must not use popup dialog');
      assert.ok(!(container.textContent || '').includes('Zero-Color OS'), 'Visitor preview replaced during visitor share');

      // Stale SSR isOwner downgrades cleanly if /api/auth/me returns { user: null } (and avoids redundant /api/profile/list fetches)
      let profileListFetchCount = 0;
      const prevTestFetch = g.fetch;
      g.fetch = async (input: any, init?: any) => {
        const urlStr = typeof input === 'string' ? input : input?.url || '';
        if (urlStr.includes('/api/profile/list')) {
          profileListFetchCount++;
        }
        if (urlStr.includes('/api/auth/me')) {
          return new Response(JSON.stringify({ user: null, profile: null, profiles: [], onboardingCompleted: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return prevTestFetch(input, init);
      };
      dom.window.history.replaceState(null, '', '/profile/phase2-tester?share=true');
      await React.act(async () => {
        root.render(
          React.createElement(
            AppRouterContext.Provider,
            { value: mockAppRouter },
            React.createElement(
              ThemeProvider,
              null,
              React.createElement(PublicProfileClient, {
                initialProfile: clone(SAMPLE_PROFILE),
                session: OWNER_USER,
                isOwner: true,
                initialIsEditing: false,
                initialIsSharing: true,
                userProfiles: [clone(SAMPLE_PROFILE)],
              })
            )
          )
        );
      });
      await React.act(async () => {
        await new Promise((r) => setTimeout(r, 30));
      });
      assert.strictEqual(profileListFetchCount, 0, 'PublicProfileClient passes userProfiles to avoid redundant /api/profile/list fetches');
      assert.strictEqual(
        container.querySelectorAll('[data-testid="visitor-share-view"]').length,
        1,
        'PublicProfileClient downgrades stale owner share view to VisitorPublicShareView when /api/auth/me returns user: null'
      );
      g.fetch = prevTestFetch;

      await React.act(async () => {
        root.unmount();
      });
    } finally {
      g.window = prevWindow;
      g.self = prevSelf;
      g.document = prevDocument;
      Object.defineProperty(g, 'navigator', { value: prevNavigator, configurable: true, writable: true });
      g.HTMLElement = prevHTMLElement;
      g.Event = prevEvent;
      g.CustomEvent = prevCustomEvent;
      g.MutationObserver = prevMutationObserver;
      g.ResizeObserver = prevResizeObserver;
      g.localStorage = prevLocalStorage;
      g.fetch = prevFetch;
      g.IS_REACT_ACT_ENVIRONMENT = prevAct;
    }
  });

  console.log(`\n✓ Phase 2 Test Suite complete: ${passed} passed, 0 failed.\n`);
}

runTests().catch((err) => {
  console.error('\n✗ Phase 2 Test Suite FAILED:', err);
  process.exit(1);
});
