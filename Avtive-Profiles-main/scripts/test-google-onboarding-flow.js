const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = { ...(options.headers || {}) };
    if (options.body) {
      headers['Content-Length'] = Buffer.byteLength(options.body);
    }
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: options.method || 'GET',
      headers
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

async function runGoogleOnboardingTests() {
  console.log('================================================================');
  console.log('TESTING GOOGLE SIGN-IN ONBOARDING FLOW & MANUAL SIGNUP PURITY');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // SCENARIO 1: Brand-New User via Google Authentication
  // -------------------------------------------------------------------------
  console.log('--- Scenario 1: Brand-New User via Google Sign-In ---');
  const newGoogleEmail = `google_new_${Date.now()}@gmail.com`;
  const newGoogleName = 'New Google User';

  const newGoogleAuthRes = await request('/api/auth/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google',
      email: newGoogleEmail,
      name: newGoogleName,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'
    })
  });

  assert(newGoogleAuthRes.statusCode === 201, 'Brand-new Google user created (HTTP 201)');
  const newGoogleData = JSON.parse(newGoogleAuthRes.body);
  assert(newGoogleData.isNewUser === true, 'Detected as new user (isNewUser === true)');
  assert(newGoogleData.hasProfile === false, 'Onboarding incomplete (hasProfile === false)');
  assert(newGoogleData.onboardingCompleted === false, 'Onboarding incomplete (onboardingCompleted === false)');
  assert(newGoogleData.profileSlug === null, 'No profileSlug assigned yet');

  const newGoogleCookies = newGoogleAuthRes.headers['set-cookie'] || [];
  const newGoogleSessionCookie = newGoogleCookies.find(c => c.startsWith('avtive_session='));
  assert(Boolean(newGoogleSessionCookie), 'Received authenticated session cookie for new Google user');
  const newGoogleCookieHeader = newGoogleCookies.map(c => c.split(';')[0]).join('; ');

  // Direct dashboard access BEFORE onboarding must redirect to /onboarding/role
  console.log('\n--- Scenario 1b: Incomplete Google User Accessing /dashboard ---');
  const dashboardAttemptRes = await request('/dashboard', {
    headers: { Cookie: newGoogleCookieHeader }
  });
  assert([307, 308].includes(dashboardAttemptRes.statusCode), `Redirected from /dashboard (got ${dashboardAttemptRes.statusCode})`);
  assert(dashboardAttemptRes.headers.location === '/onboarding/role', `Redirected directly to /onboarding/role (got ${dashboardAttemptRes.headers.location})`);

  // Google User goes through Onboarding Flow (Role -> Theme -> Create)
  console.log('\n--- Scenario 1c: New Google User Completes Onboarding Steps ---');
  // 1. Role Selection Step
  const rolePageRes = await request('/onboarding/role', {
    headers: { Cookie: newGoogleCookieHeader }
  });
  assert(rolePageRes.statusCode === 200, '/onboarding/role accessible for incomplete user (200 OK)');
  assert(rolePageRes.body.includes('Individual'), 'Role selection displays Individual option');
  assert(rolePageRes.body.includes('Company'), 'Role selection displays Company option');

  // 2. Theme Selection Step
  const themePageRes = await request('/onboarding/theme?role=individual&theme=editorial', {
    headers: { Cookie: newGoogleCookieHeader }
  });
  assert(themePageRes.statusCode === 200, '/onboarding/theme accessible (200 OK)');
  assert(themePageRes.body.includes('Editorial Minimal') || themePageRes.body.includes('Choose Your'), 'Theme selection displays theme options');

  // 3. Create Profile Submission (linked to user's auth ID)
  const createProfileRes = await request('/api/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: newGoogleCookieHeader
    },
    body: JSON.stringify({
      name: newGoogleName,
      type: 'individual',
      theme: 'editorial',
      profession: 'Senior Cloud Architect',
      company: 'Tech Innovations Ltd',
      bio: 'Cloud architecture expert and system designer.',
      skills: ['AWS', 'GCP', 'Kubernetes', 'TypeScript'],
      projects: [{
        id: 'proj-1',
        title: 'Cloud Infrastructure Pipeline',
        description: 'Multi-region disaster recovery architecture.',
        link: 'https://github.com/cloud-arch'
      }]
    })
  });
  assert(createProfileRes.statusCode === 201, 'Profile created successfully during onboarding (HTTP 201)');
  const createdProfileData = JSON.parse(createProfileRes.body);
  assert(Boolean(createdProfileData.profile?.id), 'Profile ID generated');
  assert(Boolean(createdProfileData.profile?.slug), 'Profile slug generated');

  // -------------------------------------------------------------------------
  // SCENARIO 2: Existing Completed Google User Signing in Again
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 2: Existing Completed Google User Logging In ---');
  const returnGoogleAuthRes = await request('/api/auth/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google',
      email: newGoogleEmail,
      name: newGoogleName
    })
  });
  assert(returnGoogleAuthRes.statusCode === 200, 'Existing Google user authenticated (HTTP 200)');
  const returnGoogleData = JSON.parse(returnGoogleAuthRes.body);
  assert(returnGoogleData.isNewUser === false, 'Detected as existing user (isNewUser === false)');
  assert(returnGoogleData.hasProfile === true, 'Detected completed onboarding (hasProfile === true)');
  assert(returnGoogleData.onboardingCompleted === true, 'Detected onboardingCompleted === true');
  assert(Boolean(returnGoogleData.profileSlug), `Returns existing profileSlug: ${returnGoogleData.profileSlug}`);

  // Now accessing /dashboard must succeed (200 OK)
  const completedDashboardRes = await request('/dashboard', {
    headers: { Cookie: newGoogleCookieHeader }
  });
  assert(completedDashboardRes.statusCode === 200, '/dashboard responds 200 OK for completed user');
  assert(completedDashboardRes.body.includes('My Profiles'), 'Dashboard displays "My Profiles"');

  // Accessing /onboarding after onboarding completion must redirect to /dashboard
  console.log('\n--- Scenario 2b: Completed Google User Accessing Onboarding Route ---');
  const onboardingAttemptRes = await request('/onboarding/role', {
    headers: { Cookie: newGoogleCookieHeader }
  });
  assert([307, 308].includes(onboardingAttemptRes.statusCode), `Completed user redirected away from /onboarding (got ${onboardingAttemptRes.statusCode})`);
  assert(onboardingAttemptRes.headers.location === '/dashboard' || onboardingAttemptRes.headers.location.startsWith('/profile'), `Redirected directly to profile or dashboard (got ${onboardingAttemptRes.headers.location})`);

  // -------------------------------------------------------------------------
  // SCENARIO 3: Existing Google User With Incomplete Onboarding
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 3: Existing Google User With Incomplete Onboarding ---');
  const incompleteGoogleEmail = `google_incomplete_${Date.now()}@gmail.com`;
  
  // First authentication creates user account without profile
  const incAuth1 = await request('/api/auth/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google',
      email: incompleteGoogleEmail,
      name: 'Incomplete Google User'
    })
  });
  assert(incAuth1.statusCode === 201, 'Incomplete user account created (201)');

  // User logs in again before completing onboarding
  const incAuth2 = await request('/api/auth/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google',
      email: incompleteGoogleEmail,
      name: 'Incomplete Google User'
    })
  });
  assert(incAuth2.statusCode === 200, 'Incomplete user signed in (200)');
  const incData2 = JSON.parse(incAuth2.body);
  assert(incData2.hasProfile === false, 'Detected incomplete onboarding (hasProfile === false)');
  assert(incData2.onboardingCompleted === false, 'Detected onboardingCompleted === false');

  // -------------------------------------------------------------------------
  // SCENARIO 4: Manual Signup User Unaffected (Regression Test)
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 4: Manual Signup User Unaffected ---');
  const manualEmail = `manual_signup_${Date.now()}@example.com`;
  const manualRegRes = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Manual Test User',
      email: manualEmail,
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!'
    })
  });
  assert(manualRegRes.statusCode === 201, 'Manual user registered (HTTP 201)');
  const manualRegData = JSON.parse(manualRegRes.body);
  assert(!manualRegData.hasProfile, 'Manual user has no profile initially (hasProfile is falsy/undefined)');
  
  // Login to acquire authenticated session cookie
  const manualLoginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: manualEmail,
      password: 'StrongPassword123!'
    })
  });
  assert(manualLoginRes.statusCode === 200, 'Manual user logged in (200 OK)');
  const manualCookies = manualLoginRes.headers['set-cookie'] || [];
  const manualCookieHeader = manualCookies.map(c => c.split(';')[0]).join('; ');

  // Complete manual user onboarding
  const manualCreateProfileRes = await request('/api/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: manualCookieHeader
    },
    body: JSON.stringify({
      name: 'Manual Test User',
      type: 'individual',
      theme: 'cyber',
      profession: 'Full Stack Engineer',
      company: 'Avtive Team',
      skills: ['TypeScript', 'Next.js', 'React']
    })
  });
  assert(manualCreateProfileRes.statusCode === 201, 'Manual user profile created (201)');

  const manualDashboardRes = await request('/dashboard', {
    headers: { Cookie: manualCookieHeader }
  });
  assert(manualDashboardRes.statusCode === 200, 'Manual user reaches dashboard (200 OK)');
  assert(manualDashboardRes.body.includes('Manual Test User'), 'Dashboard displays manual user profile');

  // -------------------------------------------------------------------------
  // SCENARIO 5: Multiple Google Users Isolation
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 5: Multiple Google Users Data Isolation ---');
  const userAEmail = `user_a_${Date.now()}@gmail.com`;
  const userBEmail = `user_b_${Date.now()}@gmail.com`;

  const authA = await request('/api/auth/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'google', email: userAEmail, name: 'User A' })
  });
  const cookieA = authA.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');

  const authB = await request('/api/auth/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'google', email: userBEmail, name: 'User B' })
  });
  const cookieB = authB.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');

  // Create Profile for User A
  await request('/api/profile/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      name: 'User Alpha',
      profession: 'Alpha Specialist',
      type: 'individual'
    })
  });

  // User A should have profile, User B should NOT have profile
  const meA = await request('/api/auth/me', { headers: { Cookie: cookieA } });
  const meB = await request('/api/auth/me', { headers: { Cookie: cookieB } });

  const dataA = JSON.parse(meA.body);
  const dataB = JSON.parse(meB.body);

  assert(dataA.hasProfile === true, 'User A hasProfile is true');
  assert(dataA.profile.name === 'User Alpha', 'User A profile matches User A data');
  assert(dataB.hasProfile === false, 'User B hasProfile is false (no data leakage from User A)');

  // -------------------------------------------------------------------------
  // SCENARIO 6: OAuth Callback Route Guard
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 6: OAuth Callback Endpoint ---');
  const callbackNoCodeRes = await request('/api/auth/callback');
  assert([307, 308].includes(callbackNoCodeRes.statusCode), 'Callback without code redirects to login');
  assert(callbackNoCodeRes.headers.location.includes('/login'), 'Redirects to /login');

  const callbackErrorRes = await request('/api/auth/callback?error=access_denied&error_description=User+cancelled');
  assert([307, 308].includes(callbackErrorRes.statusCode), 'Callback with error redirects to login');
  assert(callbackErrorRes.headers.location.includes('/login'), 'Redirects to /login on error');

  console.log('\n================================================================');
  console.log('🎉 ALL GOOGLE SIGN-IN ONBOARDING & FLOW TESTS PASSED!');
  console.log('================================================================\n');
}

runGoogleOnboardingTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
