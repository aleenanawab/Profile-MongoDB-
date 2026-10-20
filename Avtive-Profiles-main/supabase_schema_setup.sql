-- ==============================================================================
-- AVTIVE PROFILES: SUPABASE DATABASE & STORAGE INITIALIZATION SCRIPT
-- Project: https://hprlnnbnzomgvscmyane.supabase.co
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/hprlnnbnzomgvscmyane
-- 2. Go to "SQL Editor" in the left sidebar.
-- 3. Click "New query", paste this entire script, and click "Run".
-- ==============================================================================

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  avatar_url TEXT,
  role TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  type TEXT DEFAULT 'individual',
  theme TEXT DEFAULT 'editorial',
  avatar TEXT,
  cover_image TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Grant full permissions to service_role, authenticated, and anon
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.users TO postgres;
GRANT SELECT, INSERT, UPDATE ON TABLE public.users TO authenticated;
GRANT SELECT, INSERT ON TABLE public.users TO anon;

GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.profiles TO postgres;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO anon;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Set up RLS Policies for users table
DROP POLICY IF EXISTS "Allow service role full access to users" ON public.users;
CREATE POLICY "Allow service role full access to users" 
  ON public.users 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public select users" ON public.users;
CREATE POLICY "Public select users" 
  ON public.users 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Public insert users" ON public.users;
CREATE POLICY "Public insert users" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update users" ON public.users;
CREATE POLICY "Public update users" 
  ON public.users 
  FOR UPDATE 
  USING (true);

-- 6. Set up RLS Policies for profiles table
DROP POLICY IF EXISTS "Allow service role full access to profiles" ON public.profiles;
CREATE POLICY "Allow service role full access to profiles" 
  ON public.profiles 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public select profiles" ON public.profiles;
CREATE POLICY "Public select profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Public insert profiles" ON public.profiles;
CREATE POLICY "Public insert profiles" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update profiles" ON public.profiles;
CREATE POLICY "Public update profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (true);

DROP POLICY IF EXISTS "Public delete profiles" ON public.profiles;
CREATE POLICY "Public delete profiles" 
  ON public.profiles 
  FOR DELETE 
  USING (true);

-- 7. Ensure Storage Buckets exist and are public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profiles', 'profiles', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif']),
  ('avatars', 'avatars', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif']),
  ('links', 'links', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- 8. Storage RLS Policies for public uploads and downloads
DROP POLICY IF EXISTS "Public storage read" ON storage.objects;
CREATE POLICY "Public storage read" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id IN ('profiles', 'avatars', 'links'));

DROP POLICY IF EXISTS "Public storage insert" ON storage.objects;
CREATE POLICY "Public storage insert" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id IN ('profiles', 'avatars', 'links'));

DROP POLICY IF EXISTS "Public storage update" ON storage.objects;
CREATE POLICY "Public storage update" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id IN ('profiles', 'avatars', 'links'));

DROP POLICY IF EXISTS "Public storage delete" ON storage.objects;
CREATE POLICY "Public storage delete" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id IN ('profiles', 'avatars', 'links'));
