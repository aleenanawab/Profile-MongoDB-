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

async function runSchemaFlowVerification() {
  console.log('================================================================');
  console.log('TESTING SCHEMA & PROFILE EDIT WORKFLOW VERIFICATION');
  console.log('================================================================\n');

  // 1. Create a user
  const email = `schema_user_${Date.now()}@example.com`;
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Taylor Reed',
      email: email,
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!'
    })
  });
  assert(regRes.statusCode === 201, 'User registration returns 201');

  // 2. Login
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'StrongPassword123!' })
  });
  assert(loginRes.statusCode === 200, 'User login returns 200');
  const sessionCookie = loginRes.headers['set-cookie']?.[0]?.split(';')[0];
  const loginData = JSON.parse(loginRes.body);
  const userId = loginData.user.id;
  assert(Boolean(sessionCookie), 'Session cookie obtained');
  assert(Boolean(userId), 'User ID extracted: ' + userId);

  // 3. Create Profile with complete schema (Skills, About, Projects, Social, Experience, Education)
  console.log('\n[Creating profile with rich schema: skills, about, projects, etc.]');
  const createRes = await request('/api/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({
      firstName: 'Taylor',
      secondName: 'Reed',
      lastName: 'Reed',
      professionalTitle: 'Lead Product Architect',
      bio: 'Pioneering next-generation reactive architectures and web systems.',
      about: 'Passionate software architect with 10+ years designing enterprise-grade platforms, distributed systems, and modern interactive web experiences.',
      skills: ['TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL', 'Distributed Systems'],
      projects: [
        {
          id: 'proj-1',
          title: 'Reactive Platform Engine',
          description: 'A lightning-fast streaming UI runtime built on edge nodes.',
          tags: ['TypeScript', 'Edge', 'Wasm'],
          link: 'https://github.com/taylorreed/reactive-engine',
          image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80'
        }
      ],
      education: [
        {
          id: 'edu-1',
          degree: 'B.S. in Computer Science',
          institution: 'Stanford University',
          period: '2015 - 2019'
        }
      ],
      socialLinks: [
        { platform: 'github', url: 'https://github.com/taylorreed' },
        { platform: 'linkedin', url: 'https://linkedin.com/in/taylorreed' }
      ],
      type: 'owner',
      themePreset: 'editorial-minimal'
    })
  });
  assert(createRes.statusCode === 201, 'Profile creation returns 201');
  const createData = JSON.parse(createRes.body);
  const profileSlug = createData.profile.slug;
  const profileId = createData.profile.id;
  assert(Boolean(profileSlug), `Profile created with slug: ${profileSlug}`);

  // 4. Verify fields persisted
  const getProfileRes = await request(`/api/profile/${profileId}`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert(getProfileRes.statusCode === 200, 'GET /api/profile/[id] returns 200');
  const profileRecord = JSON.parse(getProfileRes.body).profile;
  assert(profileRecord.firstName === 'Taylor', 'firstName persisted');
  assert(profileRecord.secondName === 'Reed', 'secondName persisted');
  assert(profileRecord.about.includes('Passionate software architect'), 'about multiline text persisted');
  assert(Array.isArray(profileRecord.skills) && profileRecord.skills.length === 5, 'skills array with 5 tags persisted');
  assert(Array.isArray(profileRecord.projects) && profileRecord.projects[0].title === 'Reactive Platform Engine', 'projects array persisted with correct title');
  assert(profileRecord.projects[0].link === 'https://github.com/taylorreed/reactive-engine', 'project link persisted');
  assert(profileRecord.projects[0].image.includes('unsplash'), 'project image persisted');

  // 5. Test Access to /profile/[userId]/edit
  console.log('\n[Testing Access to /profile/[userId]/edit dynamic route]');
  let editByUserRes = await request(`/profile/${userId}/edit`, {
    headers: { 'Cookie': sessionCookie }
  });
  if (editByUserRes.statusCode === 307 && editByUserRes.headers.location) {
    editByUserRes = await request(editByUserRes.headers.location, {
      headers: { 'Cookie': sessionCookie }
    });
  }
  assert(editByUserRes.statusCode === 200, `/profile/${userId}/edit responds with 200 OK`);
  assert(editByUserRes.body.includes('Edit Profile') || editByUserRes.body.includes('Taylor') || editByUserRes.body.includes('Save'), 'Edit dashboard renders with user info');
  assert(editByUserRes.body.includes('Skills') || editByUserRes.body.includes('TypeScript'), 'Skills section rendered in dashboard');
  assert(editByUserRes.body.includes('Projects') || editByUserRes.body.includes('Reactive Platform Engine'), 'Projects section rendered in dashboard');

  // 6. Test Access to /profile/[slug]/edit
  console.log('\n[Testing Access to /profile/[slug]/edit]');
  let editBySlugRes = await request(`/profile/${profileSlug}/edit`, {
    headers: { 'Cookie': sessionCookie }
  });
  if (editBySlugRes.statusCode === 307 && editBySlugRes.headers.location) {
    editBySlugRes = await request(editBySlugRes.headers.location, {
      headers: { 'Cookie': sessionCookie }
    });
  }
  assert(editBySlugRes.statusCode === 200, `/profile/${profileSlug}/edit responds with 200 OK`);

  // 7. Test Updating the profile with additional skills and updated about text
  console.log('\n[Testing Profile Update with Skills, Projects & About]');
  const updateRes = await request('/api/profile/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({
      id: profileId,
      skills: ['TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL', 'Distributed Systems', 'Rust', 'WebAssembly'],
      about: 'Updated executive biography for Taylor Reed.',
      projects: [
        {
          id: 'proj-1',
          title: 'Reactive Platform Engine v2',
          description: 'A distributed event platform.',
          tags: ['Rust', 'Wasm', 'Next.js'],
          link: 'https://github.com/taylorreed/reactive-v2',
          image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80'
        },
        {
          id: 'proj-2',
          title: 'Neural Web Interface',
          description: 'AI-assisted design synthesis canvas.',
          tags: ['AI', 'Canvas', 'WebGL'],
          link: 'https://taylorreed.dev/neural',
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
        }
      ]
    })
  });
  assert(updateRes.statusCode === 200, 'Profile update API returns 200 OK');
  const updateData = JSON.parse(updateRes.body);
  assert(updateData.profile.skills.length === 7, 'Updated skills count is 7');
  assert(updateData.profile.skills.includes('Rust'), 'Rust added to skills');
  assert(updateData.profile.about === 'Updated executive biography for Taylor Reed.', 'About text updated');
  assert(updateData.profile.projects.length === 2, 'Projects array now has 2 items');

  // 8. Test Public Profile Render to ensure skills, about, and projects render correctly without error
  console.log('\n[Testing Public Profile Rendering]');
  const publicRes = await request(`/profile/${profileSlug}`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert(publicRes.statusCode === 200, `Public profile /profile/${profileSlug} returns 200 OK`);
  assert(publicRes.body.includes('Taylor Reed'), 'Public profile renders name');
  assert(publicRes.body.includes('Lead Product Architect'), 'Public profile renders title');
  assert(!publicRes.body.includes('👑 Owner'), 'No legacy hardcoded outer demo switcher present');
  assert(!publicRes.body.includes('👤 Employee'), 'No legacy employee demo pill present');

  console.log('\n================================================================');
  console.log('✅ ALL SCHEMA & PROFILE EDIT WORKFLOW TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runSchemaFlowVerification().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
