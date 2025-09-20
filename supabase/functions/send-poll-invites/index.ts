import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
  formUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pollId, destination, organizerEmail, memberEmails, formUrl }: PollInviteRequest = await req.json();

    console.log('Sending poll invites for:', { pollId, destination, memberEmails });

    const fromEmail = Deno.env.get("RESEND_FROM") || "Wander Vision <noreply@resend.dev>";
    
    // Send emails to all group members
    const emailPromises = memberEmails.map(async (email) => {
      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: `Group Trip Poll: ${destination} - Your Input Needed!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">🗳️ Group Trip Poll</h1>
              <h2 style="color: #374151; margin: 10px 0;">${destination} Adventure</h2>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="font-size: 16px; color: #374151; margin: 0 0 15px 0;">
                Hi there! 👋
              </p>
              <p style="font-size: 16px; color: #374151; margin: 0 0 15px 0;">
                <strong>${organizerEmail}</strong> has invited you to participate in a group trip planning poll for <strong>${destination}</strong>!
              </p>
              <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
                Your preferences will help create the perfect itinerary that everyone will enjoy. Please take a moment to share your travel preferences.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${formUrl}" 
                 style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                        color: white; 
                        text-decoration: none; 
                        padding: 15px 30px; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        font-size: 16px; 
                        display: inline-block;
                        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                📝 Fill Out the Poll
              </a>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⏰ Why your response matters:</strong><br>
                The more people who respond, the better we can customize the trip to everyone's preferences!
              </p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6b7280; margin: 0;">
                This poll was created using <strong>Wander Vision</strong> - AI-powered travel planning.<br>
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </div>
        `,
      });

      console.log(`Email sent to ${email}:`, emailResponse);
      return emailResponse;
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