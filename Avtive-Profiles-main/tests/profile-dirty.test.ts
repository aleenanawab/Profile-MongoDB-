import assert from 'node:assert';
import { isProfileDirty } from '../src/lib/profileDiff';
import { ProfileData } from '../src/types/profile';

const baseProfile: ProfileData = {
  id: 'user_123',
  userId: 'user_123',
  name: 'Jane Doe',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  bio: 'Product Designer',
  skills: ['Figma', 'UI/UX'],
  theme: 'editorial',
  type: 'individual',
  socials: [
    { platform: 'github', url: 'https://github.com/janedoe', label: 'GitHub' }
  ],
  sectionVisibility: { personalDetails: true, skills: true }
};

console.log('--- Running isProfileDirty tests ---');

// Test 1: Identical profile is NOT dirty
assert.strictEqual(isProfileDirty(baseProfile, baseProfile), false, 'Identical profile should not be dirty');

// Test 2: Whitespace and undefined vs empty string differences are NOT dirty
const identicalSemantics: ProfileData = {
  ...baseProfile,
  bio: '  Product Designer  ',
  about: '', // undefined vs ""
  skills: [{ name: 'Figma' }, { name: 'UI/UX' }] as any, // object vs string skills normalization
  socialLinks: [
    { platform: 'github', url: 'https://github.com/janedoe ', label: 'GitHub' }
  ]
};
assert.strictEqual(isProfileDirty(identicalSemantics, baseProfile), false, 'Semantically identical profile should not be dirty');

// Test 3: Changing a field makes it dirty
const changedBio: ProfileData = {
  ...baseProfile,
  bio: 'Senior Product Designer'
};
assert.strictEqual(isProfileDirty(changedBio, baseProfile), true, 'Modified bio should be dirty');

// Test 4: Adding a skill makes it dirty
const addedSkill: ProfileData = {
  ...baseProfile,
  skills: ['Figma', 'UI/UX', 'TypeScript']
};
assert.strictEqual(isProfileDirty(addedSkill, baseProfile), true, 'Added skill should be dirty');

// Test 5: Changing visibility makes it dirty
const changedVis: ProfileData = {
  ...baseProfile,
  sectionVisibility: { personalDetails: true, skills: false }
};
assert.strictEqual(isProfileDirty(changedVis, baseProfile), true, 'Changed visibility should be dirty');

console.log('✓ All isProfileDirty tests passed successfully!');
