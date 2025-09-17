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
  { date: '2025-10-22', name: 'Dussehra' },
  { date: '2025-11-01', name: 'Diwali' },
  { date: '2025-11-05', name: 'Guru Nanak Jayanti' },
  { date: '2025-12-25', name: 'Christmas' }
]

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
    const { destination } = await req.json()
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found')
    }

    const longWeekends = getUpcomingLongWeekends()
    const longWeekendsText = longWeekends.map(lw => `${lw.name} (${lw.dates}) - ${lw.type}`).join(', ')

    const prompt = `You are a travel information expert. Based on the destination provided, return information in this exact JSON format:

{
  "name": "Destination Name", 
  "description": "Brief 2-3 line description",
  "bestTimeToVisit": "Detailed description of best months and seasons to visit. Consider these upcoming Indian long weekends for travel planning: ${longWeekendsText}",
  "highlights": ["attraction1", "attraction2", "attraction3"],
  "climate": "Brief climate description",
  "travelTips": ["tip1", "tip2", "tip3"],
  "upcomingLongWeekends": ${JSON.stringify(longWeekends.slice(0, 3))}
}

Focus on practical travel advice and make the information helpful for Indian travelers. Include seasonal considerations, weather patterns, and any special events or festivals. Mention which of the upcoming long weekends would be ideal for visiting this destination.`

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