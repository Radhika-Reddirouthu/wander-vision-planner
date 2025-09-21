-- Fix security issue: Remove public access to organizer email addresses
-- Drop and recreate RLS policies with proper security

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Poll members and public can view basic poll info" ON public.group_polls;
DROP POLICY IF EXISTS "Authenticated poll members and organizers can view polls" ON public.group_polls;

-- Create secure policy for authenticated users only
CREATE POLICY "Poll members and organizers can view polls" 
ON public.group_polls 
FOR SELECT 
USING (
  -- Only authenticated users who are either organizers or poll members
  (auth.uid() IS NOT NULL) AND (
    (auth.email() = organizer_email) OR 
    (id IN (
      SELECT poll_id 
      FROM poll_members 
      WHERE email = auth.email()
    ))
  )
);

-- Add a function to get public poll info without sensitive data for unauthenticated users
CREATE OR REPLACE FUNCTION public.get_public_poll_info(poll_uuid uuid)
RETURNS TABLE (
  id uuid,
  destination text,
  trip_type text,
  group_type text,
  depart_date date,
  return_date date,
  budget text,
  created_at timestamptz
) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.destination,
    p.trip_type,
    p.group_type,
    p.depart_date,
    p.return_date,
    p.budget,
    p.created_at
  FROM group_polls p
  WHERE p.id = poll_uuid 
    AND EXISTS (
      SELECT 1 FROM poll_questions pq 
      WHERE pq.poll_id = poll_uuid 
        AND pq.allow_public_access = true
    );
$$;