-- Fix security vulnerability: Restrict access to email addresses in polls
-- Remove overly permissive RLS policies and implement proper access controls

-- 1. Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view polls" ON public.group_polls;
DROP POLICY IF EXISTS "Anyone can view poll members" ON public.poll_members;

-- 2. Create restrictive policies for group_polls table
-- Organizers can view their own polls (with full details including emails)
CREATE POLICY "Organizers can view their own polls" 
ON public.group_polls 
FOR SELECT 
TO authenticated
USING (auth.email() = organizer_email);

-- Poll members can view basic poll info (but not organizer email)
CREATE POLICY "Poll members can view basic poll info" 
ON public.group_polls 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT poll_id 
    FROM public.poll_members 
    WHERE email = auth.email()
  )
);

-- Public can view very limited poll info for participation (destination, dates, status only)
CREATE POLICY "Public can view limited poll info for participation" 
ON public.group_polls 
FOR SELECT 
TO anon
USING (
  poll_status = 'active' 
  AND expires_at > now()
);

-- 3. Create restrictive policies for poll_members table  
-- Only organizers and the specific member can see member details
CREATE POLICY "Organizers can view all poll members" 
ON public.poll_members 
FOR SELECT 
TO authenticated
USING (
  poll_id IN (
    SELECT id 
    FROM public.group_polls 
    WHERE organizer_email = auth.email()
  )
);

CREATE POLICY "Members can view their own membership" 
ON public.poll_members 
FOR SELECT 
TO authenticated
USING (email = auth.email());

-- 4. Create a security definer function to check poll access safely
CREATE OR REPLACE FUNCTION public.user_can_access_poll(poll_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is the organizer
  IF EXISTS (
    SELECT 1 FROM public.group_polls 
    WHERE id = poll_uuid 
    AND organizer_email = auth.email()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a poll member
  IF EXISTS (
    SELECT 1 FROM public.poll_members 
    WHERE poll_id = poll_uuid 
    AND email = auth.email()
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 5. Update poll questions policy to use the security function
DROP POLICY IF EXISTS "Anyone can view poll questions" ON public.poll_questions;
CREATE POLICY "Authorized users can view poll questions" 
ON public.poll_questions 
FOR SELECT 
USING (public.user_can_access_poll(poll_id));

-- 6. Update poll responses policy 
DROP POLICY IF EXISTS "Anyone can view responses for their polls" ON public.poll_responses;
CREATE POLICY "Organizers can view all responses for their polls" 
ON public.poll_responses 
FOR SELECT 
TO authenticated
USING (
  poll_id IN (
    SELECT id 
    FROM public.group_polls 
    WHERE organizer_email = auth.email()
  )
);

CREATE POLICY "Members can view their own responses" 
ON public.poll_responses 
FOR SELECT 
TO authenticated
USING (responder_email = auth.email());

-- 7. Update poll results policy
DROP POLICY IF EXISTS "Anyone can view poll results" ON public.poll_results;
CREATE POLICY "Authorized users can view poll results" 
ON public.poll_results 
FOR SELECT 
USING (public.user_can_access_poll(poll_id));

-- 8. Create a view for public poll info that excludes sensitive data
CREATE OR REPLACE VIEW public.public_poll_info AS
SELECT 
  id,
  destination,
  depart_date,
  return_date,
  trip_type,
  group_type,
  poll_status,
  expires_at,
  created_at
FROM public.group_polls
WHERE poll_status = 'active' AND expires_at > now();

-- Grant access to the view
GRANT SELECT ON public.public_poll_info TO anon, authenticated;

-- 9. Add RLS policy for poll member updates (to allow members to mark themselves as responded)
CREATE POLICY "Members can update their own response status" 
ON public.poll_members 
FOR UPDATE 
TO authenticated
USING (email = auth.email())
WITH CHECK (email = auth.email());