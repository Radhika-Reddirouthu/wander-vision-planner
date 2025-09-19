import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const pollId = url.searchParams.get('pollId')

    if (!pollId) {
      return new Response('Poll ID is required', { status: 400, headers: corsHeaders })
    }

    if (req.method === 'GET') {
      // Serve the poll form
      const { data: poll, error: pollError } = await supabase
        .from('group_polls')
        .select('*')
        .eq('id', pollId)
        .single()

      if (pollError || !poll) {
        return new Response('Poll not found', { status: 404, headers: corsHeaders })
      }

      const { data: questions, error: questionsError } = await supabase
        .from('poll_questions')
        .select('*')
        .eq('poll_id', pollId)
        .order('category')

      if (questionsError) {
        return new Response('Error loading questions', { status: 500, headers: corsHeaders })
      }

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Group Trip Poll - ${poll.destination}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 20px;
                    background: #f9fafb;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e5e7eb;
                }
                .question {
                    margin-bottom: 25px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 8px;
                }
                .question h3 {
                    color: #1f2937;
                    margin-bottom: 15px;
                }
                .options {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .option {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    border-radius: 4px;
                }
                .option:hover {
                    background: #e5e7eb;
                }
                input[type="radio"], input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                }
                .email-input {
                    margin-bottom: 20px;
                    padding: 20px;
                    background: #fef3c7;
                    border-radius: 8px;
                }
                .email-input input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #d1d5db;
                    border-radius: 4px;
                    font-size: 16px;
                }
                .submit-btn {
                    background: #2563eb;
                    color: white;
                    padding: 15px 30px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                    margin-top: 20px;
                }
                .submit-btn:hover {
                    background: #1d4ed8;
                }
                .trip-info {
                    background: #eff6ff;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🌟 Group Trip Poll</h1>
                    <h2>${poll.destination}</h2>
                </div>
                
                <div class="trip-info">
                    <h3>Trip Details:</h3>
                    <p><strong>Destination:</strong> ${poll.destination}</p>
                    <p><strong>Dates:</strong> ${poll.depart_date} to ${poll.return_date}</p>
                    <p><strong>Trip Type:</strong> ${poll.trip_type}</p>
                    <p><strong>Budget:</strong> ${poll.budget}</p>
                </div>

                <form id="pollForm">
                    <div class="email-input">
                        <label for="responderEmail"><strong>Your Email Address:</strong></label>
                        <input type="email" id="responderEmail" name="responderEmail" required 
                               placeholder="your.email@example.com" />
                    </div>

                    ${questions.map((q: any, index: number) => `
                        <div class="question">
                            <h3>${index + 1}. ${q.question_text}</h3>
                            <div class="options">
                                ${q.options.map((option: string, optIndex: number) => `
                                    <div class="option">
                                        <input type="${q.question_type === 'multiple_choice' ? 'checkbox' : 'radio'}" 
                                               id="q${q.id}_${optIndex}" 
                                               name="question_${q.id}" 
                                               value="${option}">
                                        <label for="q${q.id}_${optIndex}">${option}</label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}

                    <button type="submit" class="submit-btn">Submit My Preferences 🚀</button>
                </form>
            </div>

            <script>
                document.getElementById('pollForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const formData = new FormData(e.target);
                    const responderEmail = formData.get('responderEmail');
                    
                    const responses = [];
                    
                    ${questions.map((q: any) => `
                        const q${q.id}_elements = document.querySelectorAll('input[name="question_${q.id}"]:checked');
                        q${q.id}_elements.forEach(el => {
                            responses.push({
                                questionId: '${q.id}',
                                value: el.value
                            });
                        });
                    `).join('')}

                    try {
                        const response = await fetch('${Deno.env.get('SUPABASE_URL')}/functions/v1/poll-form?pollId=${pollId}', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                responderEmail,
                                responses
                            })
                        });

                        if (response.ok) {
                            document.querySelector('.container').innerHTML = \`
                                <div style="text-align: center; padding: 40px;">
                                    <h1 style="color: #059669;">✅ Thank you!</h1>
                                    <p style="font-size: 18px;">Your preferences have been recorded successfully.</p>
                                    <p>We'll create an amazing itinerary based on everyone's input!</p>
                                </div>
                            \`;
                        } else {
                            throw new Error('Failed to submit');
                        }
                    } catch (error) {
                        alert('Error submitting form. Please try again.');
                    }
                });
            </script>
        </body>
        </html>
      `

      return new Response(html, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/html' 
        }
      })
    }

    if (req.method === 'POST') {
      // Handle form submission
      const { responderEmail, responses } = await req.json()

      // Save responses to database
      const responseRecords = responses.map((response: any) => ({
        poll_id: pollId,
        question_id: response.questionId,
        responder_email: responderEmail,
        response_value: response.value
      }))

      const { error: responseError } = await supabase
        .from('poll_responses')
        .insert(responseRecords)

      if (responseError) {
        console.error('Error saving responses:', responseError)
        return new Response(JSON.stringify({ error: 'Failed to save responses' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update member response status
      await supabase
        .from('poll_members')
        .update({ 
          has_responded: true, 
          responded_at: new Date().toISOString() 
        })
        .eq('poll_id', pollId)
        .eq('email', responderEmail)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Error in poll-form:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})