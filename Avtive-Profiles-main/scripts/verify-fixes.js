const http = require('http');

function req(path, options = {}) {
  return new Promise((resolve, reject) => {
    const r = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    r.on('error', reject);
    if (options.body) r.write(options.body);
    r.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function verifyAll() {
  console.log('=== VERIFICATION TEST SUITE ===\n');

  // 1. Authenticate with abcd@gmail.com
  console.log('--- 1. Authenticating test user ---');
  const loginRes = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'abcd@gmail.com', password: '12345678' })
  });
  assert(loginRes.status === 200, 'Login succeeded with 200 OK');
  const cookie = loginRes.headers['set-cookie']?.[0]?.split(';')[0];
  assert(Boolean(cookie), 'Auth session cookie acquired');

  // 2. Fetch authenticated profile in edit mode
  console.log('\n--- 2. Fetching profile in edit mode ---');
  const editRes = await req('/profile/abcd-user-primary-profile-i0da?edit=true', {
    headers: { Cookie: cookie }
  });
  assert(editRes.status === 200, 'Edit mode profile returned 200 OK');
  const editHtml = editRes.body;

  // 3. Acceptance Criterion A.5: Simulated URL bar removed
  console.log('\n--- 3. Verifying simulated URL bar removal (Section 5) ---');
  const hasSimulatedUrl = editHtml.includes('avtive.platform');
  assert(!hasSimulatedUrl, 'Simulated URL bar (avtive.platform) is NOT present on profile page');

  // 4. Acceptance Criterion A.1: Exactly one Save and Cancel button
  console.log('\n--- 4. Verifying single Save and Cancel buttons (Section 1) ---');
  const cancelMatches = editHtml.match(/aria-label="Cancel Changes"/g) || [];
  const saveMatches = editHtml.match(/aria-label="Save Changes"/g) || [];
  assert(cancelMatches.length === 1, `Exactly one Cancel button found (found: ${cancelMatches.length})`);
  assert(saveMatches.length === 1, `Exactly one Save button found (found: ${saveMatches.length})`);

  // 5. Acceptance Criterion A.2: Logout placement
  console.log('\n--- 5. Verifying Logout button placement (Section 2) ---');
  const logoutMatches = editHtml.match(/aria-label="Logout"/g) || [];
  assert(logoutMatches.length === 1, `Exactly one Logout button found in HeaderNav (found: ${logoutMatches.length})`);
  const hasDetachedActionStrip = editHtml.includes('Actions Strip Directly Below Header Toolbar');
  assert(!hasDetachedActionStrip, 'Detached yellow action strip is eliminated');

  // 6. Acceptance Criterion A.4: Sections Icon in HeaderNav (icon-only, no word)
  console.log('\n--- 6. Verifying Sections Icon in HeaderNav (Section 4) ---');
  const sectionsMatches = editHtml.match(/aria-label="Sections Menu"/g) || [];
  assert(sectionsMatches.length === 1, `Sections icon present in HeaderNav (found: ${sectionsMatches.length})`);
  const hasSectionsWordInButton = editHtml.includes('>Sections<');
  assert(!hasSectionsWordInButton, 'Sections trigger shows only the icon without the word "Sections"');

  // 7. Acceptance Criterion A.3: Share button responsive styling
  console.log('\n--- 7. Verifying Share button (Section 3) ---');
  const shareMatches = editHtml.match(/aria-label="Share Profile"/g) || [];
  assert(shareMatches.length === 1, `Share button present in HeaderNav (found: ${shareMatches.length})`);

  // 8. Fetch profile in view mode
  console.log('\n--- 8. Fetching profile in view mode ---');
  const viewRes = await req('/profile/abcd-user-primary-profile-i0da', {
    headers: { Cookie: cookie }
  });
  assert(viewRes.status === 200, 'View mode profile returned 200 OK');
  const viewHtml = viewRes.body;
  const viewSections = viewHtml.match(/aria-label="Sections Menu"/g) || [];
  assert(viewSections.length === 1, 'Sections menu also available in view mode');
  const viewEdit = viewHtml.match(/aria-label="Edit Profile"/g) || [];
  assert(viewEdit.length === 1, 'Edit Profile button present for owner in view mode');

  // 9. Verify save persistence API
  console.log('\n--- 9. Verifying profile update persistence (Save functionality) ---');
  const testBio = `Empirically verified in-place editing at ${Date.now()}`;
  const updateRes = await req('/api/profile/update', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      profileId: 'prof-abcd',
      updatedData: { bio: testBio }
    })
  });
  assert(updateRes.status === 200, 'Profile update API returned 200 OK');
  const updateData = JSON.parse(updateRes.body);
  assert(updateData.profile?.bio === testBio, 'Updated bio persisted in profile data');

  // 10. Verify company profile view
  console.log('\n--- 10. Verifying company profile compatibility ---');
  const companyRes = await req('/profile/acme-robotics-muxyqyia');
  assert(companyRes.status === 200, 'Company profile page loaded with 200 OK');
  assert(companyRes.body.includes('Acme Cybernetics'), 'Company name rendered in company profile');

  console.log('\n🎉 ALL 10 EMPIRICAL VERIFICATION CHECKS PASSED!\n');
}

verifyAll().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
