const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(l => {
  const [k, ...v] = l.trim().split('=');
  if (k && v.length) {
    let val = v.join('=').trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[k.trim()] = val;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Simulate request cookies containing code-verifier
const mockCookies = {
  'sb-avtive-auth-token-code-verifier': JSON.stringify('test-code-verifier-value-12345')
};

const serverStorage = {
  getItem: (key) => {
    console.log('>>> serverStorage.getItem CALLED for key:', key);
    return mockCookies[key] || null;
  },
  setItem: (key, val) => {
    console.log('>>> serverStorage.setItem CALLED for key:', key);
    mockCookies[key] = val;
  },
  removeItem: (key) => {
    console.log('>>> serverStorage.removeItem CALLED for key:', key);
    delete mockCookies[key];
  }
};

const client = createClient(url, anon, {
  auth: {
    storageKey: 'sb-avtive-auth-token',
    storage: serverStorage,
    flowType: 'pkce',
    persistSession: true, // <-- SET TO TRUE
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

client.auth.exchangeCodeForSession('dummy_code').then(({ data, error }) => {
  console.log('Exchange result error code:', error?.code, error?.message);
}).catch(err => {
  console.error('Exchange exception:', err);
});
