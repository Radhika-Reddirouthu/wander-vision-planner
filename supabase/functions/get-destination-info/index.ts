import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Indian holidays for 2024-2025 (can be extended)
const indianHolidays2024 = [
  { date: '2024-01-26', name: 'Republic Day' },
  { date: '2024-03-08', name: 'Holi' },
  { date: '2024-03-29', name: 'Good Friday' },
  { date: '2024-04-17', name: 'Ram Navami' },
  { date: '2024-08-15', name: 'Independence Day' },
  { date: '2024-08-26', name: 'Janmashtami' },
  { date: '2024-09-07', name: 'Ganesh Chaturthi' },
  { date: '2024-10-02', name: 'Gandhi Jayanti' },
  { date: '2024-10-12', name: 'Dussehra' },
  { date: '2024-11-01', name: 'Diwali' },
  { date: '2024-11-15', name: 'Guru Nanak Jayanti' },
  { date: '2024-12-25', name: 'Christmas' }
]

const indianHolidays2025 = [
  { date: '2025-01-26', name: 'Republic Day' },
  { date: '2025-03-14', name: 'Holi' },
  { date: '2025-04-18', name: 'Good Friday' },
  { date: '2025-04-06', name: 'Ram Navami' },
  { date: '2025-08-15', name: 'Independence Day' },
  { date: '2025-08-16', name: 'Janmashtami' },
  { date: '2025-08-27', name: 'Ganesh Chaturthi' },
  { date: '2025-10-02', name: 'Gandhi Jayanti' },
  { date: '2025-10-12', name: 'Dussehra' },
  { date: '2025-10-20', name: 'Diwali' },
  { date: '2025-11-05', name: 'Guru Nanak Jayanti' },
  { date: '2025-12-25', name: 'Christmas' }
]

function getHolidaysForTravelDates(departDate, returnDate) {
  const depart = new Date(departDate)
  const returnD = new Date(returnDate)
  const longWeekends = []
  const allHolidays = [...indianHolidays2024, ...indianHolidays2025]
  
  for (const holiday of allHolidays) {
    const holidayDate = new Date(holiday.date)
    
    // Include holidays that fall within or close to travel dates (within 30 days before or during trip)
    const thirtyDaysBefore = new Date(depart.getTime() - 30*24*60*60*1000)
    if (holidayDate >= thirtyDaysBefore && holidayDate <= returnD) {
      const dayOfWeek = holidayDate.getDay()
      
      if (dayOfWeek === 1) { // Monday holiday = 3-day weekend
        longWeekends.push({
          ...holiday,
          type: '3-day weekend',
          dates: `${formatDate(new Date(holidayDate.getTime() - 2*24*60*60*1000))} - ${formatDate(holidayDate)}`
        })
      } else if (dayOfWeek === 5) { // Friday holiday = 3-day weekend
        longWeekends.push({
          ...holiday,
          type: '3-day weekend', 
          dates: `${formatDate(holidayDate)} - ${formatDate(new Date(holidayDate.getTime() + 2*24*60*60*1000))}`
        })
      } else {
        longWeekends.push({
          ...holiday,
          type: 'holiday',
          dates: formatDate(holidayDate)
        })
      }
    }
  }
  
  return longWeekends.slice(0, 6)
}

function getUpcomingLongWeekends() {
  const today = new Date()
  const longWeekends = []
  const allHolidays = [...indianHolidays2024, ...indianHolidays2025]
  
  for (const holiday of allHolidays) {
    const holidayDate = new Date(holiday.date)
    if (holidayDate < today) continue
    
    const dayOfWeek = holidayDate.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Check for long weekends (holidays on Monday or Friday, or adjacent to weekends)
    if (dayOfWeek === 1) { // Monday holiday = 3-day weekend
      longWeekends.push({
        ...holiday,
        type: '3-day weekend',
        dates: `${formatDate(new Date(holidayDate.getTime() - 2*24*60*60*1000))} - ${formatDate(holidayDate)}`
      })
    } else if (dayOfWeek === 5) { // Friday holiday = 3-day weekend
      longWeekends.push({
        ...holiday,
        type: '3-day weekend', 
        dates: `${formatDate(holidayDate)} - ${formatDate(new Date(holidayDate.getTime() + 2*24*60*60*1000))}`
      })
    } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend holidays
      longWeekends.push({
        ...holiday,
        type: '2-day weekend',
        dates: formatDate(holidayDate)
      })
    }
  }
  
  return longWeekends.slice(0, 6) // Return next 6 long weekends
}

function formatDate(date) {
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { destination, departDate, returnDate } = await req.json()
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found')
    }

    console.log('Getting destination info for:', { destination, departDate, returnDate })

    // Get holidays relevant to travel dates if provided
    const longWeekends = departDate && returnDate ? 
      getHolidaysForTravelDates(departDate, returnDate) : 
      getUpcomingLongWeekends()
    
    const longWeekendsText = longWeekends.map(lw => `${lw.name} (${lw.dates}) - ${lw.type}`).join(', ')

    const currentDate = new Date()
    const currentMonth = currentDate.toLocaleDateString('en-IN', { month: 'long' })
    const currentSeason = currentMonth === 'December' || currentMonth === 'January' || currentMonth === 'February' ? 'Winter' :
                         currentMonth === 'March' || currentMonth === 'April' || currentMonth === 'May' ? 'Spring' :
                         currentMonth === 'June' || currentMonth === 'July' || currentMonth === 'August' ? 'Summer' :
                         'Autumn'

    const prompt = `You are a travel information expert analyzing the destination "${destination}" for Indian travelers. 

CRITICAL REQUIREMENTS: 
- Provide information SPECIFICALLY about "${destination}" only
- Current date is ${currentDate.toDateString()}, current season is ${currentSeason}
- Do NOT use placeholder text or bracketed instructions
- Provide real, specific, actionable information

Return information in this exact JSON format:

{
  "name": "${destination}",
  "description": "Brief 2-3 line description of ${destination}",
  "bestTimeToVisit": "Detailed analysis of best months and seasons to visit ${destination}. Include current weather patterns, monsoon timings, temperature ranges. Consider these upcoming Indian long weekends: ${longWeekendsText}",
  "travelSafetyStatus": "Current travel safety status for ${destination} based on recent conditions, accessibility, and any weather warnings",
  "currentSeasonAdvice": "Specific advice for visiting ${destination} during ${currentSeason} (current season) with weather conditions, crowd levels, and pricing",
  "highlights": ["attraction1", "attraction2", "attraction3"],
  "climate": "Detailed climate description of ${destination} including seasonal variations",
  "travelTips": ["safety tip1", "practical tip2", "local tip3"],
  "upcomingLongWeekends": ${JSON.stringify(longWeekends.slice(0, 3))},
  "isRecommendedNow": true/false,
  "reasonForRecommendation": "Detailed explanation of why this is or isn't the best time to visit ${destination} based on current conditions, weather, events, and safety factors"
}

Focus specifically on ${destination}. Include:
1. Recent weather events, floods, or natural disasters in ${destination}
2. Current seasonal conditions and safety status
3. Specific timing recommendations based on weather patterns
4. Long weekend suitability for ${destination}
5. Any travel advisories or safety concerns specific to ${destination}

Make the information helpful for Indian travelers planning to visit ${destination}.`

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