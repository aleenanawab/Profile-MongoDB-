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

async function testButtons() {
  console.log('--- 1. Login as abcd@gmail.com ---');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'abcd@gmail.com',
      password: '12345678'
    })
  });
  assert(loginRes.statusCode === 200, 'Login succeeded');
  const ownerCookie = loginRes.headers['set-cookie']?.[0]?.split(';')[0];

  let editPageRes = await request('/profile/abcd-user-profile/edit', {
    headers: { Cookie: ownerCookie }
  });
  if (editPageRes.statusCode === 307 && editPageRes.headers.location) {
    editPageRes = await request(editPageRes.headers.location, {
      headers: { Cookie: ownerCookie }
    });
  }
  assert(editPageRes.statusCode === 200, 'Edit page loaded');
  // Must NOT have Connect or Share button inside the header below avatar
  // In our edit page, we removed the div with figma-pill-primary Share & figma-pill-secondary Connect
  assert(!editPageRes.body.includes('figma-pill-secondary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer'), 'Edit page does not have Connect button below avatar');

  console.log('\n--- 3. Owner Viewing Own Profile (/profile/abcd-user-profile) ---');
  const ownerViewRes = await request('/profile/abcd-user-profile', {
    headers: { Cookie: ownerCookie }
  });
  assert(ownerViewRes.statusCode === 200, 'Owner view loaded');
  assert(ownerViewRes.body.includes('Edit Profile'), 'Owner view renders "Edit Profile" button');
  console.log('Verified: Owner sees "Edit Profile" button');

  console.log('\n--- 4. Another User Viewing abcd\'s Profile (Visitor view) ---');
  // Login as Hamza
  const hamzaLoginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'hamza@avtive.app',
      password: 'Avtive@123'
    })
  });
  const visitorCookie = hamzaLoginRes.headers['set-cookie']?.[0]?.split(';')[0];

  const visitorViewRes = await request('/profile/abcd-user-profile', {
    headers: { Cookie: visitorCookie }
  });
  assert(visitorViewRes.statusCode === 200, 'Visitor view loaded');
  assert(visitorViewRes.body.includes('Connect'), 'Visitor view renders "Connect" button');
  console.log('Verified: Visitor sees "Connect" button');

  console.log('\n🎉 ALL OWNER VS VISITOR CHECKS PASSED!');
}

testButtons().catch(e => {
  console.error(e);
  process.exit(1);
});
