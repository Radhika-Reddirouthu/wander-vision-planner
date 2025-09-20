-- Add trip planning persistence fields to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN draft_trip_data JSONB DEFAULT NULL,
ADD COLUMN active_poll_id UUID DEFAULT NULL,
ADD COLUMN last_planning_step TEXT DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX idx_user_profiles_active_poll ON public.user_profiles(active_poll_id);

-- Add RLS policy to allow users to update their draft trip data
-- (existing policies already cover this, but being explicit)