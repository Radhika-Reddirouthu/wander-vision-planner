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

    const prompt = `You are a professional travel planner creating a ${totalDays}-day itinerary for ${destination}.

TRIP DETAILS:
- Destination: ${destination}
- Dates: ${departDate} to ${returnDate} (${totalDays} days)
- Trip Type: ${tripType}
- Group: ${groupType}${groupSize ? ` (${groupSize} people)` : ''}
- Budget: ${budget} INR
- Flights: ${needsFlights && sourceLocation ? `From ${sourceLocation}${returnLocation ? ` returning to ${returnLocation}` : ''}` : 'Not needed'}
${customStay ? `- Accommodation Requirement: ${customStay}` : `- Accommodation Type: ${stayType}`}
${specificPlaces ? `- Must Visit: ${specificPlaces}` : ''}
${pollContext}

MANDATORY REQUIREMENTS:

1. REAL HOTEL NAMES ONLY:
   ${customStay 
     ? `Find REAL hotels in ${destination} matching: "${customStay}"`
     : `Find REAL ${stayType} hotels in ${destination}`}
   - Use actual brands: Taj, Oberoi, ITC, Marriott, Hyatt, Lemon Tree, Treebo, Zostel, FabHotel
   - NEVER use: "Hotel 1", "Option 1", "Day X Hotel", or any generic names
   - Each hotel needs: real name, rating (3.5-5.0), specific amenities (3-5), realistic price

2. COMPLETE ${totalDays}-DAY ITINERARY:
   - Create EVERY SINGLE day from 1 to ${totalDays} - NO PLACEHOLDERS
   - Each day: 3 REAL hotels + 3-4 SPECIFIC activities with times and costs
   - Include exact locations, timings (e.g., 9:00 AM), durations, and estimated costs
   ${specificPlaces ? `- MUST include these places: ${specificPlaces}` : ''}

3. SPECIFIC ACTIVITIES:
   - NO GENERIC activities like "indoor activities", "exploring", "local sightseeing"
   - Use ACTUAL attraction names: temples, museums, markets, beaches, monuments
   - Examples: "City Palace Museum", "Marina Beach", "Jantar Mantar", "Local bazaar shopping"
   - Include activity type: cultural, adventure, food, relaxation, shopping
   - Weather-appropriate: indoor/outdoor/flexible

4. WEATHER & TIMING:
   - Analyze weather for ${destination} during ${departDate} to ${returnDate}
   - Flag monsoon/extreme weather periods
   - Suggest indoor backup activities
   - Include seasonal events/festivals

JSON STRUCTURE (return ONLY valid JSON, no markdown):
{
  "destination": "${destination}",
  "tripType": "${tripType}",
  "duration": "${totalDays} days",
  "timingAnalysis": {
    "isOptimalTime": boolean,
    "weatherConditions": "specific weather description",
    "seasonalConsiderations": "key seasonal factors",
    "safetyStatus": "current safety status",
    "recommendations": "specific recommendations"
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
  "itinerary": [
    {
      "day": 1,
      "title": "Day 1: Specific theme",
      "weatherNote": "Expected weather",
      "hotels": [
        {
          "name": "REAL Hotel Name (e.g., Taj Palace ${destination})",
          "category": "${stayType}",
          "rating": 4.5,
          "pricePerNight": "₹X,XXX",
          "location": "specific area",
          "amenities": ["WiFi", "Pool", "Spa", "Restaurant", "Gym"],
          "whyRecommended": "specific reason",
          "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop"
        }
        // 2 more REAL hotels
      ],
      "activities": [
        {
          "time": "9:00 AM",
          "activity": "SPECIFIC Activity Name",
          "location": "EXACT Location in ${destination}",
          "description": "Detailed description (50+ words)",
          "estimatedCost": "₹XXX",
          "duration": "X hours",
          "weatherSuitability": "indoor/outdoor/flexible",
          "activityType": "cultural/adventure/food/relaxation/shopping"
        }
        // 2-3 more specific activities
      ]
    }
    // Continue for ALL ${totalDays} days
  ],
  "localCuisine": [
    {
      "dish": "Dish name",
      "description": "What it is",
      "whereToFind": "Specific restaurant/area",
      "estimatedCost": "₹XXX"
    }
  ],
  "transportationTips": ["tip1", "tip2"],
  "packingList": ["weather-appropriate items"],
  "importantTips": ["safety and cultural tips"],
  "weatherAlerts": ["any warnings"]
}

CRITICAL: Generate ALL ${totalDays} days with SPECIFIC activities (not "exploring" or "indoor activities"). Use REAL hotel names. Return ONLY valid JSON.`

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
          response_mime_type: "application/json"
        }
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`)
    }

    const text = data.candidates[0].content.parts[0].text
    console.log('Raw Gemini response:', text)
    
    // Parse JSON from Gemini response
    let parsedData
    try {
      let parsed: any
      const raw = (text ?? '').trim()
      
      // Try direct JSON parse first
      try {
        parsed = JSON.parse(raw)
      } catch {
        // Clean and extract JSON
        let jsonText = raw
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim()

        const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No JSON found in response')
        
        jsonText = jsonMatch[0]
          .replace(/\/\/.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/\\u0026/g, '&')
          .replace(/\u0026/g, '&')

        parsed = JSON.parse(jsonText)
      }

      // Ensure complete itinerary
      if (parsed.itinerary && Array.isArray(parsed.itinerary)) {
        const currentDays = parsed.itinerary.length
        if (currentDays < totalDays) {
          console.log(`Filling ${totalDays - currentDays} missing days`)
          const hotelBrands = stayType === "budget" 
            ? [`Zostel ${destination}`, `FabHotel ${destination}`, `Treebo ${destination}`]
            : stayType === "luxury"
            ? [`Taj ${destination}`, `The Oberoi ${destination}`, `ITC Grand ${destination}`]
            : [`Lemon Tree ${destination}`, `The Park ${destination}`, `Fortune Select ${destination}`]

          for (let day = currentDays + 1; day <= totalDays; day++) {
            parsed.itinerary.push({
              day,
              title: `Day ${day} - Explore ${destination}`,
              weatherNote: "Check local weather",
              hotels: hotelBrands.map((name, idx) => ({
                name,
                category: stayType,
                rating: 4.0 + idx * 0.2,
                pricePerNight: stayType === "budget" ? `₹${1500 + idx * 500}` : stayType === "luxury" ? `₹${8000 + idx * 2000}` : `₹${3000 + idx * 500}`,
                location: destination,
                amenities: ["WiFi", "AC", "Restaurant"],
                whyRecommended: "Comfortable accommodation",
                imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop"
              })),
              activities: [
                { time: "9:00 AM", activity: "Morning exploration", location: destination, description: "Explore local attractions", estimatedCost: "₹1,000", duration: "3 hours", weatherSuitability: "flexible" },
                { time: "2:00 PM", activity: "Afternoon activities", location: destination, description: "Continue exploring", estimatedCost: "₹800", duration: "2 hours", weatherSuitability: "flexible" }
              ]
            })
          }
        }
      }

      // Ensure basic structure
      parsed.destination = parsed.destination || destination
      parsed.tripType = parsed.tripType || tripType
      parsed.duration = parsed.duration || `${totalDays} days`
      parsed.estimatedBudget = parsed.estimatedBudget || {
        total: budget || "₹50,000",
        breakdown: { accommodation: "₹20,000", food: "₹15,000", activities: "₹10,000", transport: "₹5,000" }
      }

      // Inject flight data
      if (flightData && !flightData.error) {
        parsed.flightOptions = flightData.flightOptions
        parsed.sourceAirport = flightData.sourceAirport
        parsed.destinationAirport = flightData.destinationAirport
        parsed.bookingTips = flightData.bookingTips
        parsed.bestTimeToBook = flightData.bestTimeToBook
        parsed.priceComparison = flightData.priceComparison
      }

      // Check for generic activities
      if (parsed.itinerary && Array.isArray(parsed.itinerary)) {
        for (const day of parsed.itinerary) {
          if (day.activities && Array.isArray(day.activities)) {
            for (const activity of day.activities) {
              const actLower = (activity.activity || '').toLowerCase()
              if (actLower.includes('indoor activities') || actLower === 'exploring' || actLower === 'local sightseeing') {
                parsed.warning = "⚠️ Some activities are generic. Research specific attractions in " + destination
                break
              }
            }
          }
        }
      }

      parsedData = parsed
    } catch (parseError) {
      console.error('Parse error:', parseError)

    // If no parsedData was created, we need to create a fallback
    if (!parsedData) {
      // Create a comprehensive fallback itinerary structure
      console.log('Creating fallback itinerary due to parsing error')
      
      const hotelBrands = stayType === "budget" 
        ? [`Zostel ${destination}`, `FabHotel ${destination}`, `Treebo Hotels ${destination}`]
        : stayType === "luxury"
        ? [`Taj ${destination}`, `The Oberoi ${destination}`, `ITC Grand ${destination}`]
        : [`Lemon Tree ${destination}`, `The Park ${destination}`, `Fortune Select ${destination}`];
      
      // Create destination-specific activities based on common tourist destinations
      const getDestinationActivities = (day: number) => {
        const destinationLower = destination.toLowerCase();
        const defaultActivities = [
          {
            time: "9:00 AM",
            activity: `Visit ${destination} City Center`,
            location: `${destination} Downtown`,
            description: `Explore the historic city center of ${destination}, visit local markets, and experience the local culture and architecture.`,
            estimatedCost: "₹500",
            duration: "2 hours",
            weatherSuitability: "outdoor",
            activityType: "cultural"
          },
          {
            time: "12:00 PM",
            activity: "Traditional Lunch Experience",
            location: `Popular restaurant in ${destination}`,
            description: `Try authentic local cuisine at a well-rated restaurant. Ask locals for recommendations.`,
            estimatedCost: "₹800",
            duration: "1.5 hours",
            weatherSuitability: "indoor",
            activityType: "food"
          },
          {
            time: "2:30 PM",
            activity: `${destination} Museum or Cultural Site`,
            location: `${destination} heritage area`,
            description: `Visit a local museum or cultural heritage site to learn about the history and traditions of ${destination}.`,
            estimatedCost: "₹300",
            duration: "2 hours",
            weatherSuitability: "indoor",
            activityType: "cultural"
          },
          {
            time: "6:00 PM",
            activity: "Evening Market Visit",
            location: `${destination} local market`,
            description: `Stroll through evening markets, shop for souvenirs, and enjoy street food while experiencing local life.`,
            estimatedCost: "₹600",
            duration: "2 hours",
            weatherSuitability: "outdoor",
            activityType: "shopping"
          }
        ];

        // Vary activities by day
        if (day % 3 === 0) {
          return [
            defaultActivities[0],
            {
              time: "12:00 PM",
              activity: "Local Temple or Landmark Visit",
              location: `Famous landmark in ${destination}`,
              description: `Visit one of ${destination}'s famous temples or landmarks. Check opening hours and dress code before visiting.`,
              estimatedCost: "₹200",
              duration: "2 hours",
              weatherSuitability: "outdoor",
              activityType: "cultural"
            },
            defaultActivities[3]
          ];
        } else if (day % 2 === 0) {
          return [
            defaultActivities[0],
            defaultActivities[1],
            {
              time: "5:00 PM",
              activity: "Sunset Point or Viewpoint",
              location: `${destination} viewpoint`,
              description: `Visit a popular viewpoint or sunset spot to enjoy panoramic views of ${destination}.`,
              estimatedCost: "₹100",
              duration: "1.5 hours",
              weatherSuitability: "outdoor",
              activityType: "relaxation"
            }
          ];
        }
        return defaultActivities;
      };
      
      parsedData = {
        destination: destination,
        tripType: tripType,
        duration: `${totalDays} days`,
        timingAnalysis: {
          isOptimalTime: true,
          weatherConditions: `Please check current weather for ${destination} during ${departDate} to ${returnDate}`,
          seasonalConsiderations: "Research seasonal patterns for the destination before finalizing plans",
          safetyStatus: "Check latest travel advisories",
          recommendations: "Verify weather conditions and local events closer to travel dates"
        },
        estimatedBudget: {
          total: budget || "₹50,000",
          breakdown: {
            accommodation: stayType === "luxury" ? "₹30,000" : stayType === "budget" ? "₹10,000" : "₹20,000",
            food: "₹12,000",
            activities: "₹10,000",
            transport: "₹8,000",
            flights: needsFlights ? "₹15,000" : "₹0"
          }
        },
        itinerary: Array.from({ length: totalDays }, (_, index) => ({
          day: index + 1,
          title: `Day ${index + 1} - Discover ${destination}`,
          weatherNote: "Check local weather forecast before the day's activities",
          hotels: [
            {
              name: hotelBrands[0],
              category: stayType,
              rating: 4.0 + (Math.random() * 0.5),
              pricePerNight: stayType === "budget" ? "₹1,500" : stayType === "luxury" ? "₹8,000" : "₹3,000",
              location: `Central ${destination}`,
              amenities: ["Free WiFi", "Air Conditioning", "Restaurant", "24/7 Room Service", "Breakfast Included"],
              whyRecommended: "Well-reviewed property with modern amenities and convenient location",
              imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop"
            },
            {
              name: hotelBrands[1],
              category: stayType,
              rating: 4.2 + (Math.random() * 0.5),
              pricePerNight: stayType === "budget" ? "₹2,000" : stayType === "luxury" ? "₹10,000" : "₹3,500",
              location: `${destination} City Center`,
              amenities: ["Free WiFi", "Swimming Pool", "Fitness Center", "Spa Services", "Airport Shuttle"],
              whyRecommended: "Popular choice with excellent facilities and great location",
              imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop"
            },
            {
              name: hotelBrands[2],
              category: stayType,
              rating: 4.5 + (Math.random() * 0.5),
              pricePerNight: stayType === "budget" ? "₹2,500" : stayType === "luxury" ? "₹12,000" : "₹4,000",
              location: `Premium ${destination}`,
              amenities: ["Free WiFi", "Luxury Spa", "Fine Dining Restaurant", "Concierge Service", "Valet Parking"],
              whyRecommended: "Premium property with exceptional service and top-tier amenities",
              imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop"
            }
          ],
          activities: getDestinationActivities(index + 1)
        })),
        localCuisine: [
          {
            dish: "Local Specialty Dish",
            description: `Try the famous local cuisine of ${destination}. Ask locals for their favorite dishes.`,
            whereToFind: "Popular local restaurants and street food vendors",
            estimatedCost: "₹300-₹800"
          }
        ],
        transportationTips: [
          `Book transportation in advance during peak season in ${destination}`,
          "Use reputable taxi services or ride-sharing apps for safety",
          "Consider hiring a local guide for better insights"
        ],
        packingList: [
          "Comfortable walking shoes",
          "Weather-appropriate clothing",
          "Sun protection (hat, sunscreen)",
          "Power bank and chargers",
          "First aid kit and medications",
          "Valid ID and travel documents"
        ],
        importantTips: [
          `Research ${destination} local customs and etiquette before visiting`,
          "Keep emergency contacts and hotel address handy",
          "Carry a copy of important documents",
          "Stay hydrated and be mindful of food safety"
        ],
        weatherAlerts: [`Check weather updates for ${destination} closer to travel dates`],
        warning: "⚠️ This is a fallback itinerary. The AI service encountered an issue generating a detailed plan. Please use this as a starting point and research specific attractions and activities for " + destination,
        generationError: true
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
    
    // Return a structured fallback itinerary instead of just error
    const hotelBrands = stayType === "budget" 
      ? [`Zostel ${destination}`, `FabHotel ${destination}`, `Treebo Hotels ${destination}`]
      : stayType === "luxury"
      ? [`Taj ${destination}`, `The Oberoi ${destination}`, `ITC Grand ${destination}`]
      : [`Lemon Tree ${destination}`, `The Park ${destination}`, `Fortune Select ${destination}`];
    
    const totalDays = Math.ceil((new Date(returnDate) - new Date(departDate)) / (1000 * 60 * 60 * 24)) + 1;
    
    const fallbackItinerary = {
      destination: destination || "Your Destination",
      tripType: tripType || "leisure",
      duration: `${totalDays} days`,
      error: true,
      errorMessage: "We encountered an issue generating your detailed itinerary. Here's a basic structure to get you started.",
      warning: "⚠️ Please research specific attractions, restaurants, and activities for " + (destination || "your destination") + " to create a personalized experience.",
      estimatedBudget: {
        total: budget || "₹50,000",
        breakdown: {
          accommodation: stayType === "luxury" ? "₹30,000" : stayType === "budget" ? "₹10,000" : "₹20,000",
          food: "₹12,000",
          activities: "₹10,000",
          transport: "₹8,000"
        }
      },
      itinerary: Array.from({ length: totalDays }, (_, index) => ({
        day: index + 1,
        title: `Day ${index + 1} - Discover ${destination || "Your Destination"}`,
        weatherNote: "Check local weather forecast",
        hotels: [
          {
            name: hotelBrands[0],
            category: stayType || "mid-range",
            rating: 4.0,
            pricePerNight: stayType === "budget" ? "₹1,500" : stayType === "luxury" ? "₹8,000" : "₹3,000",
            location: `${destination || "City"} Center`,
            amenities: ["Free WiFi", "Air Conditioning", "Restaurant"],
            whyRecommended: "Research hotels in your destination",
            imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop"
          },
          {
            name: hotelBrands[1],
            category: stayType || "mid-range",
            rating: 4.2,
            pricePerNight: stayType === "budget" ? "₹2,000" : stayType === "luxury" ? "₹10,000" : "₹3,500",
            location: destination || "City",
            amenities: ["Free WiFi", "Swimming Pool", "Fitness Center"],
            whyRecommended: "Compare prices on booking websites",
            imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop"
          },
          {
            name: hotelBrands[2],
            category: stayType || "mid-range",
            rating: 4.5,
            pricePerNight: stayType === "budget" ? "₹2,500" : stayType === "luxury" ? "₹12,000" : "₹4,000",
            location: destination || "City",
            amenities: ["Free WiFi", "Spa Services", "Restaurant"],
            whyRecommended: "Read reviews before booking",
            imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop"
          }
        ],
        activities: [
          {
            time: "9:00 AM",
            activity: `Research Top Attractions`,
            location: destination || "Your Destination",
            description: `Look up the most popular tourist attractions, landmarks, and cultural sites in ${destination || "your destination"}. Consider guided tours for better insights.`,
            estimatedCost: "₹500-₹2,000",
            duration: "3-4 hours",
            weatherSuitability: "flexible"
          },
          {
            time: "2:00 PM",
            activity: "Local Dining Experience",
            location: destination || "Your Destination",
            description: "Research popular restaurants and local food specialties. Ask locals or check online reviews for recommendations.",
            estimatedCost: "₹800-₹1,500",
            duration: "1-2 hours",
            weatherSuitability: "indoor"
          }
        ]
      })),
      importantTips: [
        `Research ${destination || "your destination"} thoroughly before your trip`,
        "Check weather conditions for your travel dates",
        "Book accommodations and major activities in advance",
        "Keep emergency contacts handy",
        "Purchase travel insurance"
      ]
    };
    
    return new Response(
      JSON.stringify(fallbackItinerary),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200, // Return 200 with fallback data instead of 500
      },
    )
  }
})