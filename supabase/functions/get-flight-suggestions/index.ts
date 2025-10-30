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
      sourceLocation,
      destination, 
      departDate, 
      returnDate,
      budget,
      groupSize = 1
    } = await req.json()
    
    console.log('Getting flight suggestions for:', { sourceLocation, destination, departDate, returnDate })
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found')
      throw new Error('GEMINI_API_KEY not found')
    }

    const prompt = `You are a flight booking assistant. Based on the travel details provided, suggest flight options with realistic pricing and recommendations.

Travel Details:
- From: ${sourceLocation}
- To: ${destination}
- Departure Date: ${departDate}
- Return Date: ${returnDate}
- Number of Passengers: ${groupSize}
- Budget: ${budget}

INSTRUCTIONS:
1. Identify the nearest major airport to "${sourceLocation}" and the best airport for "${destination}"
2. Provide 3-4 flight options with different airlines and price ranges
3. Include both direct and connecting flight options if applicable
4. Consider the budget and provide options within range
5. Give realistic flight durations and prices in Indian Rupees
6. Include booking tips and recommendations

Provide the response in this JSON format:
{
  "sourceAirport": {
    "code": "airport code",
    "name": "Full airport name",
    "city": "City name",
    "distanceFromSource": "distance from ${sourceLocation}"
  },
  "destinationAirport": {
    "code": "airport code", 
    "name": "Full airport name",
    "city": "City name"
  },
  "flightOptions": [
    {
      "airline": "Airline name",
      "flightNumber": "Flight number",
      "route": "route description",
      "departureTime": "time",
      "arrivalTime": "time", 
      "duration": "flight duration",
      "stops": "direct/1 stop/2 stops",
      "price": "₹XX,XXX",
      "class": "Economy/Business",
      "bookingRecommendation": "why choose this option",
      "availability": "good/limited/high demand"
    }
  ],
  "bookingTips": [
    "tip1",
    "tip2"
  ],
  "bestTimeToBook": "recommendation on when to book",
  "priceComparison": {
    "cheapest": "₹XX,XXX",
    "average": "₹XX,XXX", 
    "premium": "₹XX,XXX"
  }
}

Make sure all prices are realistic for Indian domestic/international flights and consider seasonal variations.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
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
          maxOutputTokens: 2048,
        }
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`)
    }

    const text = data.candidates[0].content.parts[0].text
    console.log('Raw Gemini response:', text)
    
    // Try to parse JSON from the response
    let parsedData
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        let jsonText = jsonMatch[0]
        
        // Clean up the JSON
        jsonText = jsonText.replace(/\/\/.*$/gm, '')
        jsonText = jsonText.replace(/\/\*[\s\S]*?\*\//g, '')
        jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1')
        
        parsedData = JSON.parse(jsonText)
        console.log('Successfully parsed flight suggestions')
      } else {
        console.error('No JSON found in Gemini response')
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('Raw Gemini response:', text)
      parsedData = {
        error: "Could not parse flight information",
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
    console.error('Error getting flight suggestions:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to get flight suggestions. Please check the console logs for more details.'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      },
    )
  }
})