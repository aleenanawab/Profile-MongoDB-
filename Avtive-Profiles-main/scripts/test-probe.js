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

async function testQuery() {
  const slug = 'aleena-nawab';
  console.log('Querying Supabase with .or(id.eq.' + slug + ',slug.eq.' + slug + ')...');
  const res = await client.from('profiles').select('*').or(`id.eq.${slug},slug.eq.${slug}`);
  console.log('Result with id.eq:', res.error);

  console.log('Querying Supabase with .eq(slug, ' + slug + ')...');
  const res2 = await client.from('profiles').select('*').eq('slug', slug);
  console.log('Result with slug only:', res2.error || 'SUCCESS');
}

testQuery();
