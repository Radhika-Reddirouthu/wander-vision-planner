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
    const { 
      destination, 
      tripType, 
      groupType, 
      departDate, 
      returnDate, 
      budget, 
      needsFlights,
      pollResults
    } = await req.json()
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found')
    }

    // Build the prompt with poll results if available
    let pollContext = ""
    if (pollResults && pollResults.preferences) {
      const prefs = pollResults.preferences
      pollContext = `
      
IMPORTANT - Group Preferences from Poll Results:
- Accommodation preference: ${prefs.accommodation}
- Activity preferences: ${Array.isArray(prefs.activities) ? prefs.activities.join(", ") : prefs.activities}
- Budget preference: ${prefs.budget}
- Food preferences: ${Array.isArray(prefs.food) ? prefs.food.join(", ") : prefs.food}
- Transportation preference: ${prefs.transport}

Please prioritize these group preferences in the itinerary. When there are choices, favor options that match the majority preferences above.`
    }

    const prompt = `Create a detailed travel itinerary for a ${tripType} ${groupType} trip to ${destination} from ${departDate} to ${returnDate} with a budget of ${budget} INR. ${needsFlights ? 'Include flight recommendations.' : 'No flights needed.'}${pollContext}

    CRITICAL REQUIREMENTS:
    1. Analyze the travel dates (${departDate} to ${returnDate}) for ${destination}
    2. Check current weather patterns, monsoon seasons, and any recent weather events
    3. Provide specific timing recommendations and safety considerations
    4. Consider if this is the optimal time to visit ${destination}
    5. Include weather-appropriate activities and packing suggestions
    6. Check for any travel advisories or safety concerns

    Provide the response in this JSON format:
    {
      "destination": "${destination}",
      "tripType": "${tripType}",
      "duration": "X days",
      "timingAnalysis": {
        "isOptimalTime": true/false,
        "weatherConditions": "Expected weather during travel dates",
        "seasonalConsiderations": "Key seasonal factors to consider",
        "safetyStatus": "Current safety status and any advisories",
        "recommendations": "Specific recommendations for these dates"
      },
      "estimatedBudget": {
        "total": "₹XX,XXX",
        "breakdown": {
          "accommodation": "₹XX,XXX",
          "food": "₹XX,XXX",
          "activities": "₹XX,XXX",
          "transport": "₹XX,XXX",
          "flights": "₹XX,XXX"
        }
      },
      "flightRecommendations": [
        {
          "airline": "airline name",
          "route": "departure - destination",
          "estimatedPrice": "₹XX,XXX",
          "duration": "Xh XXm",
          "recommendation": "why this flight"
        }
      ],
      "hotels": [
        {
          "name": "Hotel Name",
          "category": "luxury/mid-range/budget",
          "pricePerNight": "₹X,XXX",
          "location": "area name",
          "amenities": ["amenity1", "amenity2"],
          "whyRecommended": "reason for recommendation",
          "selected": false
        }
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Day title",
          "weatherNote": "Expected weather for this day",
          "activities": [
            {
              "time": "9:00 AM",
              "activity": "Activity name",
              "location": "Location name",
              "description": "Brief description with weather considerations",
              "estimatedCost": "₹XXX",
              "duration": "X hours",
              "weatherSuitability": "indoor/outdoor/flexible",
              "selected": false
            }
          ]
        }
      ],
      "localCuisine": [
        {
          "dish": "Dish name",
          "description": "What it is",
          "whereToFind": "Best places to try",
          "estimatedCost": "₹XXX"
        }
      ],
      "transportationTips": [
        "tip1 with weather considerations",
        "tip2"
      ],
      "packingList": [
        "weather-appropriate item1",
        "seasonal item2"
      ],
      "importantTips": [
        "weather and safety tip1",
        "timing-specific tip2"
      ],
      "weatherAlerts": [
        "Any current weather warnings or seasonal precautions"
      ]
    }

    IMPORTANT: Make sure to:
    - Research actual weather patterns for ${destination} during ${departDate} to ${returnDate}
    - Check for monsoon seasons, extreme temperatures, or natural disasters
    - Suggest indoor alternatives for bad weather days
    - Include weather-appropriate clothing and gear
    - Mention any seasonal festivals or events during these dates
    
    Make it specific to the trip type (${tripType}), consider if it's a ${groupType} trip, and ensure all prices are in Indian Rupees. Prioritize safety and optimal timing!`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
          temperature: 0.4,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
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
        error: "Could not parse itinerary information",
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