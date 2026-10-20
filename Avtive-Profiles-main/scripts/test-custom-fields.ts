import {
  getProfileByIdOrSlug,
  sanitizeProfileForPublic,
  updateProfile,
  createProfileForUser,
  deleteProfile,
  DEFAULT_SHARING_SETTINGS,
  DEFAULT_SECTION_ORDER
} from '../src/lib/db';
import { CustomFieldItem } from '../src/types/profile';

async function runCustomFieldTests() {
  console.log('====================================================');
  console.log('CUSTOM FIELD FEATURE AUTOMATED VALIDATION SUITE');
  console.log('Testing Title, Content, DnD, Visibility, and Persistence');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  const testUserId = `cf_test_user_${Date.now()}`;
  let testProfileId = '';
  let testProfileSlug = '';

  try {
    // 1. Create a test profile
    console.log('[1] Creating test profile...');
    const profile = await createProfileForUser(testUserId, {
      fullName: 'Dr. Jane Morgan',
      firstName: 'Jane',
      secondName: 'Morgan',
      professionalTitle: 'Lead AI Researcher',
      theme: 'editorial'
    });

    testProfileId = profile.id;
    testProfileSlug = profile.slug;
    assert(Boolean(profile && profile.id), 'Test profile created successfully');

    // 2. Define Custom Fields with Title, Content, Type, and Visibility
    console.log('\n[2] Adding Custom Fields with Title & Content...');
    const initialCustomFields: CustomFieldItem[] = [
      {
        id: 'cf-publications',
        label: 'Selected Publications',
        title: 'Selected Publications',
        value: '1. Neural Architecture Search (Nature 2025)\n2. Agentic Workflows (NeurIPS 2024)',
        content: '1. Neural Architecture Search (Nature 2025)\n2. Agentic Workflows (NeurIPS 2024)',
        type: 'markdown',
        visible: true,
        order: 0
      },
      {
        id: 'cf-officehours',
        label: 'Office Hours & Booking',
        title: 'Office Hours & Booking',
        value: 'https://cal.com/dr-jane/30min',
        content: 'https://cal.com/dr-jane/30min',
        type: 'link',
        visible: true,
        order: 1
      },
      {
        id: 'cf-internal-notes',
        label: 'Internal Lab Extension',
        title: 'Internal Lab Extension',
        value: '+1-555-0199 ext 402',
        content: '+1-555-0199 ext 402',
        type: 'phone',
        visible: false, // HIDDEN FIELD
        order: 2
      }
    ];

    const updateRes1 = await updateProfile(testProfileId, {
      customFields: initialCustomFields,
      sectionOrder: ['hero', 'about', 'custom-fields', 'contact', 'custom-field-cf-publications'],
      sectionVisibility: {
        'custom-fields': true,
        'custom-field-cf-publications': true
      }
    }, testUserId);

    const updatedProfile = updateRes1.profile;

    assert(Boolean(updateRes1.success && updatedProfile), 'Profile updated with custom fields');
    assert(updatedProfile?.customFields?.length === 3, 'All 3 custom fields persisted on profile');
    assert(updatedProfile?.customFields?.[0].label === 'Selected Publications', 'Field 1 title/label stored');
    assert(updatedProfile?.customFields?.[0].value?.includes('Neural Architecture Search'), 'Field 1 content/value stored');
    assert(updatedProfile?.customFields?.[0].type === 'markdown', 'Field 1 markdown type preserved');
    assert(updatedProfile?.customFields?.[1].type === 'link', 'Field 2 link type preserved');
    assert(updatedProfile?.customFields?.[2].visible === false, 'Field 3 hidden visibility state stored');

    // 3. Persistence verification by reloading from database
    console.log('\n[3] Verifying Database Persistence...');
    const reloaded = await getProfileByIdOrSlug(testProfileId);
    assert(Boolean(reloaded), 'Profile reloaded from database');
    assert(reloaded?.customFields?.length === 3, 'Reloaded profile has 3 custom fields');
    assert(reloaded?.customFields?.[1].value === 'https://cal.com/dr-jane/30min', 'Reloaded link content verified');
    assert(reloaded?.sectionOrder?.includes('custom-fields') === true, 'custom-fields section present in sectionOrder');

    // 4. Test Server-Side Sanitization / Visibility
    console.log('\n[4] Testing Hideable / Visibility Behavior...');
    // Owner view: can see all 3 custom fields
    const ownerView = sanitizeProfileForPublic(reloaded!, true);
    assert(ownerView.customFields?.length === 3, 'Owner sees all 3 custom fields including hidden');

    // Public visitor view: hidden fields (visible: false) are filtered out
    const publicView = sanitizeProfileForPublic(reloaded!, false);
    assert(publicView.customFields?.length === 2, 'Public visitor only sees 2 visible custom fields');
    assert(
      !publicView.customFields?.some((f: any) => f.id === 'cf-internal-notes'),
      'Hidden field cf-internal-notes is filtered out from public view'
    );
    assert(
      publicView.customFields?.some((f: any) => f.id === 'cf-publications'),
      'Visible field cf-publications is included for public visitor'
    );
    assert(
      publicView.customFields?.some((f: any) => f.id === 'cf-officehours'),
      'Visible field cf-officehours is included for public visitor'
    );

    // 5. Test Draggable / Reordering
    console.log('\n[5] Testing Drag-and-Drop Reordering Persistence...');
    const reorderedFields: CustomFieldItem[] = [
      { ...initialCustomFields[1], order: 0 }, // office hours first
      { ...initialCustomFields[0], order: 1 }, // publications second
      { ...initialCustomFields[2], order: 2 }
    ];

    const updateRes2 = await updateProfile(testProfileId, {
      customFields: reorderedFields
    }, testUserId);
    const profileAfterReorder = updateRes2.profile;

    assert(profileAfterReorder?.customFields?.[0].id === 'cf-officehours', 'Field reordering: office hours is now #1');
    assert(profileAfterReorder?.customFields?.[1].id === 'cf-publications', 'Field reordering: publications is now #2');

    // 6. Test Editable: Edit title and content of an existing field
    console.log('\n[6] Testing In-place Editing of Title and Content...');
    const editedFields: CustomFieldItem[] = reorderedFields.map((f) =>
      f.id === 'cf-officehours'
        ? {
            ...f,
            label: 'Book Consultation (Updated)',
            title: 'Book Consultation (Updated)',
            value: 'https://cal.com/dr-jane/updated',
            content: 'https://cal.com/dr-jane/updated'
          }
        : f
    );

    const updateRes3 = await updateProfile(testProfileId, {
      customFields: editedFields
    }, testUserId);
    const profileAfterEdit = updateRes3.profile;

    const updatedField = profileAfterEdit?.customFields?.find((f:any) => f.id === 'cf-officehours');
    assert(updatedField?.label === 'Book Consultation (Updated)', 'Edited title saved properly');
    assert(updatedField?.value === 'https://cal.com/dr-jane/updated', 'Edited content saved properly');

  } finally {
    // 7. Cleanup
    console.log('\n[7] Cleaning up test profile...');
    if (testProfileId) {
      const delRes = await deleteProfile(testProfileId, testUserId);
      assert(delRes.success, 'Test profile cleanly deleted');
    }
  }

  console.log('\n====================================================');
  console.log(`ALL CUSTOM FIELD TESTS PASSED: ${passed}/${total} assertions successful.`);
  console.log('====================================================\n');
}

runCustomFieldTests().catch((err) => {
  console.error('Custom Field Test Suite failed:', err);
  process.exit(1);
});
