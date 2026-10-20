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

async function runWorkflowVerification() {
  console.log('================================================================');
  console.log('AVTIVE PROFILES - ONBOARDING WORKFLOW & HEADER PURITY TEST');
  console.log('================================================================\n');

  // Test 1: Desktop Outer Header Purity
  console.log('[1. Outer Desktop Header Purity]');
  const homeRes = await request('/login');
  assert(homeRes.statusCode === 200, 'Page responds 200 OK');
  
  // Outer header has Avtive brand logo
  assert(homeRes.body.includes('Avtive'), 'Header contains Avtive brand logo text');
  // Outer header has Light/Dark toggle
  assert(homeRes.body.includes('Light') || homeRes.body.includes('Dark') || homeRes.body.includes('Toggle Light / Dark Mode'), 'Header contains Light/Dark toggle');
  
  // Ensure extra navigation items are completely removed
  assert(!homeRes.body.includes('nav-feature-pill'), 'Header does not contain nav feature pills');
  assert(!homeRes.body.includes('Figma Board'), 'Header does not contain Figma Board button');
  assert(!homeRes.body.includes('Elevate your identity'), 'Header does not contain marketing slogan in header');
  assert(!homeRes.body.includes('Public Profiles (3)'), 'Header does not contain demo profiles pill');

  // Test 2: Sequential Onboarding Registration & Login
  console.log('\n[2. Register & Login]');
  const email = `onboarding_test_${Date.now()}@example.com`;
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Eman Tariq',
      email: email,
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!'
    })
  });
  assert(regRes.statusCode === 201, 'User registered successfully');

  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: 'StrongPassword123!'
    })
  });
  assert(loginRes.statusCode === 200, 'User login succeeded');
  const cookie = loginRes.headers['set-cookie']?.[0]?.split(';')[0];
  assert(Boolean(cookie), 'Auth session cookie received');

  // Test 3: Onboarding Steps (/onboarding/theme -> /onboarding/role -> /onboarding/create)
  console.log('\n[3. Sequential Onboarding Navigation]');
  const themePage = await request('/onboarding/theme', {
    headers: { Cookie: cookie }
  });
  assert(themePage.statusCode === 200, '/onboarding/theme responds 200 OK');
  assert(themePage.body.includes('Choose Your Theme'), 'Renders theme selection');

  const rolePage = await request('/onboarding/role?theme=editorial', {
    headers: { Cookie: cookie }
  });
  assert(rolePage.statusCode === 200, '/onboarding/role responds 200 OK');
  assert(rolePage.body.includes('Select Profile Type'), 'Renders role selection');
  assert(rolePage.body.includes('Individual'), 'Renders Individual option');
  assert(rolePage.body.includes('Team'), 'Renders Team option');

  const createPage = await request('/onboarding/create?theme=editorial&role=individual', {
    headers: { Cookie: cookie }
  });
  assert(createPage.statusCode === 200, '/onboarding/create responds 200 OK');
  assert(createPage.body.includes('Create Full Profile') || createPage.body.includes('Create Your Profile'), 'Renders profile creation heading');
  assert(createPage.body.includes('Title'), 'Contains Title field');
  assert(createPage.body.includes('About Story'), 'Contains About Story field');
  assert(createPage.body.includes('Skills Badges'), 'Contains Skills Badges section');
  assert(createPage.body.includes('Projects'), 'Contains Projects section');

  // Test 4: Profile Creation via API (same as /onboarding/create form submission)
  console.log('\n[4. Profile Submission & Direct Routing to Dashboard]');
  const createProfileRes = await request('/api/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie
    },
    body: JSON.stringify({
      name: 'Eman Tariq',
      firstName: 'Eman',
      secondName: 'Tariq',
      profession: 'Lead Product Designer',
      bio: 'Crafting premium digital experiences & user interfaces.',
      about: 'Passionate designer with 8+ years experience designing web and mobile products.',
      skills: ['Figma', 'UI/UX Design', 'Design Systems', 'TypeScript', 'Tailwind CSS'],
      projects: [
        {
          id: 'proj-1',
          title: 'Fintech Mobile Design',
          description: 'Next-generation financial banking mobile application.',
          tags: ['Mobile', 'Figma'],
          link: 'https://github.com/fintech-app',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800'
        }
      ],
      socials: {
        whatsapp: 'https://wa.me/1234567890',
        linkedin: 'https://linkedin.com/in/emantariq',
        github: 'https://github.com/emantariq'
      },
      theme: 'editorial',
      type: 'individual'
    })
  });
  assert(createProfileRes.statusCode === 201, 'Profile created via API (201 Created)');
  const createdData = JSON.parse(createProfileRes.body);
  const profileSlug = createdData.profile.slug;
  const profileId = createdData.profile.id;
  assert(Boolean(profileSlug), `Profile created with slug: ${profileSlug}`);

  // Test 5: Dashboard Destination (/dashboard)
  console.log('\n[5. Dashboard Inspection]');
  const dashboardRes = await request('/dashboard', {
    headers: { Cookie: cookie }
  });
  assert(dashboardRes.statusCode === 200, '/dashboard responds 200 OK');
  if (!dashboardRes.body.includes('My Profiles')) {
    console.log('Dashboard body snippet:', dashboardRes.body.slice(0, 500));
  }
  assert(dashboardRes.body.includes('My Profiles'), 'Dashboard renders "My Profiles"');
  assert(dashboardRes.body.includes('+ Create New Profile'), 'Dashboard renders "+ Create New Profile" button');
  assert(dashboardRes.body.includes('Eman Tariq'), 'Dashboard renders created user profile card');
  assert(dashboardRes.body.includes(`/profile/${profileSlug}/edit`), 'Dashboard links to profile edit route');

  // Test 6: Edit Route DOES NOT redirect to /onboarding/theme
  console.log('\n[6. Edit Route Verification - No Redirect Loop]');
  const editRes = await request(`/profile/${profileSlug}/edit`, {
    headers: { Cookie: cookie }
  });
  assert(editRes.statusCode === 200, `/profile/${profileSlug}/edit responds 200 OK (no redirect to theme!)`);
  assert(editRes.body.includes('Edit Profile') || editRes.body.includes('Eman Tariq'), 'Edit page renders profile editing dashboard');

  // Test 7: Public Profile Layout Verification (Owner vs Visitor)
  console.log('\n[7. Public Profile Rendering & Element Ordering]');
  const publicRes = await request(`/profile/${profileSlug}`, {
    headers: { Cookie: cookie }
  });
  if (publicRes.statusCode !== 200) {
    console.log('Public profile status:', publicRes.statusCode, 'headers:', publicRes.headers);
  }
  assert(publicRes.statusCode === 200, `/profile/${profileSlug} responds 200 OK`);
  assert(publicRes.body.includes('Eman Tariq'), 'Renders profile name');
  assert(publicRes.body.includes('Lead Product Designer'), 'Renders professional title');
  assert(publicRes.body.includes('Edit Profile'), 'Owner view renders Edit Profile action button');

  // Visitor View (authenticated as another user, non-owner)
  const visitorLoginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'abcd@gmail.com', password: '12345678' })
  });
  const visitorCookie = visitorLoginRes.headers['set-cookie']?.[0]?.split(';')[0];
  const visitorRes = await request(`/profile/${profileSlug}`, {
    headers: { Cookie: visitorCookie }
  });
  assert(visitorRes.statusCode === 200, `/profile/${profileSlug} visitor view responds 200 OK`);
  assert(visitorRes.body.includes('Connect'), 'Visitor view renders Connect action button');
  assert(visitorRes.body.includes('Share'), 'Renders Share action button');
  assert(publicRes.body.includes('Virtual Card Preview'), 'Renders Virtual Card Preview section');
  assert(publicRes.body.includes('Download Virtual Card'), 'Renders Download Virtual Card button');
  assert(publicRes.body.includes('Share Card'), 'Renders Share Card button');
  assert(publicRes.body.includes('Powered by'), 'Renders Powered by footer');
  assert(publicRes.body.includes('Avtive'), 'Renders Avtive branding in footer');

  console.log('\n================================================================');
  console.log('✅ ALL ONBOARDING WORKFLOW & HEADER PURITY VERIFICATIONS PASSED!');
  console.log('================================================================');
}

runWorkflowVerification().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
