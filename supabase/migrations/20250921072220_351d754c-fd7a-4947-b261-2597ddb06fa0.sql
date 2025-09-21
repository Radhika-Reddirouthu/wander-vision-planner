-- Allow public access to poll questions for unauthenticated poll responses
ALTER TABLE public.poll_questions ADD COLUMN IF NOT EXISTS allow_public_access BOOLEAN DEFAULT FALSE;

-- Update the RLS policy to allow public access to poll questions when allow_public_access is true
DROP POLICY IF EXISTS "Authorized users can view poll questions" ON public.poll_questions;

CREATE POLICY "Authorized users and public polls can view poll questions" 
ON public.poll_questions 
FOR SELECT 
USING (
  is_poll_member_or_organizer(poll_id) 
  OR allow_public_access = true
);

-- Set public access for all existing poll questions to maintain functionality
UPDATE public.poll_questions SET allow_public_access = true;

-- Allow public poll responses for unauthenticated users
DROP POLICY IF EXISTS "Poll members can submit responses" ON public.poll_responses;

CREATE POLICY "Poll members and public can submit responses" 
ON public.poll_responses 
FOR INSERT 
WITH CHECK (
  (poll_id IN ( SELECT poll_members.poll_id
   FROM poll_members
  WHERE (poll_members.email = responder_email))) 
  OR 
  (poll_id IN ( SELECT pq.poll_id 
   FROM poll_questions pq 
   WHERE pq.allow_public_access = true))
);

-- Allow viewing of basic poll info for public polls
DROP POLICY IF EXISTS "Poll members can view basic poll info" ON public.group_polls;

CREATE POLICY "Poll members and public can view basic poll info" 
ON public.group_polls 
FOR SELECT 
USING (
  (id IN ( SELECT poll_members.poll_id
   FROM poll_members
  WHERE (poll_members.email = auth.email())))
  OR
  (auth.email() = organizer_email)
  OR
  (id IN ( SELECT pq.poll_id 
   FROM poll_questions pq 
   WHERE pq.allow_public_access = true))
);