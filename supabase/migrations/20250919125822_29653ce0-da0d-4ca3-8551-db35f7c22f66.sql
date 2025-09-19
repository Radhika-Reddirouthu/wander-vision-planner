-- Create tables for group trip polling feature

-- Group polls table to store poll metadata
CREATE TABLE public.group_polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination TEXT NOT NULL,
  organizer_email TEXT NOT NULL,
  trip_type TEXT NOT NULL,
  group_type TEXT NOT NULL,
  depart_date DATE NOT NULL,
  return_date DATE NOT NULL,
  budget TEXT NOT NULL,
  google_form_id TEXT,
  google_form_url TEXT,
  poll_status TEXT DEFAULT 'active' CHECK (poll_status IN ('active', 'completed', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Poll questions table for storing dynamic questions based on destination
CREATE TABLE public.poll_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.group_polls(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'single_choice', 'rating', 'text')),
  options JSONB,
  category TEXT NOT NULL CHECK (category IN ('accommodation', 'activities', 'budget', 'food', 'transport', 'preferences')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Poll responses table for individual group member responses
CREATE TABLE public.poll_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.group_polls(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.poll_questions(id) ON DELETE CASCADE,
  responder_email TEXT NOT NULL,
  response_value TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, question_id, responder_email)
);

-- Poll results table for aggregated results
CREATE TABLE public.poll_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.group_polls(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  result_summary JSONB NOT NULL,
  majority_choice TEXT,
  vote_distribution JSONB,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, category)
);

-- Group poll members table to track who should respond
CREATE TABLE public.poll_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.group_polls(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  has_responded BOOLEAN DEFAULT FALSE,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(poll_id, email)
);

-- Enable RLS on all tables
ALTER TABLE public.group_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_polls
CREATE POLICY "Anyone can create polls" ON public.group_polls FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view polls" ON public.group_polls FOR SELECT USING (true);
CREATE POLICY "Organizers can update their polls" ON public.group_polls FOR UPDATE USING (organizer_email = auth.email());

-- RLS Policies for poll_questions
CREATE POLICY "Anyone can view poll questions" ON public.poll_questions FOR SELECT USING (true);
CREATE POLICY "Anyone can create poll questions" ON public.poll_questions FOR INSERT WITH CHECK (true);

-- RLS Policies for poll_responses
CREATE POLICY "Anyone can submit responses" ON public.poll_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view responses for their polls" ON public.poll_responses FOR SELECT USING (true);

-- RLS Policies for poll_results
CREATE POLICY "Anyone can view poll results" ON public.poll_results FOR SELECT USING (true);
CREATE POLICY "Anyone can create poll results" ON public.poll_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update poll results" ON public.poll_results FOR UPDATE USING (true);

-- RLS Policies for poll_members
CREATE POLICY "Anyone can view poll members" ON public.poll_members FOR SELECT USING (true);
CREATE POLICY "Anyone can create poll members" ON public.poll_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update poll member status" ON public.poll_members FOR UPDATE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on group_polls
CREATE TRIGGER update_group_polls_updated_at
  BEFORE UPDATE ON public.group_polls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();