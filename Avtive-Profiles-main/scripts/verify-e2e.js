const http = require('http');

async function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runVerification() {
  console.log('=== Step 1: Check Local Server Health ===');
  const healthRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/health',
    method: 'GET'
  });
  console.log('Health Status:', healthRes.statusCode, healthRes.json);

  console.log('\n=== Step 2: Authenticate Test Account ===');
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'test_investigate_123@example.com',
    password: 'Password123!'
  });
  console.log('Login Status:', loginRes.statusCode);
  const setCookie = loginRes.headers['set-cookie'];
  const cookieHeader = Array.isArray(setCookie) ? setCookie.map(c => c.split(';')[0]).join('; ') : '';
  console.log('Cookie received:', Boolean(cookieHeader));

  // Retrieve authenticated profile details via /api/auth/me
  const meRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Cookie': cookieHeader }
  });
  console.log('Me Status:', meRes.statusCode);
  const profile = meRes.json?.profile;
  const profileId = profile?.id || profile?.slug || loginRes.json?.profileSlug;
  console.log('Authenticated Profile ID:', profileId, 'Slug:', profile?.slug);

  if (!profileId) {
    throw new Error('Could not resolve profile ID from session.');
  }

  console.log('\n=== Step 3: Test Direct Image Upload with Profile Persistence ===');
  // 1x1 transparent red png data URL
  const testAvatarDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const uploadAvatarRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    }
  }, {
    file: testAvatarDataUrl,
    bucket: 'avatars',
    profileId: profileId,
    field: 'avatar'
  });
  console.log('Avatar Upload Status:', uploadAvatarRes.statusCode, uploadAvatarRes.json);

  const testCoverDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const uploadCoverRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    }
  }, {
    file: testCoverDataUrl,
    bucket: 'profiles',
    profileId: profileId,
    field: 'coverImage'
  });
  console.log('Cover Upload Status:', uploadCoverRes.statusCode, uploadCoverRes.json);

  console.log('\n=== Step 4: Test Partial Hero Save (handleSavePartial Flow) ===');
  const updateRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/profile/update',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    }
  }, {
    profileId: profileId,
    updatedData: {
      avatar: uploadAvatarRes.json?.url,
      coverImage: uploadCoverRes.json?.url,
      tagline: 'Verified Mobile Image Persistence'
    }
  });
  console.log('Update Status:', updateRes.statusCode);

  console.log('\n=== Step 5: Verify Saved Profile Directly From DB ===');
  const fetchRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/profile/${profileId}`,
    method: 'GET',
    headers: {
      'Cookie': cookieHeader
    }
  });
  console.log('Fetched Profile Status:', fetchRes.statusCode);
  const fetched = fetchRes.json?.profile;
  console.log('Persisted Avatar URL in MongoDB:', fetched?.avatar);
  console.log('Persisted Cover URL in MongoDB:', fetched?.coverImage);
  console.log('Persisted Tagline:', fetched?.tagline);

  console.log('\n=== Step 6: Test Logout & Re-Login Session Retrieval ===');
  const logoutRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/logout',
    method: 'POST',
    headers: { 'Cookie': cookieHeader }
  });
  console.log('Logout Status:', logoutRes.statusCode);

  const reloginRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'test_investigate_123@example.com',
    password: 'Password123!'
  });
  console.log('Re-login Status:', reloginRes.statusCode);
  const reloginCookie = Array.isArray(reloginRes.headers['set-cookie']) 
    ? reloginRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') 
    : '';

  const meAfterLogin = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Cookie': reloginCookie }
  });
  const reloginProfile = meAfterLogin.json?.profile;
  console.log('Re-login Profile Avatar:', reloginProfile?.avatar);
  console.log('Re-login Profile Cover:', reloginProfile?.coverImage);

  const avatarMatches = reloginProfile?.avatar === uploadAvatarRes.json?.url;
  const coverMatches = reloginProfile?.coverImage === uploadCoverRes.json?.url;
  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log('Avatar persisted and matches Cloudinary URL:', avatarMatches);
  console.log('Cover persisted and matches Cloudinary URL:', coverMatches);

  if (avatarMatches && coverMatches) {
    console.log('SUCCESS: All mobile photo upload, save, refresh, and session persistence checks PASSED!');
  } else {
    console.error('FAILURE: Images did not match expected values.');
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
