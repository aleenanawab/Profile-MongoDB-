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

async function runComprehensiveVerification() {
  console.log('================================================================');
  console.log('AVTIVE PROFILES - FULL ARCHITECTURAL & WORKFLOW VERIFICATION');
  console.log('================================================================\n');

  // 1. Unauthenticated Root Entry Point
  console.log('[1. Root Landing & Auth Entry]');
  const unauthRoot = await request('/');
  assert(unauthRoot.statusCode === 307, 'Root / returns 307 redirect');
  assert(unauthRoot.headers.location === '/register', 'Root / redirects unauthenticated visitors strictly to /register');

  const regPage = await request('/register');
  assert(regPage.statusCode === 200, 'Register page /register responds with 200 OK');
  assert(regPage.body.includes('Create Your Account') || regPage.body.includes('Register'), 'Register page contains register heading');
  assert(regPage.body.includes('Continue with Google'), 'Register page contains prominent Google OAuth button');
  assert(regPage.body.includes('Log in'), 'Register page contains link to Log in');

  const loginPage = await request('/login');
  assert(loginPage.statusCode === 200, 'Login page /login responds with 200 OK');
  assert(loginPage.body.includes('Welcome Back') || loginPage.body.includes('Sign In'), 'Login page contains login heading');

  // 2. User Registration & Immediate Login Redirection
  console.log('\n[2. User Registration Flow]');
  const uniqueEmail = `test_flow_${Date.now()}@example.com`;
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Zara Qureshi',
      email: uniqueEmail,
      password: 'SecurePassword@123',
      confirmPassword: 'SecurePassword@123'
    })
  });
  assert(regRes.statusCode === 201, 'Registration API returns 201 Created');
  const regData = JSON.parse(regRes.body);
  assert(regData.success === true, 'Registration payload is marked success');

  // 3. Post-Registration Login Step
  console.log('\n[3. Post-Registration Login Step]');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'SecurePassword@123'
    })
  });
  assert(loginRes.statusCode === 200, 'Login returns 200 OK');
  const loginData = JSON.parse(loginRes.body);
  assert(loginData.hasProfile === false, 'New user starts with 0 profiles (hasProfile: false)');
  const sessionCookie = loginRes.headers['set-cookie']?.[0]?.split(';')[0];
  assert(Boolean(sessionCookie), 'Signed authentication session cookie is issued');

  // 4. Sequential Onboarding Verification
  console.log('\n[4. Sequential Onboarding Flow for New Users]');
  const newRoot = await request('/', {
    headers: { 'Cookie': sessionCookie }
  });
  assert(newRoot.statusCode === 307, 'Root / for authenticated user with 0 profiles redirects');
  assert(newRoot.headers.location === '/onboarding/theme', 'New user redirected strictly to /onboarding/theme');

  // Step 1: /onboarding/theme
  const themePage = await request('/onboarding/theme', {
    headers: { 'Cookie': sessionCookie }
  });
  assert(themePage.statusCode === 200, '/onboarding/theme responds with 200 OK');
  assert(themePage.body.includes('Choose Your Theme'), 'Step 1 renders "Choose Your Theme"');
  assert(themePage.body.includes('Editorial Minimal'), 'Step 1 contains "Editorial Minimal" card');
  assert(themePage.body.includes('Developer Terminal'), 'Step 1 contains "Developer Terminal" card');
  assert(themePage.body.includes('Luxe Velvet'), 'Step 1 contains "Luxe Velvet" card');

  // Step 2: /onboarding/role
  const rolePage = await request('/onboarding/role?theme=cyber', {
    headers: { 'Cookie': sessionCookie }
  });
  assert(rolePage.statusCode === 200, '/onboarding/role responds with 200 OK');
  assert(rolePage.body.includes('Select Profile Type'), 'Step 2 renders "Select Profile Type"');
  assert(rolePage.body.includes('Individual'), 'Step 2 contains "Individual" option');
  assert(rolePage.body.includes('Team'), 'Step 2 contains "Team" option');
  assert(!rolePage.body.includes('Full Control') && !rolePage.body.includes('Work at a Company'), 'Step 2 does not contain obsolete roles');

  // Step 3: /onboarding/details
  const detailsPage = await request('/onboarding/details?theme=cyber&role=individual', {
    headers: { 'Cookie': sessionCookie }
  });
  assert(detailsPage.statusCode === 200, '/onboarding/details responds with 200 OK');
  assert(detailsPage.body.includes('Initial Profile Setup'), 'Step 3 renders "Initial Profile Setup"');
  assert(detailsPage.body.includes('Profile Persona Name'), 'Step 3 includes Profile Persona Name input');

  // 5. Creating Profile and Dynamic Isolation
  console.log('\n[5. Dynamic Profile Creation & Identity Isolation]');
  const createProfileRes = await request('/api/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({
      name: 'Zara Qureshi',
      profileName: 'UI/UX Designer',
      type: 'individual',
      theme: 'cyber',
      profession: 'Senior Product Designer',
      designation: 'Senior Product Designer',
      company: 'Avtive Design Lab',
      shortBio: 'Designing futuristic interfaces and design systems.',
      skills: ['Figma', 'UI/UX', 'Tailwind CSS', 'Design Systems'],
      projects: [
        {
          id: 'proj-zara-1',
          title: 'Avtive Mobile Experience',
          description: 'Design system tokens and responsive layouts.'
        }
      ]
    })
  });
  assert(createProfileRes.statusCode === 201, 'Profile creation returns 201 Created');
  const createdProfile = JSON.parse(createProfileRes.body).profile;
  assert(Boolean(createdProfile?.slug), `Dynamic profile created with unique slug: ${createdProfile?.slug}`);
  assert(createdProfile?.type === 'individual', 'Profile type is correctly stored as "individual"');

  // 6. Verifying Authenticated User Lands on Own Profile
  console.log('\n[6. Post-Authentication Own Profile Routing]');
  const authLanding = await request('/', {
    headers: { 'Cookie': sessionCookie }
  });
  assert(authLanding.statusCode === 307, 'Authenticated user lands via redirect');
  assert(authLanding.headers.location === `/profile/${createdProfile.slug}`, `Root / directs user strictly to their own dynamic profile (/profile/${createdProfile.slug})`);

  // 7. Profile Page Rendering & Controls
  console.log('\n[7. Profile Editor & Header Rendering]');
  const profilePage = await request(`/profile/${createdProfile.slug}`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert(profilePage.statusCode === 200, 'Profile page renders 200 OK');
  assert(profilePage.body.includes('Zara Qureshi'), 'Profile page renders user name');
  assert(profilePage.body.includes('Share'), 'Profile page renders prominent Share action button');
  assert(profilePage.body.includes('Connect'), 'Profile page renders Connect action button');

  // 8. Granular Privacy & Share Settings Persistence
  console.log('\n[8. Granular Privacy & Share Settings Persistence]');
  const shareUpdateRes = await request('/api/profile/share-settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({
      profileId: createdProfile.id,
      sharingSettings: {
        photo: true,
        nameAndTitle: true,
        bio: true,
        skills: true,
        projects: false, // Projects hidden via toggle
        experience: true,
        education: false, // Education hidden via toggle
        contactInfo: true,
        socialLinks: true
      },
      sectionOrder: ['hero', 'skills', 'about', 'experience', 'projects']
    })
  });
  assert(shareUpdateRes.statusCode === 200, 'Share settings API returns 200 OK');
  const updatedProfile = JSON.parse(shareUpdateRes.body).profile;
  assert(updatedProfile.sharingSettings?.projects === false, 'Projects visibility successfully persisted as false');
  assert(updatedProfile.sharingSettings?.skills === true, 'Skills visibility successfully persisted as true');
  assert(updatedProfile.sectionOrder[1] === 'skills', 'Custom section order successfully persisted in database');

  console.log('\n================================================================');
  console.log('✅ ALL 8/8 ARCHITECTURAL & WORKFLOW CHECKS PASSED WITH ZERO ERRORS!');
  console.log('================================================================\n');
}

runComprehensiveVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
