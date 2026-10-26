import assert from 'assert';
import { isProfileDirty } from '../src/lib/profileDiff';
import { ProfileData } from '../src/types/profile';

// Mock minimal baseline profile
const baseline: ProfileData = {
  id: 'user-prof-1',
  slug: 'testuser',
  name: 'Alex Morgan',
  type: 'individual',
  email: 'alex@example.com',
  avatar: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
  location: 'San Francisco, CA',
  theme: 'editorial',
  skills: ['TypeScript', 'React'],
  projects: [
    {
      id: 'proj-1',
      title: 'Avtive Card',
      description: 'Digital identity platform',
      tags: ['TypeScript', 'Next.js'],
      link: 'https://example.com'
    }
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'B.S. Computer Science',
      institution: 'Stanford',
      period: '2018 - 2022',
      year: '2022'
    }
  ],
  experiences: [
    {
      id: 'exp-1',
      company: 'Acme Corp',
      role: 'Staff Engineer',
      period: '2022 - Present',
      location: 'Remote'
    }
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Solutions Architect',
      issuer: 'Amazon Web Services',
      issued: '2023',
      expires: '2026',
      credentialId: 'AWS-12345'
    }
  ],
  languages: [
    { language: 'English', proficiency: 'Native' },
    { language: 'Spanish', proficiency: 'Conversational' }
  ],
  sectionOrder: ['personalDetails', 'skills', 'projects', 'education'],
  sectionVisibility: { personalDetails: true, skills: true },
  sharingSettings: { bio: true, skills: true } as any,
  socials: [{ platform: 'github', url: 'https://github.com/alex' }],
  socialLinks: [{ platform: 'github', url: 'https://github.com/alex' }]
};

console.log('=== RUNNING REPRODUCTION TESTS ON UNFIXED CODE ===\n');

let failedCount = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    failedCount++;
    console.log(`  [FAIL] ${name}`);
    console.log(`    ↳ Reason: ${err.message}`);
  }
}

// 1. Missing field in isProfileDirty: sectionOrder change
runTest('isProfileDirty must detect sectionOrder reordering', () => {
  const modified: ProfileData = {
    ...baseline,
    sectionOrder: ['projects', 'skills', 'personalDetails', 'education']
  };
  assert.strictEqual(
    isProfileDirty(modified, baseline),
    true,
    'Reordering sections must mark profile as dirty so changes save'
  );
});

// 2. Missing field in isProfileDirty: languages
runTest('isProfileDirty must detect language additions/edits', () => {
  const modified: ProfileData = {
    ...baseline,
    languages: [
      { language: 'English', proficiency: 'Native' },
      { language: 'German', proficiency: 'Fluent' }
    ]
  };
  assert.strictEqual(
    isProfileDirty(modified, baseline),
    true,
    'Adding or modifying languages must mark profile as dirty'
  );
});

// 3. Project tags edit omitted in isProfileDirty
runTest('isProfileDirty must detect project tags edit', () => {
  const modified: ProfileData = {
    ...baseline,
    projects: [
      {
        ...baseline.projects![0],
        tags: ['TypeScript', 'Next.js', 'MongoDB'] // added tag
      }
    ]
  };
  assert.strictEqual(
    isProfileDirty(modified, baseline),
    true,
    'Modifying project tags must mark profile as dirty'
  );
});

// 4. Experience role edit omitted in isProfileDirty (it checked "position")
runTest('isProfileDirty must detect experience role edit', () => {
  const modified: ProfileData = {
    ...baseline,
    experiences: [
      {
        ...baseline.experiences![0],
        role: 'Principal Engineer' // changed role
      }
    ]
  };
  assert.strictEqual(
    isProfileDirty(modified, baseline),
    true,
    'Modifying experience role must mark profile as dirty'
  );
});

// 5. Certification issued date edit omitted in isProfileDirty (it checked "date")
runTest('isProfileDirty must detect certification issued date edit', () => {
  const modified: ProfileData = {
    ...baseline,
    certifications: [
      {
        ...baseline.certifications![0],
        issued: '2024' // changed issued year
      }
    ]
  };
  assert.strictEqual(
    isProfileDirty(modified, baseline),
    true,
    'Modifying certification issued year must mark profile as dirty'
  );
});

console.log(`\nReproduction Results: ${failedCount} failing gaps confirmed on current code.\n`);

if (failedCount === 0) {
  process.exit(0);
} else {
  // Exit with failure code to prove reproduction
  process.exit(1);
}
