-- Fix security linter issues after the email protection migration

-- 1. Remove the potentially problematic view and replace with safer approach
DROP VIEW IF EXISTS public.public_poll_info;

-- 2. Instead of a view, we'll use the existing RLS policies on the main table
-- The "Public can view limited poll info for participation" policy already handles this safely

-- 3. Revoke the grants that are no longer needed since we removed the view
-- (No action needed since the view is dropped)

-- 4. Ensure the security definer function is as minimal as possible
-- Replace the function with a simpler, more secure version
DROP FUNCTION IF EXISTS public.user_can_access_poll(uuid);

-- Create a more minimal security definer function that just checks membership
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

-- 5. Update the policies to use the new function
DROP POLICY IF EXISTS "Authorized users can view poll questions" ON public.poll_questions;
CREATE POLICY "Authorized users can view poll questions" 
ON public.poll_questions 
FOR SELECT 
USING (public.is_poll_member_or_organizer(poll_id));

DROP POLICY IF EXISTS "Authorized users can view poll results" ON public.poll_results;
CREATE POLICY "Authorized users can view poll results" 
ON public.poll_results 
FOR SELECT 
USING (public.is_poll_member_or_organizer(poll_id));

-- 6. Add comments explaining the security model
COMMENT ON FUNCTION public.is_poll_member_or_organizer(uuid) IS 
'Security definer function to safely check if current user can access poll data. Used in RLS policies to prevent recursive queries.';

COMMENT ON POLICY "Organizers can view their own polls" ON public.group_polls IS 
'Allows poll organizers to see full details of their polls including member emails';

COMMENT ON POLICY "Poll members can view basic poll info" ON public.group_polls IS 
'Allows poll members to see basic poll information but excludes organizer email for privacy';

COMMENT ON POLICY "Public can view limited poll info for participation" ON public.group_polls IS 
'Allows anonymous users to see minimal poll info (destination, dates) for active polls only';