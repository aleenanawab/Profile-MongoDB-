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

async function testUserWorkflow() {
  console.log('--- 1. Testing abcd@gmail.com Login ---');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'abcd@gmail.com',
      password: '12345678'
    })
  });

  console.log('Login Status:', loginRes.statusCode);
  console.log('Login Response:', loginRes.body);
  assert(loginRes.statusCode === 200, 'abcd@gmail.com login must succeed with 200 OK');

  const cookie = loginRes.headers['set-cookie']?.[0]?.split(';')[0];
  assert(Boolean(cookie), 'Received auth session cookie');

  console.log('\n--- 2. Testing Profile Creation ---');
  const createRes = await request('/api/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie
    },
    body: JSON.stringify({
      name: 'ABCD User',
      firstName: 'ABCD',
      secondName: 'User',
      profileName: 'Primary Profile',
      professionalTitle: 'Full Stack Engineer',
      bio: 'Testing profile creation workflow',
      about: 'About story content',
      skills: ['Next.js', 'React', 'TypeScript'],
      theme: 'editorial',
      type: 'owner'
    })
  });

  console.log('Create Profile Status:', createRes.statusCode);
  assert(createRes.statusCode === 201, 'Profile creation must return 201 Created');
  const createData = JSON.parse(createRes.body);
  const targetSlug = createData.profile.slug;
  console.log('Created Profile Slug:', targetSlug);

  const setCookies = createRes.headers['set-cookie'];
  console.log('Cookies returned from profile creation:', setCookies);

  console.log('\n--- 3. Testing Direct Navigation to Profile Edit Page ---');
  const editPageRes = await request(`/profile/${targetSlug}/edit`, {
    headers: { Cookie: cookie }
  });

  let finalEditRes = editPageRes;
  if (editPageRes.statusCode === 307 && editPageRes.headers.location) {
    console.log('Following in-place edit redirect to:', editPageRes.headers.location);
    finalEditRes = await request(editPageRes.headers.location, {
      headers: { Cookie: cookie }
    });
  }

  console.log('Final Edit Page Status:', finalEditRes.statusCode);
  assert(finalEditRes.statusCode === 200, `Editing profile page returns 200 OK`);
  assert(!finalEditRes.headers.location || !finalEditRes.headers.location.includes('/onboarding/theme'), 'Must NOT redirect to /onboarding/theme');
  assert(finalEditRes.body.includes('ABCD User') || finalEditRes.body.includes('Save') || finalEditRes.body.includes('Cancel'), 'Edit profile page rendered successfully');

  console.log('\n🎉 ALL CHECKS PASSED: 401 is resolved and profile creation directs to editing page!');
}

testUserWorkflow().catch(e => {
  console.error(e);
  process.exit(1);
});
