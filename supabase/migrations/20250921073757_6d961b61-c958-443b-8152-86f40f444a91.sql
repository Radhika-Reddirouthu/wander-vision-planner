-- Fix security issue: Remove public access to organizer email addresses
-- Update RLS policy to restrict public access to group_polls table

-- First, drop the current public access policy
DROP POLICY IF EXISTS "Poll members and public can view basic poll info" ON public.group_polls;

-- Create a more secure policy that only allows authenticated poll members and organizers
CREATE POLICY "Authenticated poll members and organizers can view polls" 
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

-- Create a separate policy for public access to basic poll information (without sensitive data)
-- We'll need to handle this at the application level by creating a view or modifying queries
-- For now, let's ensure poll questions remain publicly accessible for poll responses

-- Verify poll_questions table policies allow public access to questions
-- (This should already be in place from previous migrations)

-- Add a function to get public poll info without sensitive data
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