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

async function checkAuthUsers() {
  const { data, error } = await client.auth.admin.listUsers();
  console.log('auth.users count:', data?.users?.length, error || '');
  if (data?.users?.length) {
    console.log('Sample auth.user:', {
      id: data.users[0].id,
      email: data.users[0].email,
      created_at: data.users[0].created_at
    });
  }
}

checkAuthUsers();
