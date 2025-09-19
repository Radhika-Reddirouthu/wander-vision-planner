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

    const { pollId } = await req.json()

    console.log('Getting poll results for:', pollId)

    // Get poll info
    const { data: poll, error: pollError } = await supabase
      .from('group_polls')
      .select('*')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      throw new Error('Poll not found')
    }

    // Get all questions
    const { data: questions, error: questionsError } = await supabase
      .from('poll_questions')
      .select('*')
      .eq('poll_id', pollId)

    if (questionsError) {
      throw questionsError
    }

    // Get all responses
    const { data: responses, error: responsesError } = await supabase
      .from('poll_responses')
      .select('*')
      .eq('poll_id', pollId)

    if (responsesError) {
      throw responsesError
    }

    // Get member status
    const { data: members, error: membersError } = await supabase
      .from('poll_members')
      .select('*')
      .eq('poll_id', pollId)

    if (membersError) {
      throw membersError
    }

    // Calculate results by category
    const resultsByCategory: any = {}
    
    questions.forEach((question: any) => {
      const questionResponses = responses.filter((r: any) => r.question_id === question.id)
      const responseCounts: any = {}
      
      questionResponses.forEach((response: any) => {
        const value = response.response_value
        responseCounts[value] = (responseCounts[value] || 0) + 1
      })

      // Find majority choice
      const sortedResponses = Object.entries(responseCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
      
      const majorityChoice = sortedResponses[0]?.[0] || null
      const majorityCount = sortedResponses[0]?.[1] || 0
      
      if (!resultsByCategory[question.category]) {
        resultsByCategory[question.category] = {
          questions: [],
          majorityChoices: [],
          summary: {}
        }
      }

      resultsByCategory[question.category].questions.push({
        question: question.question_text,
        responses: responseCounts,
        majorityChoice,
        majorityCount,
        totalResponses: questionResponses.length
      })

      if (majorityChoice) {
        resultsByCategory[question.category].majorityChoices.push(majorityChoice)
      }
    })

    // Calculate overall summary
    const totalMembers = members.length
    const respondedMembers = members.filter((m: any) => m.has_responded).length
    const responseRate = totalMembers > 0 ? (respondedMembers / totalMembers) * 100 : 0

    // Save aggregated results
    for (const [category, categoryData] of Object.entries(resultsByCategory)) {
      const categoryResults = categoryData as any
      
      await supabase
        .from('poll_results')
        .upsert({
          poll_id: pollId,
          category,
          result_summary: categoryResults,
          majority_choice: categoryResults.majorityChoices.join(', '),
          vote_distribution: categoryResults.questions.reduce((acc: any, q: any) => {
            acc[q.question] = q.responses
            return acc
          }, {}),
          calculated_at: new Date().toISOString()
        }, {
          onConflict: 'poll_id,category'
        })
    }

    const finalResults = {
      poll,
      pollStatus: {
        totalMembers,
        respondedMembers,
        responseRate: Math.round(responseRate),
        isComplete: responseRate >= 50 // Consider complete when 50%+ have responded
      },
      resultsByCategory,
      preferences: {
        accommodation: resultsByCategory.accommodation?.majorityChoices?.[0] || 'No preference',
        activities: resultsByCategory.activities?.majorityChoices || [],
        budget: resultsByCategory.budget?.majorityChoices?.[0] || 'No preference',
        food: resultsByCategory.food?.majorityChoices || [],
        transport: resultsByCategory.transport?.majorityChoices?.[0] || 'No preference'
      }
    }

    return new Response(JSON.stringify(finalResults), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    })

  } catch (error) {
    console.error('Error in get-poll-results:', error)
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