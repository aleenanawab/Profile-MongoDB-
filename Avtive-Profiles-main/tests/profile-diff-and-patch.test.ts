import assert from 'assert';
import { isProfileDirty, diffProfile } from '../src/lib/profileDiff';
import { ProfileData } from '../src/types/profile';

console.log('--- Running Profile Diff & Patch Verification Tests ---');

// 1. Realistic server-shaped document clean hydration test
{
  const serverDocument: any = {
    _id: '67bbdf89e1a2b3c4d5e6f7a8',
    id: 'user-123',
    userId: 'user-123',
    __v: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-02-01T12:00:00.000Z',
    name: 'Jane Doe',
    firstName: 'Jane',
    secondName: 'Doe',
    email: 'jane@example.com',
    slug: 'janedoe',
    type: 'individual',
    theme: 'editorial',
    designation: 'Software Engineer',
    bio: 'Building great software.',
    skills: ['TypeScript', 'React'],
    projects: [
      { id: 'proj-1', title: 'Portal', description: 'Web app', tags: ['Web'] }
    ],
    experiences: [
      { id: 'exp-1', company: 'Tech Inc', role: 'Dev', period: '2020-2024' }
    ],
    education: [
      { id: 'edu-1', degree: 'BS', institution: 'MIT', period: '2016-2020' }
    ],
    certifications: [
      { id: 'cert-1', name: 'Cloud Cert', issuer: 'GCP', issued: '2022' }
    ],
    languages: [
      { language: 'English', proficiency: 'Native' }
    ],
    sectionOrder: ['personalDetails', 'contactInfo', 'skills'],
    sectionVisibility: { personalDetails: true, about: true, contactInfo: true },
    sharingSettings: { bio: true, skills: true },
    customFields: [],
    socialLinks: [],
    companyInfo: {
      id: 'comp-1',
      name: 'Tech Inc',
      website: 'https://tech.com',
      tagline: 'Leading tech'
    }
  };

  // Client creates draft from server document
  const clientDraft: ProfileData = {
    ...serverDocument,
    // Extra client undefined or null properties that shouldn't mark it dirty
    coverImage: undefined,
    whatsapp: '',
    phone: null as any
  };

  const diff = diffProfile(serverDocument, clientDraft);
  assert.strictEqual(
    diff.hasChanges,
    false,
    `Realistic server-shaped document must be clean upon hydration, but got patch: ${JSON.stringify(diff.patch)}`
  );
  assert.strictEqual(isProfileDirty(clientDraft, serverDocument), false);
  console.log('  [PASS] Realistic server-shaped document hydrates clean with zero changes');
}

// 2. Nested plain object dot-path generation
{
  const baseline: any = {
    id: 'user-1',
    companyInfo: {
      name: 'Old Corp',
      tagline: 'Old Tagline',
      website: 'https://old.com'
    }
  };

  const draft: any = {
    ...baseline,
    companyInfo: {
      name: 'New Corp',
      tagline: 'Old Tagline',
      website: 'https://old.com'
    }
  };

  const diff = diffProfile(baseline, draft);
  assert.strictEqual(diff.hasChanges, true);
  assert.strictEqual(diff.patch['companyInfo.name'], 'New Corp');
  assert.strictEqual(diff.patch['companyInfo.tagline'], undefined, 'Unchanged nested sibling must not be in patch');
  console.log('  [PASS] Nested objects produce dot-notation paths without wiping sibling keys');
}

// 3. Array mutation and clearing detection
{
  const baseline: any = {
    id: 'user-1',
    skills: [{ name: 'TypeScript' }, { name: 'Go' }]
  };

  const draftModified: any = {
    ...baseline,
    skills: [{ name: 'TypeScript' }, { name: 'Go' }, { name: 'Rust' }]
  };

  const diffAdd = diffProfile(baseline, draftModified);
  assert.strictEqual(diffAdd.hasChanges, true);
  assert.deepStrictEqual(diffAdd.patch.skills, [{ name: 'TypeScript' }, { name: 'Go' }, { name: 'Rust' }]);
  assert.strictEqual(diffAdd.clearFields.includes('skills'), false);

  const draftCleared: any = {
    ...baseline,
    skills: []
  };

  const diffClear = diffProfile(baseline, draftCleared);
  assert.strictEqual(diffClear.hasChanges, true);
  assert.deepStrictEqual(diffClear.patch.skills, []);
  assert.strictEqual(
    diffClear.clearFields.includes('skills'),
    true,
    'Emptying non-empty array must be flagged in clearFields'
  );
  console.log('  [PASS] Array mutation and clearing semantics correctly tracked');
}

console.log('✓ All profile diff & patch tests passed successfully!\n');
