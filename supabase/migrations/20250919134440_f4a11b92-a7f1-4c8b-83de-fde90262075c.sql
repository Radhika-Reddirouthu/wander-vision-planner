-- Check existing policies and drop them first
DO $$ 
BEGIN
    -- Drop all existing policies on group_polls
    DROP POLICY IF EXISTS "Anyone can create polls" ON public.group_polls;
    DROP POLICY IF EXISTS "Anyone can view polls" ON public.group_polls;
    DROP POLICY IF EXISTS "Organizers can update their polls" ON public.group_polls;
    DROP POLICY IF EXISTS "Organizers can view their own polls" ON public.group_polls;
    DROP POLICY IF EXISTS "Poll members can view basic poll info" ON public.group_polls;
    DROP POLICY IF EXISTS "Public can view limited poll info for participation" ON public.group_polls;
    
    -- Drop all existing policies on poll_members
    DROP POLICY IF EXISTS "Anyone can create poll members" ON public.poll_members;
    DROP POLICY IF EXISTS "Anyone can update poll member status" ON public.poll_members;
    DROP POLICY IF EXISTS "Anyone can view poll members" ON public.poll_members;
    DROP POLICY IF EXISTS "Organizers can view all poll members" ON public.poll_members;
    DROP POLICY IF EXISTS "Members can view their own membership" ON public.poll_members;
    DROP POLICY IF EXISTS "Members can update their own response status" ON public.poll_members;
    
    -- Drop all existing policies on other tables
    DROP POLICY IF EXISTS "Anyone can create poll questions" ON public.poll_questions;
    DROP POLICY IF EXISTS "Anyone can view poll questions" ON public.poll_questions;
    DROP POLICY IF EXISTS "Authorized users can view poll questions" ON public.poll_questions;
    
    DROP POLICY IF EXISTS "Anyone can submit responses" ON public.poll_responses;
    DROP POLICY IF EXISTS "Anyone can view responses for their polls" ON public.poll_responses;
    DROP POLICY IF EXISTS "Organizers can view all responses for their polls" ON public.poll_responses;
    DROP POLICY IF EXISTS "Members can view their own responses" ON public.poll_responses;
    
    DROP POLICY IF EXISTS "Anyone can create poll results" ON public.poll_results;
    DROP POLICY IF EXISTS "Anyone can update poll results" ON public.poll_results;
    DROP POLICY IF EXISTS "Anyone can view poll results" ON public.poll_results;
    DROP POLICY IF EXISTS "Authorized users can view poll results" ON public.poll_results;
END $$;

-- Now create the secure policies

-- 1. GROUP_POLLS table - Secure policies
CREATE POLICY "Organizers can create polls" 
ON public.group_polls 
FOR INSERT 
TO authenticated
WITH CHECK (auth.email() = organizer_email);

CREATE POLICY "Organizers can view their own polls" 
ON public.group_polls 
FOR SELECT 
TO authenticated
USING (auth.email() = organizer_email);

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

CREATE POLICY "Organizers can update their polls" 
ON public.group_polls 
FOR UPDATE 
TO authenticated
USING (auth.email() = organizer_email)
WITH CHECK (auth.email() = organizer_email);

-- 2. POLL_MEMBERS table - Secure policies
CREATE POLICY "Organizers can create poll members" 
ON public.poll_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  poll_id IN (
    SELECT id 
    FROM public.group_polls 
    WHERE organizer_email = auth.email()
  )
);

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

CREATE POLICY "Members can update their own response status" 
ON public.poll_members 
FOR UPDATE 
TO authenticated
USING (email = auth.email())
WITH CHECK (email = auth.email());

-- 3. Create security definer function for poll access
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

-- 4. POLL_QUESTIONS table - Secure policies
CREATE POLICY "Organizers can create poll questions" 
ON public.poll_questions 
FOR INSERT 
TO authenticated
WITH CHECK (
  poll_id IN (
    SELECT id 
    FROM public.group_polls 
    WHERE organizer_email = auth.email()
  )
);

CREATE POLICY "Authorized users can view poll questions" 
ON public.poll_questions 
FOR SELECT 
TO authenticated
USING (public.user_can_access_poll(poll_id));

-- 5. POLL_RESPONSES table - Secure policies  
CREATE POLICY "Poll members can submit responses" 
ON public.poll_responses 
FOR INSERT 
TO authenticated
WITH CHECK (
  poll_id IN (
    SELECT poll_id 
    FROM public.poll_members 
    WHERE email = auth.email()
  )
  AND responder_email = auth.email()
);

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

-- 6. POLL_RESULTS table - Secure policies
CREATE POLICY "Organizers can create poll results" 
ON public.poll_results 
FOR INSERT 
TO authenticated
WITH CHECK (
  poll_id IN (
    SELECT id 
    FROM public.group_polls 
    WHERE organizer_email = auth.email()
  )
);

CREATE POLICY "Organizers can update poll results" 
ON public.poll_results 
FOR UPDATE 
TO authenticated
USING (
  poll_id IN (
    SELECT id 
    FROM public.group_polls 
    WHERE organizer_email = auth.email()
  )
);

CREATE POLICY "Authorized users can view poll results" 
ON public.poll_results 
FOR SELECT 
TO authenticated
USING (public.user_can_access_poll(poll_id));