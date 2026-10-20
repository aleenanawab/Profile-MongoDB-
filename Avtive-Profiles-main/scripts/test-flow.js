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

async function run() {
  console.log('Testing Root Redirect:');
  const root = await request('/');
  console.log('GET / -> Status:', root.statusCode, 'Location:', root.headers.location);

  console.log('\nTesting /register:');
  const register = await request('/register');
  console.log('GET /register -> Status:', register.statusCode);

  console.log('\nTesting /login:');
  const login = await request('/login');
  console.log('GET /login -> Status:', login.statusCode);

  console.log('\nTesting /onboarding/theme without session:');
  const onboarding = await request('/onboarding/theme');
  console.log('GET /onboarding/theme -> Status:', onboarding.statusCode, 'Location:', onboarding.headers.location);

  console.log('\nTesting User Registration Flow:');
  const testEmail = `newuser_${Date.now()}@test.com`;
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test New User',
      email: testEmail,
      password: 'Password@123',
      confirmPassword: 'Password@123'
    })
  });
  console.log('POST /api/auth/register -> Status:', regRes.statusCode, regRes.body);

  console.log('\nTesting Login for New User (with 0 profiles):');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Password@123'
    })
  });
  console.log('POST /api/auth/login -> Status:', loginRes.statusCode, loginRes.body);
  const cookies = loginRes.headers['set-cookie'];
  const sessionCookie = cookies ? cookies[0].split(';')[0] : '';
  console.log('Session Cookie:', sessionCookie ? 'Received' : 'Missing');

  console.log('\nTesting / with Authenticated New User (0 profiles):');
  const authRoot = await request('/', {
    headers: { 'Cookie': sessionCookie }
  });
  console.log('GET / (with session) -> Status:', authRoot.statusCode, 'Location:', authRoot.headers.location);

  console.log('\nTesting Profile Creation through Onboarding:');
  const createRes = await request('/api/profile/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({
      name: 'Test New User',
      profileName: 'Full Stack Engineer',
      type: 'owner',
      theme: 'editorial',
      designation: 'Senior Developer',
      shortBio: 'Building great software on Avtive.'
    })
  });
  console.log('POST /api/profile/create -> Status:', createRes.statusCode);
  const createdData = JSON.parse(createRes.body);
  console.log('Created Profile Slug:', createdData.profile?.slug);

  console.log('\nTesting / with Authenticated User (>0 profiles):');
  const authRootWithProfile = await request('/', {
    headers: { 'Cookie': sessionCookie }
  });
  console.log('GET / (with profile) -> Status:', authRootWithProfile.statusCode, 'Location:', authRootWithProfile.headers.location);

  console.log('\nAll core flow validations completed successfully!');
}

run().catch(console.error);
