-- Create user profiles table to store personality and travel preferences
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  
  -- Personality traits
  social_preference TEXT CHECK (social_preference IN ('extrovert', 'ambivert', 'introvert')),
  activity_level TEXT CHECK (activity_level IN ('high_energy', 'moderate', 'relaxed')),
  group_dynamics TEXT CHECK (group_dynamics IN ('leader', 'follower', 'independent')),
  
  -- Travel preferences
  environment_preference TEXT CHECK (environment_preference IN ('beach', 'mountains', 'city', 'countryside', 'desert')),
  accommodation_style TEXT CHECK (accommodation_style IN ('luxury', 'boutique', 'budget', 'hostel', 'local')),
  food_adventure_level TEXT CHECK (food_adventure_level IN ('very_adventurous', 'somewhat_adventurous', 'familiar_foods')),
  pace_preference TEXT CHECK (pace_preference IN ('packed_schedule', 'balanced', 'slow_travel')),
  
  -- Experience preferences
  cultural_interest TEXT CHECK (cultural_interest IN ('high', 'moderate', 'low')),
  adventure_seeking TEXT CHECK (adventure_seeking IN ('thrill_seeker', 'moderate_adventure', 'comfort_zone')),
  shopping_interest TEXT CHECK (shopping_interest IN ('love_shopping', 'occasional', 'minimal')),
  nightlife_preference TEXT CHECK (nightlife_preference IN ('party_lover', 'casual_evenings', 'early_sleeper')),
  
  -- Budget and planning
  budget_flexibility TEXT CHECK (budget_flexibility IN ('flexible', 'moderate', 'strict')),
  planning_style TEXT CHECK (planning_style IN ('detailed_planner', 'rough_outline', 'spontaneous')),
  
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();