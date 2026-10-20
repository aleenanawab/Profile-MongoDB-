const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
const env = {};
content.split('\n').forEach(l => {
  const [k, ...v] = l.trim().split('=');
  if (k && v.length) {
    let val = v.join('=').trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[k.trim()] = val;
  }
});

async function test() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('--- 1. Testing with service role key: ---');
  try {
    const res1 = await fetch(`${url}/auth/v1/token?grant_type=pkce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': service, 'Authorization': `Bearer ${service}` },
      body: JSON.stringify({ auth_code: 'dummy_code', code_verifier: 'dummy_verifier' })
    });
    console.log('Service role status:', res1.status, await res1.text());
  } catch (err) {
    console.error('Service role error:', err.message);
  }

  console.log('\n--- 2. Testing with anon key: ---');
  try {
    const res2 = await fetch(`${url}/auth/v1/token?grant_type=pkce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anon, 'Authorization': `Bearer ${anon}` },
      body: JSON.stringify({ auth_code: 'dummy_code', code_verifier: 'dummy_verifier' })
    });
    console.log('Anon status:', res2.status, await res2.text());
  } catch (err) {
    console.error('Anon error:', err.message);
  }

  console.log('\n--- 3. Testing without Authorization header (apikey only): ---');
  try {
    const res3 = await fetch(`${url}/auth/v1/token?grant_type=pkce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anon },
      body: JSON.stringify({ auth_code: 'dummy_code', code_verifier: 'dummy_verifier' })
    });
    console.log('Apikey-only status:', res3.status, await res3.text());
  } catch (err) {
    console.error('Apikey-only error:', err.message);
  }
}

test();
