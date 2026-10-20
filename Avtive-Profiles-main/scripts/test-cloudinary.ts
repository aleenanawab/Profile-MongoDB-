/**
 * Test Suite: Cloudinary Storage Integration & URL Converters
 */
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  ensureCloudinaryAssetUrl,
  uploadToSupabaseStorage,
  ensureSupabaseAssetUrl
} from '../src/lib/storage';

async function runStorageTests() {
  console.log('====================================================');
  console.log('         TEST SUITE: CLOUDINARY STORAGE             ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    console.log(`Cloudinary configured with credentials: ${isCloudinaryConfigured}`);

    // 1. Existing remote URL should pass through untouched
    const remoteUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';
    const preservedUrl = await ensureCloudinaryAssetUrl(remoteUrl);
    assert(preservedUrl === remoteUrl, 'Remote HTTPS URLs pass through untouched');

    // 2. Buffer upload test
    const dummyBuffer = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;', 'binary');
    const uploadRes = await uploadToCloudinary(dummyBuffer, 'test-pixel.gif', 'image/gif', 'test');
    assert(uploadRes.success && Boolean(uploadRes.url), `Buffer upload succeeded (storage: ${uploadRes.storage}, url: ${uploadRes.url})`);

    // 3. Base64 Data URI conversion test
    const base64DataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const convertedUrl = await ensureCloudinaryAssetUrl(base64DataUri, 'profiles');
    assert(Boolean(convertedUrl && !convertedUrl.startsWith('data:')), `Data URI converted to hosted URL: ${convertedUrl}`);

    // 4. Backward compatibility alias test
    const compatUpload = await uploadToSupabaseStorage(dummyBuffer, 'compat-test.gif', 'image/gif', 'profiles');
    assert(compatUpload.success && Boolean(compatUpload.url), 'Supabase storage alias uploads properly');

    const compatConvert = await ensureSupabaseAssetUrl(base64DataUri, 'avatars');
    assert(Boolean(compatConvert && !compatConvert.startsWith('data:')), 'ensureSupabaseAssetUrl alias converts properly');

  } catch (err: any) {
    console.error('Unexpected error in storage test suite:', err.message);
    failed++;
  }

  console.log('\n----------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

runStorageTests();
