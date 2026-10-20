const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: data
      }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runDataModelTests() {
  console.log('================================================================');
  console.log('AVTIVE PROFILE DATA MODEL & EDITOR VERIFICATION');
  console.log('================================================================\n');

  // Step 1: Register and login a test user
  console.log('[1. Setup User & Authentication]');
  const uniqueId = Date.now();
  const email = `elena_${uniqueId}@example.com`;
  const password = 'StrongPassword123!';

  const regRes = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Elena Rostova',
      email: email,
      password: password,
      confirmPassword: password
    })
  });
  assert(regRes.statusCode === 201, 'Registered test user account successfully');

  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  assert(loginRes.statusCode === 200, 'Logged in test user successfully');

  const cookieHeader = loginRes.headers['set-cookie'];
  const sessionCookie = Array.isArray(cookieHeader)
    ? cookieHeader.map(c => c.split(';')[0]).join('; ')
    : (cookieHeader || '').split(';')[0];
  assert(Boolean(sessionCookie), 'Received session cookie from login');

  const loginBody = JSON.parse(loginRes.body);
  const userId = loginBody.user.id;

  // Step 2: Create profile with complete Avtive Editor data model
  console.log('\n[2. Create Profile with Comprehensive Data Model]');
  const initialCustomFields = [
    { id: 'cf-discord', label: 'Discord', value: 'elena#1337', type: 'text', visible: true, order: 0 },
    { id: 'cf-calendly', label: 'Book Consultation', value: 'https://calendly.com/elena', type: 'link', visible: true, order: 1 },
    { id: 'cf-rate', label: 'Consulting Rate', value: '$250/hr', type: 'text', visible: true, order: 2 },
    { id: 'cf-phone', label: 'Direct Line', value: '+1 (555) 019-2834', type: 'phone', visible: false, order: 3 }
  ];

  const initialDynamicSections = [
    {
      id: 'ds-publications',
      key: 'publications',
      title: 'Publications & Whitepapers',
      type: 'custom',
      visible: true,
      order: 4,
      data: 'Author of Cloud Resiliency Patterns (O\'Reilly, 2025)',
      customFields: [
        { id: 'ds-cf-1', label: 'ISBN', value: '978-0134685991', type: 'text', visible: true, order: 0 }
      ]
    }
  ];

  const initialSectionOrder = [
    'hero',
    'custom-fields',
    'about',
    'skills',
    'projects',
    'experience',
    'contact',
    'virtual-card'
  ];

  const initialSectionVisibility = {
    hero: true,
    'custom-fields': true,
    about: true,
    skills: true,
    projects: false, // hidden
    experience: true,
    contact: true,
    'virtual-card': true
  };

  const createRes = await request('/api/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({
      name: 'Elena Rostova',
      email: email,
      username: `elena_${uniqueId}`,
      profession: 'Principal Cloud Architect',
      designation: 'Principal Cloud Architect',
      bio: 'Passionate systems architect delivering resilient cloud solutions.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
      coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
      type: 'individual',
      customFields: initialCustomFields,
      dynamicSections: initialDynamicSections,
      sectionOrder: initialSectionOrder,
      sectionVisibility: initialSectionVisibility
    })
  });

  assert(createRes.statusCode === 201, 'Created profile with full editor data model');
  const createBody = JSON.parse(createRes.body);
  const profileId = createBody.profile.id;
  const profileSlug = createBody.profile.slug;
  const profileUsername = createBody.profile.username;

  assert(profileUsername === `elena_${uniqueId}`, 'Profile username stored cleanly without @');
  assert(createBody.profile.customFields.length === 4, 'Profile customFields stored 4 items');
  assert(createBody.profile.dynamicSections.length === 1, 'Profile dynamicSections stored 1 item');
  assert(createBody.profile.sectionOrder[1] === 'custom-fields', 'Profile sectionOrder preserved custom position');
  assert(createBody.profile.sectionVisibility.projects === false, 'Profile sectionVisibility preserved projects: false');

  // Step 3: Independent Ordering Update (Does not affect visibility)
  console.log('\n[3. Independent Section Ordering Test]');
  const reorderedSections = [
    'hero',
    'about',
    'skills',
    'projects',
    'experience',
    'contact',
    'virtual-card',
    'custom-fields' // moved to the end!
  ];

  const updateOrderRes = await request('/api/profile/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({
      profileId: profileId,
      updatedData: {
        sectionOrder: reorderedSections
      }
    })
  });
  assert(updateOrderRes.statusCode === 200, 'Updated sectionOrder independently');
  const updateOrderBody = JSON.parse(updateOrderRes.body);
  const afterOrderProfile = updateOrderBody.updatedProfile;

  assert(afterOrderProfile.sectionOrder[afterOrderProfile.sectionOrder.length - 1] === 'custom-fields', 'sectionOrder moved custom-fields to last');
  assert(afterOrderProfile.sectionVisibility.projects === false, 'sectionVisibility.projects remains false after reorder');
  assert(afterOrderProfile.sectionVisibility['custom-fields'] === true, 'sectionVisibility[custom-fields] remains true after reorder');

  // Step 4: Independent Visibility Update (Does not affect ordering)
  console.log('\n[4. Independent Section Visibility Test]');
  const updatedVisibility = {
    ...afterOrderProfile.sectionVisibility,
    projects: true, // unhide projects
    skills: false   // hide skills
  };

  const updateVisRes = await request('/api/profile/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({
      profileId: profileId,
      updatedData: {
        sectionVisibility: updatedVisibility
      }
    })
  });
  assert(updateVisRes.statusCode === 200, 'Updated sectionVisibility independently');
  const updateVisBody = JSON.parse(updateVisRes.body);
  const afterVisProfile = updateVisBody.updatedProfile;

  assert(afterVisProfile.sectionVisibility.projects === true, 'sectionVisibility.projects updated to true');
  assert(afterVisProfile.sectionVisibility.skills === false, 'sectionVisibility.skills updated to false');
  assert(
    JSON.stringify(afterVisProfile.sectionOrder) === JSON.stringify(reorderedSections),
    'sectionOrder preserved its exact sequence without alteration'
  );

  // Step 5: Arbitrary / Unlimited Custom Fields (No fixed field limits)
  console.log('\n[5. Unlimited Custom Fields Test]');
  const extendedCustomFields = [
    { id: 'cf-1', label: 'Discord', value: 'elena#1337', type: 'text', visible: true, order: 0 },
    { id: 'cf-2', label: 'Calendly', value: 'https://calendly.com/elena', type: 'link', visible: true, order: 1 },
    { id: 'cf-3', label: 'Consulting Rate', value: '$250/hr', type: 'text', visible: true, order: 2 },
    { id: 'cf-4', label: 'Substack', value: 'https://elena.substack.com', type: 'link', visible: true, order: 3 },
    { id: 'cf-5', label: 'GitHub Sponsors', value: 'https://github.com/sponsors/elena', type: 'link', visible: true, order: 4 },
    { id: 'cf-6', label: 'License Number', value: 'PE-98765432', type: 'text', visible: true, order: 5 },
    { id: 'cf-7', label: 'Matrix', value: '@elena:matrix.org', type: 'text', visible: true, order: 6 },
    { id: 'cf-8', label: 'Telegram', value: 't.me/elenacloud', type: 'link', visible: true, order: 7 },
    { id: 'cf-9', label: 'Emergency Contact', value: 'support@elena.io', type: 'email', visible: false, order: 8 },
    { id: 'cf-10', label: 'Office Hours', value: 'Fridays 2-4pm UTC', type: 'text', visible: true, order: 9 },
    { id: 'cf-11', label: 'Timezone', value: 'UTC+1 / CET', type: 'text', visible: true, order: 10 },
    { id: 'cf-12', label: 'Security Clearance', value: 'Level 4 / NATO Secret', type: 'text', visible: true, order: 11 }
  ];

  const updateFieldsRes = await request('/api/profile/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({
      profileId: profileId,
      updatedData: {
        customFields: extendedCustomFields
      }
    })
  });
  assert(updateFieldsRes.statusCode === 200, 'Saved 12 arbitrary custom fields without restriction');
  const updateFieldsBody = JSON.parse(updateFieldsRes.body);
  assert(updateFieldsBody.updatedProfile.customFields.length === 12, 'Persisted all 12 custom fields in DB');

  // Step 6: Identifier Resolution (Clean username, @username, slug, id)
  console.log('\n[6. Flexible Identifier Lookup Resolution]');
  const lookupClean = await request(`/api/profile/${profileUsername}`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert(lookupClean.statusCode === 200, 'Lookup by clean username succeeds');
  const cleanBody = JSON.parse(lookupClean.body);
  assert(cleanBody.profile.id === profileId, 'Clean username resolves to correct profile ID');

  const lookupWithAt = await request(`/api/profile/@${profileUsername}`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert(lookupWithAt.statusCode === 200, 'Lookup by @username succeeds');
  const atBody = JSON.parse(lookupWithAt.body);
  assert(atBody.profile.id === profileId, '@username resolves to correct profile ID');

  const lookupBySlug = await request(`/api/profile/${profileSlug}`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert(lookupBySlug.statusCode === 200, 'Lookup by slug succeeds');

  const lookupById = await request(`/api/profile/${profileId}`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert(lookupById.statusCode === 200, 'Lookup by profile ID succeeds');

  // Step 7: Persistence Verification across fresh request
  console.log('\n[7. Simulated Reload & Persistence Verification]');
  const freshFetch = await request(`/api/profile/${profileId}`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert(freshFetch.statusCode === 200, 'Fresh profile fetch succeeds');
  const fetchedProfile = JSON.parse(freshFetch.body).profile;

  assert(fetchedProfile.username === `elena_${uniqueId}`, 'Persisted username intact after reload');
  assert(fetchedProfile.customFields.length === 12, 'Persisted 12 custom fields intact after reload');
  assert(fetchedProfile.dynamicSections.length === 1, 'Persisted dynamic sections intact after reload');
  assert(fetchedProfile.sectionOrder[fetchedProfile.sectionOrder.length - 1] === 'custom-fields', 'Persisted sectionOrder intact after reload');
  assert(fetchedProfile.sectionVisibility.projects === true, 'Persisted sectionVisibility.projects === true');
  assert(fetchedProfile.sectionVisibility.skills === false, 'Persisted sectionVisibility.skills === false');

  console.log('\n================================================================');
  console.log('🎉 ALL DATA MODEL & AVTIVE EDITOR TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runDataModelTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
