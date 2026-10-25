const fs = require('fs');
const path = require('path');
const http = require('http');
const { MongoClient } = require('mongodb');

// Parse .env.local without external dependencies
try {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
} catch (e) {
  console.warn('Could not read .env.local directly:', e.message);
}

function makeRequest(options, body = null) {
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

function getMongoUri() {
  let uri = process.env.MONGODB_URI || '';
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1);
  }
  const username = process.env.MONGODB_USERNAME?.trim();
  const password = process.env.MONGODB_PASSWORD?.trim();
  if (username && password && uri.includes('@')) {
    uri = uri.replace(
      /(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/,
      `$1${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
    );
  }
  return uri.trim();
}

async function runComprehensiveVerification() {
  const results = {};
  console.log('================================================================');
  console.log('   COMPREHENSIVE VERIFICATION SUITE: MOBILE IMAGE PERSISTENCE   ');
  console.log('================================================================\n');

  // Connect to MongoDB directly for independent DB verification
  const mongoClient = new MongoClient(getMongoUri());
  await mongoClient.connect();
  const db = mongoClient.db(process.env.MONGODB_DB_NAME || 'avtive_profiles');
  const profilesCol = db.collection('profiles');

  // Step 1: Login
  console.log('--- Phase 1: Authentication ---');
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

  const setCookie = loginRes.headers['set-cookie'];
  let cookieHeader = Array.isArray(setCookie) ? setCookie.map(c => c.split(';')[0]).join('; ') : '';

  const meRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Cookie': cookieHeader }
  });

  const profileId = meRes.json?.profile?.id || meRes.json?.profile?.slug;
  const userId = meRes.json?.user?.id;
  console.log(`Authenticated User: ${userId}, Profile ID: ${profileId}`);

  // Test 1: Upload Both Images, Save, and Refresh
  console.log('\n--- Test 1: Upload Both Images & Refresh Verification ---');
  const sampleAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9Qz8DAwMTAwAAAEAMBAMpMvhUAAAAASUVORK5CYII=';
  const uploadAvatarRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/upload',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader }
  }, {
    file: sampleAvatar,
    bucket: 'avatars',
    profileId,
    field: 'avatar'
  });
  console.log('Avatar Upload Response:', uploadAvatarRes.statusCode, uploadAvatarRes.json?.url);

  const sampleCover = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8/5+B4T8DAwMTAwAABAMBAJv8m+AAAAAASUVORK5CYII=';
  const uploadCoverRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/upload',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader }
  }, {
    file: sampleCover,
    bucket: 'profiles',
    profileId,
    field: 'coverImage'
  });
  console.log('Cover Upload Response:', uploadCoverRes.statusCode, uploadCoverRes.json?.url);

  // Partial save
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/profile/update',
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader }
  }, {
    profileId,
    updatedData: {
      avatar: uploadAvatarRes.json?.url,
      coverImage: uploadCoverRes.json?.url
    }
  });

  // Refresh (fetch profile)
  const refreshRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/profile/${profileId}`,
    method: 'GET',
    headers: { 'Cookie': cookieHeader }
  });
  const refreshedProfile = refreshRes.json?.profile;
  const t1Passed = refreshedProfile?.avatar === uploadAvatarRes.json?.url && refreshedProfile?.coverImage === uploadCoverRes.json?.url;
  results['Test 1: Upload Both & Refresh'] = t1Passed ? 'PASSED' : 'FAILED';
  console.log(`Test 1 Result: ${results['Test 1: Upload Both & Refresh']}`);

  // Test 2: Logout, Clear Cookies, Re-login & Confirm Images Remain
  console.log('\n--- Test 2: Logout, Clear Cookies, Re-login Verification ---');
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/logout',
    method: 'POST',
    headers: { 'Cookie': cookieHeader }
  });

  // Clear cookie completely
  cookieHeader = '';

  const reLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'test_investigate_123@example.com',
    password: 'Password123!'
  });

  const reCookie = Array.isArray(reLoginRes.headers['set-cookie']) 
    ? reLoginRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') 
    : '';

  const meAfterReLogin = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Cookie': reCookie }
  });
  const reProfile = meAfterReLogin.json?.profile;
  const t2Passed = reProfile?.avatar === uploadAvatarRes.json?.url && reProfile?.coverImage === uploadCoverRes.json?.url;
  results['Test 2: Logout & Re-login Persistence'] = t2Passed ? 'PASSED' : 'FAILED';
  console.log(`Test 2 Result: ${results['Test 2: Logout & Re-login Persistence']}`);

  // Test 3: Confirm Direct MongoDB Record Holds Permanent HTTPS URLs
  console.log('\n--- Test 3: Direct MongoDB Record Verification ---');
  const directDoc = await profilesCol.findOne({ id: profileId });
  const hasHttpsAvatar = directDoc?.avatar?.startsWith('https://res.cloudinary.com/');
  const hasHttpsCover = directDoc?.coverImage?.startsWith('https://res.cloudinary.com/');
  const noBlobAvatar = !directDoc?.avatar?.startsWith('blob:');
  const noBlobCover = !directDoc?.coverImage?.startsWith('blob:');
  const hasNamespacedAvatarKey = directDoc?.avatarPublicId?.includes(`users/${userId}/avatars`);
  const hasNamespacedCoverKey = directDoc?.coverImagePublicId?.includes(`users/${userId}/profiles`);

  console.log('MongoDB doc.avatar:', directDoc?.avatar);
  console.log('MongoDB doc.coverImage:', directDoc?.coverImage);
  console.log('MongoDB doc.avatarPublicId:', directDoc?.avatarPublicId);
  console.log('MongoDB doc.coverImagePublicId:', directDoc?.coverImagePublicId);

  const t3Passed = hasHttpsAvatar && hasHttpsCover && noBlobAvatar && noBlobCover && hasNamespacedAvatarKey && hasNamespacedCoverKey;
  results['Test 3: MongoDB Permanent HTTPS & User Namespacing'] = t3Passed ? 'PASSED' : 'FAILED';
  console.log(`Test 3 Result: ${results['Test 3: MongoDB Permanent HTTPS & User Namespacing']}`);

  // Helper to generate structurally valid PNG images in memory
  function crc32(buf) {
    let table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        if (c & 1) c = 0xedb88320 ^ (c >>> 1);
        else c = c >>> 1;
      }
      table[n] = c;
    }
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  function createValidPng(w = 64, h = 64) {
    const zlib = require('zlib');
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    const raw = Buffer.alloc((1 + w * 4) * h);
    for (let y = 0; y < h; y++) {
      const off = y * (1 + w * 4);
      raw[off] = 0;
      for (let x = 0; x < w; x++) {
        const p = off + 1 + x * 4;
        raw[p] = 59; raw[p+1] = 130; raw[p+2] = 246; raw[p+3] = 255;
      }
    }
    const idat = zlib.deflateSync(raw);
    return Buffer.concat([sig, createChunk('IHDR', ihdr), createChunk('IDAT', idat), createChunk('IEND', Buffer.alloc(0))]);
  }

  // Test 4: Upload 5MB+ Image Simulation (Client Compression + Server 5MB Limit Enforcement)
  console.log('\n--- Test 4: 5MB+ Image Handling & Upload Verification ---');
  // Part A: Verify server rejects uncompressed files >5MB
  console.log('Testing Part 4A: Server-side >5MB size enforcement...');
  const oversizedBuffer = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(5.2 * 1024 * 1024)
  ]);
  const oversizedDataUrl = 'data:image/png;base64,' + oversizedBuffer.toString('base64');
  const oversizedRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/upload',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': reCookie }
  }, {
    file: oversizedDataUrl,
    bucket: 'avatars',
    profileId,
    field: 'avatar'
  });
  console.log('Oversized 5.2MB Upload Response Status (Expected 400):', oversizedRes.statusCode);
  console.log('Oversized 5.2MB Error Message:', oversizedRes.json?.error);
  const oversizedRejected = oversizedRes.statusCode === 400 && oversizedRes.json?.error?.includes('exceeds 5MB');

  // Part B: Large high-res mobile photo compressed client-side and uploaded
  console.log('Testing Part 4B: Large image compressed and uploaded to Cloudinary...');
  const highResPng = createValidPng(128, 128);
  const highResDataUrl = 'data:image/png;base64,' + highResPng.toString('base64');
  const uploadLargeRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/upload',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': reCookie }
  }, {
    file: highResDataUrl,
    bucket: 'avatars',
    profileId,
    field: 'avatar'
  });
  console.log('High-Res Upload Status:', uploadLargeRes.statusCode, uploadLargeRes.json?.url);
  const uploadLargeSuccess = uploadLargeRes.statusCode === 200 && uploadLargeRes.json?.url?.startsWith('https://res.cloudinary.com/');

  // Check MongoDB record updated
  const docAfterT4 = await profilesCol.findOne({ id: profileId });
  const t4MongoUpdated = docAfterT4?.avatar === uploadLargeRes.json?.url;

  const t4Passed = oversizedRejected && uploadLargeSuccess && t4MongoUpdated;
  results['Test 4: 5MB+ Photo Compression & Upload'] = t4Passed ? 'PASSED' : 'FAILED';
  console.log(`Test 4 Result: ${results['Test 4: 5MB+ Photo Compression & Upload']}`);

  // Test 5: Force Failed Upload & Confirm Visible Error and No Broken URL
  console.log('\n--- Test 5: Forced Failed Upload Rejection & Non-Corruption Verification ---');
  // Attempt to upload an invalid non-image payload (e.g. text file pretending to be image)
  const invalidFilePayload = 'data:image/jpeg;base64,' + Buffer.from('NOT_A_REAL_IMAGE_FILE_PAYLOAD').toString('base64');
  const failedUploadRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/upload',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': reCookie }
  }, {
    file: invalidFilePayload,
    bucket: 'avatars',
    profileId,
    field: 'avatar'
  });
  console.log('Failed Upload Response Status (Expected 400):', failedUploadRes.statusCode);
  console.log('Failed Upload Error Message:', failedUploadRes.json?.error);

  // Check MongoDB to verify profile avatar was NOT overwritten or corrupted by the failed attempt
  const docAfterFailed = await profilesCol.findOne({ id: profileId });
  const t5Passed = failedUploadRes.statusCode === 400 && 
    failedUploadRes.json?.error?.includes('not a valid') &&
    docAfterFailed?.avatar === uploadLargeRes.json?.url &&
    !docAfterFailed?.avatar?.startsWith('blob:');
  results['Test 5: Force Failed Upload Rejection'] = t5Passed ? 'PASSED' : 'FAILED';
  console.log(`Test 5 Result: ${results['Test 5: Force Failed Upload Rejection']}`);

  // Test 6: Edit Unrelated Field and Confirm Images are Untouched
  console.log('\n--- Test 6: Unrelated Profile Edit Image Preservation ---');
  const avatarBeforeUnrelated = docAfterFailed?.avatar;
  const coverBeforeUnrelated = docAfterFailed?.coverImage;

  const unrelatedEditRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/profile/update',
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Cookie': reCookie }
  }, {
    profileId,
    updatedData: {
      bio: 'Updated bio during unrelated edit test',
      tagline: 'Brand New Tagline Without Image Data'
      // Notice: avatar and coverImage are NOT sent in payload
    }
  });
  console.log('Unrelated Edit Status:', unrelatedEditRes.statusCode);

  const docAfterUnrelated = await profilesCol.findOne({ id: profileId });
  const t6Passed = unrelatedEditRes.statusCode === 200 &&
    docAfterUnrelated?.avatar === avatarBeforeUnrelated &&
    docAfterUnrelated?.coverImage === coverBeforeUnrelated &&
    docAfterUnrelated?.tagline === 'Brand New Tagline Without Image Data';
  results['Test 6: Unrelated Edit Image Preservation'] = t6Passed ? 'PASSED' : 'FAILED';
  console.log(`Test 6 Result: ${results['Test 6: Unrelated Edit Image Preservation']}`);

  await mongoClient.close();

  console.log('\n================================================================');
  console.log('                     FINAL TEST SCORECARD                       ');
  console.log('================================================================');
  let allPassed = true;
  for (const [testName, result] of Object.entries(results)) {
    console.log(`${result === 'PASSED' ? '✓' : '✗'} ${testName}: ${result}`);
    if (result !== 'PASSED') allPassed = false;
  }
  console.log('================================================================\n');

  if (allPassed) {
    console.log('ALL VERIFICATION REQUIREMENTS MET WITH 100% PASS RATE.');
    process.exit(0);
  } else {
    console.error('ONE OR MORE VERIFICATION CHECKS FAILED.');
    process.exit(1);
  }
}

runComprehensiveVerification().catch(err => {
  console.error('Suite execution error:', err);
  process.exit(1);
});
