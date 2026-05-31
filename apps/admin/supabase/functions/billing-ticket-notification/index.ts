import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BillingTicketRequest {
  ticketId: string;
  tenantId: string;
  tenantName: string;
  requestedBy: string;
  requestedByEmail?: string;
  action: "upgrade" | "downgrade";
  currentPlan: string;
  currentPlanPrice: number;
  requestedPlan: string;
  requestedPlanPrice: number;
  currentUsage: {
    vehicles: string;
    drivers: string;
    devices: string;
  };
}

const getEmailHtml = (data: BillingTicketRequest) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, ${data.action === 'upgrade' ? '#3b82f6' : '#f59e0b'} 0%, ${data.action === 'upgrade' ? '#1d4ed8' : '#d97706'} 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">
      ${data.action === 'upgrade' ? '📈 Plan Upgrade Request' : '📉 Plan Downgrade Request'}
    </h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin-top: 0;">A new billing ticket has been submitted and requires attention.</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid ${data.action === 'upgrade' ? '#3b82f6' : '#f59e0b'};">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Ticket Details</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Ticket ID:</td>
          <td style="padding: 8px 0; font-weight: 600;">${data.ticketId.slice(0, 8)}...</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tenant:</td>
          <td style="padding: 8px 0; font-weight: 600;">${data.tenantName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Requested By:</td>
          <td style="padding: 8px 0; font-weight: 600;">${data.requestedBy}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Action:</td>
          <td style="padding: 8px 0; font-weight: 600; text-transform: capitalize;">${data.action}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Plan Change Request</p>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="text-align: center; flex: 1;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">Current Plan</p>
          <p style="margin: 4px 0; font-weight: 600; font-size: 16px;">${data.currentPlan}</p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">₦${data.currentPlanPrice.toLocaleString()}/mo</p>
        </div>
        <div style="padding: 0 20px; font-size: 24px; color: #9ca3af;">→</div>
        <div style="text-align: center; flex: 1;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">Requested Plan</p>
          <p style="margin: 4px 0; font-weight: 600; font-size: 16px;">${data.requestedPlan}</p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">₦${data.requestedPlanPrice.toLocaleString()}/mo</p>
        </div>
      </div>
    </div>
    
    <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; color: #92400e; font-weight: 600; font-size: 14px;">Current Usage</p>
      <ul style="margin: 0; padding-left: 20px; color: #78350f;">
        <li>Vehicles: ${data.currentUsage.vehicles}</li>
        <li>Drivers: ${data.currentUsage.drivers}</li>
        <li>Devices: ${data.currentUsage.devices}</li>
      </ul>
    </div>
    
    <p>Please review this request in the <a href="${SUPABASE_URL?.replace('.supabase.co', '')}/platform/support" style="color: #3b82f6;">Support Dashboard</a>.</p>
    
    <p style="margin-bottom: 0; color: #6b7280; font-size: 14px;">Best regards,<br>FleetPro System</p>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const data: BillingTicketRequest = await req.json();

    console.log(`Sending billing ticket notification for ticket: ${data.ticketId}`);

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not configured - skipping email notification");
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        reason: "Email not configured" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get platform admin emails
    const { data: platformAdmins, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'platform_admin');

    if (adminError) {
      console.error('Error fetching platform admins:', adminError);
      throw adminError;
    }

    if (!platformAdmins || platformAdmins.length === 0) {
      console.warn('No platform admins found to notify');
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        reason: "No platform admins found" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get admin emails from profiles
    const adminIds = platformAdmins.map(a => a.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .in('user_id', adminIds)
      .not('email', 'is', null);

    if (profileError) {
      console.error('Error fetching admin profiles:', profileError);
      throw profileError;
    }

    const adminEmails = profiles?.map(p => p.email).filter(Boolean) || [];
    
    if (adminEmails.length === 0) {
      console.warn('No admin emails found');
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        reason: "No admin emails found" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Sending notification to ${adminEmails.length} platform admin(s)`);

    const subject = `[${data.action.toUpperCase()}] Plan Change Request from ${data.tenantName}`;
    const html = getEmailHtml(data);

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FleetPro Billing <onboarding@resend.dev>",
        to: adminEmails,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse,
      recipientCount: adminEmails.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending billing ticket notification:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
