-- ==============================================================================
-- AVTIVE PROFILES: COMPANY & TEAM MEMBERS MIGRATION
-- Migration Date: 2026-10-07
-- ==============================================================================

-- 1. Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  size TEXT DEFAULT '',
  website TEXT DEFAULT '',
  location TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  theme TEXT DEFAULT 'editorial',
  visibility JSONB DEFAULT '{"about": true, "team": true, "services": true, "projects": true, "contact": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create company_members table
CREATE TABLE IF NOT EXISTS public.company_members (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT DEFAULT '',
  department TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'REMOVED')),
  invite_token TEXT,
  invite_expires_at TIMESTAMPTZ,
  invited_by_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_company_member_email UNIQUE (company_id, email)
);

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_email ON public.company_members(email);

-- 4. Permissions
GRANT ALL ON TABLE public.companies TO service_role;
GRANT ALL ON TABLE public.companies TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies TO authenticated;
GRANT SELECT ON TABLE public.companies TO anon;

GRANT ALL ON TABLE public.company_members TO service_role;
GRANT ALL ON TABLE public.company_members TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_members TO authenticated;
GRANT SELECT ON TABLE public.company_members TO anon;

-- 5. Row Level Security (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role full access to companies" ON public.companies;
CREATE POLICY "Allow service role full access to companies" 
  ON public.companies 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public select companies" ON public.companies;
CREATE POLICY "Public select companies" 
  ON public.companies 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow service role full access to company_members" ON public.company_members;
CREATE POLICY "Allow service role full access to company_members" 
  ON public.company_members 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public select company_members" ON public.company_members;
CREATE POLICY "Public select company_members" 
  ON public.company_members 
  FOR SELECT 
  USING (status = 'ACTIVE');
