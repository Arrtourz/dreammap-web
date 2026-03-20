-- Row level security for Dreammap

ALTER TABLE public.dream_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view public dreams" ON public.dream_entries;
CREATE POLICY "Public can view public dreams" ON public.dream_entries
  FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Users can view own dreams" ON public.dream_entries;
CREATE POLICY "Users can view own dreams" ON public.dream_entries
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own dreams" ON public.dream_entries;
CREATE POLICY "Users can insert own dreams" ON public.dream_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own dreams" ON public.dream_entries;
CREATE POLICY "Users can delete own dreams" ON public.dream_entries
  FOR DELETE
  USING (auth.uid() = user_id);
