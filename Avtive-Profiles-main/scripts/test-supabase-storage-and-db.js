const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Simple manual .env parser
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith('#') && cleanLine.includes('=')) {
    const idx = cleanLine.indexOf('=');
    const key = cleanLine.substring(0, idx).trim();
    const val = cleanLine.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
    envConfig[key] = val;
  }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || 'https://hprlnnbnzomgvscmyane.supabase.co';
const serviceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase with URL:', supabaseUrl);
console.log('Service Key starts with:', serviceKey ? serviceKey.substring(0, 20) + '...' : 'NONE');

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function runTest() {
  console.log('\n--- 1. Testing Storage Buckets ---');
  try {
    const { data: buckets, error: bucketListErr } = await supabaseAdmin.storage.listBuckets();
    if (bucketListErr) {
      console.error('listBuckets error:', bucketListErr);
    } else {
      console.log('Existing storage buckets:', buckets.map(b => b.name));
    }

    // Ensure 'profiles' bucket exists
    const neededBuckets = ['profiles', 'links', 'avatars'];
    for (const bName of neededBuckets) {
      const exists = buckets && buckets.some(b => b.name === bName);
      if (!exists) {
        console.log(`Creating public bucket '${bName}'...`);
        const { data: createData, error: createErr } = await supabaseAdmin.storage.createBucket(bName, {
          public: true,
          fileSizeLimit: 10485760 // 10MB
        });
        if (createErr) {
          console.warn(`Could not create bucket ${bName}:`, createErr.message);
        } else {
          console.log(`Bucket '${bName}' created successfully!`);
        }
      } else {
        console.log(`Bucket '${bName}' already exists.`);
      }
    }

    // Test upload a small image to 'profiles' bucket
    console.log('\n--- 2. Testing Upload to "profiles" bucket ---');
    const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const testFilename = `test-avatar-${Date.now()}.png`;

    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from('profiles')
      .upload(testFilename, testBuffer, { contentType: 'image/png', upsert: true });

    if (uploadErr) {
      console.error('Test upload failed:', uploadErr);
    } else {
      const { data: pubUrlData } = supabaseAdmin.storage.from('profiles').getPublicUrl(testFilename);
      console.log('Upload success! CDN URL:', pubUrlData.publicUrl);
    }

  } catch (err) {
    console.error('Storage test error:', err);
  }

  console.log('\n--- 3. Testing Database Tables ("users" and "profiles") ---');
  try {
    // Test users table
    const { data: users, error: usersErr } = await supabaseAdmin.from('users').select('*').limit(5);
    if (usersErr) {
      console.error('Error querying "users" table:', usersErr);
    } else {
      console.log('Successfully queried "users" table. Row count (sample):', users.length);
    }

    // Test profiles table
    const { data: profiles, error: profilesErr } = await supabaseAdmin.from('profiles').select('*').limit(5);
    if (profilesErr) {
      console.error('Error querying "profiles" table:', profilesErr);
    } else {
      console.log('Successfully queried "profiles" table. Row count (sample):', profiles.length);
    }
  } catch (err) {
    console.error('Database test error:', err);
  }
}

runTest();
