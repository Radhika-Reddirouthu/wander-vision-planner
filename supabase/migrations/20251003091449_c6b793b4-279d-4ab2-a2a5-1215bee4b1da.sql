-- Fix poll questions public exposure vulnerability
-- Remove public access and require authentication for all poll question access

-- Drop the existing insecure policy
DROP POLICY IF EXISTS "Authorized users and public polls can view poll questions" ON public.poll_questions;

-- Create a new secure policy that requires authentication
-- Only authenticated users who are poll members or organizers can view questions
CREATE POLICY "Only authenticated members and organizers can view poll questions"
ON public.poll_questions
FOR SELECT
TO authenticated
USING (
  is_poll_member_or_organizer(poll_id)
);

-- Update the allow_public_access column description to mark it as deprecated
COMMENT ON COLUMN public.poll_questions.allow_public_access IS 
'DEPRECATED: This column is no longer used for access control. All poll questions require authentication and membership verification. Consider removing this column in a future migration.';