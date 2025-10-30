-- Drop existing SELECT policies on poll_members
DROP POLICY IF EXISTS "Organizers can view all poll members" ON public.poll_members;
DROP POLICY IF EXISTS "Members can view their own membership" ON public.poll_members;

-- Recreate policies with explicit authentication checks
CREATE POLICY "Organizers can view all poll members"
ON public.poll_members
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND poll_id IN (
    SELECT id FROM public.group_polls
    WHERE organizer_email = auth.email()
  )
);

CREATE POLICY "Members can view their own membership"
ON public.poll_members
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND email = auth.email()
);