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
      needsFlights 
    } = await req.json()
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found')
    }

    const prompt = `Create a detailed travel itinerary for a ${tripType} ${groupType} trip to ${destination} from ${departDate} to ${returnDate} with a budget of ${budget} INR. ${needsFlights ? 'Include flight recommendations.' : 'No flights needed.'}

    Provide the response in this JSON format:
    {
      "destination": "${destination}",
      "tripType": "${tripType}",
      "duration": "X days",
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
          "activities": [
            {
              "time": "9:00 AM",
              "activity": "Activity name",
              "location": "Location name",
              "description": "Brief description",
              "estimatedCost": "₹XXX",
              "duration": "X hours",
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
        "tip1",
        "tip2"
      ],
      "packingList": [
        "item1",
        "item2"
      ],
      "importantTips": [
        "tip1",
        "tip2"
      ]
    }

    Make it specific to the trip type (${tripType}), consider if it's a ${groupType} trip, and ensure all prices are in Indian Rupees. Make the itinerary practical and exciting!`

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