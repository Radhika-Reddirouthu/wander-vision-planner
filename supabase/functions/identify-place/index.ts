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
    const { imageBase64 } = await req.json()
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found')
    }

    const prompt = `Analyze this image and identify the location. Provide detailed travel information in the following JSON format:
    {
      "identifiedPlace": "Name of the place/landmark",
      "country": "Country name",
      "state": "State/Province (if applicable)",
      "city": "City name",
      "confidence": "high/medium/low",
      "description": "Brief description of the place",
      "historicalSignificance": "Historical background if any",
      "bestTimeToVisit": {
        "months": ["month1", "month2"],
        "reason": "why this is the best time"
      },
      "nearbyAttractions": [
        {
          "name": "Attraction name",
          "distance": "X km",
          "description": "Brief description"
        }
      ],
      "estimatedBudget": {
        "budget": "₹XX,XXX for X days",
        "breakdown": {
          "accommodation": "₹XX,XXX",
          "food": "₹XX,XXX", 
          "activities": "₹XX,XXX",
          "transport": "₹XX,XXX"
        }
      },
      "suggestedItinerary": [
        {
          "day": 1,
          "activities": [
            {
              "activity": "Activity name",
              "duration": "X hours",
              "cost": "₹XXX"
            }
          ]
        }
      ],
      "localCuisine": ["dish1", "dish2"],
      "transportationOptions": ["option1", "option2"],
      "importantTips": ["tip1", "tip2"],
      "weatherInfo": "Current season weather information"
    }
    
    If you cannot identify the place with confidence, indicate low confidence and provide general advice based on what you can see in the image.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64.split(',')[1] // Remove data:image/jpeg;base64, prefix
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 3072,
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
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      parsedData = {
        error: "Could not parse place identification",
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