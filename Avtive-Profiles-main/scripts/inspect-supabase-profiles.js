const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith('#') && cleanLine.includes('=')) {
    const idx = cleanLine.indexOf('=');
    envConfig[cleanLine.substring(0, idx).trim()] = cleanLine.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
});

const client = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: users, error: uErr } = await client.from('users').select('*');
  console.log('Users in Supabase:', users?.length, uErr || '');
  if (users?.length) {
    console.log('Sample User:', users[0]);
  }

  const { data: profiles, error: pErr } = await client.from('profiles').select('*');
  console.log('Profiles in Supabase:', profiles?.length, pErr || '');
  if (profiles?.length) {
    console.log('Sample Profile keys:', Object.keys(profiles[0]));
    console.log('Sample Profile:', JSON.stringify(profiles[0], null, 2));
  }
}

main();
