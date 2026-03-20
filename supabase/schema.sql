-- Dreammap database schema
-- Safe to run multiple times

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.generate_share_token() RETURNS text AS $$
DECLARE
  token text;
  exists boolean;
BEGIN
  LOOP
    token := substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);
    SELECT EXISTS(SELECT 1 FROM public.dream_entries WHERE share_token = token) INTO exists;

    IF NOT exists THEN
      RETURN token;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.dream_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dream_entries_created_at
  ON public.dream_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dream_entries_dream_date
  ON public.dream_entries(dream_date DESC);
CREATE INDEX IF NOT EXISTS idx_dream_entries_user_id
  ON public.dream_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_entries_share_token
  ON public.dream_entries(share_token);
CREATE INDEX IF NOT EXISTS idx_dream_entries_public
  ON public.dream_entries(is_public) WHERE is_public = true;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_dream_entries_updated_at ON public.dream_entries;
CREATE TRIGGER set_dream_entries_updated_at
  BEFORE UPDATE ON public.dream_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
