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

async function runTwoRoleTests() {
  console.log('================================================================');
  console.log('TWO-ROLE SYSTEM VERIFICATION (INDIVIDUAL & TEAM ONLY)');
  console.log('================================================================\n');

  // Step 1: Register a test user
  console.log('[1. Setup Test User]');
  const email = `tworole_test_${Date.now()}@example.com`;
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Role Test User',
      email: email,
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!'
    })
  });
  assert(regRes.statusCode === 201, 'Test user registered successfully');

  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: 'StrongPassword123!'
    })
  });
  assert(loginRes.statusCode === 200, 'Login succeeded');
  const cookie = loginRes.headers['set-cookie']?.[0]?.split(';')[0];
  assert(Boolean(cookie), 'Auth session cookie obtained');

  // Step 2: Verify /onboarding/role renders EXACTLY two options: Individual and Team
  console.log('\n[2. Onboarding Role Page UI Purity]');
  const rolePageRes = await request('/onboarding/role?theme=editorial', {
    headers: { Cookie: cookie }
  });
  assert(rolePageRes.statusCode === 200, '/onboarding/role responds 200 OK');
  assert(rolePageRes.body.includes('Select Profile Type'), 'Header includes "Select Profile Type"');
  assert(rolePageRes.body.includes('Individual'), 'Contains "Individual" role card');
  assert(rolePageRes.body.includes('Personal Profile'), 'Contains "Personal Profile" badge');
  assert(rolePageRes.body.includes('Company') || rolePageRes.body.includes('Team'), 'Contains "Company" or "Team" role card');
  assert(rolePageRes.body.includes('Company Profile') || rolePageRes.body.includes('Group / Organization'), 'Contains Company profile badge');

  // Ensure NO obsolete role options exist
  assert(!rolePageRes.body.includes('Work at a Company'), 'Does NOT contain obsolete Employee subtitle');
  assert(!rolePageRes.body.includes('Full Control'), 'Does NOT contain obsolete Owner badge');

  // Step 3: Create 'individual' profile via API
  console.log('\n[3. Create Profile with type: "individual"]');
  const indivRes = await request('/api/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie
    },
    body: JSON.stringify({
      name: 'Individual Person',
      profileName: 'My Solo Profile',
      type: 'individual',
      theme: 'editorial'
    })
  });
  assert(indivRes.statusCode === 201, 'Individual profile created (201 Created)');
  const indivData = JSON.parse(indivRes.body);
  assert(indivData.profile.type === 'individual', `Profile type is "individual" (actual: ${indivData.profile.type})`);

  // Step 4: Create 'team' profile via API
  console.log('\n[4. Create Profile with type: "team"]');
  const teamRes = await request('/api/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie
    },
    body: JSON.stringify({
      name: 'Alpha Engineering Team',
      profileName: 'Core Team',
      type: 'team',
      theme: 'cyber'
    })
  });
  assert(teamRes.statusCode === 201, 'Team profile created (201 Created)');
  const teamData = JSON.parse(teamRes.body);
  assert(teamData.profile.type === 'team', `Profile type is "team" (actual: ${teamData.profile.type})`);

  // Step 5: Test Legacy Normalization
  console.log('\n[5. Legacy Role Normalization on Creation]');
  // Legacy 'owner' should normalize to 'individual'
  const legacyOwnerRes = await request('/api/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie
    },
    body: JSON.stringify({
      name: 'Legacy Owner Profile',
      type: 'owner'
    })
  });
  assert(legacyOwnerRes.statusCode === 201, 'Legacy owner profile created');
  const legacyOwnerData = JSON.parse(legacyOwnerRes.body);
  assert(legacyOwnerData.profile.type === 'individual', `Legacy "owner" normalized to "individual" (actual: ${legacyOwnerData.profile.type})`);

  // Legacy 'company' should normalize to 'team'
  const legacyCompanyRes = await request('/api/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie
    },
    body: JSON.stringify({
      name: 'Legacy Company Profile',
      type: 'company'
    })
  });
  assert(legacyCompanyRes.statusCode === 201, 'Legacy company profile created');
  const legacyCompanyData = JSON.parse(legacyCompanyRes.body);
  assert(legacyCompanyData.profile.type === 'team', `Legacy "company" normalized to "team" (actual: ${legacyCompanyData.profile.type})`);

  // Legacy 'employee' should normalize to 'individual'
  const legacyEmpRes = await request('/api/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie
    },
    body: JSON.stringify({
      name: 'Legacy Employee Profile',
      type: 'employee'
    })
  });
  assert(legacyEmpRes.statusCode === 201, 'Legacy employee profile created');
  const legacyEmpData = JSON.parse(legacyEmpRes.body);
  assert(legacyEmpData.profile.type === 'individual', `Legacy "employee" normalized to "individual" (actual: ${legacyEmpData.profile.type})`);

  // Step 6: Verify profiles list in dashboard
  console.log('\n[6. Dashboard & Profiles Type Verification]');
  const dashboardRes = await request('/dashboard', {
    headers: { Cookie: cookie }
  });
  assert(dashboardRes.statusCode === 200, '/dashboard responds 200 OK');
  assert(dashboardRes.body.includes('My Solo Profile'), 'Dashboard lists Individual profile');
  assert(dashboardRes.body.includes('Core Team'), 'Dashboard lists Team profile');

  console.log('\n================================================================');
  console.log('🎉 ALL TWO-ROLE SYSTEM TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runTwoRoleTests().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
