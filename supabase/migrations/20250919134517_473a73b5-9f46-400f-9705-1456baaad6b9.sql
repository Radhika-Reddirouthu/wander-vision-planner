-- Fix security linter issues - correct order to handle dependencies

-- 1. First drop the policies that depend on the function
DROP POLICY IF EXISTS "Authorized users can view poll questions" ON public.poll_questions;
DROP POLICY IF EXISTS "Authorized users can view poll results" ON public.poll_results;

-- 2. Now we can safely drop the function
DROP FUNCTION IF EXISTS public.user_can_access_poll(uuid);

-- 3. Remove the potentially problematic view 
DROP VIEW IF EXISTS public.public_poll_info;

-- 4. Create the new, more secure function
CREATE OR REPLACE FUNCTION public.is_poll_member_or_organizer(poll_uuid uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_polls 
    WHERE id = poll_uuid 
    AND organizer_email = auth.email()
  ) OR EXISTS (
    SELECT 1 FROM public.poll_members 
    WHERE poll_id = poll_uuid 
    AND email = auth.email()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 5. Recreate the policies with the new function
CREATE POLICY "Authorized users can view poll questions" 
ON public.poll_questions 
FOR SELECT 
USING (public.is_poll_member_or_organizer(poll_id));

CREATE POLICY "Authorized users can view poll results" 
ON public.poll_results 
FOR SELECT 
USING (public.is_poll_member_or_organizer(poll_id));

-- 6. Add security documentation
COMMENT ON FUNCTION public.is_poll_member_or_organizer(uuid) IS 
'Secure function to check poll access. Uses SECURITY DEFINER to safely bypass RLS in policy evaluation and prevent recursive queries.';

-- 7. Verify all tables have proper RLS enabled
ALTER TABLE public.group_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_members ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.poll_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_results ENABLE ROW LEVEL SECURITY;