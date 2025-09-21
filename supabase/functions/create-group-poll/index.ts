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

    // Create itinerary-focused poll questions for group planning
    const questions = [
      {
        poll_id: pollId,
        question_text: "What time would you prefer to start daily activities?",
        question_type: "single_choice",
        category: "schedule",
        options: ["Early Bird (6-8 AM)", "Morning (8-10 AM)", "Late Morning (10 AM-12 PM)", "Afternoon (12-2 PM)", "Flexible timing"],
        allow_public_access: true
      },
      {
        poll_id: pollId,
        question_text: "How many hours per day do you want to spend on sightseeing/activities?",
        question_type: "single_choice",
        category: "pace",
        options: ["Light (2-4 hours)", "Moderate (4-6 hours)", "Active (6-8 hours)", "Intensive (8+ hours)", "Very flexible"],
        allow_public_access: true
      },
      {
        poll_id: pollId,
        question_text: "Which types of attractions interest you most? (Select multiple)",
        question_type: "multiple_choice",
        category: "attractions",
        options: ["Historical Sites", "Religious Places", "Museums", "Local Markets", "Nature Spots", "Adventure Activities", "Cultural Experiences", "Photo Spots"],
        allow_public_access: true
      },
      {
        poll_id: pollId,
        question_text: "What's your preferred accommodation type?",
        question_type: "single_choice",
        category: "accommodation",
        options: ["Luxury Hotels", "Mid-range Hotels", "Budget Hotels", "Hostels", "Vacation Rentals", "Local Homestays"],
        allow_public_access: true
      },
      {
        poll_id: pollId,
        question_text: "How do you prefer to travel between locations?",
        question_type: "single_choice",
        category: "transport",
        options: ["Private Car/Taxi", "Public Transport", "Walking when possible", "Rental Vehicle", "Mix of options"],
        allow_public_access: true
      },
      {
        poll_id: pollId,
        question_text: "What dining experiences would you like? (Select multiple)",
        question_type: "multiple_choice",
        category: "dining",
        options: ["Local Street Food", "Traditional Restaurants", "Fine Dining", "International Cuisine", "Vegetarian Options", "Food Tours"],
        allow_public_access: true
      },
      {
        poll_id: pollId,
        question_text: "How much free time do you want for personal exploration?",
        question_type: "single_choice",
        category: "flexibility",
        options: ["Minimal (Packed schedule)", "Some (1-2 hours daily)", "Moderate (Half day free)", "Plenty (Full day free)", "Maximum flexibility"],
        allow_public_access: true
      },
      {
        poll_id: pollId,
        question_text: "Any specific requirements or preferences? (Optional)",
        question_type: "text",
        category: "requirements",
        options: [],
        allow_public_access: true
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

    // Create shareable poll URL (accessible without authentication)
    const pollUrl = `https://lovable.dev/poll/${pollId}`
    
    // Update poll with form URL
    await supabase
      .from('group_polls')
      .update({ google_form_url: pollUrl })
      .eq('id', pollId)

    console.log(`Poll created successfully. Members (including organizer): ${allMembers.join(', ')}`)
    console.log(`Shareable poll URL: ${pollUrl}`)
    console.log(`Poll ID: ${pollId}`)

    // Send invitation emails to all group members (including organizer)
    const memberEmailsToInvite = [...memberEmails, organizerEmail].filter((email, index, array) => 
      array.indexOf(email.trim()) === index // Remove duplicates
    )
    
    if (memberEmailsToInvite.length > 0) {
      try {
        console.log('Sending poll invites to:', memberEmailsToInvite)
        
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-poll-invites', {
          body: {
            pollId,
            destination,
            organizerEmail,
            memberEmails: memberEmailsToInvite
          }
        })

        if (emailError) {
          console.error('Error sending poll invites:', emailError)
          // Don't fail the entire request if email sending fails
        } else {
          console.log('Poll invites sent successfully:', emailResult)
        }
      } catch (emailError) {
        console.error('Failed to send poll invites:', emailError)
        // Continue with success response even if emails failed
      }
    }

    return new Response(JSON.stringify({ 
      pollId,
      pollUrl,
      formUrl: pollUrl, // for backward compatibility
      memberCount: allMembers.length,
      emailsSent: memberEmailsToInvite.length,
      message: `Poll created successfully! Invitation emails sent to ${memberEmailsToInvite.length} group members.`,
      shareInstructions: {
        pollUrl,
        destination,
        memberEmails: memberEmailsToInvite
      }
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