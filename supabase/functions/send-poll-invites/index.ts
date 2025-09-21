import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

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

    const pollUrl = `https://lovable.dev/poll/${pollId}`;
    
    // Send emails using Supabase's built-in email service
    const emailPromises = memberEmails.map(async (email) => {
      // Create a temporary auth user invitation
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: pollUrl,
        data: {
          poll_id: pollId,
          destination: destination,
          organizer_email: organizerEmail,
          invitation_type: 'group_poll'
        }
      });

      if (error) {
        console.error(`Failed to send invite to ${email}:`, error);
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