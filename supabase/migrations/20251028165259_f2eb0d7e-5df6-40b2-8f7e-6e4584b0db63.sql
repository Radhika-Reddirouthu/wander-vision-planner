-- Add UPDATE policy for poll_questions (only organizers can update)
CREATE POLICY "Organizers can update poll questions"
ON public.poll_questions
FOR UPDATE
USING (
  poll_id IN (
    SELECT id FROM public.group_polls 
    WHERE organizer_email = auth.email()
  )
)
WITH CHECK (
  poll_id IN (
    SELECT id FROM public.group_polls 
    WHERE organizer_email = auth.email()
  )
);

-- Add DELETE policy for poll_questions (only organizers can delete)
CREATE POLICY "Organizers can delete poll questions"
ON public.poll_questions
FOR DELETE
USING (
  poll_id IN (
    SELECT id FROM public.group_polls 
    WHERE organizer_email = auth.email()
  )
);