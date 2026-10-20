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

async function runTests() {
  console.log('================================================================');
  console.log('TESTING AUTH ROUTING, STATE HANDLING & ANTI-ENUMERATION SECURITY');
  console.log('================================================================\n');

  // 1. Brand new user visiting root /
  console.log('--- 1. New Visitor on Root (/) ---');
  const newVisitorRes = await request('/');
  assert([307, 308].includes(newVisitorRes.statusCode), `New visitor gets redirected (got ${newVisitorRes.statusCode})`);
  assert(['/login', '/register'].includes(newVisitorRes.headers.location), `New visitor redirected to /login or /register (got ${newVisitorRes.headers.location})`);

  // 2. Returning unauthenticated user visiting root /
  console.log('\n--- 2. Returning User on Root (/) ---');
  const returningVisitorRes = await request('/', {
    headers: { 'Cookie': 'avtive_returning_user=true' }
  });
  assert([307, 308].includes(returningVisitorRes.statusCode), `Returning visitor gets redirected (got ${returningVisitorRes.statusCode})`);
  assert(returningVisitorRes.headers.location === '/login', `Returning visitor redirected to /login (got ${returningVisitorRes.headers.location})`);

  // 3. Login to obtain a valid session
  console.log('\n--- 3. Authenticate User (abcd@gmail.com) ---');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'abcd@gmail.com', password: '12345678' })
  });
  assert(loginRes.statusCode === 200, `Login succeeds (200)`);
  const cookiesHeader = loginRes.headers['set-cookie'] || [];
  const sessionCookie = cookiesHeader.find(c => c.startsWith('avtive_session='));
  const returningCookie = cookiesHeader.find(c => c.startsWith('avtive_returning_user='));
  assert(Boolean(sessionCookie), 'Received avtive_session cookie');
  assert(Boolean(returningCookie), 'Received avtive_returning_user cookie on login');

  const authCookies = cookiesHeader.map(c => c.split(';')[0]).join('; ');

  // 4. Authenticated user visiting root (/)
  console.log('\n--- 4. Authenticated User on Root (/) ---');
  const authHomeRes = await request('/', {
    headers: { 'Cookie': authCookies }
  });
  assert([307, 308].includes(authHomeRes.statusCode), `Authenticated user redirected from / (got ${authHomeRes.statusCode})`);
  assert(!authHomeRes.headers.location.includes('/register'), `Authenticated user is NOT sent to /register (location: ${authHomeRes.headers.location})`);
  assert(authHomeRes.headers.location.includes('/profile'), `Authenticated user redirected to their profile (location: ${authHomeRes.headers.location})`);

  // 5. Authenticated user visiting /register
  console.log('\n--- 5. Authenticated User on /register ---');
  const authRegisterRes = await request('/register', {
    headers: { 'Cookie': authCookies }
  });
  assert([307, 308].includes(authRegisterRes.statusCode), `Authenticated user redirected from /register (got ${authRegisterRes.statusCode})`);
  assert(!authRegisterRes.headers.location.includes('/register'), `Location does not loop on /register`);
  assert(authRegisterRes.headers.location.includes('/profile'), `Authenticated user redirected away from registration to profile`);

  // 6. Authenticated user visiting /login
  console.log('\n--- 6. Authenticated User on /login ---');
  const authLoginRes = await request('/login', {
    headers: { 'Cookie': authCookies }
  });
  assert([307, 308].includes(authLoginRes.statusCode), `Authenticated user redirected from /login (got ${authLoginRes.statusCode})`);
  assert(authLoginRes.headers.location.includes('/profile'), `Authenticated user redirected away from login to profile`);

  // 7. Anti-Enumeration on Registration
  console.log('\n--- 7. Anti-Enumeration on POST /api/auth/register ---');
  const dupRegRes = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Attacker',
      email: 'abcd@gmail.com', // Existing email
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!'
    })
  });
  assert(dupRegRes.statusCode !== 409, `Does NOT return HTTP 409 Conflict (got ${dupRegRes.statusCode})`);
  assert(!dupRegRes.body.includes('account with this email address already exists'), `Does not leak that email exists in database`);
  assert(dupRegRes.body.includes('Unable to process registration'), `Returns safe generic message`);
  const dupCookies = dupRegRes.headers['set-cookie'] || [];
  assert(!dupCookies.some(c => c.startsWith('avtive_returning_user=true')), 'Does NOT set returning user cookie on failed registration error (no cookie enumeration leak)');

  // 8. Anti-Enumeration on Login
  console.log('\n--- 8. Anti-Enumeration on POST /api/auth/login ---');
  const nonExistentLoginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'nonexistent_user_9999@randomdomain.xyz',
      password: 'SomePassword123!'
    })
  });
  assert(nonExistentLoginRes.statusCode === 401, `Returns 401 for non-existent user`);
  const nonExistentData = JSON.parse(nonExistentLoginRes.body);
  assert(nonExistentData.error === 'Invalid email or password.', `Returns generic error`);

  const wrongPasswordLoginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'abcd@gmail.com', // Existing user
      password: 'WrongPassword123!'
    })
  });
  assert(wrongPasswordLoginRes.statusCode === 401, `Returns 401 for wrong password`);
  const wrongPasswordData = JSON.parse(wrongPasswordLoginRes.body);
  assert(wrongPasswordData.error === 'Invalid email or password.', `Error message matches non-existent user`);

  // 9. Logout preserves returning user
  console.log('\n--- 9. Logout preserves returning user state ---');
  const logoutRes = await request('/api/auth/logout', {
    method: 'POST',
    headers: { 'Cookie': authCookies }
  });
  assert(logoutRes.statusCode === 200, `Logout succeeds (200)`);
  const logoutCookies = logoutRes.headers['set-cookie'] || [];
  const logoutSession = logoutCookies.find(c => c.startsWith('avtive_session='));
  const logoutReturning = logoutCookies.find(c => c.startsWith('avtive_returning_user='));
  assert(logoutSession && (logoutSession.includes('Max-Age=0') || logoutSession.includes('expires=')), `Session cookie cleared`);
  assert(Boolean(logoutReturning && logoutReturning.includes('true')), `Returning user cookie maintained on logout`);

  console.log('\n================================================================');
  console.log('🎉 ALL AUTH ROUTING & ANTI-ENUMERATION SECURITY TESTS PASSED!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
