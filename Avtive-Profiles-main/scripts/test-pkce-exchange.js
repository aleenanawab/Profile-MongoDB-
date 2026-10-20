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
const service = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing createClient with Anon Key:');
const clientAnon = createClient(url, anon, {
  auth: {
    storageKey: 'sb-test',
    storage: {
      getItem: (k) => {
        if (k.includes('code-verifier') && !k.includes('flows')) {
          return JSON.stringify('test-verifier-1234567890123456789012345678901234567890');
        }
        return null;
      },
      setItem: () => {},
      removeItem: () => {}
    },
    flowType: 'pkce'
  }
});

clientAnon.auth.exchangeCodeForSession('dummy_code').then(({ data, error }) => {
  console.log('Anon client exchangeCodeForSession result:');
  console.log('Status:', error?.status, '| Message:', error?.message, '| Name:', error?.name);
}).catch(e => console.error('Anon client exception:', e));

console.log('Testing createClient with Service Role Key:');
const clientService = createClient(url, service, {
  auth: {
    storageKey: 'sb-test',
    storage: {
      getItem: (k) => {
        if (k.includes('code-verifier') && !k.includes('flows')) {
          return JSON.stringify('test-verifier-1234567890123456789012345678901234567890');
        }
        return null;
      },
      setItem: () => {},
      removeItem: () => {}
    },
    flowType: 'pkce'
  }
});

clientService.auth.exchangeCodeForSession('dummy_code').then(({ data, error }) => {
  console.log('Service client exchangeCodeForSession result:');
  console.log('Status:', error?.status, '| Message:', error?.message, '| Name:', error?.name);
}).catch(e => console.error('Service client exception:', e));

clientService.auth.exchangeCodeForSession('dummy_code').then(({ data, error }) => {
  console.log('Service client exchangeCodeForSession result:');
  console.log('Error:', error?.status, error?.message, error?.name);
}).catch(e => console.error('Service client exception:', e));
