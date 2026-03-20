-- Row Level Security Policies for Dreammap
-- Run this in Supabase SQL Editor after creating tables and triggers

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own data
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Enable insert for authenticated users (handled by trigger)
CREATE POLICY "Enable insert for authenticated users" ON public.users
  FOR INSERT WITH CHECK (true);

-- Service role can manage all users (for triggers and admin operations)
CREATE POLICY "Service role full access" ON public.users
  FOR ALL USING (true);

-- ============================================================================
-- RESEARCH TASKS POLICIES
-- ============================================================================

-- Users can view their own research tasks
CREATE POLICY "Users can view own research tasks" ON public.research_tasks
  FOR SELECT USING (auth.uid() = user_id OR anonymous_id IS NOT NULL);

-- Users can insert their own research tasks
CREATE POLICY "Users can insert own research tasks" ON public.research_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id OR anonymous_id IS NOT NULL);

-- Users can update their own research tasks
CREATE POLICY "Users can update own research tasks" ON public.research_tasks
  FOR UPDATE USING (auth.uid() = user_id OR anonymous_id IS NOT NULL);

-- Users can delete their own research tasks
CREATE POLICY "Users can delete own research tasks" ON public.research_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Anonymous users can view their research tasks (by anonymous_id)
CREATE POLICY "Anonymous users can view research tasks" ON public.research_tasks
  FOR SELECT USING (anonymous_id IS NOT NULL);

-- Anonymous users can insert research tasks
CREATE POLICY "Anonymous users can insert research tasks" ON public.research_tasks
  FOR INSERT WITH CHECK (anonymous_id IS NOT NULL);

-- Anonymous users can update research tasks
CREATE POLICY "Anonymous users can update research tasks" ON public.research_tasks
  FOR UPDATE USING (anonymous_id IS NOT NULL);

-- Service role can manage all research tasks (for API operations)
CREATE POLICY "Service role full access to research tasks" ON public.research_tasks
  FOR ALL USING (true);

-- ============================================================================
-- USER RATE LIMITS POLICIES
-- ============================================================================

-- Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits" ON public.user_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own rate limits (for decrementing usage)
CREATE POLICY "Users can update their own rate limits" ON public.user_rate_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable rate limit creation (handled by application/triggers)
CREATE POLICY "Enable rate limit creation" ON public.user_rate_limits
  FOR INSERT WITH CHECK (true);

-- Service role can manage all rate limits (for API operations and resets)
CREATE POLICY "Service role full access to rate limits" ON public.user_rate_limits
  FOR ALL USING (true);
