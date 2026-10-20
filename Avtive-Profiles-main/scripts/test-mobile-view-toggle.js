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

async function run() {
  console.log('--- 1. Authenticating as abcd@gmail.com ---');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'abcd@gmail.com',
      password: '12345678'
    })
  });
  assert(loginRes.statusCode === 200, `Login status 200, got ${loginRes.statusCode}`);
  const cookieHeader = loginRes.headers['set-cookie'];
  const cookies = (cookieHeader || []).map(c => c.split(';')[0]).join('; ');

  console.log('--- 2. Fetching Profile Page (/profile/abcd-user-profile) ---');
  const profileRes = await request('/profile/abcd-user-profile', {
    headers: { 'Cookie': cookies }
  });
  assert(profileRes.statusCode === 200, `Profile page loaded (200), got ${profileRes.statusCode}`);
  
  console.log('--- 3. Verifying View Switcher Toolbar elements ---');
  assert(profileRes.body.includes('Desktop View'), 'Contains "Desktop View" button');
  assert(profileRes.body.includes('Mobile View'), 'Contains "Mobile View" button');
  assert(profileRes.body.includes('Edit Profile'), 'Contains "Edit Profile" button');
  assert(profileRes.body.includes('Share'), 'Contains "Share" button');

  console.log('--- 4. Verifying ?view=mobile query support ---');
  const mobileProfileRes = await request('/profile/abcd-user-profile?view=mobile', {
    headers: { 'Cookie': cookies }
  });
  assert(mobileProfileRes.statusCode === 200, `Mobile query page loaded (200)`);
  assert(mobileProfileRes.body.includes('Mobile View'), 'Contains "Mobile View"');

  console.log('🎉 ALL MOBILE VIEW TESTS PASSED SUCCESSFULLY!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
