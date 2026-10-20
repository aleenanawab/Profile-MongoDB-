const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

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

const clientAnon = createClient(supabaseUrl, anonKey);
const clientAdmin = createClient(supabaseUrl, serviceKey);

async function testTables() {
  console.log('Testing with anon key:');
  const { data: uAnon, error: eAnon } = await clientAnon.from('users').select('*').limit(1);
  console.log('users with anon:', { uAnon, eAnon });

  const { data: pAnon, error: epAnon } = await clientAnon.from('profiles').select('*').limit(1);
  console.log('profiles with anon:', { pAnon, epAnon });

  console.log('\nTesting with service role key:');
  const { data: uAdmin, error: eAdmin } = await clientAdmin.from('users').select('*').limit(1);
  console.log('users with admin:', { uAdmin, eAdmin });

  const { data: pAdmin, error: epAdmin } = await clientAdmin.from('profiles').select('*').limit(1);
  console.log('profiles with admin:', { pAdmin, epAdmin });
}

testTables();
