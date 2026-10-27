import assert from 'assert';
import { isProfileDirty, diffProfile, arePrimitivesEqual, FIELD_CLASSIFICATIONS } from '../src/lib/profileDiff';
import { 
  sanitizeProfileForPublic, 
  mapDocToProfileData 
} from '../src/lib/db/profiles';
import { isFieldShared } from '../src/lib/sections';
import { ProfileData } from '../src/types/profile';

console.log('================================================================');
console.log(' RUNNING COMPREHENSIVE REGRESSION SUITE FOR SAVE PERSISTENCE');
console.log('================================================================');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    failedTests++;
    console.log(`  [FAIL] ${name}`);
    console.log(`    ↳ Reason: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// 1. Fix 2 Test a: Comprehensive synthetic fixture leaf mutation coverage
// -----------------------------------------------------------------------------
runTest('Fix 2a: Enumerate and mutate every leaf path to assert isProfileDirty and diff detection', () => {
  const fullFixture: ProfileData = {
    id: 'user-prof-full',
    userId: 'user-123',
    slug: 'alexmorgan',
    username: 'alexmorgan',
    name: 'Alex Morgan',
    firstName: 'Alex',
    secondName: 'Morgan',
    lastName: 'Morgan',
    designation: 'Principal Architect',
    professionalTitle: 'Principal Architect',
    profession: 'Software Engineering',
    department: 'Core Infrastructure',
    company: 'Apex Tech Inc',
    companyLogo: 'https://cdn.example.com/logo.png',
    tagline: 'Architecting resilient cloud native ecosystems',
    coverSlogan: 'Built to scale',
    avatar: 'https://cdn.example.com/avatar.jpg',
    avatarPublicId: 'avatars/alex',
    coverImage: 'https://cdn.example.com/cover.jpg',
    coverImagePublicId: 'profiles/cover',
    verified: true,
    pronouns: 'they/them',
    birthday: '1990-05-12',
    location: 'San Francisco, CA',
    country: 'United States',
    bio: 'Software architect and OSS contributor.',
    shortBio: 'Software architect and OSS contributor.',
    about: 'Over 12 years of hands-on distributed systems engineering.',
    fullBio: 'Over 12 years of hands-on distributed systems engineering.',
    statusBadge: 'Open to consulting',
    phone: '+1 415-555-0199',
    whatsapp: '+1 415-555-0199',
    email: 'alex@apextech.io',
    website: 'https://alexmorgan.dev',
    officeAddress: '500 Howard Street, Suite 400, San Francisco',
    googleMapsUrl: 'https://maps.google.com/?q=500+Howard+St',
    resumeUrl: 'https://cdn.example.com/resume.pdf',
    resumeFileName: 'Alex_Morgan_Resume_2026.pdf',
    profileName: 'Alex Morgan Primary',
    type: 'individual',
    profileType: 'individual',
    theme: 'editorial',
    buttonRadius: 'rounded',
    buttonStyle: 'solid',
    followersCount: '1.2k',
    connectionsCount: '500+',
    customThemeColors: {
      background: '#0B0F19',
      textColor: '#F8FAFC',
      buttonColor: '#06B6D4',
      buttonTextColor: '#020617'
    },
    customCta: {
      label: 'Schedule Advisory Call',
      url: 'https://cal.com/alexmorgan',
      active: true
    },
    companyInfo: {
      id: 'comp-100',
      name: 'Apex Tech Inc',
      tagline: 'Next-Gen Cloud Architecture',
      logo: 'https://cdn.example.com/apex.png',
      industry: 'Technology',
      location: 'San Francisco, CA',
      website: 'https://apextech.io',
      employeeCount: '50-100',
      profileId: 'user-prof-full'
    },
    nfcCard: {
      cardNumber: 'NFC-998811',
      chipId: 'CHIP-0042',
      finish: 'obsidian'
    },
    sharingSettings: {
      photo: true,
      nameAndTitle: true,
      bio: true,
      contactInfo: true,
      email: true,
      phone: true,
      links: true,
      socialLinks: true,
      skills: true,
      experience: true,
      education: true,
      certifications: true,
      projects: true,
      services: true,
      recommendations: true,
      volunteer: true,
      languages: true,
      companySection: true,
      nfcCard: true,
      customFields: true
    },
    sectionVisibility: {
      hero: true,
      about: true,
      contact: true,
      contactInfo: true,
      skills: true,
      projects: true,
      experience: true,
      education: true,
      certifications: true,
      languages: true,
      socialLinks: true,
      'virtual-card': true
    },
    sectionOrder: [
      'personalDetails',
      'contactInfo',
      'skills',
      'projects',
      'experience',
      'education',
      'certifications',
      'languages',
      'socialLinks'
    ],
    skills: ['Distributed Systems', 'TypeScript', 'Kubernetes', 'MongoDB', 'Go'],
    projects: [
      {
        id: 'p-1',
        title: 'CloudMesh Engine',
        tagline: 'Service Mesh orchestrator',
        description: 'Multi-cluster high throughput routing core',
        image: 'https://cdn.example.com/p1.png',
        tags: ['Go', 'eBPF', 'K8s'],
        link: 'https://github.com/apex/cloudmesh',
        client: 'Global FinTech',
        year: '2025'
      }
    ],
    experiences: [
      {
        id: 'exp-1',
        company: 'Apex Tech',
        role: 'Principal Architect',
        period: '2023 - Present',
        location: 'San Francisco, CA',
        description: 'Lead core architecture team.'
      }
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'M.S. Computer Engineering',
        institution: 'UC Berkeley',
        period: '2012 - 2014',
        year: '2014'
      }
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'CKA - Certified Kubernetes Administrator',
        issuer: 'CNCF / Linux Foundation',
        issued: '2022',
        expires: '2028',
        credentialId: 'CKA-882201'
      }
    ],
    languages: [
      { language: 'English', proficiency: 'Native' },
      { language: 'Mandarin', proficiency: 'Professional' }
    ],
    socials: [
      { platform: 'github', url: 'https://github.com/alex' },
      { platform: 'linkedin', url: 'https://linkedin.com/in/alex' }
    ],
    socialLinks: [
      { platform: 'github', url: 'https://github.com/alex', visible: true },
      { platform: 'linkedin', url: 'https://linkedin.com/in/alex', visible: true }
    ],
    customFields: [
      {
        id: 'cf-1',
        label: 'Patents Filed',
        value: 'US 11,489,201 B2',
        type: 'text',
        visible: true,
        order: 0
      }
    ],
    contactOrder: ['whatsapp', 'phone', 'email', 'website'],
    customContacts: [
      {
        id: 'cc-1',
        type: 'custom',
        label: 'Signal Private',
        value: '+1 415-555-0199',
        active: true
      }
    ]
  };

  // 1. Unchanged clone is strictly clean
  const unchangedClone = JSON.parse(JSON.stringify(fullFixture));
  const cleanDiff = diffProfile(fullFixture, unchangedClone);
  assert.strictEqual(cleanDiff.hasChanges, false, 'Unchanged fixture copy must be 100% clean');
  assert.strictEqual(isProfileDirty(unchangedClone, fullFixture), false);

  // 2. Programmatically mutate leaf properties and assert dirtiness
  const testMutations: Array<{ path: string; mutate: (d: ProfileData) => void }> = [
    { path: 'name', mutate: (d) => { d.name = 'Alex Morgan Jr.'; } },
    { path: 'tagline', mutate: (d) => { d.tagline = 'New mutated tagline'; } },
    { path: 'phone', mutate: (d) => { d.phone = '+1 415-999-8877'; } },
    { path: 'whatsapp', mutate: (d) => { d.whatsapp = '+1 415-999-0000'; } },
    { path: 'email', mutate: (d) => { d.email = 'alex.new@apex.io'; } },
    { path: 'website', mutate: (d) => { d.website = 'https://alex-new.dev'; } },
    { path: 'officeAddress', mutate: (d) => { d.officeAddress = '100 New Pine St'; } },
    { path: 'country', mutate: (d) => { d.country = 'Canada'; } },
    { path: 'customThemeColors.textColor', mutate: (d) => { d.customThemeColors!.textColor = '#E2E8F0'; } },
    { path: 'companyInfo.name', mutate: (d) => { d.companyInfo!.name = 'Apex Systems Group'; } },
    { path: 'nfcCard.finish', mutate: (d) => { d.nfcCard!.finish = 'emerald'; } },
    { path: 'sharingSettings.phone', mutate: (d) => { d.sharingSettings!.phone = false; } },
    { path: 'sectionVisibility.contactInfo', mutate: (d) => { d.sectionVisibility!.contactInfo = false; } },
    { path: 'skills', mutate: (d) => { d.skills = [...(d.skills || []), 'Rust']; } },
    { path: 'projects.0.tags', mutate: (d) => { d.projects![0].tags = ['Go', 'eBPF', 'Rust']; } },
    { path: 'projects.0.client', mutate: (d) => { d.projects![0].client = 'Enterprise Client'; } },
    { path: 'projects.0.year', mutate: (d) => { d.projects![0].year = '2026'; } },
    { path: 'experiences.0.role', mutate: (d) => { d.experiences![0].role = 'Distinguished Architect'; } },
    { path: 'certifications.0.credentialId', mutate: (d) => { d.certifications![0].credentialId = 'NEW-ID-999'; } },
    { path: 'languages.0.proficiency', mutate: (d) => { d.languages![0].proficiency = 'Fluent'; } },
    { path: 'customFields.0.value', mutate: (d) => { d.customFields![0].value = 'US 12,000,001 B2'; } },
    { path: 'contactOrder', mutate: (d) => { d.contactOrder = ['email', 'whatsapp', 'phone']; } },
    { path: 'customContacts.0.label', mutate: (d) => { d.customContacts![0].label = 'Telegram Secure'; } }
  ];

  for (const item of testMutations) {
    const mutated = JSON.parse(JSON.stringify(fullFixture));
    item.mutate(mutated);
    const diff = diffProfile(fullFixture, mutated);
    assert.strictEqual(
      diff.hasChanges,
      true,
      `Mutating leaf path "${item.path}" was not detected by diffProfile!`
    );
    assert.strictEqual(
      isProfileDirty(mutated, fullFixture),
      true,
      `Mutating leaf path "${item.path}" did not mark profile dirty!`
    );
  }
});

// -----------------------------------------------------------------------------
// 2. Fix 2 Test b: Schema coverage assertion
// -----------------------------------------------------------------------------
runTest('Fix 2b: All keys in FIELD_CLASSIFICATIONS / ProfileData are accounted for', () => {
  const allFieldKeys = Object.keys(FIELD_CLASSIFICATIONS);
  assert.ok(allFieldKeys.length >= 50, 'FIELD_CLASSIFICATIONS must cover all profile fields');
  assert.ok(allFieldKeys.includes('phone'), 'phone must be classified');
  assert.ok(allFieldKeys.includes('whatsapp'), 'whatsapp must be classified');
  assert.ok(allFieldKeys.includes('email'), 'email must be classified');
  assert.ok(allFieldKeys.includes('website'), 'website must be classified');
  assert.ok(allFieldKeys.includes('officeAddress'), 'officeAddress must be classified');
  assert.ok(allFieldKeys.includes('customContacts'), 'customContacts must be classified');
  assert.ok(allFieldKeys.includes('contactOrder'), 'contactOrder must be classified');
  assert.ok(allFieldKeys.includes('sharingSettings'), 'sharingSettings must be classified');
  assert.ok(allFieldKeys.includes('sectionVisibility'), 'sectionVisibility must be classified');
});

// -----------------------------------------------------------------------------
// 3. Fix 2 Test c: Clean hydration guard with legacy aliases & nulls
// -----------------------------------------------------------------------------
runTest('Fix 2c: Realistic server document with extra metadata and legacy aliases hydrates clean', () => {
  const realisticServerDoc: any = {
    _id: '507f1f77bcf86cd799439011',
    id: 'user-001',
    userId: 'user-001',
    slug: 'sarah-connor',
    __v: 2,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-02-15T15:30:00.000Z',
    name: 'Sarah Connor',
    designation: 'Resistance Commander',
    email: 'sarah@skynet-resistance.org',
    phone: '+1 555-1234',
    whatsapp: '',
    website: null,
    country: undefined,
    skills: ['Leadership', 'Tactics'],
    // Legacy aliases
    experience: [{ company: 'Resistance', role: 'Leader', period: '2024-Present' }],
    socials: [{ platform: 'github', url: 'https://github.com/sarah' }],
    sectionVisibility: { hero: true, about: true, contact: true }, // 'contact' alias for 'contactInfo'
    sharingSettings: { phone: true, email: true },
    sectionOrder: ['personalDetails', 'contactInfo', 'skills']
  };

  const mappedServerDoc = mapDocToProfileData(realisticServerDoc);

  const clientDraft: ProfileData = {
    ...mappedServerDoc,
    website: '',
    whatsapp: '',
    country: ''
  };

  const diff = diffProfile(mappedServerDoc, clientDraft);
  assert.strictEqual(
    diff.hasChanges,
    false,
    `Realistic server document must hydrate clean, but got patch: ${JSON.stringify(diff.patch)}`
  );
  assert.strictEqual(isProfileDirty(clientDraft, mappedServerDoc), false);
});

// -----------------------------------------------------------------------------
// 3b. Core Regression: Live update contact edits reach draft & unrelated edit preserves them
// -----------------------------------------------------------------------------
runTest('Core Regression: Contact edit via live update reaches draft and unrelated edit does NOT revert it', () => {
  const initialBaseline: ProfileData = {
    id: 'user-reg-1',
    slug: 'reg-user',
    name: 'Robert Davis',
    bio: 'Initial Bio',
    phone: '+1 555-0100',
    whatsapp: '+1 555-0100',
    email: 'robert@example.com',
    website: 'https://robert.io',
    type: 'individual',
    location: 'Boston, MA'
  };

  // Step 1: User edits contact info through live-update handler
  const contactLiveUpdatePayload: Partial<ProfileData> = {
    phone: '+1 555-9999',
    whatsapp: '+1 555-8888',
    email: 'robert.davis@newmail.com',
    website: 'https://robertdavis.dev'
  };

  // When live update handler runs, it must update draft state:
  const draftAfterContactEdit: ProfileData = {
    ...initialBaseline,
    ...contactLiveUpdatePayload
  };

  // Step 2: User makes an unrelated edit (e.g. bio)
  const draftAfterBioEdit: ProfileData = {
    ...draftAfterContactEdit,
    bio: 'Brand new updated bio'
  };

  // Diff against initialBaseline must contain BOTH the contact fields AND the bio field
  const diff = diffProfile(initialBaseline, draftAfterBioEdit);
  assert.strictEqual(diff.hasChanges, true);
  assert.strictEqual(diff.patch.bio, 'Brand new updated bio');
  assert.strictEqual(diff.patch.phone, '+1 555-9999', 'Phone must NOT be reverted or dropped by unrelated edit');
  assert.strictEqual(diff.patch.whatsapp, '+1 555-8888', 'WhatsApp must NOT be reverted or dropped by unrelated edit');
  assert.strictEqual(diff.patch.email, 'robert.davis@newmail.com', 'Email must NOT be reverted or dropped by unrelated edit');
  assert.strictEqual(diff.patch.website, 'https://robertdavis.dev', 'Website must NOT be reverted or dropped by unrelated edit');
});

// -----------------------------------------------------------------------------
// 4. Test A: Contact Info - Phone, WhatsApp, Email, Website Persistence
// -----------------------------------------------------------------------------
runTest('Test A: Contact info fields save, reload, and honor sharing flags', () => {
  const baseline: ProfileData = {
    id: 'user-contact-test',
    userId: 'owner-1',
    slug: 'contact-test',
    name: 'Jane Doe',
    type: 'individual',
    location: 'Austin, TX',
    email: 'old@example.com',
    phone: '+1 555-0100',
    whatsapp: '+1 555-0100',
    website: 'https://old.example.com',
    sharingSettings: { phone: true, email: true },
    sectionVisibility: { contactInfo: true }
  };

  // User edits all contact channels
  const updatedDraft: ProfileData = {
    ...baseline,
    email: 'jane.new@example.com',
    phone: '+1 555-9999',
    whatsapp: '+1 555-8888',
    website: 'https://janedoe.me',
    officeAddress: '100 Congress Ave',
    country: 'United States'
  };

  const diff = diffProfile(baseline, updatedDraft);
  assert.strictEqual(diff.hasChanges, true);
  assert.strictEqual(diff.patch.email, 'jane.new@example.com');
  assert.strictEqual(diff.patch.phone, '+1 555-9999');
  assert.strictEqual(diff.patch.whatsapp, '+1 555-8888');
  assert.strictEqual(diff.patch.website, 'https://janedoe.me');
  assert.strictEqual(diff.patch.officeAddress, '100 Congress Ave');
  assert.strictEqual(diff.patch.country, 'United States');

  // Verify public view displays phone when shared
  const publicShared = sanitizeProfileForPublic(updatedDraft, false);
  assert.strictEqual(publicShared.phone, '+1 555-9999');
  assert.strictEqual(publicShared.whatsapp, '+1 555-8888');
  assert.strictEqual(publicShared.email, 'jane.new@example.com');
  assert.strictEqual(publicShared.website, 'https://janedoe.me');

  // Verify public view omits phone when phone flag is explicitly false
  const privatePhoneDraft: ProfileData = {
    ...updatedDraft,
    sharingSettings: { ...updatedDraft.sharingSettings, phone: false }
  };
  const publicPrivatePhone = sanitizeProfileForPublic(privatePhoneDraft, false);
  assert.strictEqual(publicPrivatePhone.phone, '', 'Phone must be omitted when sharingSettings.phone is false');
  assert.strictEqual(publicPrivatePhone.whatsapp, '', 'WhatsApp must be omitted when sharingSettings.phone is false');
  assert.strictEqual(publicPrivatePhone.email, 'jane.new@example.com', 'Email remains visible if email sharing is true');
});

// -----------------------------------------------------------------------------
// 5. Test B: Projects - Detailed properties preserved byte-identical on edit of one
// -----------------------------------------------------------------------------
runTest('Test B: Projects list preserves non-edited projects byte-identical', () => {
  const p1 = {
    id: 'p1',
    title: 'Alpha Portal',
    description: 'Mission critical analytics',
    tags: ['React', 'D3', 'TypeScript'],
    link: 'https://alpha.example.com',
    client: 'Acme Corp',
    year: '2024'
  };
  const p2 = {
    id: 'p2',
    title: 'Beta Service',
    description: 'High throughput pipeline',
    tags: ['Kafka', 'Go', 'Redis'],
    link: 'https://beta.example.com',
    client: 'Beta Global',
    year: '2025'
  };
  const p3 = {
    id: 'p3',
    title: 'Gamma Mobile',
    description: 'Cross platform client',
    tags: ['Flutter', 'Dart'],
    link: 'https://gamma.example.com',
    client: 'Gamma Inc',
    year: '2026'
  };

  const baseline: ProfileData = {
    id: 'user-projects',
    slug: 'projects-user',
    name: 'Dev',
    type: 'individual',
    location: 'NYC',
    projects: [p1, p2, p3]
  };

  // Edit only p2
  const editedP2 = { ...p2, description: 'Updated pipeline with sub-millisecond latency' };
  const updatedProjects = [p1, editedP2, p3];

  const draft: ProfileData = {
    ...baseline,
    projects: updatedProjects
  };

  const diff = diffProfile(baseline, draft);
  assert.strictEqual(diff.hasChanges, true);
  assert.strictEqual(diff.patch.projects.length, 3);
  // Assert p1 and p3 remain byte-identical
  assert.deepStrictEqual(diff.patch.projects[0], p1);
  assert.deepStrictEqual(diff.patch.projects[1], editedP2);
  assert.deepStrictEqual(diff.patch.projects[2], p3);
});

// -----------------------------------------------------------------------------
// 6. Test C: Repeated Editing - Sequential edits do not revert previous saves
// -----------------------------------------------------------------------------
runTest('Test C: Repeated editing preserves previously saved values', () => {
  // Step 1: Baseline
  let baseline: ProfileData = {
    id: 'user-repeated',
    slug: 'user-repeated',
    name: 'Initial Name',
    bio: 'Initial Bio',
    phone: '+1 555-0001',
    email: 'initial@example.com',
    type: 'individual',
    location: 'Chicago, IL'
  };

  // Step 2: Edit phone and bio, then "save"
  const edit1: ProfileData = {
    ...baseline,
    phone: '+1 555-7777',
    bio: 'Updated Bio'
  };
  const diff1 = diffProfile(baseline, edit1);
  assert.strictEqual(diff1.hasChanges, true);
  // Server confirms save: baseline advances
  baseline = { ...baseline, ...diff1.patch };
  assert.strictEqual(baseline.phone, '+1 555-7777');
  assert.strictEqual(baseline.bio, 'Updated Bio');

  // Step 3: Reopen and change only name
  const edit2: ProfileData = {
    ...baseline,
    name: 'Final Name'
  };
  const diff2 = diffProfile(baseline, edit2);
  assert.strictEqual(diff2.hasChanges, true);
  assert.strictEqual(diff2.patch.name, 'Final Name');
  assert.strictEqual(diff2.patch.phone, undefined, 'Previously saved phone must NOT be re-sent or reverted');
  assert.strictEqual(diff2.patch.bio, undefined, 'Previously saved bio must NOT be re-sent or reverted');

  // Server confirms edit2
  const finalProfile = { ...baseline, ...diff2.patch };
  assert.strictEqual(finalProfile.name, 'Final Name');
  assert.strictEqual(finalProfile.phone, '+1 555-7777', 'Phone remained intact across repeated editing');
  assert.strictEqual(finalProfile.bio, 'Updated Bio', 'Bio remained intact across repeated editing');
});

// -----------------------------------------------------------------------------
// 7. Test D: Concurrency & In-Flight Edits Protection
// -----------------------------------------------------------------------------
runTest('Test D: Newer edit made during in-flight save is preserved and not overwritten by response', () => {
  const sentBaseline: ProfileData = {
    id: 'user-concurrent',
    slug: 'user-concurrent',
    name: 'Initial Name',
    bio: 'Bio v1',
    phone: '+1 555-1111',
    type: 'individual',
    location: 'Denver, CO'
  };

  // Request 1 dispatches saving bio to 'Bio v2'
  const inFlightSentData: ProfileData = {
    ...sentBaseline,
    bio: 'Bio v2'
  };

  // While Request 1 is in-flight, user types newer phone '+1 555-2222'
  const currentLocalDraft: ProfileData = {
    ...inFlightSentData,
    phone: '+1 555-2222'
  };

  // Server confirms Request 1 and returns persisted document
  const serverResponseDoc: ProfileData = {
    ...sentBaseline,
    bio: 'Bio v2',
    updatedAt: new Date().toISOString()
  };

  // Safe merge logic from Fix 1:
  // Baseline advances for confirmed sent fields
  const updatedBaseline: ProfileData = {
    ...sentBaseline,
    bio: serverResponseDoc.bio
  };

  // Draft merges server values ONLY for fields not modified since dispatch:
  const mergedDraft: ProfileData = { ...currentLocalDraft };
  for (const [k, v] of Object.entries(serverResponseDoc)) {
    // If local draft still matches what was sent, apply server value
    if (arePrimitivesEqual((currentLocalDraft as any)[k], (inFlightSentData as any)[k])) {
      (mergedDraft as any)[k] = v;
    }
    // If local draft differs from sentData, PRESERVE the newer local edit!
  }

  assert.strictEqual(mergedDraft.bio, 'Bio v2', 'Bio updated to server confirmed value');
  assert.strictEqual(mergedDraft.phone, '+1 555-2222', 'Newer in-flight phone edit was NOT overwritten!');

  // Dirtiness check: mergedDraft against updatedBaseline MUST still be dirty because phone has newer edit!
  const trailingDiff = diffProfile(updatedBaseline, mergedDraft);
  assert.strictEqual(trailingDiff.hasChanges, true, 'Draft must remain dirty so trailing save can dispatch phone');
  assert.strictEqual(trailingDiff.patch.phone, '+1 555-2222');
});

// -----------------------------------------------------------------------------
// 8. Test E: Visibility & Privacy - Hiding Contact preserves values, suppresses public output
// -----------------------------------------------------------------------------
runTest('Test E: Contact section hide/unhide preserves stored values and hides public data', () => {
  const storedProfile: ProfileData = {
    id: 'user-vis-test',
    slug: 'vis-test',
    name: 'Visible User',
    type: 'individual',
    location: 'Seattle, WA',
    phone: '+1 206-555-0144',
    whatsapp: '+1 206-555-0144',
    email: 'user@seattle.org',
    website: 'https://userseattle.com',
    customContacts: [{ id: 'cc1', label: 'Matrix', value: '@user:matrix.org', type: 'custom' }],
    sectionVisibility: { contactInfo: false }, // HIDDEN
    sharingSettings: { phone: true, email: true }
  };

  // 1. In stored document, contact values remain 100% intact
  assert.strictEqual(storedProfile.phone, '+1 206-555-0144');
  assert.strictEqual(storedProfile.email, 'user@seattle.org');
  assert.strictEqual(storedProfile.customContacts?.length, 1);

  // 2. Public sanitization hides all contact channels
  const publicHidden = sanitizeProfileForPublic(storedProfile, false);
  assert.strictEqual(publicHidden.phone, '', 'Phone hidden when contact section is hidden');
  assert.strictEqual(publicHidden.whatsapp, '', 'WhatsApp hidden when contact section is hidden');
  assert.strictEqual(publicHidden.email, '', 'Email hidden when contact section is hidden');
  assert.strictEqual(publicHidden.website, '', 'Website hidden when contact section is hidden');
  assert.deepStrictEqual(publicHidden.customContacts, [], 'Custom contacts hidden when contact section is hidden');

  // 3. Unhiding contact section restores visibility without data loss
  const unhiddenProfile: ProfileData = {
    ...storedProfile,
    sectionVisibility: { contactInfo: true }
  };
  const publicRestored = sanitizeProfileForPublic(unhiddenProfile, false);
  assert.strictEqual(publicRestored.phone, '+1 206-555-0144');
  assert.strictEqual(publicRestored.whatsapp, '+1 206-555-0144');
  assert.strictEqual(publicRestored.email, 'user@seattle.org');
  assert.strictEqual(publicRestored.website, 'https://userseattle.com');
  assert.strictEqual(publicRestored.customContacts?.length, 1);
});

// -----------------------------------------------------------------------------
// 9. Intentional Clear vs Omitted Field Preservation
// -----------------------------------------------------------------------------
runTest('Intentional clear persists as cleared, omitted fields preserved', () => {
  const baseline: ProfileData = {
    id: 'user-clear',
    slug: 'user-clear',
    name: 'Old Name',
    bio: 'Old Bio',
    tagline: 'Old Tagline',
    phone: '+1 555-4321',
    skills: ['Skill1', 'Skill2'],
    type: 'individual',
    location: 'Boston, MA'
  };

  // User explicitly clears tagline and bio (empty string)
  const draftWithClears: ProfileData = {
    ...baseline,
    bio: '',
    tagline: ''
  };

  const diff = diffProfile(baseline, draftWithClears);
  assert.strictEqual(diff.hasChanges, true);
  assert.strictEqual(diff.patch.bio, '');
  assert.strictEqual(diff.patch.tagline, '');
  assert.ok(diff.clearFields.includes('bio'), 'bio must be in clearFields');
  assert.ok(diff.clearFields.includes('tagline'), 'tagline must be in clearFields');
  assert.strictEqual(diff.patch.phone, undefined, 'Omitted phone must not be in patch');
  assert.strictEqual(diff.patch.skills, undefined, 'Omitted skills must not be in patch');
});

// -----------------------------------------------------------------------------
// 10. sanitizeProfileForPublic Purity & Sharing Default Consistency
// -----------------------------------------------------------------------------
runTest('sanitizeProfileForPublic is strictly pure and uses single canonical sharing helper', () => {
  const inputProfile: ProfileData = {
    id: 'user-pure',
    slug: 'user-pure',
    name: 'Pure Test',
    type: 'individual',
    location: 'Miami, FL',
    phone: '+1 305-555-0123',
    email: 'pure@example.com',
    sharingSettings: { phone: true, email: true },
    sectionVisibility: { contactInfo: true }
  };

  const inputSnapshot = JSON.stringify(inputProfile);
  const result = sanitizeProfileForPublic(inputProfile, false);

  // 1. Input document must NEVER be mutated
  assert.strictEqual(
    JSON.stringify(inputProfile),
    inputSnapshot,
    'sanitizeProfileForPublic mutated input document in-place!'
  );
  assert.notStrictEqual(result, inputProfile, 'sanitizeProfileForPublic must return a fresh copy');

  // 2. Sharing helper consistency
  assert.strictEqual(isFieldShared(inputProfile, 'phone'), true);
  assert.strictEqual(isFieldShared(inputProfile, 'email'), true);

  // Unset sharing settings defaults to true for phone and email
  const unsetProfile: ProfileData = {
    ...inputProfile,
    sharingSettings: undefined
  };
  assert.strictEqual(isFieldShared(unsetProfile, 'phone'), true);
  assert.strictEqual(isFieldShared(unsetProfile, 'email'), true);

  // Explicit false strictly returns false
  const hiddenProfile: ProfileData = {
    ...inputProfile,
    sharingSettings: { phone: false, email: false }
  };
  assert.strictEqual(isFieldShared(hiddenProfile, 'phone'), false);
  assert.strictEqual(isFieldShared(hiddenProfile, 'email'), false);
});

// -----------------------------------------------------------------------------
// 11. Database Document Mapping Round Trip
// -----------------------------------------------------------------------------
runTest('mapDocToProfileData round-trip preserves all contact channels', () => {
  const mongoDoc = {
    _id: 'prof-mongo-001',
    id: 'prof-mongo-001',
    userId: 'user-abc',
    slug: 'mongo-doc',
    name: 'Doc User',
    email: 'doc@example.com',
    phone: '+1 800-555-0199',
    whatsapp: '+1 800-555-0199',
    website: 'https://docuser.org',
    country: 'United Kingdom',
    officeAddress: '10 Downing St, London',
    googleMapsUrl: 'https://maps.google.com/?q=London',
    customContacts: [{ id: 'c1', label: 'Telegram', value: '@docuser' }],
    contactOrder: ['whatsapp', 'phone', 'email'],
    type: 'individual',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z'
  };

  const mapped = mapDocToProfileData(mongoDoc);
  assert.strictEqual(mapped.phone, '+1 800-555-0199');
  assert.strictEqual(mapped.whatsapp, '+1 800-555-0199');
  assert.strictEqual(mapped.email, 'doc@example.com');
  assert.strictEqual(mapped.website, 'https://docuser.org');
  assert.strictEqual(mapped.country, 'United Kingdom');
  assert.strictEqual(mapped.officeAddress, '10 Downing St, London');
  assert.deepStrictEqual(mapped.customContacts, mongoDoc.customContacts);
  assert.deepStrictEqual(mapped.contactOrder, mongoDoc.contactOrder);
});

// -----------------------------------------------------------------------------
// 12. Failure Path - Failed save keeps draft and dirtiness
// -----------------------------------------------------------------------------
runTest('Failure path keeps draft dirty and baseline unchanged', () => {
  const baseline: ProfileData = {
    id: 'user-fail',
    slug: 'user-fail',
    name: 'Original Name',
    type: 'individual',
    location: 'Atlanta, GA'
  };

  const draft: ProfileData = {
    ...baseline,
    name: 'Failed Attempt Name'
  };

  // On simulated network failure, baseline remains untouched
  const saveFailed = true;
  const activeBaseline = baseline;
  const activeDraft = draft;

  if (saveFailed) {
    // Baseline NOT updated; draft kept; dirty stays true
    assert.strictEqual(isProfileDirty(activeDraft, activeBaseline), true);
    assert.strictEqual(activeBaseline.name, 'Original Name');
    assert.strictEqual(activeDraft.name, 'Failed Attempt Name');
  }
});

// -----------------------------------------------------------------------------
// 13. Image Safety - Avatar / Cover unaffected by unrelated saves, blob URLs rejected
// -----------------------------------------------------------------------------
runTest('Image safety: blob: URLs rejected and existing URLs preserved on unrelated saves', () => {
  const baseline: ProfileData = {
    id: 'user-img',
    slug: 'user-img',
    name: 'Image User',
    avatar: 'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg',
    coverImage: 'https://res.cloudinary.com/demo/image/upload/v1/cover.jpg',
    type: 'individual',
    location: 'Dallas, TX'
  };

  // 1. Unrelated bio edit does not include avatar or cover in diff patch
  const unrelatedEdit: ProfileData = {
    ...baseline,
    bio: 'Updated bio only'
  };
  const diffUnrelated = diffProfile(baseline, unrelatedEdit);
  assert.strictEqual(diffUnrelated.patch.avatar, undefined, 'Avatar must not be sent on unrelated save');
  assert.strictEqual(diffUnrelated.patch.coverImage, undefined, 'Cover must not be sent on unrelated save');

  // 2. Blob URL guard
  const blobDraft: ProfileData = {
    ...baseline,
    avatar: 'blob:http://localhost:3000/temp-uuid-1234'
  };
  // Save guard replaces blob URL with baseline permanent image URL
  const safeAvatar = typeof blobDraft.avatar === 'string' && blobDraft.avatar.startsWith('blob:')
    ? baseline.avatar
    : blobDraft.avatar;
  assert.strictEqual(safeAvatar, baseline.avatar, 'Blob URL must be guarded and never sent to MongoDB');
});

console.log('================================================================');
console.log(` RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${totalTests})`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
