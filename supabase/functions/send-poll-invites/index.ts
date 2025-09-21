import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PollInviteRequest {
  pollId: string;
  destination: string;
  organizerEmail: string;
  memberEmails: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pollId, destination, organizerEmail, memberEmails }: PollInviteRequest = await req.json();

    console.log('Sending poll invites for:', { pollId, destination, memberEmails });

    // Get current domain from environment or use the current project domain
    const domain = "https://9732e81f-7616-47ba-bdf0-fb0479cedada.lovableproject.com";
    const pollUrl = `${domain}/poll/${pollId}`;
    
    // Send direct emails using Resend (no authentication required)
    const emailPromises = memberEmails.map(async (email) => {
      const isOrganizer = email === organizerEmail;
      
      const emailSubject = isOrganizer 
        ? `Your Group Trip Poll for ${destination} - Please Share Your Preferences`
        : `You're Invited to Plan a Group Trip to ${destination}!`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">🌟 Group Trip Planning Poll</h1>
          
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">Trip to ${destination}</h2>
            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Help us create the perfect itinerary for everyone!</p>
          </div>

          ${isOrganizer 
            ? `<p>Hi! As the organizer of this group trip, please share your preferences to help create an amazing itinerary that everyone will love.</p>`
            : `<p>Hi! You've been invited to join a group trip planning poll for <strong>${destination}</strong>.</p>
               <p>Your input will help us create an itinerary that matches everyone's preferences and interests.</p>`
          }
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b;">What we'll ask you:</h3>
            <ul style="color: #64748b; margin: 0;">
              <li>Your preferred activity timing and pace</li>
              <li>Types of attractions you're most interested in</li>
              <li>Accommodation and dining preferences</li>
              <li>Transportation preferences</li>
              <li>Any special requirements or preferences</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${pollUrl}" 
               style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              📝 Answer Poll Questions
            </a>
          </div>

          <p style="color: #64748b; font-size: 14px; text-align: center;">
            <strong>No signup required!</strong> Just click the button above to share your preferences.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            This poll will help us create a personalized itinerary that everyone will enjoy. 
            Your responses are confidential and will only be used for trip planning.
          </p>
        </div>
      `;

      const { data, error } = await resend.emails.send({
        from: "Trip Poll <onboarding@resend.dev>",
        to: [email],
        subject: emailSubject,
        html: emailHtml
      });

      if (error) {
        console.error(`Failed to send poll invite to ${email}:`, error);
        throw error;
      }

      console.log(`Poll invite sent to ${email}:`, data);
      return data;
    });

    // Wait for all emails to be sent
    const results = await Promise.allSettled(emailPromises);
    
    // Count successful sends
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`Poll invites sent: ${successful} successful, ${failed} failed`);

    return new Response(JSON.stringify({ 
      success: true,
      emailsSent: successful,
      emailsFailed: failed,
      message: `Poll invites sent successfully to ${successful} members`
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-poll-invites function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);