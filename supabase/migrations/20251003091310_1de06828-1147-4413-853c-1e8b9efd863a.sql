-- Fix poll response security vulnerability
-- Remove the public access bypass and require authentication for all responses

-- Drop the existing insecure policy
DROP POLICY IF EXISTS "Poll members and public can submit responses" ON public.poll_responses;

-- Create a new secure policy that requires authentication
-- Only authenticated users who are invited members can submit responses
CREATE POLICY "Only authenticated invited members can submit responses"
ON public.poll_responses
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be authenticated (handled by TO authenticated)
  -- User's email must match their auth email
  responder_email = auth.email()
  AND
  -- User must be an invited member of the poll
  EXISTS (
    SELECT 1 
    FROM public.poll_members 
    WHERE poll_members.poll_id = poll_responses.poll_id
    AND poll_members.email = poll_responses.responder_email
  )
);

-- Update the allow_public_access column description to clarify it's for viewing only
COMMENT ON COLUMN public.poll_questions.allow_public_access IS 
'Controls whether unauthenticated users can VIEW poll questions. Does not affect response submission - all responses require authentication and membership.';