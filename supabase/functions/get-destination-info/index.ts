import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { destination } = await req.json()
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found')
    }

    const prompt = `Analyze the travel destination "${destination}" and provide detailed information in the following JSON format:
    {
      "destination": "${destination}",
      "peakSeason": {
        "months": ["month1", "month2"],
        "description": "why it's peak season",
        "averageTemp": "temperature range",
        "crowdLevel": "high/medium/low",
        "priceLevel": "high/medium/low"
      },
      "offPeakSeason": {
        "months": ["month1", "month2"], 
        "description": "benefits of off-peak",
        "averageTemp": "temperature range",
        "crowdLevel": "high/medium/low",
        "priceLevel": "high/medium/low"
      },
      "bestTimeToVisit": {
        "months": ["month1", "month2"],
        "reason": "why this is the best time"
      },
      "weatherPatterns": "description of weather throughout the year",
      "localEvents": ["event1", "event2"],
      "warnings": "any travel warnings or considerations",
      "isGoodDestination": true/false,
      "alternativeSuggestions": ["alternative1", "alternative2"] // if not a good destination
    }
    
    Provide accurate, current information. If you're not sure about specific details, indicate uncertainty.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`)
    }

    const text = data.candidates[0].content.parts[0].text
    
    // Try to parse JSON from the response
    let parsedData
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        // Fallback if JSON parsing fails
        parsedData = {
          destination,
          error: "Could not parse destination information",
          rawResponse: text
        }
      }
    } catch (parseError) {
      parsedData = {
        destination,
        error: "Could not parse destination information",
        rawResponse: text
      }
    }

    return new Response(
      JSON.stringify(parsedData),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      },
    )
  }
})