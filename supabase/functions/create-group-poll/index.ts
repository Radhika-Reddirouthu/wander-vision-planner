import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend@4.0.0"

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

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    const { 
      destination, 
      tripType, 
      groupType, 
      departDate, 
      returnDate, 
      budget, 
      needsFlights,
      organizerEmail,
      memberEmails
    } = await req.json()

    console.log('Creating group poll for:', { destination, organizerEmail, memberEmails })

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

    // Insert poll members
    const pollMembers = memberEmails.map((email: string) => ({
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

    // Send emails to all group members
    const emailPromises = memberEmails.map(async (email: string) => {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Group Trip Poll - ${destination}</h1>
          <p>Hi there!</p>
          <p>${organizerEmail} has invited you to participate in planning a group trip to <strong>${destination}</strong>.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Trip Details:</h3>
            <ul>
              <li><strong>Destination:</strong> ${destination}</li>
              <li><strong>Dates:</strong> ${departDate} to ${returnDate}</li>
              <li><strong>Trip Type:</strong> ${tripType}</li>
              <li><strong>Budget:</strong> ${budget}</li>
            </ul>
          </div>
          
          <p>Please take a moment to share your preferences for accommodation, activities, food, and transportation by clicking the link below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${formUrl}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Complete Poll
            </a>
          </div>
          
          <p>Your responses will help us create an itinerary that everyone will love!</p>
          <p>The poll will close in 7 days, so please respond soon.</p>
          
          <p>Happy travels!<br>The Travel Planning Team</p>
        </div>
      `

      return resend.emails.send({
        from: 'Travel Planner <noreply@lovableproject.com>',
        to: [email.trim()],
        subject: `Group Trip Poll: ${destination} - Your Input Needed!`,
        html: emailHtml
      })
    })

    await Promise.all(emailPromises)

    // Also send confirmation email to organizer
    const organizerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Poll Created Successfully!</h1>
        <p>Hi ${organizerEmail},</p>
        <p>Your group trip poll for <strong>${destination}</strong> has been created and sent to all group members.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Poll Summary:</h3>
          <ul>
            <li><strong>Destination:</strong> ${destination}</li>
            <li><strong>Group Members:</strong> ${memberEmails.length} people</li>
            <li><strong>Poll URL:</strong> <a href="${formUrl}">${formUrl}</a></li>
          </ul>
        </div>
        
        <p>Group members have 7 days to respond. Once responses are collected, we'll generate a customized itinerary based on the majority preferences.</p>
        
        <p>You can track poll progress and view results using your poll ID: <strong>${pollId}</strong></p>
      </div>
    `

    await resend.emails.send({
      from: 'Travel Planner <noreply@lovableproject.com>',
      to: [organizerEmail],
      subject: `Poll Created: ${destination} Group Trip`,
      html: organizerEmailHtml
    })

    return new Response(JSON.stringify({ 
      pollId,
      formUrl,
      message: 'Poll created and emails sent successfully'
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