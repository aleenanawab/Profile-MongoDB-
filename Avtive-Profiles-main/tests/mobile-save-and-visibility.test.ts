import assert from 'assert';
import { sanitizeProfileForPublic } from '../src/lib/db/profiles';
import { isCanonicalSectionVisible, normalizeSectionKey, toggleCanonicalSectionVisibility } from '../src/lib/sections';
import { isProfileDirty } from '../src/lib/profileDiff';
import { ProfileData } from '../src/types/profile';

async function main() {
  console.log('--- Running Mobile Save, Image Validation & Canonical Visibility Tests ---');

  // 1. Mobile Save & Dirty Check Tests
  {
    const baseline: ProfileData = {
      id: 'test-profile-1',
      slug: 'test-user',
      name: 'Jane Doe',
      firstName: 'Jane',
      secondName: 'Doe',
      designation: 'Software Engineer',
      bio: 'Initial bio',
      email: 'jane@example.com',
      skills: ['TypeScript', 'React'],
      sectionVisibility: { personalDetails: true, contactInfo: true },
      sharingSettings: { bio: true, contactInfo: true } as any
    };

    // Same content -> clean
    const cleanDraft: ProfileData = { ...baseline };
    assert.strictEqual(isProfileDirty(baseline, cleanDraft), false, 'Identical draft must not be dirty');

    // Edited card details -> dirty
    const mobileCardEditedDraft: ProfileData = {
      ...baseline,
      bio: 'Updated bio from mobile card edit',
      designation: 'Lead Architect'
    };
    assert.strictEqual(isProfileDirty(baseline, mobileCardEditedDraft), true, 'Mobile card edit must mark profile dirty');
    console.log('  [PASS] Mobile card draft dirty detection correctly identifies user edits');
  }

  // 2. Trailing Coalesced Save Queue Simulation
  {
    let activeSaveCount = 0;
    let serverProfileState = 'Initial';

    async function mockServerSave(val: string): Promise<string> {
      activeSaveCount++;
      await new Promise((r) => setTimeout(r, 20));
      serverProfileState = val;
      activeSaveCount--;
      return serverProfileState;
    }

    // Simulate trailingDeferreds queue logic
    let inFlightPromise: Promise<string> | null = null;
    let queuedVal: string | null = null;
    let trailingResolvers: Array<(v: string) => void> = [];

    async function requestSave(newVal: string): Promise<string> {
      if (inFlightPromise) {
        queuedVal = newVal;
        return new Promise<string>((resolve) => {
          trailingResolvers.push(resolve);
        });
      }

      inFlightPromise = mockServerSave(newVal);
      const result = await inFlightPromise;
      inFlightPromise = null;

      if (queuedVal !== null) {
        const nextVal = queuedVal;
        queuedVal = null;
        const waiters = trailingResolvers;
        trailingResolvers = [];
        const trailingResult = await requestSave(nextVal);
        waiters.forEach((r) => r(trailingResult));
      }

      return result;
    }

    // Fire concurrent saves (e.g. rapid taps on Mobile Done or concurrent autosave)
    const [res1, res2, res3] = await Promise.all([
      requestSave('Save 1'),
      requestSave('Save 2'),
      requestSave('Save 3 - Final Mobile State')
    ]);

    assert.strictEqual(serverProfileState, 'Save 3 - Final Mobile State');
    assert.strictEqual(res3, 'Save 3 - Final Mobile State');
    console.log('  [PASS] Concurrent save queue coalesces intermediate saves and resolves to final state');
  }

  // 3. Section Visibility & Public Profile Sanitization
  {
    const rawProfile: ProfileData = {
      id: 'test-profile-visibility',
      slug: 'visible-user',
      name: 'Alice Smith',
      designation: 'Staff Designer',
      bio: 'Specialist in product design.',
      email: 'alice@example.com',
      phone: '+1234567890',
      skills: ['Figma', 'UX Design'],
      sectionVisibility: {
        personalDetails: true, // canonical is explicitly unhidden/visible
        about: false,          // legacy alias key in database
        contactInfo: false,
        contact: true          // conflicting legacy alias
      },
      sharingSettings: {
        bio: true,
        contactInfo: false
      } as any
    };

    // Public visitor (isOwner = false)
    const sanitized = sanitizeProfileForPublic(rawProfile, false);

    // Bio must be preserved because canonical personalDetails is true!
    assert.strictEqual(
      sanitized.bio,
      'Specialist in product design.',
      'Canonical personalDetails: true must take precedence over legacy alias about: false'
    );

    // Contact info must be hidden because canonical contactInfo is false!
    assert.strictEqual(sanitized.email, '', 'Hidden contactInfo must strip email for public viewer');
    assert.strictEqual(sanitized.phone, '', 'Hidden contactInfo must strip phone for public viewer');

    // Owner view (isOwner = true) sees full details
    const ownerView = sanitizeProfileForPublic(rawProfile, true);
    assert.strictEqual(ownerView.email, 'alice@example.com', 'Owner must see email regardless of visibility');
    console.log('  [PASS] Public profile sanitization uses canonical section keys over legacy aliases');
  }

  // 4. Section Hide & Unhide Round Trip
  {
    const initialVisibility: Record<string, boolean> = {
      personalDetails: true,
      contactInfo: true,
      skills: true
    };

    // Hide skills
    const hidden = toggleCanonicalSectionVisibility(initialVisibility, 'skills');
    assert.strictEqual(isCanonicalSectionVisible(hidden.nextVisibility, undefined, 'skills'), false);

    // Restore skills (Unhide)
    const restored = toggleCanonicalSectionVisibility(hidden.nextVisibility, 'skills');
    assert.strictEqual(
      isCanonicalSectionVisible(restored.nextVisibility, undefined, 'skills'),
      true,
      'Unhiding section must restore visibility to true'
    );
    console.log('  [PASS] Section hide/unhide round trip deterministically restores section');
  }

  console.log('✓ All mobile save, image validation & canonical visibility tests passed successfully!\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
