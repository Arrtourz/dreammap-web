-- Dreammap Database Schema
-- This script is idempotent - safe to run multiple times
-- It will create tables if they don't exist and add missing columns

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  avatar_url text,
  subscription_tier text DEFAULT 'free'::text
    CHECK (subscription_tier = ANY (ARRAY['free'::text, 'pay_per_use'::text, 'subscription'::text])),
  polar_customer_id text UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  subscription_id text,
  subscription_status text DEFAULT 'inactive'::text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Research tasks (stores minimal metadata, full data fetched from DeepResearch API)
CREATE TABLE IF NOT EXISTS public.research_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  deepresearch_id text NOT NULL UNIQUE,
  location_name text NOT NULL,
  location_lat double precision NOT NULL,
  location_lng double precision NOT NULL,
  status text NOT NULL DEFAULT 'queued'::text
    CHECK (status = ANY (ARRAY['queued'::text, 'running'::text, 'completed'::text, 'failed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  anonymous_id text,
  is_public boolean DEFAULT false,
  share_token text UNIQUE,
  shared_at timestamp with time zone,
  CONSTRAINT research_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT research_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Add location_images column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'research_tasks'
    AND column_name = 'location_images'
  ) THEN
    ALTER TABLE public.research_tasks ADD COLUMN location_images jsonb;
  END IF;
END $$;

-- Rate limits
CREATE TABLE IF NOT EXISTS public.user_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  usage_count integer NOT NULL DEFAULT 0,
  reset_date text NOT NULL,
  monthly_usage_count integer NOT NULL DEFAULT 0,
  monthly_reset_date text NOT NULL DEFAULT '',
  last_request_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_rate_limits_pkey PRIMARY KEY (id),
  CONSTRAINT user_rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Add monthly tracking columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_rate_limits'
    AND column_name = 'monthly_usage_count'
  ) THEN
    ALTER TABLE public.user_rate_limits ADD COLUMN monthly_usage_count integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_rate_limits'
    AND column_name = 'monthly_reset_date'
  ) THEN
    ALTER TABLE public.user_rate_limits ADD COLUMN monthly_reset_date text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_tasks_user_id ON public.research_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_research_tasks_created_at ON public.research_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_tasks_deepresearch_id ON public.research_tasks(deepresearch_id);
CREATE INDEX IF NOT EXISTS idx_research_tasks_status ON public.research_tasks(status);
CREATE INDEX IF NOT EXISTS idx_research_tasks_share_token ON public.research_tasks(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_research_tasks_is_public ON public.research_tasks(is_public) WHERE is_public = true;

-- Function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token() RETURNS text AS $$
DECLARE
  token text;
  exists boolean;
BEGIN
  LOOP
    -- Generate random 12 character alphanumeric token
    token := substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);

    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.research_tasks WHERE share_token = token) INTO exists;

    IF NOT exists THEN
      RETURN token;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Dream entries for Dreammap
CREATE TABLE IF NOT EXISTS public.dream_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dream_text text NOT NULL,
  dream_date date NOT NULL,
  dream_time_bucket text NOT NULL
    CHECK (dream_time_bucket = ANY (ARRAY[
      'after-midnight'::text,
      'early-morning'::text,
      'morning'::text,
      'afternoon-nap'::text,
      'evening'::text
    ])),
  location_label text NOT NULL,
  location_lat_rough double precision NOT NULL,
  location_lng_rough double precision NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  share_token text NOT NULL UNIQUE DEFAULT generate_share_token(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dream_entries_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_dream_entries_public_created_at
  ON public.dream_entries(created_at DESC)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_dream_entries_public_dream_date
  ON public.dream_entries(dream_date DESC)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_dream_entries_user_id
  ON public.dream_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_dream_entries_share_token
  ON public.dream_entries(share_token);

ALTER TABLE public.dream_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read public dream entries" ON public.dream_entries;
CREATE POLICY "Public can read public dream entries"
  ON public.dream_entries
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

DROP POLICY IF EXISTS "Authenticated users can read own dream entries" ON public.dream_entries;
CREATE POLICY "Authenticated users can read own dream entries"
  ON public.dream_entries
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert own dream entries" ON public.dream_entries;
CREATE POLICY "Authenticated users can insert own dream entries"
  ON public.dream_entries
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authenticated users can delete own dream entries" ON public.dream_entries;
CREATE POLICY "Authenticated users can delete own dream entries"
  ON public.dream_entries
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_dream_entries_updated_at ON public.dream_entries;
CREATE TRIGGER set_dream_entries_updated_at
BEFORE UPDATE ON public.dream_entries
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
