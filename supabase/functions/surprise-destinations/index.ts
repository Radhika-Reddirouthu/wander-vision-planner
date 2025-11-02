import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, budget, generateItinerary, destination } = await req.json();
    
    console.log('Surprise destinations request:', { userId, budget, generateItinerary, destination });

    // Get user preferences from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      // Return default profile if user profile doesn't exist
      if (profileError.code === 'PGRST116') {
        console.log('User profile not found, using defaults');
        profile = {
          social_preference: 'balanced',
          activity_level: 'moderate',
          environment_preference: 'varied',
          adventure_seeking: 'moderate',
          food_adventure_level: 'moderate',
          accommodation_style: 'comfortable',
          cultural_interest: 'moderate',
          nightlife_preference: 'casual'
        };
      } else {
        throw profileError;
      }
    }

    console.log('User profile loaded:', profile);

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    if (generateItinerary && destination) {
      // Generate detailed itinerary for the selected destination
      const itineraryPrompt = `
        Create a detailed 3-day itinerary for ${destination} based on this user's preferences:
        
        User Profile:
        - Social Preference: ${profile.social_preference || 'balanced'}
        - Activity Level: ${profile.activity_level || 'moderate'}
        - Environment Preference: ${profile.environment_preference || 'varied'}
        - Adventure Seeking: ${profile.adventure_seeking || 'moderate'}
        - Food Adventure Level: ${profile.food_adventure_level || 'moderate'}
        - Accommodation Style: ${profile.accommodation_style || 'comfortable'}
        - Cultural Interest: ${profile.cultural_interest || 'moderate'}
        - Nightlife Preference: ${profile.nightlife_preference || 'casual'}
        - Budget: ${budget || 'moderate'}

        Provide a detailed 3-day itinerary with:
        1. Day-wise activities with timing
        2. Accommodation recommendations
        3. Food experiences
        4. Transportation suggestions
        5. Cultural experiences
        6. Safety tips
        7. Budget breakdown
        8. Best time to visit

        Format as JSON with this structure:
        {
          "destination": "${destination}",
          "duration": "3 days",
          "bestTimeToVisit": "...",
          "overview": "...",
          "itinerary": [
            {
              "day": 1,
              "title": "...",
              "activities": [
                {
                  "time": "09:00 AM",
                  "activity": "...",
                  "description": "...",
                  "location": "...",
                  "duration": "2 hours",
                  "cost": "₹500-1000"
                }
              ],
              "hotels": [
                {
                  "name": "Actual Hotel Name",
                  "rating": "4.5/5",
                  "location": "Area/Neighborhood",
                  "category": "3-Star",
                  "pricePerNight": "₹2,500",
                  "amenities": ["Free WiFi", "Pool", "Restaurant", "Room Service"],
                  "imageUrl": ""
                }
              ]
            }
          ],
          "accommodation": {
            "type": "...",
            "suggestions": ["..."],
            "priceRange": "₹2000-5000 per night"
          },
          "foodExperiences": [
            {
              "type": "...", 
              "recommendations": ["..."],
              "avgCost": "₹300-800 per meal"
            }
          ],
          "transportation": {
            "howToReach": "...",
            "localTransport": "...",
            "estimatedCost": "₹1000-3000"
          },
          "budgetBreakdown": {
            "accommodation": "₹6000-15000",
            "food": "₹2700-7200", 
            "activities": "₹3000-8000",
            "transport": "₹2000-6000",
            "total": "₹13700-36200"
          },
          "safetyTips": ["..."],
          "packingTips": ["..."]
        }

        IMPORTANT: For each day, provide 3 different hotel options in the "hotels" array with varying price points (budget/mid-range/luxury). Use real hotel names from ${destination}. Leave imageUrl empty.
      `;

      const itineraryResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: itineraryPrompt }]
          }]
        })
      });

      const itineraryData = await itineraryResponse.json();
      let itineraryText = itineraryData.candidates[0]?.content?.parts[0]?.text || '';
      
      // Clean and parse JSON
      itineraryText = itineraryText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const itinerary = JSON.parse(itineraryText);

      return new Response(JSON.stringify({ itinerary }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate destination suggestions
    const suggestionPrompt = `
      Based on this user's travel personality and preferences, suggest 3 unique and personalized travel destinations in India with detailed reasoning:

      User Profile:
      - Social Preference: ${profile.social_preference || 'balanced'} (extrovert/ambivert/introvert)
      - Activity Level: ${profile.activity_level || 'moderate'} (high_energy/moderate/relaxed)
      - Environment Preference: ${profile.environment_preference || 'varied'} (beach/mountains/city/countryside/desert)
      - Adventure Seeking: ${profile.adventure_seeking || 'moderate'} (thrill_seeker/moderate_adventure/comfort_zone)
      - Food Adventure Level: ${profile.food_adventure_level || 'moderate'} (very_adventurous/somewhat_adventurous/familiar_foods)
      - Accommodation Style: ${profile.accommodation_style || 'comfortable'} (luxury/boutique/budget/local)
      - Cultural Interest: ${profile.cultural_interest || 'moderate'} (high/moderate/low)
      - Nightlife Preference: ${profile.nightlife_preference || 'casual'} (party_lover/casual_evenings/early_sleeper)
      - Budget Range: ${budget || 'moderate budget'}

      Current month: ${new Date().toLocaleString('default', { month: 'long' })}
      Current season considerations and weather patterns should be included.

      For each destination, provide:
      1. Name and location
      2. Detailed reasoning why it matches their personality (reference specific preferences)
      3. What makes it special right now (seasonal factors, weather, events)
      4. Key highlights they'd love based on their profile
      5. Estimated budget range
      6. Perfect for what type of experience

      Format as JSON array:
      [
        {
          "name": "Destination Name",
          "location": "State, Region",
          "image": "brief description for image generation",
          "matchReason": "Detailed explanation of why this matches their personality...",
          "seasonalAdvantage": "Why this is perfect right now...",
          "highlights": ["Key attraction 1", "Key attraction 2", ...],
          "perfectFor": "Type of experience this destination offers",
          "estimatedBudget": "₹XX,000 - ₹XX,000 for 3-4 days",
          "personalityMatch": 95,
          "tags": ["tag1", "tag2", "tag3"]
        }
      ]

      Make sure suggestions are highly personalized and explain the connection to their specific preferences.
    `;

    console.log('Calling Gemini API for destination suggestions...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: suggestionPrompt }]
        }]
      })
    });

    const data = await response.json();
    console.log('Gemini response:', data);

    if (!data.candidates || !data.candidates[0]) {
      throw new Error('No suggestions generated');
    }

    let suggestionsText = data.candidates[0].content.parts[0].text;
    
    // Clean the response - remove markdown formatting
    suggestionsText = suggestionsText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Cleaned suggestions text:', suggestionsText);
    
    const suggestions = JSON.parse(suggestionsText);
    
    return new Response(JSON.stringify({ suggestions, userProfile: profile }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in surprise-destinations function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate destination suggestions'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});