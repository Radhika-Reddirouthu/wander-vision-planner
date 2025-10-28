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
      groupSize,
      departDate, 
      returnDate, 
      budget, 
      needsFlights,
      pollResults,
      stayType = "3-star",
      specificPlaces = ""
    } = await req.json()
    
    console.log('Creating itinerary for:', { destination, tripType, groupType, groupSize, departDate, returnDate })
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found')
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

    // Calculate the total number of days
    const startDate = new Date(departDate);
    const endDate = new Date(returnDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const prompt = `Create a detailed travel itinerary for a ${tripType} ${groupType} trip to ${destination} from ${departDate} to ${returnDate} with a budget of ${budget} INR${groupSize ? ` for ${groupSize} people` : ''}. ${needsFlights ? 'Include flight recommendations.' : 'No flights needed.'}${pollContext}

    CRITICAL REQUIREMENTS - MUST FOLLOW:
    1. CREATE ITINERARY FOR EXACTLY ${totalDays} DAYS (from day 1 to day ${totalDays})
    2. INCLUDE DETAILED ACTIVITIES FOR EVERY SINGLE DAY - DO NOT SKIP ANY DAYS
    3. NO PLACEHOLDERS OR COMMENTS LIKE "Days 4-22 would follow..." - PROVIDE COMPLETE DETAILS
    4. Each day must have at least 2-3 specific activities with times, costs, and descriptions
    5. Each day MUST have exactly 3 hotel options with proper imageUrl from Unsplash
    6. Analyze the travel dates (${departDate} to ${returnDate}) for ${destination}
    7. Check current weather patterns, monsoon seasons, and any recent weather events
    8. Provide specific timing recommendations and safety considerations
    9. Consider if this is the optimal time to visit ${destination}
    10. Include weather-appropriate activities and packing suggestions
    11. Check for any travel advisories or safety concerns
    ${specificPlaces ? `12. MUST include these specific places in the itinerary: ${specificPlaces}` : ''}

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
        // MUST CREATE EXACTLY ${totalDays} DAYS - NO SHORTCUTS OR PLACEHOLDERS
        {
          "day": 1,
          "title": "Day 1 title",
          "weatherNote": "Expected weather for day 1",
          "hotels": [
            {
              "name": "Hotel Name 1",
              "category": "${stayType}",
              "pricePerNight": "₹X,XXX",
              "location": "area name",
              "whyRecommended": "reason for recommendation",
              "imageUrl": "https://images.unsplash.com/photo-XXXXX?w=400&h=300&fit=crop"
            },
            {
              "name": "Hotel Name 2",
              "category": "${stayType}",
              "pricePerNight": "₹X,XXX",
              "location": "area name",
              "whyRecommended": "reason for recommendation",
              "imageUrl": "https://images.unsplash.com/photo-XXXXX?w=400&h=300&fit=crop"
            },
            {
              "name": "Hotel Name 3",
              "category": "${stayType}",
              "pricePerNight": "₹X,XXX",
              "location": "area name",
              "whyRecommended": "reason for recommendation",
              "imageUrl": "https://images.unsplash.com/photo-XXXXX?w=400&h=300&fit=crop"
            }
          ],
          "activities": [
            {
              "time": "9:00 AM",
              "activity": "Specific activity for day 1",
              "location": "Specific location in ${destination}",
              "description": "Detailed description with weather considerations",
              "estimatedCost": "₹XXX",
              "duration": "X hours",
              "weatherSuitability": "indoor/outdoor/flexible"
            },
            {
              "time": "2:00 PM",
              "activity": "Another specific activity for day 1",
              "location": "Another location in ${destination}",
              "description": "Detailed description",
              "estimatedCost": "₹XXX",
              "duration": "X hours",
              "weatherSuitability": "indoor/outdoor/flexible"
            }
          ]
        },
        {
          "day": 2,
          "title": "Day 2 title",
          "weatherNote": "Expected weather for day 2",
          "hotels": [
            // 3 hotel options with imageUrl for day 2
          ],
          "activities": [
            {
              "time": "9:00 AM",
              "activity": "Specific activity for day 2",
              "location": "Specific location in ${destination}",
              "description": "Detailed description with weather considerations",
              "estimatedCost": "₹XXX",
              "duration": "X hours",
              "weatherSuitability": "indoor/outdoor/flexible"
            }
          ]
        }
        // CONTINUE THIS PATTERN FOR ALL ${totalDays} DAYS - DO NOT USE PLACEHOLDERS
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

    CRITICAL INSTRUCTIONS - MUST FOLLOW:
    - CREATE EXACTLY ${totalDays} COMPLETE DAYS OF ITINERARY - NO MISSING DAYS OR PLACEHOLDERS
    - Each day (from 1 to ${totalDays}) must have exactly 3 hotel options with proper imageUrl fields from Unsplash
    - Each day must have 2-3 detailed activities with specific times, locations, and costs
    - Hotel category should match the requested stay type: ${stayType}
    - Use realistic Unsplash image URLs for hotels (search terms like: hotel ${destination}, luxury hotel, ${stayType} hotel)
    ${specificPlaces ? `- MUST include these specific places: ${specificPlaces}` : ''}
    - DO NOT use comments like "Days X-Y would follow this structure" - PROVIDE FULL DETAILS FOR EACH DAY
    - Research actual weather patterns for ${destination} during ${departDate} to ${returnDate}
    - Check for monsoon seasons, extreme temperatures, or natural disasters
    - Suggest indoor alternatives for bad weather days
    - Include weather-appropriate clothing and gear
    - Mention any seasonal festivals or events during these dates
    - Provide realistic costs in Indian Rupees
    - Make it specific to the trip type (${tripType}) and group type (${groupType})
    - RETURN ONLY VALID JSON - NO MARKDOWN FORMATTING OR EXTRA TEXT
    
    IMPORTANT: Your response should be a complete JSON object with all ${totalDays} days filled out in detail with 3 hotels each. Do not truncate or use placeholder text.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
          topK: 32,
          topP: 0.9,
          maxOutputTokens: 8192,
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
      // First, try to extract JSON from markdown code blocks
      let jsonText = text
      
      // Remove markdown code block markers
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
      
      // Try to find the main JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
        
        // Clean up the JSON by removing JavaScript-style comments
        jsonText = jsonText.replace(/\/\/.*$/gm, '')
        jsonText = jsonText.replace(/\/\*[\s\S]*?\*\//g, '')
        
        // Remove trailing commas before closing brackets/braces
        jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1')
        
        // Handle incomplete itinerary arrays - if itinerary is incomplete, create a basic structure
        const parsed = JSON.parse(jsonText)
        
        // Ensure we have all required days
        if (parsed.itinerary && Array.isArray(parsed.itinerary)) {
          const currentDays = parsed.itinerary.length
          if (currentDays < totalDays) {
            console.log(`Incomplete itinerary: got ${currentDays} days, need ${totalDays}`)
            
            // Fill in missing days with basic structure
            for (let day = currentDays + 1; day <= totalDays; day++) {
              parsed.itinerary.push({
                day: day,
                title: `Day ${day} - Explore ${destination}`,
                weatherNote: "Please check local weather conditions",
                hotels: [
                  {
                    name: `Hotel Option 1 - Day ${day}`,
                    category: stayType,
                    pricePerNight: "₹3,000",
                    location: destination,
                    whyRecommended: "Comfortable stay with good amenities",
                    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop"
                  },
                  {
                    name: `Hotel Option 2 - Day ${day}`,
                    category: stayType,
                    pricePerNight: "₹3,500",
                    location: destination,
                    whyRecommended: "Great location with modern facilities",
                    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop"
                  },
                  {
                    name: `Hotel Option 3 - Day ${day}`,
                    category: stayType,
                    pricePerNight: "₹4,000",
                    location: destination,
                    whyRecommended: "Premium choice with excellent service",
                    imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop"
                  }
                ],
                activities: [
                  {
                    time: "9:00 AM",
                    activity: "Morning exploration",
                    location: destination,
                    description: "Explore local attractions and culture",
                    estimatedCost: "₹1,000",
                    duration: "3 hours",
                    weatherSuitability: "flexible"
                  },
                  {
                    time: "2:00 PM",
                    activity: "Afternoon activities",
                    location: destination,
                    description: "Continue exploring or relax",
                    estimatedCost: "₹800",
                    duration: "2 hours",
                    weatherSuitability: "flexible"
                  }
                ]
              })
            }
          }
        }
        
        // Ensure basic structure exists
        if (!parsed.destination) parsed.destination = destination
        if (!parsed.tripType) parsed.tripType = tripType
        if (!parsed.duration) parsed.duration = `${totalDays} days`
        if (!parsed.estimatedBudget) {
          parsed.estimatedBudget = {
            total: budget || "₹50,000",
            breakdown: {
              accommodation: "₹20,000",
              food: "₹15,000",
              activities: "₹10,000",
              transport: "₹5,000"
            }
          }
        }
        
        parsedData = parsed
        console.log('Successfully parsed and completed itinerary data')
      } else {
        console.error('No JSON found in Gemini response')
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('Raw Gemini response:', text)
      
      // Create a fallback itinerary structure
      parsedData = {
        destination: destination,
        tripType: tripType,
        duration: `${totalDays} days`,
        estimatedBudget: {
          total: budget || "₹50,000",
          breakdown: {
            accommodation: "₹20,000",
            food: "₹15,000",
            activities: "₹10,000",
            transport: "₹5,000"
          }
        },
        itinerary: Array.from({ length: totalDays }, (_, index) => ({
          day: index + 1,
          title: `Day ${index + 1} - Explore ${destination}`,
          weatherNote: "Please check local weather conditions",
          hotels: [
            {
              name: `Hotel Option 1 - Day ${index + 1}`,
              category: stayType,
              pricePerNight: "₹3,000",
              location: destination,
              whyRecommended: "Comfortable stay with good amenities",
              imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop"
            },
            {
              name: `Hotel Option 2 - Day ${index + 1}`,
              category: stayType,
              pricePerNight: "₹3,500",
              location: destination,
              whyRecommended: "Great location with modern facilities",
              imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop"
            },
            {
              name: `Hotel Option 3 - Day ${index + 1}`,
              category: stayType,
              pricePerNight: "₹4,000",
              location: destination,
              whyRecommended: "Premium choice with excellent service",
              imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop"
            }
          ],
          activities: [
            {
              time: "9:00 AM",
              activity: "Morning exploration",
              location: destination,
              description: "Explore local attractions and culture",
              estimatedCost: "₹1,000",
              duration: "3 hours",
              weatherSuitability: "flexible"
            },
            {
              time: "2:00 PM",
              activity: "Afternoon activities",
              location: destination,
              description: "Continue exploring or relax",
              estimatedCost: "₹800",
              duration: "2 hours",
              weatherSuitability: "flexible"
            }
          ]
        })),
        error: "AI response parsing failed - showing basic itinerary structure",
        rawResponse: text.substring(0, 1000) + "..." // Truncate for logging
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
    console.error('Error creating itinerary:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to create itinerary. Please check the console logs for more details.'
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