const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

async function syncSeedUsers() {
  const defaultPasswordHash = bcrypt.hashSync('Avtive@123', 10);
  const abcdPasswordHash = bcrypt.hashSync('12345678', 10);

  const seedUsers = [
    {
      id: 'user-abcd',
      name: 'ABCD User',
      email: 'abcd@gmail.com',
      password_hash: abcdPasswordHash,
      created_at: new Date().toISOString()
    },
    {
      id: 'user-aleena',
      name: 'Aleena Nawab',
      email: 'aleenaknawab@gmail.com',
      password_hash: abcdPasswordHash,
      created_at: new Date().toISOString()
    },
    {
      id: 'user-leap',
      name: 'The Leap Pakistan',
      email: 'theleappakistan22@gmail.com',
      password_hash: abcdPasswordHash,
      created_at: new Date().toISOString()
    },
    {
      id: 'user-mesum',
      name: 'Syed Mesum Raza Shah',
      email: 'mesum@avtive.app',
      password_hash: defaultPasswordHash,
      created_at: new Date().toISOString()
    },
    {
      id: 'user-hamza',
      name: 'Hamza Malik',
      email: 'hamza@avtive.app',
      password_hash: defaultPasswordHash,
      created_at: new Date().toISOString()
    }
  ];

  for (const u of seedUsers) {
    const res = await client.from('users').upsert(u, { onConflict: 'email' });
    console.log(`Upserted ${u.email}:`, res.error || 'SUCCESS');
  }

  const { data: allUsers } = await client.from('users').select('*');
  console.log('Total users now in Supabase:', allUsers?.length);
}

syncSeedUsers();
