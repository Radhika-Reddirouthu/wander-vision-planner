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
      sourceLocation = "",
      returnLocation = "",
      pollResults,
      stayType = "3-star",
      customStay = "",
      specificPlaces = ""
    } = await req.json()
    
    console.log('Creating itinerary for:', { destination, tripType, groupType, groupSize, departDate, returnDate })
    
    // Get flight suggestions if needed
    let flightData = null
    if (needsFlights && sourceLocation) {
      console.log('Fetching flight suggestions...')
      try {
        const flightResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/get-flight-suggestions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            sourceLocation,
            destination,
            departDate,
            returnDate,
            returnLocation,
            budget,
            groupSize
          })
        })
        
        if (flightResponse.ok) {
          flightData = await flightResponse.json()
          console.log('Flight suggestions fetched successfully')
        } else {
          console.error('Failed to fetch flight suggestions:', await flightResponse.text())
        }
      } catch (flightError) {
        console.error('Error fetching flight suggestions:', flightError)
      }
    }
    
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

    const prompt = `Create a detailed travel itinerary for a ${tripType} ${groupType} trip to ${destination} from ${departDate} to ${returnDate} with a budget of ${budget} INR${groupSize ? ` for ${groupSize} people` : ''}. ${needsFlights && sourceLocation ? `Flying from ${sourceLocation}${returnLocation ? ` and returning to ${returnLocation}` : ''}.` : 'No flights needed.'}${pollContext}

    🔴🔴🔴 CRITICAL HOTEL REQUIREMENTS - ABSOLUTE TOP PRIORITY 🔴🔴🔴:
    ${customStay ? `
    ⚠️ USER'S SPECIFIC REQUIREMENT: "${customStay}" 
    - THIS IS NON-NEGOTIABLE - Find REAL, EXISTING hotels in ${destination} that EXACTLY match: "${customStay}"
    - If user mentioned "beach resort", find actual beach resorts like "The Leela Kovalam Beach Resort", "Taj Exotica Goa"
    - If user mentioned "boutique hotel", find actual boutique properties like "The Oberoi Amarvilas", "Rambagh Palace"
    - If user mentioned specific amenities, prioritize hotels with those features` 
    : `Find REAL, EXISTING hotels in ${destination} that match ${stayType} category.`}
    
    🚫 ABSOLUTELY FORBIDDEN - NEVER USE THESE:
    - "Hotel 1", "Hotel 2", "Hotel 3"
    - "Option 1", "Option 2", "Option 3"  
    - "Budget Hotel", "Mid-range Hotel", "Luxury Hotel"
    - "Hotel Option 1 - Day X"
    - Any generic placeholder name
    
    ✅ MANDATORY - USE ONLY REAL HOTEL NAMES:
    - Examples for ${destination}: "ITC Grand ${destination}", "Taj ${destination}", "The Leela ${destination}", "Marriott ${destination}", "Hyatt Regency ${destination}"
    - Budget options: "Zostel ${destination}", "FabHotel", "Treebo Hotels", "OYO Townhouse"
    - Mid-range: "Fortune Select", "Lemon Tree Hotels", "The Park Hotels"
    - Luxury: "Oberoi Hotels", "Taj Hotels", "ITC Hotels", "Leela Palaces"
    - Each hotel MUST include a rating field between 3.5-5.0 stars
    - Each hotel MUST include 3-5 specific amenities
    - Use actual hotel search queries for Unsplash images

    CRITICAL REQUIREMENTS - MUST FOLLOW:
    1. CREATE ITINERARY FOR EXACTLY ${totalDays} DAYS (from day 1 to day ${totalDays})
    2. INCLUDE DETAILED ACTIVITIES FOR EVERY SINGLE DAY - DO NOT SKIP ANY DAYS
    3. NO PLACEHOLDERS OR COMMENTS LIKE "Days 4-22 would follow..." - PROVIDE COMPLETE DETAILS
    4. Each day must have at least 2-3 specific activities with times, costs, and descriptions
    5. Each day MUST have exactly 3 hotel options with REAL names and ratings
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
              "name": "ACTUAL EXISTING Hotel Name (e.g. The Leela Palace ${destination})",
              "category": "${stayType}",
              "rating": 4.5,
              "pricePerNight": "₹X,XXX",
              "location": "specific area name",
              "amenities": ["WiFi", "Pool", "Restaurant"],
              "whyRecommended": "reason for recommendation",
              "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&q=80"
            },
            {
              "name": "DIFFERENT REAL Hotel Name (e.g. Taj ${destination})",
              "category": "${stayType}",
              "rating": 4.7,
              "pricePerNight": "₹X,XXX",
              "location": "specific area name",
              "amenities": ["WiFi", "Spa", "Gym"],
              "whyRecommended": "reason for recommendation",
              "imageUrl": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&q=80"
            },
            {
              "name": "THIRD ACTUAL Hotel Name (e.g. ITC Grand ${destination})",
              "category": "${stayType}",
              "rating": 4.3,
              "pricePerNight": "₹X,XXX",
              "location": "specific area name",
              "amenities": ["WiFi", "Restaurant", "Bar"],
              "whyRecommended": "reason for recommendation",
              "imageUrl": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop&q=80"
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

    🔴 CRITICAL INSTRUCTIONS - MUST FOLLOW:
    
    ⚠️⚠️⚠️ HOTEL NAMING - ABSOLUTE NON-NEGOTIABLE REQUIREMENT ⚠️⚠️⚠️:
    ${customStay ? `
    🎯 USER EXPLICITLY REQUESTED: "${customStay}"
    - This is the #1 priority - Find REAL hotels in ${destination} that match: "${customStay}"
    - Research actual properties that fit this description
    - Example: If user wants "beach resort" → "The Leela Kovalam", "Taj Fort Aguada Resort & Spa", "Grand Hyatt Goa"
    - Example: If user wants "heritage hotel" → "Taj Falaknuma Palace", "Rambagh Palace", "Umaid Bhawan Palace"` 
    : `- Find REAL hotels matching ${stayType} in ${destination}`}
    
    🚫 NEVER EVER USE THESE NAMES (will cause rejection):
    - "Hotel 1", "Hotel 2", "Hotel 3", "Day 1 Hotel", "Day 2 Hotel"
    - "Option 1", "Option 2", "Budget/Mid-range/Luxury Hotel"
    - Any name containing "Option" or "Day X"
    
    ✅ ONLY USE REAL BRANDS & PROPERTIES:
    - Major chains: "Taj ${destination}", "Oberoi ${destination}", "ITC Grand ${destination}", "Marriott ${destination}"
    - Budget: "Zostel ${destination}", "FabHotel ${destination}", "Treebo ${destination}"
    - Mid-range: "Lemon Tree ${destination}", "The Park ${destination}", "Fortune Select ${destination}"
    - Each hotel needs: rating (3.5-5.0), 3-5 amenities, realistic price
    
    HOTEL IMAGES:
    - Use Unsplash with search query: "${destination} hotel luxury" or "${destination} resort" 
    - Different photo ID for each hotel
    
    ITINERARY COMPLETENESS:
    - CREATE EXACTLY ${totalDays} COMPLETE DAYS - NO MISSING DAYS OR PLACEHOLDERS
    - Each day must have exactly 3 REAL hotel options with ratings
    - Each day must have 2-3 detailed activities with specific times, locations, and costs
    ${specificPlaces ? `- MUST include these specific places: ${specificPlaces}` : ''}
    - DO NOT use comments like "Days X-Y would follow this structure" - PROVIDE FULL DETAILS
    
    WEATHER & TIMING:
    - Research actual weather patterns for ${destination} during ${departDate} to ${returnDate}
    - Check for monsoon seasons, extreme temperatures, or natural disasters
    - Suggest indoor alternatives for bad weather days
    - Include weather-appropriate clothing and gear
    - Mention any seasonal festivals or events during these dates
    
    OTHER:
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
          temperature: 0.4,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 16384,
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
        
        // Replace HTML entities and control characters
        jsonText = jsonText.replace(/\\u0026/g, '&')
        jsonText = jsonText.replace(/\u0026/g, '&')
        jsonText = jsonText.replace(/\\u003c/g, '<')
        jsonText = jsonText.replace(/\\u003e/g, '>')
        jsonText = jsonText.replace(/\\u0027/g, "'")
        jsonText = jsonText.replace(/\\u0022/g, '"')
        
        // Remove any other control characters that might break JSON parsing
        jsonText = jsonText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        
        // Handle incomplete itinerary arrays - if itinerary is incomplete, create a basic structure
        const parsed = JSON.parse(jsonText)
        
        // Ensure we have all required days
        if (parsed.itinerary && Array.isArray(parsed.itinerary)) {
          const currentDays = parsed.itinerary.length
          if (currentDays < totalDays) {
            console.log(`Incomplete itinerary: got ${currentDays} days, need ${totalDays}`)
            
            // Fill in missing days with realistic hotel names
            const hotelBrands = stayType === "budget" 
              ? [`Zostel ${destination}`, `FabHotel ${destination}`, `Treebo ${destination}`]
              : stayType === "luxury"
              ? [`Taj ${destination}`, `The Oberoi ${destination}`, `ITC Grand ${destination}`]
              : [`Lemon Tree ${destination}`, `The Park ${destination}`, `Fortune Select ${destination}`];
            
            for (let day = currentDays + 1; day <= totalDays; day++) {
              parsed.itinerary.push({
                day: day,
                title: `Day ${day} - Explore ${destination}`,
                weatherNote: "Please check local weather conditions",
                hotels: [
                  {
                    name: hotelBrands[0],
                    category: stayType,
                    rating: 4.0,
                    pricePerNight: stayType === "budget" ? "₹1,500" : stayType === "luxury" ? "₹8,000" : "₹3,000",
                    location: destination,
                    amenities: ["WiFi", "AC", "Restaurant"],
                    whyRecommended: "Comfortable stay with good amenities",
                    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop"
                  },
                  {
                    name: hotelBrands[1],
                    category: stayType,
                    rating: 4.2,
                    pricePerNight: stayType === "budget" ? "₹2,000" : stayType === "luxury" ? "₹10,000" : "₹3,500",
                    location: destination,
                    amenities: ["WiFi", "Pool", "Gym"],
                    whyRecommended: "Great location with modern facilities",
                    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop"
                  },
                  {
                    name: hotelBrands[2],
                    category: stayType,
                    rating: 4.5,
                    pricePerNight: stayType === "budget" ? "₹2,500" : stayType === "luxury" ? "₹12,000" : "₹4,000",
                    location: destination,
                    amenities: ["WiFi", "Spa", "Restaurant"],
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
        
        // Inject flight data if available
        if (flightData && !flightData.error) {
          parsed.flightOptions = flightData.flightOptions
          parsed.sourceAirport = flightData.sourceAirport
          parsed.destinationAirport = flightData.destinationAirport
          parsed.bookingTips = flightData.bookingTips
          parsed.bestTimeToBook = flightData.bestTimeToBook
          parsed.priceComparison = flightData.priceComparison
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
      
      // Create a fallback itinerary structure with realistic hotel names
      const hotelBrands = stayType === "budget" 
        ? [`Zostel ${destination}`, `FabHotel ${destination}`, `Treebo ${destination}`]
        : stayType === "luxury"
        ? [`Taj ${destination}`, `The Oberoi ${destination}`, `ITC Grand ${destination}`]
        : [`Lemon Tree ${destination}`, `The Park ${destination}`, `Fortune Select ${destination}`];
      
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
              name: hotelBrands[0],
              category: stayType,
              rating: 4.0,
              pricePerNight: stayType === "budget" ? "₹1,500" : stayType === "luxury" ? "₹8,000" : "₹3,000",
              location: destination,
              amenities: ["WiFi", "AC", "Restaurant"],
              whyRecommended: "Comfortable stay with good amenities",
              imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop"
            },
            {
              name: hotelBrands[1],
              category: stayType,
              rating: 4.2,
              pricePerNight: stayType === "budget" ? "₹2,000" : stayType === "luxury" ? "₹10,000" : "₹3,500",
              location: destination,
              amenities: ["WiFi", "Pool", "Gym"],
              whyRecommended: "Great location with modern facilities",
              imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop"
            },
            {
              name: hotelBrands[2],
              category: stayType,
              rating: 4.5,
              pricePerNight: stayType === "budget" ? "₹2,500" : stayType === "luxury" ? "₹12,000" : "₹4,000",
              location: destination,
              amenities: ["WiFi", "Spa", "Restaurant"],
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