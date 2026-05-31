import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityAlertRequest {
  alert_type: 'ip_blocked' | 'critical_event' | 'suspicious_activity';
  ip_address?: string;
  country?: string;
  city?: string;
  reason?: string;
  threat_level?: string;
  recipient_email: string;
  details?: Record<string, unknown>;
}

const getAlertSubject = (alertType: string, ipAddress?: string): string => {
  switch (alertType) {
    case 'ip_blocked':
      return `🚨 Security Alert: IP ${ipAddress || 'Unknown'} Has Been Blocked`;
    case 'critical_event':
      return `⚠️ Critical Security Event Detected`;
    case 'suspicious_activity':
      return `🔍 Suspicious Activity Detected`;
    default:
      return `Security Alert`;
  }
};

const getAlertHtml = (request: SecurityAlertRequest): string => {
  const timestamp = new Date().toLocaleString('en-US', { 
    timeZone: 'UTC',
    dateStyle: 'full',
    timeStyle: 'long'
  });

  switch (request.alert_type) {
    case 'ip_blocked':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 24px; }
            .alert-icon { font-size: 48px; }
            h1 { color: #dc2626; margin: 16px 0 8px; font-size: 24px; }
            .subtitle { color: #6b7280; font-size: 14px; }
            .details { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fecaca; }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #6b7280; font-size: 14px; }
            .value { color: #1f2937; font-weight: 600; }
            .threat-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
            .threat-high { background: #dc2626; color: white; }
            .threat-medium { background: #f59e0b; color: white; }
            .threat-low { background: #10b981; color: white; }
            .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="alert-icon">🚨</div>
              <h1>IP Address Blocked</h1>
              <p class="subtitle">${timestamp} (UTC)</p>
            </div>
            <div class="details">
              <div class="detail-row">
                <span class="label">IP Address</span>
                <span class="value">${request.ip_address || 'Unknown'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Location</span>
                <span class="value">${request.city ? `${request.city}, ` : ''}${request.country || 'Unknown'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Threat Level</span>
                <span class="threat-badge threat-${request.threat_level || 'medium'}">${(request.threat_level || 'medium').toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Reason</span>
                <span class="value">${request.reason || 'Automated security rule triggered'}</span>
              </div>
            </div>
            <p style="color: #4b5563; font-size: 14px;">This IP has been automatically blocked based on your security rules. No further action is required unless you wish to review or unblock this IP.</p>
            <div class="footer">
              <p>FleetHub Security System</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'critical_event':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 24px; }
            .alert-icon { font-size: 48px; }
            h1 { color: #dc2626; margin: 16px 0 8px; font-size: 24px; }
            .subtitle { color: #6b7280; font-size: 14px; }
            .details { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 24px 0; }
            .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="alert-icon">⚠️</div>
              <h1>Critical Security Event</h1>
              <p class="subtitle">${timestamp} (UTC)</p>
            </div>
            <div class="details">
              <p style="color: #1f2937; margin: 0;">${request.reason || 'A critical security event has been detected that requires your attention.'}</p>
            </div>
            <p style="color: #4b5563; font-size: 14px;">Please review your security dashboard for more details and take appropriate action.</p>
            <div class="footer">
              <p>FleetHub Security System</p>
            </div>
          </div>
        </body>
        </html>
      `;

    default:
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Security Alert</h1>
            <p>${request.reason || 'A security event has occurred.'}</p>
          </div>
        </body>
        </html>
      `;
  }
};

serve(async (req: Request): Promise<Response> => {
  console.log("Security Alerts function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: SecurityAlertRequest = await req.json();
    
    console.log("Sending security alert:", {
      type: request.alert_type,
      ip: request.ip_address,
      recipient: request.recipient_email
    });

    if (!request.recipient_email) {
      throw new Error("Recipient email is required");
    }

    const subject = getAlertSubject(request.alert_type, request.ip_address);
    const html = getAlertHtml(request);

    const emailResponse = await resend.emails.send({
      from: "Security Alerts <onboarding@resend.dev>",
      to: [request.recipient_email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the security event
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.rpc('log_security_event', {
      p_event_type: 'security_alert_sent',
      p_severity: request.alert_type === 'critical_event' ? 'critical' : 'medium',
      p_description: `Security alert email sent: ${request.alert_type}`,
      p_ip_address: request.ip_address,
      p_metadata: {
        alert_type: request.alert_type,
        recipient: request.recipient_email,
        country: request.country,
        city: request.city
      }
    });

    return new Response(
      JSON.stringify({ success: true, message_id: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending security alert:", errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
