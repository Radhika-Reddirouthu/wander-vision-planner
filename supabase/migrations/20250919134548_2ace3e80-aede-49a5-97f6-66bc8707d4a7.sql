-- Fix security definer view issue
-- Drop any views that might have SECURITY DEFINER

-- Check if public_poll_info view exists and drop it if it has security issues
DROP VIEW IF EXISTS public.public_poll_info;

-- Instead of a view, we'll rely on the RLS policies we created
-- The frontend should query the tables directly with proper authentication

-- Ensure our security definer function is properly scoped
DROP FUNCTION IF EXISTS public.user_can_access_poll(uuid);

-- Recreate the function with minimal privileges and proper security
CREATE OR REPLACE FUNCTION public.user_can_access_poll(poll_uuid uuid)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- Get the current user's email
  user_email := auth.email();
  
  -- Return false if no authenticated user
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is the organizer (most restrictive check first)
  IF EXISTS (
    SELECT 1 FROM public.group_polls 
    WHERE id = poll_uuid 
    AND organizer_email = user_email
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a poll member
  IF EXISTS (
    SELECT 1 FROM public.poll_members 
    WHERE poll_id = poll_uuid 
    AND email = user_email
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Grant minimal necessary permissions
REVOKE ALL ON FUNCTION public.user_can_access_poll(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_access_poll(uuid) TO authenticated;