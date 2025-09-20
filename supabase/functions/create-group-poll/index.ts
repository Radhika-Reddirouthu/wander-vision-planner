import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      destination, 
      tripType, 
      groupType, 
      groupSize,
      departDate, 
      returnDate, 
      budget, 
      needsFlights,
      organizerEmail,
      memberEmails
    } = await req.json()

    console.log('Creating group poll for:', { destination, organizerEmail, memberEmails, groupSize })

    // Create the poll record
    const { data: pollData, error: pollError } = await supabase
      .from('group_polls')
      .insert({
        destination,
        trip_type: tripType,
        group_type: groupType,
        depart_date: departDate,
        return_date: returnDate,
        budget,
        organizer_email: organizerEmail,
        poll_status: 'active'
      })
      .select()
      .single()

    if (pollError) {
      console.error('Error creating poll:', pollError)
      throw pollError
    }

    const pollId = pollData.id

    // Create poll questions based on destination and trip type
    const questions = [
      {
        poll_id: pollId,
        question_text: "What type of accommodation do you prefer?",
        question_type: "single_choice",
        category: "accommodation",
        options: ["Luxury Hotels", "Mid-range Hotels", "Budget Hotels", "Hostels", "Vacation Rentals", "Guesthouses"]
      },
      {
        poll_id: pollId,
        question_text: "What activities interest you most? (Select multiple)",
        question_type: "multiple_choice",
        category: "activities",
        options: ["Adventure Sports", "Cultural Sites", "Nightlife", "Nature/Wildlife", "Food Tours", "Shopping", "Relaxation/Spa", "Photography"]
      },
      {
        poll_id: pollId,
        question_text: "What's your preferred budget range per person?",
        question_type: "single_choice",
        category: "budget",
        options: ["Budget (Under ₹30k)", "Mid-range (₹30k-₹80k)", "Premium (₹80k-₹1.5L)", "Luxury (Above ₹1.5L)"]
      },
      {
        poll_id: pollId,
        question_text: "Food preferences?",
        question_type: "multiple_choice",
        category: "food",
        options: ["Local Cuisine", "International Food", "Vegetarian Options", "Street Food", "Fine Dining", "Dietary Restrictions"]
      },
      {
        poll_id: pollId,
        question_text: "Transportation preference?",
        question_type: "single_choice",
        category: "transport",
        options: ["Private Taxi/Car", "Public Transport", "Rental Car", "Walking/Cycling", "Mix of All"]
      }
    ]

    // Insert poll questions
    const { error: questionsError } = await supabase
      .from('poll_questions')
      .insert(questions)

    if (questionsError) {
      console.error('Error creating questions:', questionsError)
      throw questionsError
    }

    // Insert poll members (including organizer)
    const allMembers = [...memberEmails, organizerEmail].filter((email, index, array) => 
      array.indexOf(email.trim()) === index // Remove duplicates
    )
    
    const pollMembers = allMembers.map((email: string) => ({
      poll_id: pollId,
      email: email.trim()
    }))

    const { error: membersError } = await supabase
      .from('poll_members')
      .insert(pollMembers)

    if (membersError) {
      console.error('Error adding members:', membersError)
      throw membersError
    }

    // Create Google Form (simplified version - for now we'll use a simple form URL)
    const formUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/poll-form?pollId=${pollId}`
    
    // Update poll with form URL
    await supabase
      .from('group_polls')
      .update({ google_form_url: formUrl })
      .eq('id', pollId)

    // Send poll invites via email
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-poll-invites', {
      body: {
        pollId,
        destination,
        organizerEmail,
        memberEmails: memberEmails.filter(email => email.trim() !== organizerEmail.trim()), // Don't email organizer
        formUrl
      }
    });

    if (emailError) {
      console.error('Error sending poll invites:', emailError);
      // Continue anyway, poll is created
    } else {
      console.log('Poll invites sent successfully:', emailResult);
    }

    console.log(`Poll created successfully. Members (including organizer): ${allMembers.join(', ')}`)
    console.log(`Poll form URL: ${formUrl}`)
    console.log('Note: Organizer has been added as a poll member and can participate in the poll.')

    return new Response(JSON.stringify({ 
      pollId,
      formUrl,
      message: 'Poll created and invites sent successfully',
      emailResult
    }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    })

  } catch (error) {
    console.error('Error in create-group-poll:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    })
  }
})